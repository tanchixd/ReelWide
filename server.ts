import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { initStorage, INPUTS_DIR, OUTPUTS_DIR, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from './server/storageManager.js';
import { validateFacebookUrl, ingestFacebookVideo } from './server/fbIngestion.js';
import { runConversionJob, inspectVideoWithProbe } from './server/ffmpegPipeline.js';
import { ConversionConfig, ConversionJob, FacebookVideoInfo } from './server/types.js';

initStorage();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory jobs map (cleaned up when expired)
const activeJobs = new Map<string, ConversionJob>();

// Multer configuration for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, INPUTS_DIR);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.mp4';
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/') || file.originalname.match(/\.(mp4|mov|m4v|webm|mkv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MOV, WebM, etc.) are permitted.'));
    }
  },
});

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', name: 'ReelWide Engine' });
});

// 2. Validate URL endpoint
app.post('/api/validate-url', (req: Request, res: Response) => {
  const { url } = req.body;
  const result = validateFacebookUrl(url);
  res.json(result);
});

// 3. Ingest Facebook video
app.post('/api/fetch-facebook', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Facebook URL is required.' });
    }

    const validation = validateFacebookUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const videoInfo = await ingestFacebookVideo(url);
    return res.json({ success: true, video: videoInfo });
  } catch (err: any) {
    console.error('[Ingestion Error]:', err.message);
    return res.status(422).json({
      error: err.message || 'Failed to retrieve Facebook video.',
    });
  }
});

// 4. Sample Reel (for instant testing)
app.get('/api/sample-reel', async (_req: Request, res: Response) => {
  try {
    const sampleSourcePath = path.join(process.cwd(), 'public', 'sample-reel.mp4');
    if (!fs.existsSync(sampleSourcePath)) {
      return res.status(404).json({ error: 'Sample reel not found.' });
    }

    const fileId = 'sample-reel-' + crypto.randomUUID().slice(0, 8);
    const destPath = path.join(INPUTS_DIR, `${fileId}.mp4`);
    fs.copyFileSync(sampleSourcePath, destPath);

    const meta = await inspectVideoWithProbe(destPath);
    const videoInfo: FacebookVideoInfo = {
      sourceType: 'sample',
      originalUrl: 'https://www.facebook.com/reel/sample-demo-reel',
      title: 'Demo Reel — 9:16 Vertical Video (Sample)',
      streamUrl: `/api/video-stream/${fileId}`,
      tempFilePath: destPath,
      fileId,
      metadata: meta,
    };

    return res.json({ success: true, video: videoInfo });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 5. Upload Video Alternative
app.post(
  '/api/upload-video',
  (req: Request, res: Response, next) => {
    upload.single('video')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: `Video exceeds the maximum allowed file size of ${MAX_FILE_SIZE_MB}MB.`,
          });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file was uploaded.' });
      }

      const filePath = req.file.path;
      const fileId = path.parse(filePath).name;
      const meta = await inspectVideoWithProbe(filePath);

      const videoInfo: FacebookVideoInfo = {
        sourceType: 'upload',
        title: req.file.originalname.replace(/\.[^/.]+$/, '') || 'Uploaded Video',
        streamUrl: `/api/video-stream/${fileId}`,
        tempFilePath: filePath,
        fileId,
        metadata: meta,
      };

      return res.json({ success: true, video: videoInfo });
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      return res.status(500).json({
        error: err.message || 'Failed to process uploaded video.',
      });
    }
  }
);

// 6. Video streaming endpoint with HTTP Range support for smooth playback
app.get('/api/video-stream/:fileId', (req: Request, res: Response) => {
  const { fileId } = req.params;
  // Look in INPUTS_DIR or OUTPUTS_DIR
  let filePath = path.join(INPUTS_DIR, `${fileId}.mp4`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(OUTPUTS_DIR, `reelwide_${fileId}.mp4`);
  }
  if (!fs.existsSync(filePath)) {
    // Check if filename has direct extension
    filePath = path.join(INPUTS_DIR, fileId);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file has expired or was not found.' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    // Limit open-ended range requests to 8MB max chunks so long videos load immediately and seek fast
    const MAX_CHUNK = 8 * 1024 * 1024; // 8MB chunk
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + MAX_CHUNK - 1, fileSize - 1);
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': 'video/mp4',
      'Cache-Control': 'public, max-age=3600',
    });

    req.on('close', () => {
      file.destroy();
    });

    file.on('error', () => {
      file.destroy();
    });

    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    });
    const file = fs.createReadStream(filePath);
    req.on('close', () => {
      file.destroy();
    });
    file.pipe(res);
  }
});

