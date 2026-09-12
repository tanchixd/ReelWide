import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';
import { INPUTS_DIR, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, deleteFileSafely } from './storageManager.js';
import { FacebookVideoInfo } from './types.js';
import { inspectVideoWithProbe, optimizeWithFastStart } from './ffmpegPipeline.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalizedUrl?: string;
  videoId?: string;
  urlType?: 'reel' | 'watch' | 'video' | 'share';
}

/**
 * Validates strictly that the URL belongs to Facebook and is a Video or Reel format.
 * Strictly rejects Instagram, TikTok, YouTube, X, and any other platform.
 */
export function validateFacebookUrl(rawUrl: string): ValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Please enter a Facebook Reel or video URL.' };
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
  } catch {
    return { valid: false, error: 'The provided URL is not a valid web address.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const pathname = parsed.pathname;

  // Strict domain check: ReelWide ONLY accepts Facebook URLs
  const isFbDomain =
    hostname === 'facebook.com' ||
    hostname === 'm.facebook.com' ||
    hostname === 'web.facebook.com' ||
    hostname === 'touch.facebook.com' ||
    hostname === 'fb.watch' ||
    hostname.endsWith('.facebook.com');

  if (!isFbDomain) {
    if (
      hostname.includes('instagram.com') ||
      hostname.includes('tiktok.com') ||
      hostname.includes('youtube.com') ||
      hostname.includes('youtu.be') ||
      hostname.includes('twitter.com') ||
      hostname.includes('x.com')
    ) {
      return {
        valid: false,
        error:
          'Unsupported platform. ReelWide is designed exclusively for Facebook Reels and public Facebook videos. Other platforms are not supported.',
      };
    }
    return {
      valid: false,
      error: 'Invalid URL. ReelWide only supports Facebook video and Reel links (facebook.com or fb.watch).',
    };
  }

  // Handle fb.watch short links: fb.watch/abc123/
  if (hostname === 'fb.watch') {
    const code = pathname.replace(/^\/+/, '').split('/')[0];
    if (!code) {
      return { valid: false, error: 'Incomplete fb.watch link. Please check the URL and try again.' };
    }
    return {
      valid: true,
      normalizedUrl: parsed.href,
      videoId: code,
      urlType: 'reel',
    };
  }

  // Handle facebook.com/reel/123456789
  const reelMatch = pathname.match(/\/reel\/([a-zA-Z0-9_-]+)/i);
  if (reelMatch) {
    return {
      valid: true,
      normalizedUrl: parsed.href,
      videoId: reelMatch[1],
      urlType: 'reel',
    };
  }

  // Handle facebook.com/share/r/123456 or /share/v/123456
  const shareMatch = pathname.match(/\/share\/(r|v)\/([a-zA-Z0-9_-]+)/i);
  if (shareMatch) {
    return {
      valid: true,
      normalizedUrl: parsed.href,
      videoId: shareMatch[2],
      urlType: shareMatch[1] === 'r' ? 'reel' : 'video',
    };
  }

  // Handle facebook.com/watch/?v=123456789
  if (pathname.includes('/watch')) {
    const v = parsed.searchParams.get('v');
    if (v) {
      return {
        valid: true,
        normalizedUrl: parsed.href,
        videoId: v,
        urlType: 'watch',
      };
    }
  }

  // Handle facebook.com/{page_name}/videos/{id} or /videos/{id}
  const videoMatch = pathname.match(/\/videos\/([0-9]+)/i);
  if (videoMatch) {
    return {
      valid: true,
      normalizedUrl: parsed.href,
      videoId: videoMatch[1],
      urlType: 'video',
    };
  }

  // Handle video.php?v={id}
  if (pathname.includes('video.php')) {
    const v = parsed.searchParams.get('v');
    if (v) {
      return {
        valid: true,
        normalizedUrl: parsed.href,
        videoId: v,
        urlType: 'video',
      };
    }
  }

  // If on facebook.com but not a recognizable video/reel route
  return {
    valid: false,
    error:
      'This does not appear to be a Facebook Reel or video link. Please paste a link formatted like facebook.com/reel/... or fb.watch/...',
  };
}

/**
 * Ingests a public Facebook Reel or video URL without bypassing DRM or authentication.
 * If private or login-required, provides friendly descriptive error.
 */
export async function ingestFacebookVideo(rawUrl: string): Promise<FacebookVideoInfo> {
  const validation = validateFacebookUrl(rawUrl);
  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.error || 'Invalid Facebook URL');
  }

  const fileId = crypto.randomUUID();
  const targetPath = path.join(INPUTS_DIR, `${fileId}.mp4`);

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,video/mp4,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
  };

  let pageResponse: Response;
  try {
    pageResponse = await fetch(validation.normalizedUrl, {
      headers,
      redirect: 'follow',
    });
  } catch (err: any) {
    throw new Error(`Failed to connect to Facebook: ${err.message || 'Network request failed'}`);
  }

  const finalUrl = pageResponse.url || '';
  if (finalUrl.includes('facebook.com/login') || finalUrl.includes('checkpoint')) {
    throw new Error(
      'This Facebook video requires a login or has private visibility. ReelWide only processes public Facebook Reels and videos that do not require an account.'
    );
  }

  const html = await pageResponse.text();

  if (html.includes('This content isn&#039;t available right now') || html.includes("This content isn't available")) {
    throw new Error(
      'The requested video could not be found or has been removed by the creator.'
    );
  }

  // Extract candidate stream URLs from public HTML (HD, SD, native, OG, etc.)
  const candidateUrls = extractCandidateStreamUrls(html);

  // If no direct MP4 extracted, check if it's a test/sample reel or redirect
  if (candidateUrls.length === 0) {
    // Check if the page is private/restricted
    if (html.includes('login_source') || html.includes('login_form')) {
      throw new Error(
        'This Facebook video is private or restricted to logged-in users. ReelWide cannot access private content.'
      );
    }

    throw new Error(
      'Could not retrieve a publicly streamable video from this Facebook Reel. The video might be private, geoblocked, or protected. You can upload the video directly using the Upload Video option.'
    );
  }

  // Extract title/description
  let title = 'Facebook Reel';
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
  if (titleMatch && titleMatch[1]) {
    title = decodeHtmlEntities(titleMatch[1]);
  }

  // Download stream to temp storage with size limit verification.
  // If the HD stream exceeds size limit or fails, try subsequent candidates (e.g. SD).
  let lastError: Error | null = null;
  let downloaded = false;

  for (const streamUrl of candidateUrls) {
    try {
      await downloadStreamToFile(streamUrl, targetPath, headers);
      downloaded = true;
      break;
    } catch (err: any) {
      lastError = err;
      deleteFileSafely(targetPath);
      // If error is size limit and we have more candidates (like SD), continue trying
      console.warn(`[Ingestion] Candidate stream failed, trying next candidate if available:`, err.message);
    }
  }

  if (!downloaded) {
    throw lastError || new Error(`Video exceeds the maximum allowed file size of ${MAX_FILE_SIZE_MB}MB.`);
  }

  // Optimize video with faststart (+faststart moov atom at beginning)
  // Ensures browsers play and seek long videos instantly without waiting to buffer
  await optimizeWithFastStart(targetPath);

  // Inspect with ffprobe to get exact metadata
  const meta = await inspectVideoWithProbe(targetPath);

  return {
    sourceType: 'facebook',
    originalUrl: validation.normalizedUrl,
    title,
    streamUrl: `/api/video-stream/${fileId}`,
    tempFilePath: targetPath,
    fileId,
    metadata: meta,
  };
}

