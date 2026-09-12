# Implementation Plan: Ad / Monetization Placeholders & Creator Support

## 1. Overview
ReelWide provides high-fidelity vertical-to-landscape transformation for Facebook Reels and videos. To allow the creator (Tanchi) to monetize the tool, we have integrated dedicated advertising and sponsorship placeholders along with the UPI / Buy Me a Coffee support hub.

## 2. Monetization Components
- `src/components/AdBannerPlaceholder.tsx`:
  - Responsive, dark-styled ad slot supporting Google AdSense (`ins.adsbygoogle`) and custom partner banners.
  - Includes an in-app **Configure Ad** modal allowing the publisher to set or update their `ca-pub-XXXXXXXX` Client ID and Slot ID without re-deploying code.
  - Automatically activates the Google AdSense loader when live IDs are supplied.
  - Can be dismissed during previews and testing.
- `index.html`:
  - Includes Google AdSense loader script comment and preconnect headers.

## 3. Ad Placement Strategy
1. **Homepage / Ingestion View**: Placed between the URL submission card and the feature cards (`home-leaderboard-1`).
2. **Editor View**: Placed under the real-time interactive video preview (`editor-preview-bottom-1`).
3. **Result View**: Placed directly beneath the result card when the converted video is ready (`results-banner-1`).

## 4. Verification
- `npm run lint` passing.
- `compile_applet` passing.
