# Implementation Plan: Ad / Monetization Placeholders & Creator Support

## 1. Overview
ReelWide provides high-fidelity vertical-to-landscape transformation for Facebook Reels and videos. To allow the creator (Tanchi) to monetize the tool, we have integrated dedicated advertising and sponsorship placeholders along with the UPI / Buy Me a Coffee support hub.

## 2. Monetization & Creator Support Components (Locked & Secured)
- `src/components/BuyMeACoffeeModal.tsx`:
  - **Permanently Locked Creator Credentials**: UPI ID (`priyankasinha3162@ybl`), Payee (`Tanchi`), and Buy Me a Coffee (`https://www.buymeacoffee.com/tanchixd`) are immutable constants.
  - **Removed all user-facing payout editing controls**: Visitors can no longer edit UPI IDs, change handles, or upload screenshots. All payouts route strictly and securely to Tanchi.
  - **Auto-cleans stale storage**: Automatically removes any legacy `localStorage` keys on startup to prevent cache-poisoning.
  - Embedded official customized Buy Me a Coffee button badge (`https://img.buymeacoffee.com/button-api/?text=Support me 💜&emoji=🌺&slug=tanchixd&button_colour=a694ff...`).
  - Zero-fee UPI QR integration ready for instant PhonePe / GPay payments with preset amounts (₹49, ₹99, ₹199, ₹499, or custom).
- `src/components/ErrorBoundary.tsx`:
  - Global error boundary capturing any unexpected runtime rendering exceptions and offering a 1-click reload button rather than a blank black screen.
- `src/components/AdBannerPlaceholder.tsx`:
  - **Removed user-facing "Configure Ad" button and developer modal**: Website visitors cannot view or alter ad client IDs or slots.
  - Clean, dark-mode sponsored placeholder for visitors with dismiss option; seamlessly switches to Google AdSense only when configured via environment or code props.
- `index.html`:
  - Includes Google AdSense loader script comment and preconnect headers.

## 3. Ad Placement Strategy
1. **Homepage / Ingestion View**: Placed between the URL submission card and the feature cards (`home-leaderboard-1`).
2. **Editor View**: Placed under the real-time interactive video preview (`editor-preview-bottom-1`).
3. **Result View**: Placed directly beneath the result card when the converted video is ready (`results-banner-1`).

## 4. Verification
- `npm run lint` passing.
- `compile_applet` passing.