function extractCandidateStreamUrls(html: string): string[] {
  const candidates: string[] = [];

  // Try HD playable URL first
  const hdMatch = html.match(/"playable_url_quality_hd":"([^"]+)"/);
  if (hdMatch && hdMatch[1]) {
    candidates.push(cleanEscapedUrl(hdMatch[1]));
  }

  // Try standard playable URL (SD)
  const sdMatch = html.match(/"playable_url":"([^"]+)"/);
  if (sdMatch && sdMatch[1]) {
    candidates.push(cleanEscapedUrl(sdMatch[1]));
  }

  // Try browser_native_hd_url
  const nativeHdMatch = html.match(/"browser_native_hd_url":"([^"]+)"/);
  if (nativeHdMatch && nativeHdMatch[1]) {
    candidates.push(cleanEscapedUrl(nativeHdMatch[1]));
  }

  // Try browser_native_sd_url
  const nativeSdMatch = html.match(/"browser_native_sd_url":"([^"]+)"/);
  if (nativeSdMatch && nativeSdMatch[1]) {
    candidates.push(cleanEscapedUrl(nativeSdMatch[1]));
  }

  // Try OpenGraph video tag
  const ogMatch = html.match(/<meta\s+property="og:video(?::secure_url|:url)?"\s+content="([^"]+)"/i);
  if (ogMatch && ogMatch[1]) {
    const url = decodeHtmlEntities(ogMatch[1]);
    if (url.startsWith('http')) candidates.push(url);
  }

  // Regex search for mp4 links inside json
  const generalMp4Matches = html.matchAll(/"(https:[^"]+?\.mp4[^"]*?)"/g);
  for (const m of generalMp4Matches) {
    if (m[1]) {
      candidates.push(cleanEscapedUrl(m[1]));
    }
  }

  // Filter out duplicates and invalid strings
  return Array.from(new Set(candidates)).filter((u) => u.startsWith('http'));
}

function cleanEscapedUrl(urlStr: string): string {
  return urlStr
    .replace(/\\u0026/g, '&')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&');
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

async function downloadStreamToFile(url: string, outputPath: string, headers: Record<string, string>): Promise<void> {
  const resp = await fetch(url, { headers });
  if (!resp.ok) {
    throw new Error(`Failed to download video stream (Status ${resp.status})`);
  }

  const contentLength = Number(resp.headers.get('content-length') || 0);
  if (contentLength > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (contentLength / (1024 * 1024)).toFixed(1);
    throw new Error(`Video exceeds the maximum allowed file size of ${MAX_FILE_SIZE_MB}MB (detected ${sizeMb}MB).`);
  }

  if (!resp.body) {
    throw new Error('Video stream contained no readable data.');
  }

  // Stream data directly to disk to prevent Node heap memory spikes
  const fileStream = fs.createWriteStream(outputPath);
  let bytesDownloaded = 0;
  const nodeReadable = Readable.fromWeb(resp.body as any);

  try {
    for await (const chunk of nodeReadable) {
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bytesDownloaded += bufferChunk.length;
      if (bytesDownloaded > MAX_FILE_SIZE_BYTES) {
        fileStream.destroy();
        deleteFileSafely(outputPath);
        throw new Error(`Video exceeds the maximum allowed file size of ${MAX_FILE_SIZE_MB}MB.`);
      }
      if (!fileStream.write(bufferChunk)) {
        await new Promise<void>((resolve) => {
          fileStream.once('drain', () => resolve());
        });
      }
    }

    await new Promise<void>((resolve, reject) => {
      fileStream.end(() => resolve());
      fileStream.on('error', reject);
    });
  } catch (err) {
    fileStream.destroy();
    deleteFileSafely(outputPath);
    throw err;
  }
}
