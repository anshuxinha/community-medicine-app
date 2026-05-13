# Phase 02: Hardening & Analytics - Validation

**Phase:** 02
**Goal:** Hardening Gem image reliability and implementing Coupon Analytics.

## Validation Architecture

### Component 1: Topic Illustrations Service
**Objective:** Resilient asset fetching from 'gems/' path and fallback query.
- **Verification Method:** Unit Tests (Jest)
- **Key Test Cases:**
    - Path construction for `contentKey` starting with `gems:`.
    - Fallback to Firestore query when `getDoc` fails.
    - URL normalization with/without existing metadata.

### Component 2: Coupon Analytics (Paywall)
**Objective:** Correct event logging for the coupon funnel.
- **Verification Method:** Integration Tests (Jest) + Manual DebugView.
- **Key Test Cases:**
    - `coupon_apply_attempt` called on button press.
    - `coupon_apply_success` called on valid coupon result.
    - `coupon_apply_failure` called on service error.
    - User document sync (`appliedCoupon` field) verification.

### Component 3: Firestore Data Quality
**Objective:** Ensure existing illustrations in Firestore have valid URLs.
- **Verification Method:** Maintenance Script
- **Key Test Cases:**
    - Script scans `topicIllustrations` collection.
    - Reports documents missing `images` or `url` fields.

## Success Criteria
- 100% pass rate in `src/services/__tests__/topicIllustrations.test.js`.
- 100% pass rate in `src/screens/__tests__/PaywallScreen.analytics.test.js`.
- All Gem images load successfully in a staging environment.
- Analytics events visible in Firebase Console.
