import React from 'react';
import { ResolutionTarget, VideoMetadata } from '../types.js';
import { Check, Sparkles } from 'lucide-react';

interface ResolutionSelectorProps {
  selectedResolution: ResolutionTarget;
  onSelectResolution: (res: ResolutionTarget) => void;
  sourceMeta?: VideoMetadata;
}

interface ResolutionOption {
  id: ResolutionTarget;
  label: string;
  description: string;
  minHeight: number;
}

const OPTIONS: ResolutionOption[] = [
  { id: '720p', label: '720p HD', description: 'Fast processing • Smaller size', minHeight: 720 },
  { id: '1080p', label: '1080p Full HD', description: 'Recommended • Pristine fidelity', minHeight: 1080 },
  { id: '1440p', label: '1440p 2K', description: 'Crisp monitors & YouTube', minHeight: 1440 },
  { id: '4k', label: '4K Ultra HD', description: 'Maximum canvas clarity', minHeight: 2160 },
];

export const ResolutionSelector: React.FC<ResolutionSelectorProps> = ({
  selectedResolution,
  onSelectResolution,
  sourceMeta,
}) => {
  const sourceHeight = sourceMeta ? Math.max(sourceMeta.width, sourceMeta.height) : 1080;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-200">
          Output Resolution
        </label>
        {sourceMeta && (
          <span className="text-xs text-neutral-400 font-mono">
            Source: {sourceMeta.width}×{sourceMeta.height} ({sourceMeta.fps} fps)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {OPTIONS.map((opt) => {
          const isSelected = selectedResolution === opt.id;
          const isUpscaling = opt.minHeight > sourceHeight;

          return (
            <button
              key={opt.id}
              type="button"
              id={`res-${opt.id}`}
              onClick={() => onSelectResolution(opt.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-white tracking-tight">
                  {opt.label}
                </span>
                {isSelected && <Check className="w-4 h-4 text-blue-400" />}
              </div>

              <span className="text-[11px] text-neutral-400 leading-tight mb-2">
                {opt.description}
              </span>

              {isUpscaling && (
                <div className="inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50 mt-auto">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Upscale</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-neutral-500 italic">
        *Source frame rate and original audio fidelity will be fully preserved during encoding.
      </p>
    </div>
  );
};
