import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ConversionConfig, ConversionJob, VideoMetadata } from './types.js';
import { OUTPUTS_DIR, deleteFileSafely } from './storageManager.js';

/**
 * Optimizes an MP4 file by moving the moov atom to the beginning of the file (+faststart).
 * This ensures web browsers can begin playing long videos immediately without waiting to
 * buffer the entire file or seeking the end. Uses stream copy (zero re-encoding overhead).
 */
export async function optimizeWithFastStart(filePath: string): Promise<void> {
  const tempFastPath = `${filePath}.fast.mp4`;
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', [
      '-y',
      '-i', filePath,
      '-c', 'copy',
      '-movflags', '+faststart',
      tempFastPath,
    ]);

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(tempFastPath)) {
        try {
          fs.renameSync(tempFastPath, filePath);
        } catch {
          // If rename fails, keep original
        }
      }
      deleteFileSafely(tempFastPath);
      resolve();
    });

    proc.on('error', () => {
      deleteFileSafely(tempFastPath);
      resolve();
    });
  });
}

export async function inspectVideoWithProbe(filePath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
    });

    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`ffprobe failed with exit code ${code}: ${stderr}`));
      }

      try {
        const data = JSON.parse(stdout);
        const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
        const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('No valid video stream found in the media file.'));
        }

        const width = Number(videoStream.width) || 720;
        const height = Number(videoStream.height) || 1280;
        const duration = Number(data.format?.duration || videoStream.duration || 0);

        let fps = 30;
        if (videoStream.avg_frame_rate) {
          const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
          if (den && num) {
            fps = Math.round((num / den) * 100) / 100;
          }
        }

        const sizeBytes = Number(data.format?.size || fs.statSync(filePath).size || 0);
        const bitrate = Number(data.format?.bit_rate || 0);

        let aspectRatioLabel = `${width}:${height}`;
        if (Math.abs(width / height - 9 / 16) < 0.05) {
          aspectRatioLabel = '9:16 (Vertical Reel)';
        } else if (Math.abs(width / height - 16 / 9) < 0.05) {
          aspectRatioLabel = '16:9 (Landscape)';
        } else if (Math.abs(width / height - 1) < 0.05) {
          aspectRatioLabel = '1:1 (Square)';
        }

        resolve({
          width,
          height,
          duration,
          fps,
          codec: videoStream.codec_name || 'h264',
          bitrate,
          sizeBytes,
          hasAudio: !!audioStream,
          aspectRatioLabel,
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse video metadata: ${err.message}`));
      }
    });
  });
}

/**
 * Calculates target landscape resolution (width & height)
 */
export function calculateTargetDimensions(
  inWidth: number,
  inHeight: number,
  config: ConversionConfig
): { targetW: number; targetH: number } {
  let baseH = 1080;
  if (config.resolution === '720p') baseH = 720;
  else if (config.resolution === '1440p') baseH = 1440;
  else if (config.resolution === '4k') baseH = 2160;
  else if (config.resolution === 'source') {
    // Keep max dimension from source without downscaling
    baseH = Math.min(Math.max(inWidth, inHeight), 1080);
  }

  let ratio = 16 / 9;
  if (config.aspectRatio === '4:3') ratio = 4 / 3;
  else if (config.aspectRatio === '3:2') ratio = 3 / 2;
  else if (config.aspectRatio === '21:9') ratio = 21 / 9;
  else if (config.aspectRatio === 'custom') {
    const cw = config.customRatio?.width || 16;
    const ch = config.customRatio?.height || 9;
    ratio = cw / ch;
  }

  const targetW = Math.round((baseH * ratio) / 2) * 2;
  const targetH = Math.round(baseH / 2) * 2;

  return { targetW, targetH };
}

/**
 * Constructs the FFmpeg filter string based on mode and settings.
 */
export function buildFilterGraph(
  inWidth: number,
  inHeight: number,
  targetW: number,
  targetH: number,
  config: ConversionConfig
): string {
  if (config.mode === 'change_orientation') {
    const rotation = config.orientationOptions?.rotation ?? 90;
    const flipH = !!config.orientationOptions?.flipHorizontal;
    const flipV = !!config.orientationOptions?.flipVertical;
    const fitMode = config.orientationOptions?.fitMode ?? 'fit';

    // Build orientation rotation filter
    let transformFilter = '';
    if (rotation === 90) {
      transformFilter = 'transpose=1'; // 90 degrees clockwise
    } else if (rotation === 270) {
      transformFilter = 'transpose=2'; // 90 degrees counter-clockwise
    } else if (rotation === 180) {
      transformFilter = 'hflip,vflip'; // 180 degrees
    }

    if (flipH) {
      transformFilter = transformFilter ? `${transformFilter},hflip` : 'hflip';
    }
    if (flipV) {
      transformFilter = transformFilter ? `${transformFilter},vflip` : 'vflip';
    }

    // Scaling into target landscape canvas
    let scaleFilter = '';
    if (fitMode === 'fill') {
      scaleFilter = `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}`;
    } else {
      scaleFilter = `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black`;
    }

    if (transformFilter) {
      return `[0:v]${transformFilter},${scaleFilter}[outv]`;
    } else {
      return `[0:v]${scaleFilter}[outv]`;
    }
  }

  if (config.mode === 'blur_fill') {
    const blurRadius = Math.max(5, Math.min(60, config.blurOptions?.blurStrength ?? 30));
    const brightness = Math.max(-0.5, Math.min(0.2, config.blurOptions?.bgBrightness ?? -0.2));
    const bgZoom = Math.max(1.0, Math.min(2.0, config.blurOptions?.bgZoom ?? 1.15));

    const bgScaleW = Math.round((targetW * bgZoom) / 2) * 2;
    const bgScaleH = Math.round((targetH * bgZoom) / 2) * 2;

    // Filter pipeline:
    // [0:v] split into [bg_raw] and [fg_raw]
    // [bg_raw] scale & crop to target, boxblur, eq brightness => [bg]
    // [fg_raw] scale to fit inside target without distortion => [fg]
    // [bg][fg] overlay in center => [outv]
    return [
      `[0:v]split=2[bg_raw][fg_raw]`,
      `[bg_raw]scale=${bgScaleW}:${bgScaleH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},boxblur=luma_radius=${blurRadius}:luma_power=2,eq=brightness=${brightness}[bg]`,
      `[fg_raw]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease[fg]`,
      `[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`,
    ].join(';');
  }

  if (config.mode === 'crop_fill' || config.mode === 'smart_crop') {
    const userZoom = config.mode === 'smart_crop' ? 1.0 : Math.max(1.0, Math.min(2.5, config.cropOptions?.zoom ?? 1.0));
    const scaleFactor = Math.max(targetW / inWidth, targetH / inHeight) * userZoom;
    const scaledW = Math.round((inWidth * scaleFactor) / 2) * 2;
    const scaledH = Math.round((inHeight * scaleFactor) / 2) * 2;

    let xNorm = 0; // -1 to 1
    let yNorm = 0; // -1 to 1

    if (config.mode === 'smart_crop') {
      // Smart crop fallback: subjects in vertical reels are centered horizontally
      // and positioned in the upper 35%-40% vertically.
      xNorm = 0;
      yNorm = -0.3; // slightly upwards to avoid cutting heads
    } else {
      xNorm = (config.cropOptions?.xPosition ?? 0) / 100;
      yNorm = (config.cropOptions?.yPosition ?? 0) / 100;
    }

    // Calculate crop bounds
    const maxCropX = Math.max(0, scaledW - targetW);
    const maxCropY = Math.max(0, scaledH - targetH);

    // Map -1..1 to 0..maxCrop
    const cropX = Math.round(Math.max(0, Math.min(maxCropX, (maxCropX / 2) + (xNorm * (maxCropX / 2)))));
    const cropY = Math.round(Math.max(0, Math.min(maxCropY, (maxCropY / 2) + (yNorm * (maxCropY / 2)))));

    return `[0:v]scale=${scaledW}:${scaledH},crop=${targetW}:${targetH}:${cropX}:${cropY}[outv]`;
  }

  // Default fallback: fit center
  return `[0:v]scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2[outv]`;
}

/**
 * Runs FFmpeg processing job with real-time progress callbacks.
 */
export async function runConversionJob(
  job: ConversionJob,
  onProgress: (progress: number, stageText: string) => void
): Promise<void> {
  const inputPath = job.inputInfo.tempFilePath;
  if (!inputPath || !fs.existsSync(inputPath)) {
    throw new Error('Input video file is missing or expired.');
  }

  const outputFileName = `reelwide_${job.id}.mp4`;
  const outputPath = path.join(OUTPUTS_DIR, outputFileName);
  job.outputFilePath = outputPath;

  const inMeta = job.inputInfo.metadata;
  const { targetW, targetH } = calculateTargetDimensions(inMeta.width, inMeta.height, job.config);
  const filterStr = buildFilterGraph(inMeta.width, inMeta.height, targetW, targetH, job.config);

  const duration = inMeta.duration || 1;

  onProgress(5, 'Preparing FFmpeg pipeline and encoding parameters...');

  const ffmpegArgs = [
    '-y',
    '-i', inputPath,
    '-filter_complex', filterStr,
    '-map', '[outv]',
  ];

  if (inMeta.hasAudio) {
    ffmpegArgs.push('-map', '0:a?');
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '192k', '-ar', '48000');
  }

  ffmpegArgs.push(
    '-threads', '0',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-progress', 'pipe:1',
    outputPath
  );

  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', ffmpegArgs);

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      const outTimeMatch = text.match(/out_time_ms=(\d+)/);
      if (outTimeMatch) {
        const outTimeMicro = Number(outTimeMatch[1]);
        const currentSec = outTimeMicro / 1000000;
        const pct = Math.min(95, Math.max(10, Math.round((currentSec / duration) * 90) + 5));
        onProgress(pct, `Encoding landscape video (${pct}%)...`);
      }
    });

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', async (code) => {
      if (code !== 0) {
        return reject(new Error(`FFmpeg processing failed (code ${code}): ${stderr.slice(-300)}`));
      }

      try {
        onProgress(98, 'Finalizing video stream and metadata...');
        const outMeta = await inspectVideoWithProbe(outputPath);
        job.outputMeta = outMeta;
        job.downloadUrl = `/api/download/${job.id}`;
        onProgress(100, 'Video ready!');
        resolve();
      } catch (err: any) {
        reject(new Error(`Output verification failed: ${err.message}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to start FFmpeg: ${err.message}`));
    });
  });
}
