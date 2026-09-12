import React from 'react';
import { Film, ShieldCheck, Cpu, Coffee, QrCode } from 'lucide-react';

interface HeaderProps {
  onOpenCoffeeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCoffeeModal }) => {
  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                Reel<span className="text-blue-500">Wide</span>
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Facebook Only
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Convert vertical Facebook Reels & videos into high-fidelity landscape
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {onOpenCoffeeModal && (
            <button
              type="button"
              id="header-support-btn"
              onClick={onOpenCoffeeModal}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/15 to-amber-500/15 hover:from-purple-500/25 hover:to-amber-500/25 border border-purple-500/30 hover:border-amber-500/50 text-purple-200 hover:text-white font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Support Tanchi via UPI QR Code or Buy Me a Coffee"
            >
              <QrCode className="w-3.5 h-3.5 text-purple-400" />
              <Coffee className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
              <span className="hidden sm:inline">Support Tanchi</span>
              <span className="sm:hidden">Support</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-900/60 border border-purple-700/50 text-purple-300 font-mono">UPI / ☕</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Ephemeral Storage</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
            <Cpu className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="font-mono text-[11px]">FFmpeg Engine</span>
          </div>
        </div>
      </div>
    </header>
  );
};
