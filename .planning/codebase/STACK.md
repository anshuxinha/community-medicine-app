# Technology Stack

**Analysis Date:** 2024-05-14

## Languages

**Primary:**
- JavaScript (ES2022+) - Core application logic, React Native components, and utility scripts in `src/` and `scripts/`.

**Secondary:**
- Python 3.x - Data processing, graph construction (`build_graph.py`), and automation scripts in `scripts/`.

## Runtime

**Environment:**
- Node.js (Expo SDK 54 / React Native 0.81.5)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Expo SDK 54 - Managed React Native framework for cross-platform development.
- React 19.1.0 - Core UI component library.
- React Native Paper (^5.15.0) - Material Design UI component library for React Native.

**Testing:**
- Not detected - No testing frameworks (Jest, Vitest, etc.) found in `package.json` dependencies.

**Build/Dev:**
- Expo Application Services (EAS) - Build and distribution pipeline for mobile apps.
- Metro Bundler - Standard JavaScript bundler for React Native.

## Key Dependencies

**Critical:**
- `firebase` (^12.9.0) - Backend-as-a-service for database (Firestore), Authentication, and Analytics.
- `react-native-purchases` (^9.10.3) - RevenueCat SDK for in-app subscriptions and purchase management.
- `@react-navigation/native` (^7.1.28) - Routing and navigation management.

**Infrastructure:**
- `expo-updates` (~29.0.17) - Over-the-air update support.
- `expo-notifications` (~0.32.17) - Push notification handling.
- `expo-secure-store` (~15.0.8) - Encrypted key-value storage.

## Configuration

**Environment:**
- Configured via `.env` file for local development and EAS Secrets for production builds.
- Key configurations: `EXPO_PUBLIC_RC_API_KEY`, `BUNNY_STREAM_API_KEY`, and Firebase project credentials.

**Build:**
- `app.json`: Main Expo configuration.
- `eas.json`: Build profiles and submission configurations.
- `metro.config.js`: Custom Metro bundler settings (e.g., node module aliases).

## Platform Requirements

**Development:**
- Node.js, npm, Expo CLI, Python 3.

**Production:**
- Android: API 35 target (configured in `app.json`).
- iOS: 15.1 deployment target (configured in `app.json`).

---

*Stack analysis: 2024-05-14*
