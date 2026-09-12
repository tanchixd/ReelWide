import React from 'react';
import { AspectRatioPreset, CustomRatio } from '../types.js';
import { Monitor, Tv, Smartphone, Maximize2 } from 'lucide-react';

interface AspectRatioSelectorProps {
  selectedPreset: AspectRatioPreset;
  onSelectPreset: (preset: AspectRatioPreset) => void;
  customRatio: CustomRatio;
  onCustomRatioChange: (ratio: CustomRatio) => void;
}

const PRESETS: { id: AspectRatioPreset; label: string; sub: string; icon: React.FC<{ className?: string }> }[] = [
  { id: '16:9', label: '16:9', sub: 'Standard Landscape', icon: Monitor },
  { id: '4:3', label: '4:3', sub: 'Classic TV / iPad', icon: Tv },
  { id: '3:2', label: '3:2', sub: 'DSLR / Photography', icon: Smartphone },
  { id: '21:9', label: '21:9', sub: 'Cinematic Ultrawide', icon: Maximize2 },
  { id: 'custom', label: 'Custom', sub: 'Width × Height', icon: Monitor },
];

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  selectedPreset,
  onSelectPreset,
  customRatio,
  onCustomRatioChange,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-200">
          Target Aspect Ratio
        </label>
        <span className="text-xs text-neutral-400 font-mono">
          {selectedPreset === 'custom'
            ? `${customRatio.width}:${customRatio.height} (${(customRatio.width / customRatio.height).toFixed(2)}:1)`
            : selectedPreset}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              type="button"
              id={`preset-${preset.id.replace(':', '-')}`}
              onClick={() => onSelectPreset(preset.id)}
              className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-500/10 ring-1 ring-blue-500'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  {preset.label}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-neutral-500'}`} />
              </div>
              <span className="text-[11px] leading-tight text-neutral-400">
                {preset.sub}
              </span>
            </button>
          );
        })}
      </div>

      {selectedPreset === 'custom' && (
        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3 animate-in fade-in duration-200">
          <span className="text-xs text-neutral-300 font-medium">Custom Ratio:</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={100}
              step={0.1}
              value={customRatio.width}
              onChange={(e) =>
                onCustomRatioChange({
                  ...customRatio,
                  width: Math.max(1, parseFloat(e.target.value) || 1),
                })
              }
              className="w-18 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white text-center focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <span className="text-neutral-500 font-bold">:</span>
            <input
              type="number"
              min={1}
              max={100}
              step={0.1}
              value={customRatio.height}
              onChange={(e) =>
                onCustomRatioChange({
                  ...customRatio,
                  height: Math.max(1, parseFloat(e.target.value) || 1),
                })
              }
              className="w-18 bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-white text-center focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <span className="text-xs text-neutral-500 font-mono ml-auto">
            Factor: {(customRatio.width / customRatio.height).toFixed(3)}
          </span>
        </div>
      )}
    </div>
  );
};
