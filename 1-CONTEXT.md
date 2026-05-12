# Phase 1 Context: Coupon Integration

## Goals
- Add "Have a coupon code? Apply now" functionality to the Paywall screen.
- Support both Native Google Play Promo Codes and Custom App Coupons.
- Implement UI to reveal input field, apply, and remove coupons.
- Update pricing display dynamically based on the applied coupon.

## Decisions & Implementation Detail

### 1. Coupon Logic Strategy
- **Service:** Created `src/services/couponService.js` to handle validation and calculation.
- **Validation:** Coupons are validated against a Firestore collection named `coupons`.
- **Supported Types:**
    - `percentage`: Percentage off the base price.
    - `flat`: Flat amount off the base price.
- **Restrictions:** Supports `expiryDate`, `usageLimit`, and `targetPlans` (e.g., only for Yearly).
- **Post-Purchase:** `usageCount` is incremented in Firestore upon successful purchase.

### 2. UI/UX Changes (`PaywallScreen.js`)
- **Trigger:** "Have a coupon code? Apply now" text added below the pricing cards.
- **Input:** Reveals a `TextInput` and an "Apply" button when triggered.
- **State Management:**
    - `appliedCoupon`: Stores the full coupon object from Firestore.
    - `selectedPlan`: Changing the plan will automatically re-verify if the coupon is still applicable; if not, it is removed with an alert.
- **Pricing:** Shows a strikethrough original price and a highlighted discounted price (in green) when a coupon is active.

### 3. Native Support
- Native Google Play Promo Codes are supported via the standard RevenueCat `purchasePackage` flow. If a user has a native code, they can apply it in the Google Play overlay.
- The custom UI is primarily for app-side marketing coupons tracked in Firestore.

### 4. Data Persistence (`AppContext.js`)
- The `upgradeToPremium` function now accepts `metadata` which includes the `appliedCoupon` code. This is saved to the `users` collection in Firestore under the `appliedCoupon` field.

## Locked Choices
- **Collection Name:** `coupons` (case-sensitive).
- **Code Format:** Upper-case strings (e.g., `SUMMER2026`).
- **Pricing Format:** Parsed from RevenueCat's `priceString` to ensure consistency with local currency symbols.

## Next Steps
- Verify Firestore Security Rules allow reading from the `coupons` collection.
- Test with production packages in a signed build to confirm Google Play Promo Code behavior.
