# Reference Notes: Ad Networks & Video Conversion Architecture

## AdSense & Ad Networks Integration Rules
- Publisher Client ID format: `ca-pub-XXXXXXXXXXXXXXXX`.
- Slot ID: 10-digit numerical identifier configured per ad unit inside Google AdSense dashboard.
- Script location: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js`.
- The `AdBannerPlaceholder` component stores configured IDs in `localStorage` (`reelwide_adsense_client_id`, `reelwide_adsense_slot_id`) for immediate persistence in the client.

## Alternative Networks
- **Carbon Ads / EthicalAds**: Can be mounted in `AdBannerPlaceholder` using their 1-line script tag.
- **Direct Sponsors**: Banners can be swapped to link to creator affiliates or services.
