---
status: completed
trigger: "Price mismatch between app UI (999) and Play Store (1200) for yearly plan after clicking 'Get Discounted Price'"
goal: find_and_fix
tdd_mode: false
---

# Debug Session: yearly-plan-price-mismatch

## Symptoms
- In the paywall screen, clicking "Get Discounted Price" updates the UI price for the yearly plan to 999.
- However, when the purchase process is initiated, the Play Store shows the original price of 1200.

## Evidence
- timestamp: 2025-01-01T00:00:00Z
  observation: Initial report of price discrepancy.
- timestamp: 2025-01-01T01:00:00Z
  observation: Found that `PaywallScreen.js` calculates the discount locally in the UI using `applyDiscount` but uses the same `pkg` for `Purchases.purchasePackage(pkg)`.
- timestamp: 2025-01-01T01:05:00Z
  observation: Confirmed that RevenueCat offerings are not being switched immediately because the code only looks at `result.current` and doesn't verify if the discount was actually applied by the store.

## Current Focus
- **Hypothesis**: The UI update logic only changes the displayed value but doesn't update the product ID or offer code used for the actual purchase.
- **Next Action**: [Completed] Applied fix to use coupon-specific offerings and verify store prices in UI.

## Investigation Log
- Identified the issue in `src/screens/PaywallScreen.js`.
- Root cause: Manual UI override without verified Store discount and lack of immediate offering switching.
- Fixed by allowing immediate offering selection by coupon ID and improving UI price verification logic.

## Resolution
- root_cause: The app was calculating a discounted price locally in the UI while still using the full-price RevenueCat package for the purchase. It also relied on slow-syncing Targeting Rules instead of immediate offering switching.
- fix: Modified `fetchOfferings` to support immediate offering switching via coupon IDs, ensured attributes sync before fetching, and updated the UI to only show discounts if verified by the Store's price or successfully switched offerings.
