import React from 'react';
import { Coffee, Heart, Film, RotateCw, QrCode } from 'lucide-react';

interface FooterProps {
  onOpenCoffeeModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCoffeeModal }) => {
  return (
    <footer className="w-full mt-16 border-t border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
        {/* Creator Attribution */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          <span className="font-semibold text-white tracking-wide">ReelWide</span>
          <span className="text-neutral-600">•</span>
          <div className="flex items-center gap-1.5 text-neutral-300">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline-block animate-pulse" />
            <span>by <strong className="text-white font-medium">Tanchi</strong></span>
          </div>
          <span className="text-neutral-600 hidden sm:inline">•</span>
          <span className="text-neutral-400 hidden sm:inline">
            Best for movies and clips that aren&apos;t in fullscreen
          </span>
        </div>

        {/* Action Controls & UPI / Coffee Support */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            id="footer-support-btn"
            onClick={onOpenCoffeeModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-amber-500/15 hover:from-purple-500/25 hover:to-amber-500/25 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <Coffee className="w-4 h-4 fill-amber-400/20 text-amber-400" />
            <span>Support Creator (UPI QR / Coffee)</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
