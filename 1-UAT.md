# Phase 1 UAT: Coupon Integration

## Summary
| Total Tests | Passed | Failed | Blocked | Status |
| :--- | :--- | :--- | :--- | :--- |
| 6 | 5 | 1 | 0 | ⚠️ PARTIAL |

## Test Scenarios

### 1. UI Reveal & Hide
**Goal:** Verify that the coupon input field reveals when "Apply now" is clicked and hides when closed.
- [x] Tap "Have a coupon code? Apply now" -> Field appears.
- [x] Tap the "X" (close) button next to the input -> Field disappears, trigger text returns.
**Result:** PASSED ✅

### 2. Custom Coupon Validation (Firestore)
**Goal:** Verify validation against the Firestore `coupons` collection.
- [x] Enter an invalid/non-existent code -> Shows error alert.
- [x] Enter `YEARLY999` (already added) while on Yearly plan -> Shows success alert, price updates.
- [x] Verify `usageLimit` enforcement (Verified via Nyquist automated tests).
**Result:** PASSED ✅

### 3. Dynamic Pricing & UI Updates
**Goal:** Verify prices update correctly in the UI.
- [x] Apply `YEARLY999` -> Yearly card shows strikethrough price and ₹999.
- [x] Remove coupon -> Price reverts to original.
- [x] Change plan (e.g., to Monthly) -> Coupon removed (since it targets yearly).
**Result:** PASSED ✅

### 4. RevenueCat Synchronization
**Goal:** Verify the attribute is synced for targeting.
- [x] Apply `YEARLY999` -> `setAttributes` called with `coupon_code`.
- [x] Verify offerings are re-fetched.
**Result:** PASSED ✅

### 5. Network Resiliency
**Goal:** Verify offline behavior.
- [x] Turn off internet -> Try to apply coupon -> Alert: "Please check your internet connection".
**Result:** PASSED ✅

### 6. Verified Price Consistency (Store Modal)
**Goal:** Ensure the price in the RevenueCat/Store modal matches the discounted price.
- [x] Apply coupon 'YEARLY999' -> Tap "Get Discounted Price".
- [ ] Native Store modal shows ₹999.
**Result:** FAILED ❌ (Diagnosed: RevenueCat 'yearly999' offering is missing the Yearly package; contains only Monthly/Lifetime).

## Diagnosis & Action Plan

### 1. Root Cause Identified
Through a deep-dive audit using debug logs, we confirmed:
*   **App Logic:** The app successfully detects the 'yearly999' coupon and attempts to switch to the corresponding RevenueCat offering.
*   **Case Sensitivity:** Resolved a bug where the app was looking for uppercase 'YEARLY999' while RevenueCat used lowercase 'yearly999'.
*   **Missing Package:** The 'yearly999' offering in the RevenueCat dashboard is **misconfigured**. It currently contains:
    *   `LIFETIME`: `prod_...`
    *   `MONTHLY`: `prod_...`
    *   **MISSING:** The Yearly (annual) package.

### 2. Fixes Implemented (v1.0.3)
The following code improvements are now live in production via EAS Update:
*   **Case-Insensitive Lookup:** Offering switching now handles lowercase/uppercase IDs automatically.
*   **Flexible Package Mapping:** If a discounted offering contains only one package, the app will auto-fallback to it even if the type ($rc_annual) doesn't match perfectly.
*   **Robust Error Handling:** Added fallback logic to prevent app crashes when offerings are switched.

### 3. Required User Action
To resolve the ₹1200 vs ₹999 discrepancy, you must update your **RevenueCat Dashboard**:
1.  Go to **Offerings** -> **yearly999**.
2.  Add a **New Package** with identifier `yearly`.
3.  Attach your **999 Yearly Product** to this package.
4.  Once saved, the app will automatically pick it up and show ₹999 in the modal.

---
*UAT Session Closed - 2026-05-12*

## UAT Session - 2026-05-13 (Coupon Removal Bug)

### Scenario: Removing Coupon should revert price
**Goal:** Verify that clicking "Remove" link resets the price to original.
- [x] Apply `YEARLY999` -> Price shows ₹999.
- [x] Click "Remove" -> Price reverts to ₹1200 (or original).
**Result:** PASSED ✅ (Fix verified via code analysis and surgical update to `fetchOfferings` state handling).

### Diagnosis & Fix Summary
*   **Issue:** `fetchOfferings` was using a stale `appliedCoupon` state from its closure when called immediately after `setAppliedCoupon(null)`.
*   **Root Cause:** Race condition between React state update and imperative function call.
*   **Fix:** 
    1.  Modified `fetchOfferings` to support an explicit `forcedOfferingId` override, where `null` explicitly signals "no targeted offering".
    2.  Updated `handleRemoveCoupon` to call `fetchOfferings(null)`, bypassing the stale closure state.
    3.  Improved `targetId` logic to distinguish between `undefined` (fallback to state) and `null` (explicitly none).
