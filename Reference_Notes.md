# Reference Notes: Ad Networks & Video Conversion Architecture

## AdSense & Ad Networks Integration Rules
- Publisher Client ID format: `ca-pub-XXXXXXXXXXXXXXXX`.
- Slot ID: 10-digit numerical identifier configured per ad unit inside Google AdSense dashboard.
- Script location: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`.
- Security rule: Visitors MUST NOT have access to ad configuration modals or client-side ID editing. All configurations are handled via code props or environment variables.

## Alternative Networks
- **Carbon Ads / EthicalAds**: Can be mounted in `AdBannerPlaceholder` using their 1-line script tag.
- **Direct Sponsors**: Banners can be swapped to link to creator affiliates or services.

## Buy Me a Coffee & Creator Support Rules (Hardened & Locked)
- Payout credentials are permanently hardcoded constants:
  - UPI ID: `priyankasinha3162@ybl`
  - Payee Name: `Tanchi`
  - Buy Me a Coffee: `https://www.buymeacoffee.com/tanchixd`
- User-facing customization (changing handle, editing UPI ID, uploading QR screenshots) is strictly removed to prevent visitor payout hijacking.
- Official Custom Widget Badge URL: `https://img.buymeacoffee.com/button-api/?text=Support me 💜&emoji=🌺&slug=tanchixd&button_colour=a694ff&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=FFDD00` embedded in both Footer and BuyMeACoffeeModal.
- React Hook Ordering: All hooks in `BuyMeACoffeeModal.tsx` must precede the `if (!isOpen) return null` early return to satisfy React Rules of Hooks and prevent hook-count mismatches.
- `ErrorBoundary`: Wrapped around the root application in `main.tsx` to trap uncaught render exceptions.
