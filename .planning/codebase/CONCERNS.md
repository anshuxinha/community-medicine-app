# Codebase Concerns

**Analysis Date:** 2025-05-14

## Tech Debt

**"God Context" in AppContext:**
- Issue: `AppContext.js` manages too many responsibilities including auth, premium status, learning progress, bookmarks, highlights, and notifications.
- Files: `src/context/AppContext.js`
- Impact: Frequent unnecessary re-renders across the entire app. High maintenance burden and difficulty in isolating state-related bugs.
- Fix approach: Split `AppContext` into smaller, focused contexts (e.g., `AuthContext`, `PremiumContext`, `ProgressContext`).

**Fragile Currency Parsing:**
- Issue: `applyDiscount` relies on regex to strip non-numeric characters from price strings before calculation.
- Files: `src/services/couponService.js`
- Impact: Prone to breaking if RevenueCat returns different currency formats or locales.
- Fix approach: Use numeric values for calculations and format only at the presentation layer using `Intl.NumberFormat`.

**Large Component Complexity:**
- Issue: Screens like `PaywallScreen` and `VirtualMuseumScreen` are large and contain complex logic mixed with UI.
- Files: `src/screens/PaywallScreen.js`, `src/screens/VirtualMuseumScreen.js`
- Impact: Harder to test and maintain. Slower developer onboarding.
- Fix approach: Extract logic into custom hooks and split UI into smaller functional components.

## Known Bugs

**Device Conflict Edge Cases:**
- Issue: The device conflict logic in `AppContext` might trigger unnecessary logouts if Firebase Auth resolves before Firestore data during cold starts.
- Files: `src/context/AppContext.js`
- Trigger: Cold app start with a stale session.
- Workaround: Handled by a safety check but remains a fragile logic branch.

## Security Considerations

**Hardcoded Firebase Configuration:**
- Issue: Firebase configuration object including `apiKey` is hardcoded in the source.
- Files: `src/config/firebase.js`
- Current mitigation: None.
- Recommendations: Move configuration to environment variables (`EXPO_PUBLIC_...`) and use different keys for staging and production.

**Native Module Dependency:**
- Issue: Screen capture protection depends on `NativeModules.ScreenCaptureProtection` which may silently fail if the native side is not linked correctly.
- Files: `src/utils/screenCaptureProtection.js`
- Current mitigation: Returns `false` on failure.
- Recommendations: Implement a fallback or explicit warning if protection cannot be enabled on sensitive screens.

## Performance Bottlenecks

**Frequent State Persistence:**
- Issue: Large JSON blobs (bookmarks, read history) are stringified and written to `AsyncStorage` and Firestore on every small state update.
- Files: `src/context/AppContext.js`
- Cause: Oversized `useEffect` hook syncing the entire state.
- Improvement path: Implement debouncing for persistence or only sync dirty fields.

**Image Heavy Museum Screen:**
- Issue: Loading many high-resolution images in `VirtualMuseumScreen` without virtualization.
- Files: `src/screens/VirtualMuseumScreen.js`
- Cause: Uses `ScrollView` to map over all museum items.
- Improvement path: Use `FlatList` with `windowSize` optimization and image caching.

## Test Coverage Gaps

**Total Lack of Tests:**
- What's not tested: Entire application logic, including critical paths like payment, content progress, and authentication.
- Files: All files in `src/`
- Risk: High risk of regressions during refactoring or adding new features.
- Priority: High

## Dependencies at Risk

**Moment.js:**
- Risk: `moment` is considered legacy and has a large bundle size. (Detected in npm cache).
- Impact: Increased bundle size and potential maintenance issues.
- Migration plan: Replace with `date-fns` or `dayjs` if used directly.

## Missing Critical Features

**Centralized Error Logging:**
- Problem: Errors are often swallowed with `console.warn` or "ignore".
- Blocks: Real-time monitoring of production crashes and issues.
- Recommendations: Integrate Sentry or a similar crash reporting tool.

---

*Concerns audit: 2025-05-14*
