import React from 'react';
import { JobStage } from '../types.js';
import {
  CheckCircle2,
  Loader2,
  Film,
  Cpu,
  Sparkles,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  stage: JobStage;
  progress: number;
  message: string;
  error?: string;
  onCancel?: () => void;
  onClose?: () => void;
}

const STAGES: { id: JobStage; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'checking', label: 'Checking Facebook URL', icon: Film },
  { id: 'preparing', label: 'Preparing Video', icon: Sparkles },
  { id: 'processing', label: 'Processing', icon: Cpu },
  { id: 'finalizing', label: 'Finalizing', icon: FileCheck },
  { id: 'ready', label: 'Ready', icon: CheckCircle2 },
];

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  stage,
  progress,
  message,
  error,
  onClose,
}) => {
  if (!isOpen) return null;

  const getStageIndex = (s: JobStage) => {
    switch (s) {
      case 'checking': return 0;
      case 'preparing': return 1;
      case 'processing': return 2;
      case 'finalizing': return 3;
      case 'ready': return 4;
      case 'failed': return 2;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top ambient glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center mb-3">
            {stage === 'failed' ? (
              <AlertCircle className="w-6 h-6 text-rose-400" />
            ) : stage === 'ready' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            )}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {stage === 'failed'
              ? 'Processing Failed'
              : stage === 'ready'
              ? 'Conversion Complete!'
              : 'Rendering Landscape Video'}
          </h3>
          <p className="text-xs text-neutral-400">
            {message || 'Converting vertical frames using server FFmpeg filters...'}
          </p>
        </div>

        {/* Progress bar */}
        {stage !== 'failed' && (
          <div className="space-y-2 mb-8">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">FFmpeg Render Pipeline</span>
              <span className="font-mono text-blue-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Step-by-step pipeline list */}
        <div className="space-y-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-4 mb-6">
          {STAGES.map((s, idx) => {
            const isCompleted = currentIndex > idx || stage === 'ready';
            const isCurrent = currentIndex === idx && stage !== 'ready' && stage !== 'failed';
            const Icon = s.icon;

            return (
              <div
                key={s.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-blue-950/40 border border-blue-900/50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        : 'bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCompleted
                        ? 'text-neutral-200'
                        : isCurrent
                        ? 'text-white font-semibold'
                        : 'text-neutral-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="text-[10px] text-blue-400 font-mono animate-pulse">
                      In progress...
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[10px] text-emerald-400 font-mono">Done</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message if failed */}
        {stage === 'failed' && error && (
          <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs mb-6 space-y-1">
            <p className="font-bold text-rose-300">Conversion Error</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Action Button */}
        {(stage === 'ready' || stage === 'failed') && (
          <button
            type="button"
            id="close-processing-modal"
            onClick={onClose}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {stage === 'ready' ? 'View Landscape Video Result' : 'Dismiss & Try Again'}
          </button>
        )}
      </div>
    </div>
  );
};
