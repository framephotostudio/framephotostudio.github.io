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

- `scripts/build-web.mjs`: the `TRYON` block cuts the travel and try-on controls out of the 1.0 build, sets the
  `window.__FC_NO_TRYON` flag and trims the legal-page wording. With FC_TRYON=1 none of that runs.
- `app/app-api.js`: refuses travel/try-on requests only when that flag is set
- `app/app.js`: `noTryOn()` removes `#fcWowOutfit`, `#fcWowBg`, `#fcWowAcc`, `#fcWowShoes`,
  `#fcTravel`, `#fcTryCats` only when that flag is set

Also in 1.1: the look names were changed in 1.0 (Nov 5, 2026: Grand Soirée, Première, Bare Luxe, Ivory Vow,
Boardroom Portrait, Couture Glow, Couture Looks, etc.). They are app-only renames in build-web.mjs; the website
still uses the old names until Demah approves the same change there.
