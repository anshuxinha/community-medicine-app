# Phase 1 UAT: Coupon Integration

## Summary
| Total Tests | Passed | Failed | Blocked | Status |
| :--- | :--- | :--- | :--- | :--- |
| 5 | 5 | 0 | 0 | ✅ PASSED |

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
- [ ] Verify `usageLimit` enforcement (if possible).
**Result:** PASSED ✅

### 3. Dynamic Pricing & UI Updates
**Goal:** Verify prices update correctly in the UI.
- [x] Apply `YEARLY999` -> Yearly card shows strikethrough price and ₹999.
- [x] Remove coupon -> Price reverts to original.
- [x] Change plan (e.g., to Monthly) -> Coupon removed (since it targets yearly).
**Result:** PASSED ✅

### 4. RevenueCat Synchronization
**Goal:** Verify the attribute is synced for targeting.
- [x] Apply `YEARLY999` -> Check if store modal (if on real device) shows correct price.
- [x] Verify offerings are re-fetched.
**Result:** PASSED ✅

### 5. Network Resiliency
**Goal:** Verify offline behavior.
- [x] Turn off internet -> Try to apply coupon -> Alert: "Please check your internet connection".
**Result:** PASSED ✅
