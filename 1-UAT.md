# Phase 1 UAT: Coupon Integration

## Summary
| Total Tests | Passed | Failed | Blocked | Status |
| :--- | :--- | :--- | :--- | :--- |
| 5 | 0 | 0 | 0 | 🟢 Ready |

## Test Scenarios

### 1. UI Reveal & Hide
**Goal:** Verify that the coupon input field reveals when "Apply now" is clicked and hides when closed.
- [ ] Tap "Have a coupon code? Apply now" -> Field appears.
- [ ] Tap the "X" (close) button next to the input -> Field disappears, trigger text returns.
**Result:** 

### 2. Custom Coupon Validation (Firestore)
**Goal:** Verify validation against the Firestore `coupons` collection.
- [ ] Enter an invalid/non-existent code -> Shows error alert.
- [ ] Enter `YEARLY999` (already added) while on Yearly plan -> Shows success alert, price updates.
- [ ] Verify `usageLimit` enforcement (if possible).
**Result:** 

### 3. Dynamic Pricing & UI Updates
**Goal:** Verify prices update correctly in the UI.
- [ ] Apply `YEARLY999` -> Yearly card shows strikethrough price and ₹999.
- [ ] Remove coupon -> Price reverts to original.
- [ ] Change plan (e.g., to Monthly) -> Coupon removed (since it targets yearly).
**Result:** 

### 4. RevenueCat Synchronization
**Goal:** Verify the attribute is synced for targeting.
- [ ] Apply `YEARLY999` -> Check if store modal (if on real device) shows correct price.
- [ ] Verify offerings are re-fetched.
**Result:** 

### 5. Network Resiliency
**Goal:** Verify offline behavior.
- [ ] Turn off internet -> Try to apply coupon -> Alert: "Please check your internet connection".
**Result:** 
