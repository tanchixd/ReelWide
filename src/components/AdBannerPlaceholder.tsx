import React, { useState, useEffect } from 'react';
import { Sparkles, ExternalLink, Info, X } from 'lucide-react';

export interface AdBannerPlaceholderProps {
  /** Identifier for AdSense or ad network slot */
  slotId?: string;
  /** Client ID (e.g. ca-pub-XXXXXXXXXXXXXXXX) */
  clientId?: string;
  /** Format: 'horizontal' (leaderboard/banner), 'rectangle' (medium rectangle), or 'responsive' */
  format?: 'horizontal' | 'rectangle' | 'responsive';
  /** Label for placement location */
  label?: string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * AdBannerPlaceholder:
 * - Ready for Google AdSense or standard ad networks.
 * - Displays an interactive, sleek, dark-mode placeholder when no ad client ID is configured.
 * - Once you add your Google AdSense `client-id` and `slot-id`, it seamlessly switches to live AdSense rendering.
 * - Users can dismiss or configure settings locally.
 */
export const AdBannerPlaceholder: React.FC<AdBannerPlaceholderProps> = ({
  slotId = '1234567890',
  clientId,
  format = 'horizontal',
  label = 'Sponsored Advertisement',
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [localClientId, setLocalClientId] = useState<string>(() => {
    try {
      return localStorage.getItem('reelwide_adsense_client_id') || clientId || '';
    } catch {
      return clientId || '';
    }
  });
  const [localSlotId, setLocalSlotId] = useState<string>(() => {
    try {
      return localStorage.getItem('reelwide_adsense_slot_id') || slotId || '';
    } catch {
      return slotId || '';
    }
  });

  const isLiveAdSense = Boolean(localClientId && localClientId.startsWith('ca-pub-'));

  // Trigger Google AdSense if live credentials exist
  useEffect(() => {
    if (isLiveAdSense && !isDismissed) {
      try {
        // @ts-ignore
        const adsbygoogle = (window.adsbygoogle = window.adsbygoogle || []);
        adsbygoogle.push({});
      } catch (err) {
        console.debug('AdSense request queued or ignored in preview environment', err);
      }
    }
  }, [isLiveAdSense, isDismissed]);

  const handleSaveConfig = () => {
    try {
      localStorage.setItem('reelwide_adsense_client_id', localClientId.trim());
      localStorage.setItem('reelwide_adsense_slot_id', localSlotId.trim());
    } catch {
      // Ignore
    }
    setShowConfigModal(false);
  };

  if (isDismissed) return null;

  // Format styles
  const containerHeightClass =
    format === 'rectangle'
      ? 'min-h-[250px] max-w-[336px]'
      : format === 'horizontal'
      ? 'min-h-[90px] w-full max-w-4xl'
      : 'min-h-[100px] w-full';

  return (
    <div className={`mx-auto w-full my-4 ${className}`}>
      {/* Live Google AdSense Mode */}
      {isLiveAdSense ? (
        <div className="w-full flex flex-col items-center justify-center p-1 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
          <div className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mb-1">
            {label}
          </div>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={localClientId}
            data-ad-slot={localSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        /* Dark Sleek Ad Placeholder (Pre-launch / Demo state) */
        <div
          className={`relative rounded-2xl bg-gradient-to-r from-neutral-900/80 via-neutral-900 to-neutral-900/80 border border-dashed border-neutral-800 hover:border-neutral-700/80 p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm group ${containerHeightClass}`}
        >
          {/* Top Tag & Close button */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700/50">
              Ad Space Placeholder
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              {format.toUpperCase()} {slotId ? `• Slot #${slotId}` : ''}
            </span>
          </div>

          {/* Center Promo / Sponsor Content */}
          <div className="flex-1 text-center sm:text-left px-2">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-neutral-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Monetize with Google AdSense, Carbon Ads, or Brand Sponsors</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
              Connect your publisher ID (`ca-pub-XXXXXXXX`) to display live banner ads here.
            </p>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Configure Google AdSense ID"
            >
              <Info className="w-3 h-3 text-blue-400" />
              <span>Configure Ad</span>
            </button>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Dismiss ad preview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Ad Configuration Modal */}
      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 text-neutral-100 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  AD
                </div>
                <h3 className="text-base font-bold text-white">AdSense Configuration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Enter your Google AdSense credentials to activate live banners in this slot.
              Once saved, live ads will automatically request and display here.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  AdSense Publisher Client ID (`ca-pub-...`)
                </label>
                <input
                  type="text"
                  value={localClientId}
                  onChange={(e) => setLocalClientId(e.target.value)}
                  placeholder="ca-pub-1234567890123456"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                  Ad Slot ID (Optional / Per Banner)
                </label>
                <input
                  type="text"
                  value={localSlotId}
                  onChange={(e) => setLocalSlotId(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <span className="font-semibold text-neutral-300">Quick Guide:</span>
              <p>1. Sign in to your Google AdSense account.</p>
              <p>2. Create a Display Ad Unit and copy the client & slot IDs.</p>
              <p>3. Paste them here or customize directly in the code.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-3 py-1.5 rounded-xl text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
