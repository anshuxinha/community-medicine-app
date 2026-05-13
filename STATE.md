# Project State: STROMA

## Current Status
**Active Milestone:** Milestone 1 - Foundation & Monetization
**Current Phase:** Shipped Phase 2

## Shipped Phases
### Phase 2: Deferred Ideas (2026-05-13)
**Goal:** Hardened Gem image reliability and implemented Coupon Analytics logging.
**Key Deliverables:**
- `src/services/topicIllustrations.js`: Resilient fetching with multi-path support and query fallback.
- `src/screens/PaywallScreen.js`: Firebase Analytics instrumentation for the coupon funnel.
- `firestore.rules`: Updated security rules to allow illustration reads.
- **Verification:** 100% UAT pass rate on physical device after UI polish.

### Phase 1: Coupon Integration (2026-05-12)
**Goal:** Add coupon code functionality with Firestore and RevenueCat synchronization.
**Key Deliverables:**
- `src/services/couponService.js`: Atomic Firestore transactions and robust currency parsing.
- `src/screens/PaywallScreen.js`: Interactive coupon UI with RevenueCat attribute syncing.
- `COUPON_SETUP.md`: Database configuration guide.
- **Verification:** 100% UAT pass rate on real devices.
- **Production Build:** v1.0.2 (7) live on Play Store and App Store channels.

## Active Phases
[None]

## Technical Baseline
- **Version:** 1.0.2 (7)
- **Primary Branch:** `main`
- **Environment:** Production
- **Key Dependencies:** `@react-native-community/netinfo`, `react-native-purchases`, `firebase` (Auth/Firestore).

## Known Issues / Technical Debt
- Minor Jest environment mismatch (requires separate investigation to fully resolve in CI).
