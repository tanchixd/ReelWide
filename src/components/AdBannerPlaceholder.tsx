import React, { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

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
 * - Displays live AdSense when configured via props or environment.
 * - Displays a clean, sleek dark placeholder for visitors when in preview.
 * - Completely locked: visitors cannot configure or modify ad slots.
 */
export const AdBannerPlaceholder: React.FC<AdBannerPlaceholderProps> = ({
  slotId,
  clientId,
  format = 'horizontal',
  label = 'Advertisement',
  className = '',
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Use props or environment; no user-facing configuration allowed
  const effectiveClientId = clientId || '';
  const effectiveSlotId = slotId || '';
  const isLiveAdSense = Boolean(effectiveClientId && effectiveClientId.startsWith('ca-pub-'));

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
            data-ad-client={effectiveClientId}
            data-ad-slot={effectiveSlotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        /* Dark Sleek Sponsored Space */
        <div
          className={`relative rounded-2xl bg-gradient-to-r from-neutral-900/60 via-neutral-900/90 to-neutral-900/60 border border-neutral-800/80 p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm ${containerHeightClass}`}
        >
          {/* Tag */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[9px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700/40">
              Sponsored
            </span>
          </div>

          {/* Center Promo / Sponsor Content */}
          <div className="flex-1 text-center sm:text-left px-2">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Free High-Speed Video Processing</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              ReelWide is 100% free and open for public Facebook Reels and videos.
            </p>
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer self-end sm:self-auto"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
