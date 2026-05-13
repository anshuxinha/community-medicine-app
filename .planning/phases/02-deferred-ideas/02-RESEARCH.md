# Phase 02: Hardening & Analytics - Research

**Researched:** 2026-05-13
**Domain:** React Native, Firebase Storage, Firestore, Firebase Analytics
**Confidence:** HIGH

## Summary

This phase focuses on improving the reliability of dynamic asset fetching (Gems) and implementing robust analytics for coupon usage. Research confirms that Gem images are correctly uploaded to a `gems/` folder in Firebase Storage, but the client-side logic currently hardcodes a fallback path to `reading-illustrations/`. Additionally, the existing `docId` construction for topic illustrations is brittle as it relies on section titles.

Coupon analytics will leverage the existing Firebase Analytics integration. The `validateCoupon` and `handlePurchase` flows in `PaywallScreen.js` provide natural hook points for logging attempts, successes, and failures.

**Primary recommendation:** Introduce a `basePath` parameter to image normalization logic and implement a Firestore query-based fallback for illustration metadata to decouple fetching from brittle title strings.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Gem Image Fetching | API (Firestore) | Client (Service) | Metadata lives in Firestore; Client handles merging and fallback. |
| Image Rendering | Browser / Client | — | ReadingView renders standard Image components. |
| Coupon Validation | API (Firestore) | Client (Service) | Validation logic is shared but Firestore is the source of truth. |
| Analytics Logging | Client | — | Events are triggered by user actions on the device. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | ^12.9.0 | Backend Services | Official JS SDK for Firestore, Auth, and Analytics. |
| react-native | 0.81.5 | UI Framework | Core framework for the application. |
| expo-speech | ~14.0.8 | TTS | Used for reading content aloud. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| firebase/analytics | ^10.20.0 | User Tracking | Integrated with Firebase JS SDK; used for logging events. |
| react-native-Purchases | ^9.10.3 | IAP | RevenueCat SDK for subscription management. |

**Installation:**
```bash
# Already installed
npm install firebase
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── config/
│   └── firebase.js     # Analytics initialization
├── services/
│   ├── topicIllustrations.js # PATH logic and fetching logic
│   └── couponService.js      # Validation logic
└── screens/
    └── PaywallScreen.js      # Analytics trigger points
```

### Pattern 1: Path-Aware Image Normalization
The `normalizeIllustration` function should accept a `basePath` to distinguish between standard reading illustrations and Gems.

**Example:**
```javascript
// src/services/topicIllustrations.js
const normalizeIllustration = (image = {}, basePath = "reading-illustrations") => {
  let url = image.url || null;
  if (!url && image.fileName) {
    const storageBucket = "community-med-app.firebasestorage.app";
    url = `https://storage.googleapis.com/${storageBucket}/${basePath}/${image.fileName}`;
  }
  return { ...image, url };
};
```

### Pattern 2: Resilient Metadata Fetching
Instead of relying solely on `${sectionTitle}__${topicId}`, the service should query by `contentKey` as a fallback.

**Example:**
```javascript
import { query, collection, where, getDocs } from "firebase/firestore";

// Fallback logic if doc(docId) fails
const q = query(collection(db, "topicIllustrations"), where("contentKey", "==", contentKey));
const querySnapshot = await getDocs(q);
if (!querySnapshot.empty) {
  return querySnapshot.docs[0].data().images;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Analytics | Custom logging DB | `firebase/analytics` | Built-in aggregation, funnel analysis, and standard event schema. |
| Retries | Custom loop | Firestore SDK + exponential backoff | Firestore SDK has built-in persistence and retries for network issues. |

## Common Pitfalls

### Pitfall 1: Brittle DocIDs
**What goes wrong:** `docId` is constructed using `section.title`. If the title in `gemsData.json` or the content registry changes, the `docId` mismatch breaks image loading.
**How to avoid:** Use `contentKey` as a query parameter when the primary ID fetch fails.

### Pitfall 2: Analytics Availability
**What goes wrong:** Calling `logEvent` on a `null` analytics object.
**Why it happens:** `isSupported()` is async and may return `false` in some environments (e.g., non-web native without specific native modules).
**How to avoid:** Always check `if (analytics)` before calling `logEvent`.

## Code Examples

### Analytics Logging for Coupons
```javascript
// Source: https://firebase.google.com/docs/analytics/get-started?platform=web
import { logEvent } from "firebase/analytics";
import { analytics } from "../config/firebase";

const logCouponEvent = (eventName, params) => {
  if (analytics) {
    logEvent(analytics, eventName, {
      ...params,
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    });
  }
};

// Usage in handleApplyCoupon
logCouponEvent('coupon_apply_attempt', { code, plan: selectedPlan });
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `jest.config.js` |
| Quick run command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-02 | Gem images use 'gems/' path | Unit | `npm test src/services/__tests__/topicIllustrations.test.js` | ❌ (Need to create) |
| D-03 | Resilience to title mismatch | Unit | `npm test src/services/__tests__/topicIllustrations.test.js` | ❌ (Need to create) |
| D-05 | Analytics events logged | Integration | Manual verification in Firebase DebugView | — |

### Test Cases for Gems
1. **Gem Path Verification:** Pass `contentKey` starting with `gems:` to `getTopicIllustrations` and verify constructed URL contains `/gems/`.
2. **Title Mismatch Fallback:** 
    - Mock Firestore `getDoc` to return empty for `DocTitle__1`.
    - Mock Firestore `getDocs` (query) to return images for `contentKey="gems:S1:1"`.
    - Verify `getTopicIllustrations` successfully returns images.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Sanitize coupon codes (trim, uppercase) before validation. |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Path Traversal | Information Disclosure | Sanitize `fileName` in storage URL construction. |
| Analytics Spam | Denial of Service | Implement client-side throttling if events are triggered in loops. |

## Sources

### Primary (HIGH confidence)
- `src/services/topicIllustrations.js` - Checked current path construction.
- `scripts/sync-gem-images.js` - Verified storage folder is `gems/`.
- `src/config/firebase.js` - Verified analytics initialization.

### Secondary (MEDIUM confidence)
- `firebase/analytics` - Verified standard `logEvent` usage.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH
- Architecture: HIGH
- Pitfalls: HIGH

**Research date:** 2026-05-13
**Valid until:** 2026-06-12