// 7. Start Conversion Job
app.post('/api/convert', async (req: Request, res: Response) => {
  try {
    const { videoInfo, config } = req.body as {
      videoInfo: FacebookVideoInfo;
      config: ConversionConfig;
    };

    if (!videoInfo || !videoInfo.tempFilePath || !config) {
      return res.status(400).json({ error: 'Missing video information or conversion configuration.' });
    }

    if (!fs.existsSync(videoInfo.tempFilePath)) {
      return res.status(404).json({
        error: 'The source video has expired or is no longer available. Please reload the video.',
      });
    }

    const jobId = crypto.randomUUID();
    const job: ConversionJob = {
      id: jobId,
      stage: 'checking',
      progress: 5,
      message: 'Checking Facebook video streams and audio channels...',
      inputInfo: videoInfo,
      config,
      createdAt: Date.now(),
    };

    activeJobs.set(jobId, job);

    // Asynchronously run pipeline
    (async () => {
      try {
        job.stage = 'preparing';
        job.progress = 15;
        job.message = 'Preparing layout, resolution, and canvas parameters...';

        job.stage = 'processing';
        await runConversionJob(job, (progress, message) => {
          job.progress = progress;
          job.message = message;
        });

        job.stage = 'finalizing';
        job.progress = 98;
        job.message = 'Finalizing landscape MP4 package...';

        job.stage = 'ready';
        job.progress = 100;
        job.message = 'Conversion complete and ready for download.';
        job.completedAt = Date.now();
      } catch (err: any) {
        console.error(`[Job ${jobId} Error]:`, err);
        job.stage = 'failed';
        job.error = err.message || 'Video processing encountered an unexpected error.';
      }
    })();

    return res.json({ success: true, jobId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 8. Poll Job Status
app.get('/api/job-status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (!job) {
    return res.status(404).json({ error: 'Conversion job not found or expired.' });
  }
  return res.json(job);
});

// 9. Download output video
app.get('/api/download/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = activeJobs.get(jobId);
  if (!job || !job.outputFilePath || !fs.existsSync(job.outputFilePath)) {
    return res.status(404).send('Download file is no longer available or has expired.');
  }

  const safeTitle = (job.inputInfo.title || 'reelwide-video')
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '_')
    .slice(0, 40);
  const ratioLabel = job.config.aspectRatio.replace(':', 'x');
  const filename = `${safeTitle}_landscape_${ratioLabel}.mp4`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'video/mp4');
  fs.createReadStream(job.outputFilePath).pipe(res);
});

// 10. Direct Download Endpoint (Saves raw Facebook video directly to device/gallery)
app.get('/api/download-direct/:fileId', (req: Request, res: Response) => {
  const { fileId } = req.params;
  let filePath = path.join(INPUTS_DIR, `${fileId}.mp4`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(OUTPUTS_DIR, `reelwide_${fileId}.mp4`);
  }
  if (!fs.existsSync(filePath)) {
    filePath = path.join(INPUTS_DIR, fileId);
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Video file has expired or was not found.' });
  }

  const stat = fs.statSync(filePath);
  const titleParam = (req.query.title as string) || 'facebook_video';
  const safeTitle = titleParam.toLowerCase().replace(/[^a-z0-9]/gi, '_').slice(0, 40) || 'facebook_video';
  const filename = `${safeTitle}.mp4`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Length', stat.size);
  fs.createReadStream(filePath).pipe(res);
});

// Vite Middleware & SPA serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ReelWide] Server started on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[ReelWide] Startup error:', err);
});
