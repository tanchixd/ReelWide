import React, { useState } from 'react';
import { ConversionJob } from '../types.js';
import { saveVideoToGallery } from '../utils/galleryDownload.js';
import {
  Download,
  CheckCircle,
  Share2,
  RefreshCw,
  Film,
  Volume2,
  HardDrive,
  Maximize,
  Sparkles,
  Layers,
  Crop,
  RotateCw,
  Loader2,
  Coffee,
  QrCode,
} from 'lucide-react';

interface ResultCardProps {
  job: ConversionJob;
  onReset: () => void;
  onOpenCoffeeModal?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ job, onReset, onOpenCoffeeModal }) => {
  const [activeTab, setActiveTab] = useState<'after' | 'before_after'>('after');
  const [copied, setCopied] = useState(false);
  const [isSavingToGallery, setIsSavingToGallery] = useState(false);
  const [galleryMsg, setGalleryMsg] = useState<string | null>(null);

  const outMeta = job.outputMeta;
  const inMeta = job.inputInfo.metadata;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const handleCopyLink = () => {
    if (job.downloadUrl) {
      navigator.clipboard.writeText(window.location.origin + job.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header with success badge & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Landscape Video Ready!
            </h2>
            <p className="text-xs text-neutral-400">
              {job.inputInfo.title || 'Facebook Video'} transformed to {job.config.aspectRatio} landscape
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switch */}
          <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
            <button
              type="button"
              id="view-after-tab"
              onClick={() => setActiveTab('after')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'after'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Landscape Video
            </button>
            <button
              type="button"
              id="view-before-after-tab"
              onClick={() => setActiveTab('before_after')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                activeTab === 'before_after'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Before & After
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Presentation Area */}
      {activeTab === 'after' ? (
        <div className="w-full rounded-2xl overflow-hidden bg-black border border-neutral-800 shadow-xl">
          <video
            controls
            autoPlay
            playsInline
            src={job.downloadUrl}
            className="w-full max-h-[500px] object-contain mx-auto bg-black"
          />
        </div>
      ) : (
        /* Before / After Dual View */
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-black/60 p-4 rounded-2xl border border-neutral-800">
          {/* Before: 9:16 vertical original */}
          <div className="sm:col-span-4 flex flex-col items-center">
            <div className="text-xs font-semibold text-neutral-400 mb-2 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-neutral-500" />
              <span>Before (Original Reel)</span>
            </div>
            <div className="w-full aspect-[9/16] max-h-[380px] bg-black rounded-xl overflow-hidden border border-neutral-700 shadow-lg relative">
              <video
                controls
                playsInline
                src={job.inputInfo.streamUrl}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-500 mt-2">
              {inMeta.width}×{inMeta.height} ({inMeta.aspectRatioLabel})
            </span>
          </div>

          {/* Divider arrow */}
          <div className="sm:col-span-1 hidden sm:flex justify-center text-blue-500 font-bold text-lg">
            →
          </div>

          {/* After: landscape final */}
          <div className="sm:col-span-7 flex flex-col items-center">
            <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>After (Landscape Format)</span>
            </div>
            <div className="w-full rounded-xl overflow-hidden border border-neutral-700 bg-black shadow-lg">
              <video
                controls
                playsInline
                src={job.downloadUrl}
                className="w-full max-h-[380px] object-contain bg-black"
              />
            </div>
            <span className="text-[11px] font-mono text-neutral-400 mt-2">
              {outMeta?.width}×{outMeta?.height} ({job.config.aspectRatio} Landscape)
            </span>
          </div>
        </div>
      )}

      {/* Metadata Badges: Resolution, Aspect Ratio, File Size, FPS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Maximize className="w-3.5 h-3.5 text-blue-400" />
            <span>Resolution</span>
          </div>
          <p className="text-sm font-bold text-white font-mono">
            {outMeta ? `${outMeta.width} × ${outMeta.height}` : '1920 × 1080'}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Film className="w-3.5 h-3.5 text-indigo-400" />
            <span>Aspect Ratio</span>
          </div>
          <p className="text-sm font-bold text-white font-mono">
            {job.config.aspectRatio} Landscape
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>File Size</span>
          </div>
          <p className="text-sm font-bold text-white font-mono">
            {formatBytes(outMeta?.sizeBytes)}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audio & FPS</span>
          </div>
          <p className="text-sm font-bold text-white font-mono">
            {outMeta?.hasAudio ? 'AAC Sync' : 'Muted'} • {outMeta?.fps || 30} FPS
          </p>
        </div>
      </div>

      {/* Applied mode summary */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/80">
        <span className="font-semibold text-neutral-300">Processing Mode:</span>
        <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/40 text-blue-300 flex items-center gap-1 font-medium">
          {job.config.mode === 'change_orientation' && <RotateCw className="w-3 h-3 text-emerald-400" />}
          {job.config.mode === 'blur_fill' && <Layers className="w-3 h-3" />}
          {job.config.mode === 'crop_fill' && <Crop className="w-3 h-3" />}
          {job.config.mode === 'smart_crop' && <Sparkles className="w-3 h-3 text-amber-400" />}
          <span className="capitalize">
            {job.config.mode === 'change_orientation' ? 'Landscape Orientation' : job.config.mode.replace('_', ' ')}
          </span>
        </span>

        {job.config.mode === 'change_orientation' && (
          <span className="text-[11px] text-neutral-400">
            (Rotated {job.config.orientationOptions?.rotation ?? 90}° to Landscape{job.config.orientationOptions?.flipHorizontal ? ', Mirrored' : ''})
          </span>
        )}

        {job.config.mode === 'blur_fill' && (
          <span className="text-[11px] text-neutral-500">
            (Blur: {job.config.blurOptions.blurStrength}px, Dim: {Math.round(job.config.blurOptions.bgBrightness * 100)}%, Zoom: {job.config.blurOptions.bgZoom}x)
          </span>
        )}

        {job.config.mode === 'crop_fill' && (
          <span className="text-[11px] text-neutral-500">
            (Pan X: {job.config.cropOptions.xPosition}%, Y: {job.config.cropOptions.yPosition}%, Zoom: {job.config.cropOptions.zoom}x)
          </span>
        )}
      </div>

      {/* Primary Actions: Download & Convert Another */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
        <button
          type="button"
          id="convert-another-btn"
          onClick={onReset}
          className="w-full sm:w-auto px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Convert Another Video</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Save Directly to Gallery button */}
          <button
            type="button"
            id="result-save-gallery-btn"
            onClick={async () => {
              if (!job.downloadUrl) return;
              setIsSavingToGallery(true);
              setGalleryMsg('Saving to device gallery...');
              try {
                const title = (job.inputInfo.title || 'landscape_video').replace(/[^a-z0-9]/gi, '_');
                const res = await saveVideoToGallery(job.downloadUrl, `${title}_landscape.mp4`, (m) => setGalleryMsg(m));
                setGalleryMsg(
                  res.method === 'web-share'
                    ? 'Tap "Save Video" in the share sheet to store in Photos/Gallery!'
                    : 'Video downloaded to your device gallery!'
                );
              } catch (err: any) {
                setGalleryMsg(err.message || 'Download failed');
              } finally {
                setIsSavingToGallery(false);
                setTimeout(() => setGalleryMsg(null), 5000);
              }
            }}
            disabled={isSavingToGallery}
            className="px-4 py-3 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-700/60 hover:border-emerald-600 text-emerald-300 hover:text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
            id="copy-video-link-btn"
            onClick={handleCopyLink}
            className="px-3.5 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Copy download link"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>

          {onOpenCoffeeModal && (
            <button
              type="button"
              id="result-support-creator-btn"
              onClick={onOpenCoffeeModal}
              className="px-3.5 py-3 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-amber-500/20 hover:from-purple-500/30 hover:to-amber-500/30 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              title="Support Tanchi via UPI QR Code or Coffee"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <Coffee className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
              <span>Support</span>
            </button>
          )}

          <a
            id="download-video-btn"
            href={job.downloadUrl}
            download
            className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download MP4</span>
          </a>
        </div>
      </div>

      {galleryMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
          <span>{galleryMsg}</span>
          <button
            type="button"
            onClick={() => setGalleryMsg(null)}
            className="text-emerald-400 hover:text-white text-[11px] font-mono ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
