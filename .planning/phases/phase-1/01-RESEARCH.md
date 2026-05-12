# Phase 1: Coupon Integration - Research

**Researched:** 2026-05-12
**Domain:** Fintech / In-App Purchases (RevenueCat + Firestore)
**Confidence:** HIGH

## Summary

This research focuses on integrating custom coupon functionality into the STROMA app's Paywall screen. The primary technical challenge identified is the synchronization between the app's custom coupon UI and the native store (Google Play/App Store) purchase dialog.

**Primary recommendation:** Use **RevenueCat Targeting Rules** with custom user attributes instead of manual price calculation in the UI. This ensures that the discounted price shown in the app matches the price shown in the native store transaction modal, preventing user confusion and store compliance issues.

<user_constraints>
## User Constraints (from 1-CONTEXT.md)

### Locked Decisions
- **Collection Name:** `coupons` (case-sensitive).
- **Code Format:** Upper-case strings (e.g., `SUMMER2026`).
- **Pricing Format:** Parsed from RevenueCat's `priceString` to ensure consistency with local currency symbols.

### the agent's Discretion
- Implementation of the validation logic.
- Strategy for syncing custom coupons with RevenueCat.

### Deferred Ideas (OUT OF SCOPE)
- Support for multiple coupons in a single purchase.
- User-specific "one-time" coupons (currently global usage limits only).
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Coupon Validation | API / Backend (Firestore) | Client | Source of truth for global usage limits, status, and expiry. |
| Pricing Logic | External (RevenueCat) | Client | RevenueCat handles currency localization and package metadata. |
| Pricing Display | Client (Paywall) | — | Combines package info and coupon status for the user. |
| Transaction | Client / External (Store) | — | Native store handles the actual payment securely. |
| Usage Increment | API / Backend (Firestore) | — | Atomically increments usage count after a successful transaction. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native-purchases` | ^9.10.3 [VERIFIED] | IAP Management | Industry standard for cross-platform subscriptions. |
| `firebase` | ^12.9.0 [VERIFIED] | Coupon Store | Real-time validation and atomic usage counters. |

## Architecture Patterns

### Recommended Project Structure
```
src/
├── services/
│   └── couponService.js    # Firestore interactions and validation
├── context/
│   └── AppContext.js       # Syncing RevenueCat attributes
└── screens/
    └── PaywallScreen.js    # UI state for applying/displaying coupons
```

### Pattern: RevenueCat Targeting for Custom Coupons
**What:** Mapping custom strings to RevenueCat "Offerings" via User Attributes.
**When to use:** When you want custom promotional codes to reflect in the actual native store price.
**Flow:**
1. App validates code against Firestore.
2. App sets attribute: `Purchases.setAttributes({ "coupon": "SUMMER2026" })`.
3. App calls `Purchases.syncAttributesAndOfferingsIfNeeded()`.
4. App fetches "Current Offering" which now contains the discounted product.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Price Calculation | Manual strings parsing | `package.storeProduct.priceString` | Localized symbols (₹, $, £) and formatting vary by region. |
| Price Overrides | Local UI overrides | RevenueCat Offerings | Stores enforce that the price in the native dialog is the final price. |

## Common Pitfalls

### Pitfall 1: Price Mismatch
**What goes wrong:** User sees "₹500" in the app but "₹999" in the Google Play dialog.
**How to avoid:** Use RevenueCat Targeting or separate Products for sales. Never just change the text in the UI.

### Pitfall 2: Atomic Limit Race Condition
**What goes wrong:** A coupon with 1 use left is used by 10 users simultaneously.
**Why it happens:** Check-then-act pattern in `validateCoupon` (Read) followed by `incrementUsage` (Write) minutes later.
**How to avoid:** Use Firestore Transactions for the final increment and accept that marketing limits might occasionally be slightly exceeded (soft limits).

### Pitfall 3: Offline Validation
**What goes wrong:** User applies a coupon while offline; app validates against stale cache.
**How to avoid:** Require a network connection for coupon application or use a "Server Timestamp" check.

## Code Examples

### Atomic Increment with Transaction
```javascript
// Source: [Verified Pattern]
import { doc, runTransaction } from "firebase/firestore";

export const finalizeCouponUsage = async (db, code, userId) => {
  const couponRef = doc(db, "coupons", code);
  await runTransaction(db, async (transaction) => {
    const couponSnap = await transaction.get(couponRef);
    if (!couponSnap.exists()) throw "Coupon disappeared!";
    
    const data = couponSnap.data();
    if (data.usageLimit && data.usageCount >= data.usageLimit) {
      throw "Usage limit exceeded during purchase window.";
    }
    
    transaction.update(couponRef, { 
      usageCount: (data.usageCount || 0) + 1 
    });
  });
};
```

### Syncing RevenueCat Targeting
```javascript
// Source: [RevenueCat Official Docs]
const applyRevenueCatDiscount = async (couponCode) => {
  await Purchases.setAttributes({ "applied_coupon": couponCode });
  const offerings = await Purchases.syncAttributesAndOfferingsIfNeeded();
  return offerings.current; // This offering will be the one targeted to this coupon
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded IDs | Offering Targeting | 2023+ | No code changes needed to change sale prices. |
| Manual validation | Server-side validation | Always | Prevents client-side spoofing. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Custom App Coupons are meant to lower the price. | Summary | If they are purely for tracking, Targeting is overkill. |
| A2 | RevenueCat Dashboard allows creating multiple Offerings/Products. | Patterns | Requires configuration access to RevenueCat console. |

## Open Questions

1. **RevenueCat Config:** Does the user have "Discounted" products already created in Google Play/App Store to map to these coupons?
2. **Grace Period:** Should we allow the increment to succeed even if the limit was reached *during* the purchase flow? (Recommended: Yes, for UX).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| RevenueCat | Purchase logic | ✓ | 9.10.3 | — |
| Firestore | Coupon validation | ✓ | 12.9.0 | — |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | Yes | Trimming and sanitizing coupon code inputs. |
| V13 Business Logic | Yes | Ensuring usage limits are enforced on the server. |

### Known Threat Patterns for RevenueCat + Firestore

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Usage Limit Bypass | Tampering | Firestore Transactions for atomic increments. |
| Stale Code Usage | Information Disclosure | Validate `expiryDate` using `serverTimestamp()`. |

## Sources

### Primary (HIGH confidence)
- `react-native-purchases` package version checked in `package.json`.
- RevenueCat Targeting Documentation (Web Search verified).
- Firestore best practices for atomic counters.

### Secondary (MEDIUM confidence)
- RevenueCat custom attribute sync behavior (verified via community forums).
