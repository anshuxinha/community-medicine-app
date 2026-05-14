# Phase 3 Context: Apple Sign-In Fix & iOS Hardening

**Date:** 2026-05-14
**Status:** Decisions Locked

<domain>
## Phase Boundary
This phase addresses the `auth/invalid-credential` error occurring during Apple Sign-In on iOS devices. The root cause is an audience mismatch between the native ID Token (`com.communitymed.app`) and the Firebase configuration (`com.stroma.auth`).

</domain>

<decisions>
## Implementation Decisions

### 1. Identifier Alignment
- **D-01: Primary ID:** We are locking the Apple Sign-In identifier to the app's Bundle ID: `com.communitymed.app`.
- **D-02: Abandon Service ID:** The `com.stroma.auth` Service ID is to be ignored/de-prioritized as Web/Android Apple Sign-In is not currently required.
- **D-03: Firebase Console Sync:** The user must update the Firebase Console -> Authentication -> Apple Sign-In settings to use `com.communitymed.app` as the **Services ID** (or Client ID).

### 2. Firebase iOS Registration
- **D-04: Register iOS App:** We will register the native iOS app in the Firebase project with bundle ID `com.communitymed.app`.
- **D-05: Config File:** We will add `GoogleService-Info.plist` to the project root and reference it in `app.json`.
- **D-06: Expo Config:** Update `app.json` under `expo.ios.googleServicesFile` to point to `./GoogleService-Info.plist`.

### 3. RevenueCat Multi-Platform Support
- **D-07: Platform Keys:** Configured `AppContext.js` to use `EXPO_PUBLIC_RC_API_KEY_IOS` and `EXPO_PUBLIC_RC_API_KEY_ANDROID`.
- **D-08: Hardened Initialization:** The SDK now selects the correct key dynamically based on `Platform.OS`.
- **D-09: Environment Sync:** Updated `.env` and GitHub Workflows to include both platform keys.

## Final API Configuration
- **iOS:** `appl_bIbghsScVIeHGfrXogcChLzXKsS`
- **Android:** `goog_mfyywPtYwjSUQhFJoHeVysbUole`

</decisions>

<instructions>
## Required Manual Steps (User Action Needed)

1. **Firebase Console -> Authentication -> Sign-in method -> Apple:**
   - Edit the configuration.
   - Change **Services ID** from `com.stroma.auth` to `com.communitymed.app`.
   - Save changes.

2. **Firebase Console -> Project Settings:**
   - Add a new **iOS App**.
   - Bundle ID: `com.communitymed.app`.
   - Download `GoogleService-Info.plist`.
   - **Upload/Provide the content of this file to the agent.**

</instructions>

<success_criteria>
- [ ] Firebase Console updated with `com.communitymed.app`.
- [ ] iOS App registered in Firebase and `GoogleService-Info.plist` added to the repo.
- [ ] `app.json` updated to reference the new plist.
- [ ] Apple Sign-In successful on physical iOS device without audience mismatch error.
</success_criteria>

<canonical_refs>
## Canonical References
- `PROJECT.md`: General architecture.
- `app.json`: App configuration.
- `src/screens/LoginScreen.js`: Apple Auth implementation.
- `src/config/firebase.js`: Firebase initialization.
</canonical_refs>

---
*Phase: 03-apple-signin-fix*
*Context gathered: 2026-05-14*
