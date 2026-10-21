# Privacy answers for the stores

These match what the app actually does. Change them only if the app changes.

## Apple — App Privacy (App Store Connect → App Privacy)

**Do you or your third-party partners collect data from this app?** Yes. Google Analytics counts actions (no photos, no face data, no names, ad signals off); AI Looks send a photo only when used.

| Data type | Collected? | Linked to identity? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Photos or Videos | Yes — only when the user chooses an AI Look and agrees; sent to the AI provider for that one edit, not stored by us | No | No | App Functionality |
| Purchases (purchase history) | Yes — via App Store / RevenueCat to grant Pro | No (device-level ID only) | No | App Functionality |
| Product Interaction (taps on looks, saves, shares) | Yes — counts only, no photos, sent to Google Analytics | No | No | Analytics |
| Device ID (a random install ID we create, not the advertising ID) | Yes | No | No | Analytics; App Functionality (AI allowance, fraud prevention) |
| Coarse Location (country from IP, no GPS) | Yes | No | No | Analytics |
| Crash data | No (unless you add a crash reporter) | — | — | — |
| Contact info, Health, Financial, Contacts, Browsing history, Search history, Sensitive info | Not collected | — | — | — |

**Face data note for App Review (Review Notes field):** "Face and lip landmarks are computed on-device with MediaPipe/ONNX to position makeup. No face data leaves the device, is stored, or is shared. Optional AI Looks send the chosen photo to OpenAI's image API only for the requested edit, after explicit consent (checkbox), and the result is returned; we do not retain the photo. No account is required."

**Tracking:** No. The app does not request App Tracking Transparency because it does not track across apps or sites.

**Encryption export compliance:** `ITSAppUsesNonExemptEncryption = false` (HTTPS only) — already set by the build.

## Google Play — Data safety

- **Does your app collect or share any of the required user data types?** Yes
- **Is all of the user data collected by your app encrypted in transit?** Yes
- **Do you provide a way for users to request that their data is deleted?** Yes — in-app (Settings → Delete my data) and https://facecouture.app/delete-my-data.html

| Data type | Collected | Shared | Processed ephemerally | Required/optional | Purpose |
|---|---|---|---|---|---|
| Photos | Yes (only for AI Looks) | Yes — with the AI provider for the edit | Yes | Optional | App functionality |
| Purchase history | Yes | Yes (Google Play / RevenueCat) | No | Optional | App functionality |
| App interactions | Yes (Google Analytics, as our service provider) | No | No | Required | Analytics |
| Device or other IDs (random install ID) | Yes | No | No | Required for AI Looks | App functionality, fraud prevention |
| Approximate location (country from IP) | Yes | No | Yes | Optional | Analytics |

**Account deletion URL:** https://facecouture.app/delete-my-data.html (no accounts exist; the page explains device-data deletion).

## Permissions the app asks for and why

- **Camera** — only when the user taps "Take a selfie". Denied → the app says so and offers the photo picker.
- **Photos (read)** — only when choosing a photo (system picker; on iOS 14+ it is the limited picker, no library access).
- **Photos (add)** — saving finished photos/videos through the share sheet ("Save Image").
- No location, contacts, microphone, notifications or background permissions.

## Age rating

4+ / Everyone. The app is not directed to children under 13 and the privacy policy says so.

## Offensive output and safety controls (AI)

- Server-side prompts preserve identity and prohibit nudity/violence; the provider's own safety system rejects unsafe requests (the app shows "That edit could not be made").
- Users can report any AI result from the AI screen (Report this AI result) — reports appear in the owner dashboard.
- Outfit try-on and Vanish are visual simulations; the app says so next to the controls.
