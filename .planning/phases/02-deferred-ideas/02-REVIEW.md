---
phase: 02-deferred-ideas
reviewed: 2025-03-24T18:20:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/services/topicIllustrations.js
  - src/screens/PaywallScreen.js
  - scripts/validate-illustrations.js
  - src/services/__tests__/topicIllustrations.test.js
  - src/screens/__tests__/PaywallScreen.analytics.test.js
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2025-03-24T18:20:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The implementation of topic illustrations and the paywall screen with coupon support is generally solid and well-tested. However, there are some concerns regarding path traversal sanitation, state synchronization with RevenueCat, and potential merge collisions in the illustration service.

## Warnings

### WR-01: Insufficient Path Traversal Protection

**File:** `src/services/topicIllustrations.js:18`
**Issue:** The sanitation logic `String(image.fileName).replace(/\.\.\//g, "")` is insufficient. It can be bypassed using double patterns like `....//` (which becomes `../` after one replacement) or other separators like `..\`. This could allow a malicious Firestore entry to construct URLs pointing to unauthorized files in the Firebase Storage bucket.
**Fix:**
```javascript
// Use a more robust sanitation or a whitelist approach
const sanitizedFileName = String(image.fileName).replace(/[^a-zA-Z0-0._-]/g, "_");
// OR use a regex that handles multiple levels and backslashes
const sanitizedFileName = String(image.fileName).replace(/\.\.[/\\]/g, "");
```

### WR-02: RevenueCat Attribute Desync on Plan Change

**File:** `src/screens/PaywallScreen.js:84`
**Issue:** When the `selectedPlan` changes and the current `appliedCoupon` is no longer applicable, the coupon is cleared from the local state, but the `coupon_code` attribute is not cleared in RevenueCat, nor are the offerings re-fetched. This means the backend might still believe a coupon is active or present an incorrect offering.
**Fix:**
```javascript
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.targetPlans && !appliedCoupon.targetPlans.includes(selectedPlan)) {
      setAppliedCoupon(null);
      // Synchronize with RevenueCat
      if (Purchases) {
        Purchases.setAttributes({ "coupon_code": "" });
        fetchOfferings(null);
      }
      Alert.alert("Coupon Removed", "This coupon is not applicable to the newly selected plan.");
    }
  }, [selectedPlan]);
```

### WR-03: Merge Key Collision Risk

**File:** `src/services/topicIllustrations.js:77`
**Issue:** The key generation logic `normalized.id || `${normalized.anchorText}:${normalized.alt}`` is prone to collisions if `id` is missing and `anchorText` is absent or duplicate (especially since `alt` defaults to "Topic illustration"). This results in remote images overwriting each other or defaults in the Map.
**Fix:** Use a more unique fallback key, perhaps including the index or a hash of the object if no ID is provided. Ensure every illustration in Firestore has a unique ID.

### WR-04: Loss of Local Fallback on Merge

**File:** `src/services/topicIllustrations.js:27`
**Issue:** The `normalizeIllustration` function explicitly sets `source` to `null` if a `url` is constructed or present. While this prioritizes remote images, it removes the ability for the app to fall back to a local bundled asset if the remote URL fails to load (e.g., due to network issues specific to the storage bucket).
**Fix:** Keep the `source` as a secondary fallback even if a `url` is present, and handle the prioritization at the component level or during the merge without destructive assignment.

## Info

### IN-01: Hardcoded Storage Bucket URL

**File:** `src/services/topicIllustrations.js:16`
**Issue:** The Firebase Storage bucket name `community-med-app.firebasestorage.app` is hardcoded in the service.
**Fix:** Move this to a configuration file or derive it from the Firebase app configuration.

### IN-02: RevenueCat Package Selection Fallback

**File:** `src/screens/PaywallScreen.js:189`
**Issue:** The logic falls back to selecting the first available package if the specific plan ID isn't found and only one package exists. While this supports custom offerings, it might be too permissive if multiple offerings are misconfigured.
**Fix:** Add a log or warning when this fallback occurs to aid in debugging configuration issues.

---

_Reviewed: 2025-03-24T18:20:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
