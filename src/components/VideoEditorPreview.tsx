import React, { useRef, useState, useEffect } from 'react';
import { FacebookVideoInfo, ConversionConfig } from '../types.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Sparkles,
  Layers,
  Crop,
  Eye,
  Loader2,
  Download,
  CheckCircle,
} from 'lucide-react';
import { saveVideoToGallery } from '../utils/galleryDownload.js';

interface VideoEditorPreviewProps {
  videoInfo: FacebookVideoInfo;
  config: ConversionConfig;
}

export const VideoEditorPreview: React.FC<VideoEditorPreviewProps> = ({
  videoInfo,
  config,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(videoInfo.metadata.duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [isDownloadingDirect, setIsDownloadingDirect] = useState(false);
  const [directDownloadNotice, setDirectDownloadNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fgVideoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const origVideoRef = useRef<HTMLVideoElement>(null);

  // Compute CSS aspect ratio value
  let aspectRatioValue = 16 / 9;
  if (config.aspectRatio === '4:3') aspectRatioValue = 4 / 3;
  else if (config.aspectRatio === '3:2') aspectRatioValue = 3 / 2;
  else if (config.aspectRatio === '21:9') aspectRatioValue = 21 / 9;
  else if (config.aspectRatio === 'custom') {
    const w = config.customRatio?.width || 16;
    const h = config.customRatio?.height || 9;
    aspectRatioValue = w / h;
  }

  // Play / Pause synchronization without constant frame thrashing
  const togglePlay = () => {
    if (!fgVideoRef.current) return;
    if (fgVideoRef.current.paused) {
      if (bgVideoRef.current) {
        bgVideoRef.current.currentTime = fgVideoRef.current.currentTime;
        bgVideoRef.current.play().catch(() => {});
      }
      if (origVideoRef.current) {
        origVideoRef.current.currentTime = fgVideoRef.current.currentTime;
        origVideoRef.current.play().catch(() => {});
      }
      fgVideoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      fgVideoRef.current.pause();
      if (bgVideoRef.current) bgVideoRef.current.pause();
      if (origVideoRef.current) origVideoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!fgVideoRef.current) return;
    setCurrentTime(fgVideoRef.current.currentTime);
    if (!duration && fgVideoRef.current.duration) {
      setDuration(fgVideoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (fgVideoRef.current) fgVideoRef.current.currentTime = time;
    if (bgVideoRef.current) bgVideoRef.current.currentTime = time;
    if (origVideoRef.current) origVideoRef.current.currentTime = time;
  };

  const handleSeeked = () => {
    setIsBuffering(false);
    if (fgVideoRef.current) {
      const cur = fgVideoRef.current.currentTime;
      if (bgVideoRef.current && Math.abs(bgVideoRef.current.currentTime - cur) > 0.3) {
        bgVideoRef.current.currentTime = cur;
      }
      if (origVideoRef.current && Math.abs(origVideoRef.current.currentTime - cur) > 0.3) {
        origVideoRef.current.currentTime = cur;
      }
    }
  };

  const videoEventHandlers = {
    onTimeUpdate: handleTimeUpdate,
    onWaiting: () => setIsBuffering(true),
    onSeeking: () => setIsBuffering(true),
    onCanPlay: () => setIsBuffering(false),
    onPlaying: () => {
      setIsBuffering(false);
      setIsPlaying(true);
    },
    onPause: () => setIsPlaying(false),
    onSeeked: handleSeeked,
    preload: 'auto' as const,
  };

  const toggleMute = () => {
    if (!fgVideoRef.current) return;
    const next = !fgVideoRef.current.muted;
    fgVideoRef.current.muted = next;
    setIsMuted(next);
  };

  // Robust Fullscreen handling with fallback and event synchronization
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      const doc = document as any;
      const isCurrentlyFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isCurrentlyFs && !isFullscreen) {
        const elem = containerRef.current as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        } else {
          // Fallback to pure CSS viewport fullscreen
          setIsFullscreen(true);
          return;
        }
        setIsFullscreen(true);
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch {
      // In iframes, requestFullscreen might be disallowed by browser policy:
      // toggle the simulated full-screen overlay smoothly
      setIsFullscreen((prev) => !prev);
    }
  };

  // Listen for native fullscreen changes & Escape key
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isNativeFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        const doc = document as any;
        if (doc.fullscreenElement) {
          doc.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Handle direct download of original Facebook reel into user's device gallery
  const handleDownloadOriginalToGallery = async () => {
    setIsDownloadingDirect(true);
    setDirectDownloadNotice('Preparing video for your gallery...');

    try {
      const fileIdMatch = videoInfo.streamUrl.match(/\/api\/video-stream\/([^?#]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : '';
      const safeTitle = (videoInfo.title || 'facebook_reel').replace(/[^a-z0-9]/gi, '_');
      const downloadUrl = fileId
        ? `/api/download-direct/${fileId}?title=${encodeURIComponent(safeTitle)}`
        : videoInfo.streamUrl;

      const result = await saveVideoToGallery(downloadUrl, `${safeTitle}.mp4`, (msg) => {
        setDirectDownloadNotice(msg);
      });

      setDirectDownloadNotice(
        result.method === 'web-share'
          ? 'Tap "Save Video" in the share sheet to store in your Photos / Gallery!'
          : 'Video downloaded to your device! Check your Gallery or Downloads.'
      );
    } catch (err: any) {
      setDirectDownloadNotice(err.message || 'Could not download video.');
    } finally {
      setIsDownloadingDirect(false);
      setTimeout(() => setDirectDownloadNotice(null), 5000);
    }
  };

  // Reset video when stream changes
  useEffect(() => {
    if (fgVideoRef.current) {
      fgVideoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [videoInfo.streamUrl]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-3">
      {/* Top Bar above preview */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-sm font-semibold text-neutral-200">
            Real-Time Landscape Video Preview
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
            {config.aspectRatio === 'custom'
              ? `${config.customRatio?.width}:${config.customRatio?.height}`
              : config.aspectRatio}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Save to Gallery button */}
          <button
            type="button"
            id="preview-save-gallery-top-btn"
            onClick={handleDownloadOriginalToGallery}
            disabled={isDownloadingDirect}
            title="Download original video directly into your device gallery / camera roll"
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-500/60 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isDownloadingDirect ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Save to Gallery</span>
          </button>

          <button
            type="button"
            id="toggle-comparison-btn"
            onClick={() => setShowOriginalComparison(!showOriginalComparison)}
            className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showOriginalComparison
                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showOriginalComparison ? 'Hide Original (9:16)' : 'Compare with Original'}</span>
          </button>
        </div>
      </div>

      {/* Direct Download Feedback Toast */}
      {directDownloadNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium">{directDownloadNotice}</span>
          <button
            type="button"
            onClick={() => setDirectDownloadNotice(null)}
            className="text-emerald-400 hover:text-white text-[11px] font-mono px-1.5 py-0.5 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {/* Main Preview Container with glitch-free fullscreen styling */}
        <div
          ref={containerRef}
          className={`relative w-full overflow-hidden bg-neutral-950 flex flex-col group select-none transition-all ${
            isFullscreen
              ? 'fixed inset-0 z-50 w-screen h-screen bg-black rounded-none border-none justify-between p-0 m-0'
              : 'rounded-2xl border border-neutral-800 shadow-2xl'
          }`}
        >
          {/* Top Info Overlay */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
            <span className="px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono text-white flex items-center gap-1.5 shadow-lg">
              {config.mode === 'change_orientation' && <RotateCw className="w-3 h-3 text-emerald-400" />}
              {config.mode === 'blur_fill' && <Layers className="w-3 h-3 text-blue-400" />}
              {config.mode === 'crop_fill' && <Crop className="w-3 h-3 text-emerald-400" />}
              {config.mode === 'smart_crop' && <Sparkles className="w-3 h-3 text-amber-400" />}
              <span className="capitalize">
                {config.mode === 'change_orientation'
                  ? `Rotate ${config.orientationOptions?.rotation ?? 90}° Landscape`
                  : config.mode.replace('_', ' ')}
              </span>
            </span>
          </div>

          {/* Fullscreen Floating Exit Button */}
          {isFullscreen && (
            <div className="absolute top-3 right-3 z-40">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 border border-neutral-700/80 shadow-2xl backdrop-blur-md cursor-pointer transition-transform active:scale-95"
              >
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span>Exit Fullscreen (Esc)</span>
              </button>
            </div>
          )}

          {/* Aspect Ratio Canvas Wrapper */}
          <div
            className={`w-full flex items-center justify-center bg-black relative overflow-hidden transition-all duration-200 ${
              isFullscreen ? 'flex-1 h-full max-h-[calc(100vh-76px)]' : ''
            }`}
            style={{
              aspectRatio: isFullscreen ? undefined : `${aspectRatioValue}`,
              maxHeight: isFullscreen ? 'calc(100vh - 76px)' : '480px',
              height: isFullscreen ? 'calc(100vh - 76px)' : undefined,
            }}
          >
            {/* MODE: CHANGE ORIENTATION (ROTATE TO LANDSCAPE) */}
            {config.mode === 'change_orientation' && (() => {
              const rot = config.orientationOptions?.rotation ?? 90;
              const scale = rot === 90 || rot === 270 ? aspectRatioValue : 1.0;
              const flipX = config.orientationOptions?.flipHorizontal ? -1 : 1;
              const flipY = config.orientationOptions?.flipVertical ? -1 : 1;
              return (
                <div
                  className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-pointer bg-black"
                  onClick={togglePlay}
                >
                  <video
                    ref={fgVideoRef}
                    src={videoInfo.streamUrl}
                    muted={isMuted}
                    playsInline
                    loop
                    {...videoEventHandlers}
                    className="w-full h-full object-contain transition-transform duration-200 ease-out"
                    style={{
                      transform: `rotate(${rot}deg) scale(${scale * flipX}, ${scale * flipY})`,
                    }}
                  />
                </div>
              );
            })()}

            {/* MODE: BLUR FILL */}
            {config.mode === 'blur_fill' && (
              <>
                {/* Blurred Background Layer */}
                <video
                  ref={bgVideoRef}
                  src={videoInfo.streamUrl}
                  muted
                  playsInline
                  loop
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-100 ease-linear"
                  style={{
                    filter: `blur(${config.blurOptions.blurStrength / 2.5}px) brightness(${
                      1 + config.blurOptions.bgBrightness
                    })`,
                    transform: `scale(${config.blurOptions.bgZoom})`,
                  }}
                />

                {/* Centered Original Crisp Video */}
                <video
                  ref={fgVideoRef}
                  src={videoInfo.streamUrl}
                  muted={isMuted}
                  playsInline
                  loop
                  {...videoEventHandlers}
                  onClick={togglePlay}
                  className="relative z-10 h-full max-h-full max-w-full object-contain cursor-pointer shadow-2xl drop-shadow-2xl"
                />
              </>
            )}

            {/* MODE: CROP TO FILL */}
            {config.mode === 'crop_fill' && (
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <video
                  ref={fgVideoRef}
                  src={videoInfo.streamUrl}
                  muted={isMuted}
                  playsInline
                  loop
                  {...videoEventHandlers}
                  className="w-full h-full object-cover transition-transform duration-100 ease-linear"
                  style={{
                    transform: `scale(${config.cropOptions.zoom}) translate(${
                      (config.cropOptions.xPosition * 0.4).toFixed(1)
                    }%, ${(config.cropOptions.yPosition * 0.4).toFixed(1)}%)`,
                  }}
                />
              </div>
            )}

            {/* MODE: SMART CROP */}
            {config.mode === 'smart_crop' && (
              <div
                className="w-full h-full relative overflow-hidden flex items-center justify-center cursor-pointer"
                onClick={togglePlay}
              >
                <video
                  ref={fgVideoRef}
                  src={videoInfo.streamUrl}
                  muted={isMuted}
                  playsInline
                  loop
                  {...videoEventHandlers}
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'translateY(-10%) scale(1.0)',
                  }}
                />
              </div>
            )}

            {/* Buffering Indicator Overlay */}
            {isBuffering && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-xs pointer-events-none transition-opacity">
                <div className="px-3.5 py-2 rounded-xl bg-neutral-900/90 border border-neutral-700/80 text-white text-xs font-medium flex items-center gap-2 shadow-2xl">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Buffering video...</span>
                </div>
              </div>
            )}

            {/* Center Play Button Overlay when paused */}
            {!isPlaying && !isBuffering && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute z-30 w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Play className="w-8 h-8 ml-1 fill-white" />
              </button>
            )}
          </div>

          {/* Bottom Player Controls Bar */}
          <div className="bg-neutral-950/95 border-t border-neutral-800/80 p-3 flex flex-col gap-2 z-20">
            {/* Progress Scrubber */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-neutral-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                onMouseUp={handleSeeked}
                onTouchEnd={handleSeeked}
                className="w-full accent-blue-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-neutral-400 w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback action buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="preview-play-btn"
                  onClick={togglePlay}
                  className="p-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (fgVideoRef.current) fgVideoRef.current.currentTime = 0;
                  }}
                  title="Restart"
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-2 text-neutral-200 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Save directly to gallery button in player bar */}
                <button
                  type="button"
                  id="preview-save-to-gallery-btn"
                  onClick={handleDownloadOriginalToGallery}
                  disabled={isDownloadingDirect}
                  title="Save original video directly into device gallery"
                  className="px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Save to Gallery</span>
                </button>

                <button
                  type="button"
                  id="preview-fullscreen-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Side-by-Side Original Comparison */}
        {showOriginalComparison && !isFullscreen && (
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center gap-6 animate-in fade-in duration-200">
            <div className="w-44 shrink-0 aspect-[9/16] bg-black rounded-lg overflow-hidden border border-neutral-700 relative shadow-lg">
              <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                Original 9:16
              </div>
              <video
                ref={origVideoRef}
                src={videoInfo.streamUrl}
                muted
                playsInline
                loop
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5 text-xs text-neutral-300">
              <h4 className="font-bold text-white text-sm">Original Reel Specs</h4>
              <p>Dimensions: {videoInfo.metadata.width} × {videoInfo.metadata.height}px</p>
              <p>Duration: {videoInfo.metadata.duration.toFixed(1)}s • {videoInfo.metadata.fps} FPS</p>
              <p>Aspect: {videoInfo.metadata.aspectRatioLabel}</p>
              <p className="text-neutral-400 pt-1">
                Notice how the landscape version maintains visual proportion with zero stretching or distortion.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
