import React from 'react';
import {
  ConversionMode,
  BlurFillOptions,
  CropFillOptions,
  OrientationOptions,
  RotationAngle,
} from '../types.js';
import {
  RotateCw,
  RotateCcw,
  RefreshCw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Crop,
  Sparkles,
  SlidersHorizontal,
  Sun,
  ZoomIn,
  Move,
  Compass,
} from 'lucide-react';

interface FillModeControlsProps {
  mode: ConversionMode;
  onModeChange: (mode: ConversionMode) => void;
  orientationOptions: OrientationOptions;
  onOrientationOptionsChange: (opts: OrientationOptions) => void;
  blurOptions: BlurFillOptions;
  onBlurOptionsChange: (opts: BlurFillOptions) => void;
  cropOptions: CropFillOptions;
  onCropOptionsChange: (opts: CropFillOptions) => void;
}

export const FillModeControls: React.FC<FillModeControlsProps> = ({
  mode,
  onModeChange,
  orientationOptions,
  onOrientationOptionsChange,
  blurOptions,
  onBlurOptionsChange,
  cropOptions,
  onCropOptionsChange,
}) => {
  const handleRotationChange = (angle: RotationAngle) => {
    onOrientationOptionsChange({
      ...orientationOptions,
      rotation: angle,
    });
  };

  const toggleFlipH = () => {
    onOrientationOptionsChange({
      ...orientationOptions,
      flipHorizontal: !orientationOptions.flipHorizontal,
    });
  };

  const toggleFlipV = () => {
    onOrientationOptionsChange({
      ...orientationOptions,
      flipVertical: !orientationOptions.flipVertical,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-neutral-200 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-blue-400" />
          <span>Transformation Mode</span>
        </label>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300">
          Best for movies that aren&apos;t in fullscreen
        </span>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
        <button
          type="button"
          id="mode-change-orientation"
          onClick={() => onModeChange('change_orientation')}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            mode === 'change_orientation'
              ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/40'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5 text-emerald-300" />
          <span>Orientation</span>
        </button>

        <button
          type="button"
          id="mode-crop-fill"
          onClick={() => onModeChange('crop_fill')}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'crop_fill'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
          <span>Crop to Fill</span>
        </button>

        <button
          type="button"
          id="mode-smart-crop"
          onClick={() => onModeChange('smart_crop')}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'smart_crop'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Smart Crop</span>
        </button>

        <button
          type="button"
          id="mode-blur-fill"
          onClick={() => onModeChange('blur_fill')}
          className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'blur_fill'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Blur Fill</span>
        </button>
      </div>

      {/* Mode-Specific Fine Tuning Controls */}
      {mode === 'change_orientation' && (
        <div className="p-4 rounded-xl bg-neutral-900/70 border border-neutral-800/90 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200">
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Rotate Video into Landscape</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-800/40">
              Best for movies that aren&apos;t in fullscreen
            </span>
          </div>

          {/* Rotation Angle Selection */}
          <div className="space-y-2">
            <label className="text-xs text-neutral-400 block font-medium">
              Rotation Angle
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="rotate-90-cw-btn"
                onClick={() => handleRotationChange(90)}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  orientationOptions.rotation === 90
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <RotateCw className="w-4 h-4 text-blue-400" />
                <span>90° Clockwise</span>
                <span className="text-[10px] text-neutral-500">(Landscape)</span>
              </button>

              <button
                type="button"
                id="rotate-270-ccw-btn"
                onClick={() => handleRotationChange(270)}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  orientationOptions.rotation === 270
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-indigo-400" />
                <span>90° Counter-CW</span>
                <span className="text-[10px] text-neutral-500">(Landscape)</span>
              </button>

              <button
                type="button"
                id="rotate-180-btn"
                onClick={() => handleRotationChange(180)}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  orientationOptions.rotation === 180
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>180° Inverted</span>
                <span className="text-[10px] text-neutral-500">(Flip)</span>
              </button>
            </div>
          </div>

          {/* Flip & Mirror toggles */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-neutral-800/80">
            <button
              type="button"
              id="toggle-flip-horizontal-btn"
              onClick={toggleFlipH}
              className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                orientationOptions.flipHorizontal
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span>Mirror Horizontal</span>
            </button>

            <button
              type="button"
              id="toggle-flip-vertical-btn"
              onClick={toggleFlipV}
              className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                orientationOptions.flipVertical
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span>Flip Vertical</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'blur_fill' && (
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
            <span>Blur Backdrop Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Blur strength */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Blur Radius
                </span>
                <span className="font-mono text-neutral-300">{blurOptions.blurStrength}px</span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={blurOptions.blurStrength}
                onChange={(e) =>
                  onBlurOptionsChange({
                    ...blurOptions,
                    blurStrength: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Background brightness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3" /> Backdrop Dim
                </span>
                <span className="font-mono text-neutral-300">
                  {Math.round(blurOptions.bgBrightness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={-0.5}
                max={0.1}
                step={0.05}
                value={blurOptions.bgBrightness}
                onChange={(e) =>
                  onBlurOptionsChange({
                    ...blurOptions,
                    bgBrightness: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Background zoom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <ZoomIn className="w-3 h-3" /> Backdrop Scale
                </span>
                <span className="font-mono text-neutral-300">{blurOptions.bgZoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={1.8}
                step={0.05}
                value={blurOptions.bgZoom}
                onChange={(e) =>
                  onBlurOptionsChange({
                    ...blurOptions,
                    bgZoom: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'crop_fill' && (
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Move className="w-3.5 h-3.5 text-blue-400" />
            <span>Crop Positioning & Zoom</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Horizontal Position */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Horizontal Pan</span>
                <span className="font-mono text-neutral-300">
                  {cropOptions.xPosition > 0 ? `+${cropOptions.xPosition}%` : `${cropOptions.xPosition}%`}
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={2}
                value={cropOptions.xPosition}
                onChange={(e) =>
                  onCropOptionsChange({
                    ...cropOptions,
                    xPosition: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Vertical Position */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Vertical Tilt</span>
                <span className="font-mono text-neutral-300">
                  {cropOptions.yPosition > 0 ? `+${cropOptions.yPosition}%` : `${cropOptions.yPosition}%`}
                </span>
              </div>
              <input
                type="range"
                min={-100}
                max={100}
                step={2}
                value={cropOptions.yPosition}
                onChange={(e) =>
                  onCropOptionsChange({
                    ...cropOptions,
                    yPosition: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Zoom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Zoom Level</span>
                <span className="font-mono text-neutral-300">{cropOptions.zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.5}
                step={0.05}
                value={cropOptions.zoom}
                onChange={(e) =>
                  onCropOptionsChange({
                    ...cropOptions,
                    zoom: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'smart_crop' && (
        <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-semibold text-blue-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Saliency & Face-Aware Subject Framing</span>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            Smart Crop dynamically balances the composition to ensure faces and central action in vertical reels are kept inside the landscape frame without decapitation.
          </p>
        </div>
      )}
    </div>
  );
};
