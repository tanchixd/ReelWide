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
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
          {/* Official Buy Me a Coffee Widget Button */}
          <a
            href="https://www.buymeacoffee.com/tanchixd"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex transition-transform hover:scale-105 active:scale-95 shadow-md shadow-purple-950/40 rounded-xl overflow-hidden cursor-pointer"
            title="Support me 💜 on Buy Me A Coffee"
          >
            <img
              src="https://img.buymeacoffee.com/button-api/?text=Support me 💜&emoji=🌺&slug=tanchixd&button_colour=a694ff&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00"
              alt="Support me 💜"
              className="h-[36px] sm:h-[40px] w-auto max-w-full"
              referrerPolicy="no-referrer"
            />
          </a>

          <button
            type="button"
            id="footer-support-btn"
            onClick={onOpenCoffeeModal}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500/15 via-indigo-500/15 to-amber-500/15 hover:from-purple-500/25 hover:to-amber-500/25 border border-purple-500/30 hover:border-purple-500/50 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer h-[36px] sm:h-[40px]"
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            <span>UPI QR (0% Fee)</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
