# Phase 4 Context: iOS Subscription Investigation

**Date:** 2026-05-14
**Status:** In Progress

<domain>
## Phase Boundary
This phase addresses the issue where subscription plans are not appearing on iOS devices. The app reports "no App Store products registered" and "Configuration is not valid" for iOS.

</domain>

<hypotheses>
## Hypotheses & Investigation Paths

### H-01: RevenueCat API Key Mismatch
- **Symptoms:** "Configuration is not valid" error in logs.
- **Verification:** Compare the key in `3-CONTEXT.md` (`appl_bIbghsScVIeHGfrXogcChLzXKsS`) with the RevenueCat Dashboard -> Project Settings -> API Keys (iOS).

### H-02: App Store Agreements
- **Symptoms:** "no App Store products registered" (StoreKit returns empty list).
- **Evidence:** `asc_agreements.png` exists in the repo root.
- **Verification:** Check if "Paid Applications" agreement is active in App Store Connect -> Agreements, Tax, and Banking.

### H-03: Bundle ID / Product Mismatch
- **Symptoms:** Offerings found but packages empty.
- **Verification:** 
  - Confirm `com.communitymed.app` is the Bundle ID used in RevenueCat's iOS App settings.
  - Verify that products (e.g., `prod_monthly`, `prod_yearly`) are correctly attached to the "current" offering in RevenueCat.

</hypotheses>

<strategy>
## Strategy

1. **Log Analysis:** Review user-provided logs for `[RevenueCat]` tags to confirm if the SDK is initialized correctly.
2. **Key Audit:** Verify if `EXPO_PUBLIC_RC_API_KEY_IOS` is being passed correctly to `Purchases.configure`.
3. **Product Audit:** Check `PaywallScreen.js` mapping of `packageType` to ensure it matches what RevenueCat returns.
4. **Environment Check:** Ensure the development build is using the correct environment variables.

</strategy>

<success_criteria>
- [ ] RevenueCat SDK initializes on iOS without "Configuration is not valid".
- [ ] `Purchases.getOfferings()` returns valid packages on physical iOS device.
- [ ] PaywallScreen displays correct prices for Monthly, Yearly, and Lifetime plans.
- [ ] Native StoreKit modal appears when "Subscribe Now" is tapped.
</success_criteria>

<canonical_refs>
## Canonical References
- `3-CONTEXT.md`: Previous iOS hardening work.
- `src/context/AppContext.js`: SDK initialization logic.
- `src/screens/PaywallScreen.js`: Offering fetching and display.
- `asc_agreements.png`: User-provided screenshot of agreement status.
</canonical_refs>

---
*Phase: 04-ios-subscription-fix*
*Context gathered: 2026-05-14*
