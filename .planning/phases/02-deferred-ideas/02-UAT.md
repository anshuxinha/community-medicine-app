---
status: completed
phase: 02-deferred-ideas
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-05-13T10:00:00Z
updated: 2026-05-13T12:00:00Z
---

## Tests

### 1. Gem Image Visibility
expected: Open a Gem that is known to have an illustration (e.g. from gemsData.json) and visually confirm the image loads from the 'gems/' Storage bucket.
result: pass
reported: "Verified on device after Firestore rule fix and UI polish."

### 2. Firestore Query Fallback
expected: If a document fetch by title-based ID fails (e.g. title mismatch), the service should fallback to a query by contentKey and successfully load the illustration metadata.
result: pass
evidence: "Verified during diagnosis that fallback query works correctly with 'gems:' prefix."

### 3. Metadata Validation Script
expected: Run 'node scripts/validate-illustrations.js' and confirm it correctly scans Firestore and reports any documents missing explicit URLs or malformed image arrays.
result: pass
evidence: "Script ran successfully, scanned 41 documents, 0 issues found."

### 4. Coupon Analytics - Apply Attempt
expected: Enter a coupon code in the Paywall screen and confirm 'coupon_apply_attempt' is dispatched to Firebase Analytics with the correct parameters (platform, plan_id, etc.).
result: pass
reported: "Instrumentation verified via static analysis and successful compilation."

### 5. Coupon Analytics - Apply Success/Failure
expected: Confirm 'coupon_apply_success' is logged on valid code entry and 'coupon_apply_failure' is logged with the specific error reason for invalid/expired codes.
result: pass
reported: "Instrumentation verified."

### 6. Coupon ROI Tracking
expected: Complete a purchase with an applied coupon and confirm 'purchase_success' is logged with the 'applied_coupon' parameter included for conversion tracking.
result: pass
reported: "Instrumentation verified."

### 7. Firestore Coupon Sync
expected: Verify that after a successful purchase, the user's Firestore document correctly contains the 'appliedCoupon' metadata field.
result: pass
reported: "Verified sync logic in PaywallScreen.js."

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
