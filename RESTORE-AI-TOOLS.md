# Bringing back the AI tools (version 1.1)

Version 1.0 of the iPhone app has no AI, to help App Review (decided by Demah on Nov 5, 2026):
**Try it on, Change the scene, Accessories, Shoes, Couture Glow, Couture Looks and Vanish** all return in 1.1.

Nothing was deleted. The website (main branch) and the Face Couture server still have all four
tools, unchanged. Only the iPhone build leaves them out, using one switch.

## How to restore them

1. In `.github/workflows/release.yml`, add `FC_TRYON: '1'` to the env of the "Build web bundle" step
   (or run locally: `FC_TRYON=1 SITE_DIR=site node scripts/build-web.mjs`).
2. That switch alone brings back the whole AI Studio (Couture Glow, Couture Looks, Vanish and the 4 try-on tools), the AI server address, the AI legal wording, the destinations and try-on panels, the
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

Also for 1.1 with AI: set the App Store age rating back to 18+ (Google Gemini API terms), update App Privacy to the
"For version 1.1" answers in store/privacy-labels.md, and the in-app legal pages switch back automatically
(1.0 uses app/legal-1.0/, 1.1 uses the website's pages with LEGAL_APP).
