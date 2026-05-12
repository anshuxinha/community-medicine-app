# External Integrations

**Analysis Date:** 2024-05-14

## APIs & External Services

**Backend-as-a-Service:**
- Firebase - Central platform for authentication, data persistence, and analytics.
  - SDK/Client: `firebase` JS SDK (`src/config/firebase.js`), `firebase-admin` (`scripts/`)
  - Auth: Configuration object in `src/config/firebase.js`

**In-App Purchases:**
- RevenueCat - Subscription management and billing lifecycle.
  - SDK/Client: `react-native-purchases`
  - Auth: `EXPO_PUBLIC_RC_API_KEY` (configured in `src/context/AppContext.js`)

**Video Hosting:**
- Bunny.net (Bunny Stream) - Hosting, encoding, and streaming of video lessons.
  - SDK/Client: Custom integration via REST API in `scripts/bunny-videos.js`
  - Auth: `BUNNY_STREAM_API_KEY` and `BUNNY_STREAM_LIBRARY_ID`

**Push Notifications:**
- Expo Notification Service (EAS) - Reliable push notification delivery.
  - SDK/Client: `expo-notifications`
  - Auth: Managed via EAS project credentials (`app.json`)

**Messaging & Bot Automation:**
- Telegram - Used for session string generation and potentially CI/CD notifications.
  - SDK/Client: `telethon` (Python) in `scripts/auth_telegram.py`

## Data Storage

**Databases:**
- Firebase Firestore (NoSQL)
  - Connection: Initialized in `src/config/firebase.js`
  - Client: Firebase JS SDK (App), Firebase Admin SDK (Scripts)

**File Storage:**
- Firebase Storage / Google Cloud Storage
  - Service: Used for static assets (e.g., biostat images, museum photos)
  - Client: `firebase-admin` storage bucket in `scripts/upload-biostat-images.js`

**Caching:**
- React Native Async Storage
  - Service: `@react-native-async-storage/async-storage` - Used for local persistent state and Firebase Auth persistence.

## Authentication & Identity

**Auth Provider:**
- Firebase Auth
  - Implementation: Supports Email/Password, Google Sign-In, and Apple Authentication.
  - Integration: Identity linked to RevenueCat via `Purchases.logIn(user.uid)` in `src/context/AppContext.js`.

## Monitoring & Observability

**Error Tracking:**
- Not detected - No third-party error tracking service (like Sentry or Bugsnag) was found in the codebase.

**Logs:**
- Console-based logging for development; Firebase Analytics for tracking key user events (e.g., premium conversion).

## CI/CD & Deployment

**Hosting:**
- Google Cloud / Firebase: Hosts the application database and authentication services.
- Bunny.net: Dedicated CDN for high-bandwidth video content.

**CI Pipeline:**
- GitHub Actions - Configured in `.github/workflows/` for data validation and automated updates.

## Environment Configuration

**Required env vars:**
- `EXPO_PUBLIC_RC_API_KEY`: RevenueCat Public API Key.
- `BUNNY_STREAM_API_KEY`: Bunny.net API Key for video management.
- `BUNNY_STREAM_LIBRARY_ID`: Bunny.net Library ID.
- `BUNNY_STREAM_PULL_ZONE_HOSTNAME`: Pull zone for video thumbnails.

**Secrets location:**
- `.env` file for local environment; EAS Secrets and GitHub Secrets for CI/CD environments.

## Webhooks & Callbacks

**Incoming:**
- RevenueCat Webhooks - Used to sync subscription status changes (e.g., renewals, cancellations) to Firestore (configured in RevenueCat dashboard).

**Outgoing:**
- None detected.

---

*Integration audit: 2024-05-14*
