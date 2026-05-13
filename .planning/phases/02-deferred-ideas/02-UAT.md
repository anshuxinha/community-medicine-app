---
status: testing
phase: 02-deferred-ideas
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-05-13T10:00:00Z
updated: 2026-05-13T10:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: Gem Image Visibility
expected: Open a Gem that is known to have an illustration (e.g. from gemsData.json) and visually confirm the image loads from the 'gems/' Storage bucket.
awaiting: user response

## Tests

### 1. Gem Image Visibility
expected: Open a Gem that is known to have an illustration (e.g. from gemsData.json) and visually confirm the image loads from the 'gems/' Storage bucket.
result: [pending]

### 2. Firestore Query Fallback
expected: If a document fetch by title-based ID fails (e.g. title mismatch), the service should fallback to a query by contentKey and successfully load the illustration metadata.
result: [pending]

### 3. Metadata Validation Script
expected: Run 'node scripts/validate-illustrations.js' and confirm it correctly scans Firestore and reports any documents missing explicit URLs or malformed image arrays.
result: [pending]

### 4. Coupon Analytics - Apply Attempt
expected: Enter a coupon code in the Paywall screen and confirm 'coupon_apply_attempt' is dispatched to Firebase Analytics with the correct parameters (platform, plan_id, etc.).
result: [pending]

### 5. Coupon Analytics - Apply Success/Failure
expected: Confirm 'coupon_apply_success' is logged on valid code entry and 'coupon_apply_failure' is logged with the specific error reason for invalid/expired codes.
result: [pending]

### 6. Coupon ROI Tracking
expected: Complete a purchase with an applied coupon and confirm 'purchase_success' is logged with the 'applied_coupon' parameter included for conversion tracking.
result: [pending]

### 7. Firestore Coupon Sync
expected: Verify that after a successful purchase, the user's Firestore document correctly contains the 'appliedCoupon' metadata field.
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
