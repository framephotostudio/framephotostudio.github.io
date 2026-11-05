# Bringing back the 4 AI tools (version 1.1)

Version 1.0 of the iPhone app leaves out four AI Studio tools to help App Review:
**Try it on, Change the scene, Accessories and Shoes** (decided by Demah on Nov 5, 2026).

Nothing was deleted. The website (main branch) and the Face Couture server still have all four
tools, unchanged. Only the iPhone build leaves them out, using one switch.

## How to restore them

1. In `.github/workflows/release.yml`, add `FC_TRYON: '1'` to the env of the "Build web bundle" step
   (or run locally: `FC_TRYON=1 SITE_DIR=site node scripts/build-web.mjs`).
2. That switch alone brings back the 4 buttons, the destinations and try-on panels, the
   "Travel, Vanish & try-on" title and the full wording in the in-app Privacy and Terms pages.
3. Set the version to 1.1 in `release/ios.txt`, test on TestFlight, and list the 4 tools under
   "What's New" and in the App Store description and screenshots.

## What the switch controls (for reference)

- `scripts/build-web.mjs`: the `TRYON` block (panel title, `window.__FC_NO_TRYON` flag, legal-page wording)
- `app/app.js`: `noTryOn()` removes `#fcWowOutfit`, `#fcWowBg`, `#fcWowAcc`, `#fcWowShoes`,
  `#fcTravel`, `#fcTryCats` only when that flag is set
