# Privacy answers for the stores

These match what the app actually does. Change them only if the app changes.

## Apple — App Privacy for iPhone version 1.0 (App Store Connect → App Privacy)

Version 1.0 has no AI, no analytics and no server connection, so:

**Do you or your third-party partners collect data from this app?** **No, we do not collect data from this app.** The label then shows "Data Not Collected".

**Tracking:** No.

**Encryption export compliance:** `ITSAppUsesNonExemptEncryption = false` — already set by the build.

**Age rating:** with no AI in 1.0, the questionnaire answers are all "None", which gives 4+. (It was 18+ only because of Google's Gemini API terms; set it back to 18+ when AI returns in 1.1.)

### For version 1.1 (AI back)
| Data type | Collected? | Linked? | Tracking? | Purpose |
|---|---|---|---|---|
| Photos or Videos | Yes, only when the user chooses an AI tool and agrees; not stored by us | No | No | App Functionality |
| Device ID (random install ID, not the advertising ID) | Yes | No | No | App Functionality (AI allowance, abuse prevention) |

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
