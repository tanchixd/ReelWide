import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.js';
import { UrlInputCard } from './components/UrlInputCard.js';
import { AspectRatioSelector } from './components/AspectRatioSelector.js';
import { FillModeControls } from './components/FillModeControls.js';
import { ResolutionSelector } from './components/ResolutionSelector.js';
import { VideoEditorPreview } from './components/VideoEditorPreview.js';
import { ProcessingModal } from './components/ProcessingModal.js';
import { ResultCard } from './components/ResultCard.js';
import { Footer } from './components/Footer.js';
import { BuyMeACoffeeModal } from './components/BuyMeACoffeeModal.js';
import { AdBannerPlaceholder } from './components/AdBannerPlaceholder.js';
import { saveVideoToGallery } from './utils/galleryDownload.js';
import {
  FacebookVideoInfo,
  ConversionConfig,
  ConversionJob,
  AspectRatioPreset,
  CustomRatio,
  ConversionMode,
  OrientationOptions,
  BlurFillOptions,
  CropFillOptions,
  ResolutionTarget,
} from './types.js';
import { ArrowRight, Film, Sparkles, RefreshCw, RotateCw, Download, Loader2, CheckCircle } from 'lucide-react';

export default function App() {
  const [loadedVideo, setLoadedVideo] = useState<FacebookVideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false);
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [galleryStatusMessage, setGalleryStatusMessage] = useState<string | null>(null);

  // Conversion settings - default to change_orientation (rotate into landscape)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('16:9');
  const [customRatio, setCustomRatio] = useState<CustomRatio>({ width: 16, height: 9 });
  const [mode, setMode] = useState<ConversionMode>('change_orientation');
  const [resolution, setResolution] = useState<ResolutionTarget>('1080p');

  const [orientationOptions, setOrientationOptions] = useState<OrientationOptions>({
    rotation: 90,
    flipHorizontal: false,
    flipVertical: false,
    fitMode: 'fit',
  });

  const [blurOptions, setBlurOptions] = useState<BlurFillOptions>({
    blurStrength: 30,
    bgBrightness: -0.2,
    bgZoom: 1.15,
  });

  const [cropOptions, setCropOptions] = useState<CropFillOptions>({
    xPosition: 0,
    yPosition: 0,
    zoom: 1.0,
  });

  // Active conversion job
  const [activeJob, setActiveJob] = useState<ConversionJob | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const pollIntervalRef = useRef<number | null>(null);

  const currentConfig: ConversionConfig = {
    aspectRatio,
    customRatio,
    mode,
    resolution,
    orientationOptions,
    blurOptions,
    cropOptions,
  };

  const handleStartConversion = async () => {
    if (!loadedVideo) return;

    setErrorMessage(null);
    setIsModalOpen(true);

    try {
      const resp = await fetch('/api/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoInfo: loadedVideo,
          config: currentConfig,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Failed to start conversion.');
      }

      const jobId = data.jobId;
      pollJobStatus(jobId);
    } catch (err: any) {
      if (activeJob) {
        setActiveJob({
          ...activeJob,
          stage: 'failed',
          error: err.message,
        });
      } else {
        setErrorMessage(err.message || 'Conversion initiation failed.');
        setIsModalOpen(false);
      }
    }
  };

  const pollJobStatus = (jobId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = window.setInterval(async () => {
      try {
        const resp = await fetch(`/api/job-status/${jobId}`);
        if (!resp.ok) return;

        const job: ConversionJob = await resp.json();
        setActiveJob(job);

        if (job.stage === 'ready') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsFinished(true);
        } else if (job.stage === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleDownloadToGallery = async () => {
    if (!loadedVideo) return;
    setIsSavingToGallery(true);
    setGalleryStatusMessage('Preparing video for direct gallery save...');

    try {
      const fileIdMatch = loadedVideo.streamUrl.match(/\/api\/video-stream\/([^?#]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : '';
      const safeTitle = (loadedVideo.title || 'facebook_video').replace(/[^a-z0-9]/gi, '_');
      const downloadUrl = fileId
        ? `/api/download-direct/${fileId}?title=${encodeURIComponent(safeTitle)}`
        : loadedVideo.streamUrl;

      const result = await saveVideoToGallery(downloadUrl, `${safeTitle}.mp4`, (msg) => {
        setGalleryStatusMessage(msg);
      });

      setGalleryStatusMessage(
        result.method === 'web-share'
          ? 'Tap "Save Video" in the share sheet to store in your Photos / Gallery!'
          : 'Video downloaded! Saved to your device Gallery / Downloads.'
      );
    } catch (err: any) {
      setGalleryStatusMessage(err.message || 'Could not download video.');
    } finally {
      setIsSavingToGallery(false);
      setTimeout(() => setGalleryStatusMessage(null), 5000);
    }
  };

  const handleReset = () => {
    setLoadedVideo(null);
    setActiveJob(null);
    setIsFinished(false);
    setIsModalOpen(false);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-blue-200">
      <Header onOpenCoffeeModal={() => setIsCoffeeModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* VIEW 1: Finished Result Screen */}
        {isFinished && activeJob && activeJob.stage === 'ready' ? (
          <div className="space-y-6">
            <ResultCard
              job={activeJob}
              onReset={handleReset}
              onOpenCoffeeModal={() => setIsCoffeeModalOpen(true)}
            />
            {/* High-conversion Ad slot below results */}
            <AdBannerPlaceholder
              slotId="results-banner-1"
              format="horizontal"
              label="Sponsored Partner"
              className="max-w-4xl"
            />
          </div>
        ) : !loadedVideo ? (
          /* VIEW 2: Initial Facebook URL Ingestion Screen */
          <div className="space-y-8">
            <UrlInputCard
              onVideoLoaded={(video) => {
                setLoadedVideo(video);
                setIsFinished(false);
              }}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />

            {/* Non-intrusive Mid-page Banner Placeholder */}
            <AdBannerPlaceholder
              slotId="home-leaderboard-1"
              format="horizontal"
              label="Sponsored Video Tools"
              className="max-w-4xl"
            />

            {/* Feature highlights strictly respecting the requested Facebook scope */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto pt-6">
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                      <RotateCw className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      Best for Movies
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Landscape Orientation</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    Turn vertical 9:16 reels right-side up into 16:9 landscape videos (90° CW, 90° CCW, 180°, and mirror options) with no blur bars.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-neutral-800/80 text-[11px] font-medium text-emerald-400">
                  Best for movies that aren&apos;t in fullscreen
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Film className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                      Widescreen Clips
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Crop or Blur Modes</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    Alternatively scale & pan with crop to fill, apply smart subject-aware framing, or use smooth blurred backdrops if preferred.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-neutral-800/80 text-[11px] font-medium text-amber-300">
                  Best for movies that aren&apos;t in fullscreen
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      Direct Save
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">Lossless Audio & FFmpeg</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                    Preserves pristine AAC audio sync, native framerates, and renders with hardware-accelerated H.264 server pipelines.
                  </p>
                </div>
                <div className="pt-2.5 border-t border-neutral-800/80 text-[11px] font-medium text-blue-400">
                  Direct download to device gallery
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 3: Video Loaded -> Editor & Conversion Controls */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Video Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                    {loadedVideo.title || 'Facebook Video'}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="font-mono text-neutral-300">
                      {loadedVideo.metadata.width}×{loadedVideo.metadata.height}
                    </span>
                    <span>•</span>
                    <span>{loadedVideo.metadata.duration.toFixed(1)}s</span>
                    <span>•</span>
                    <span className="text-blue-400 font-medium">
                      {loadedVideo.metadata.aspectRatioLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <button
                  type="button"
                  id="bar-save-to-gallery-btn"
                  onClick={handleDownloadToGallery}
                  disabled={isSavingToGallery}
                  title="Download original video directly into your device gallery / camera roll"
                  className="px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/60 hover:border-emerald-600 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSavingToGallery ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Save to Gallery</span>
                </button>

                <button
                  type="button"
                  id="change-video-btn"
                  onClick={handleReset}
                  className="px-3.5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Change Video</span>
                </button>
              </div>
            </div>

            {/* Gallery Save Toast Notice */}
            {galleryStatusMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="flex-1 font-medium">{galleryStatusMessage}</span>
                <button
                  type="button"
                  onClick={() => setGalleryStatusMessage(null)}
                  className="text-emerald-400 hover:text-white text-[11px] font-mono px-1.5 py-0.5 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Main Editor Grid: Left = Live Preview, Right = Configuration Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left column: Real-time Editor Preview */}
              <div className="lg:col-span-7 space-y-4">
                <VideoEditorPreview
                  videoInfo={loadedVideo}
                  config={currentConfig}
                />
                <AdBannerPlaceholder
                  slotId="editor-preview-bottom-1"
                  format="horizontal"
                  label="Sponsored Recommendation"
                />
              </div>

              {/* Right column: Aspect ratio, mode & resolution controls */}
              <div className="lg:col-span-5 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-6">
                {/* 1. Aspect Ratio */}
                <AspectRatioSelector
                  selectedPreset={aspectRatio}
                  onSelectPreset={setAspectRatio}
                  customRatio={customRatio}
                  onCustomRatioChange={setCustomRatio}
                />

                <div className="border-t border-neutral-800" />

                {/* 2. Fill Mode & Fine-tuning Sliders */}
                <FillModeControls
                  mode={mode}
                  onModeChange={setMode}
                  orientationOptions={orientationOptions}
                  onOrientationOptionsChange={setOrientationOptions}
                  blurOptions={blurOptions}
                  onBlurOptionsChange={setBlurOptions}
                  cropOptions={cropOptions}
                  onCropOptionsChange={setCropOptions}
                />

                <div className="border-t border-neutral-800" />

                {/* 3. Output Resolution */}
                <ResolutionSelector
                  selectedResolution={resolution}
                  onSelectResolution={setResolution}
                  sourceMeta={loadedVideo.metadata}
                />

                {/* 4. Convert Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="convert-to-landscape-btn"
                    onClick={handleStartConversion}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Convert to Landscape</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-center text-neutral-500 mt-2">
                    Processed with server-side FFmpeg • Audio and original quality preserved
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Made By Tanchi Footer */}
      <Footer onOpenCoffeeModal={() => setIsCoffeeModalOpen(true)} />

      {/* Buy Me a Coffee (Support Tanchi) Modal */}
      <BuyMeACoffeeModal
        isOpen={isCoffeeModalOpen}
        onClose={() => setIsCoffeeModalOpen(false)}
      />

      {/* Progress & Processing Modal */}
      {activeJob && (
        <ProcessingModal
          isOpen={isModalOpen}
          stage={activeJob.stage}
          progress={activeJob.progress}
          message={activeJob.message}
          error={activeJob.error}
          onClose={() => {
            setIsModalOpen(false);
            if (activeJob.stage === 'ready') {
              setIsFinished(true);
            }
          }}
        />
      )}
    </div>
  );
}
