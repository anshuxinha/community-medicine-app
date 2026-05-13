---
phase: "02"
plan: "01"
subsystem: "Gems/Illustrations"
tags: ["reliability", "firestore", "storage", "validation"]
requirements: ["D-01", "D-02", "D-03", "D-04"]
tech-stack: ["firebase", "jest", "node.js"]
key-files:
  - "src/services/topicIllustrations.js"
  - "src/services/__tests__/topicIllustrations.test.js"
  - "scripts/validate-illustrations.js"
metrics:
  duration: "45m"
  completed_date: "2026-05-13"
---

# Phase 02 Plan 01: Gem Illustration Reliability Summary

## Objective
Harden Gem image loading reliability and ensure data quality in Firestore metadata. This plan decoupled illustration fetching from brittle title-based IDs and fixed incorrect storage paths for Gems.

## Key Changes

### 1. Resilient Illustration Service (`src/services/topicIllustrations.js`)
- **Multi-path Support:** Modified `normalizeIllustration` and `getTopicIllustrations` to support different storage paths based on the `contentKey`.
- **Gems Integration:** If a `contentKey` starts with `gems:`, the service now correctly constructs URLs pointing to the `gems/` folder in Firebase Storage.
- **Query Fallback:** Implemented a Firestore query fallback using `where("contentKey", "==", resolvedContentKey)` if the primary `getDoc(docId)` fetch fails. This provides resilience against brittle title-based document IDs.
- **Security:** Added path traversal sanitization for `fileName` when constructing Storage URLs.

### 2. Unit Testing (`src/services/__tests__/topicIllustrations.test.js`)
- Comprehensive test suite covering standard pathing, Gem pathing, and query fallback logic.
- Mocks Firestore `getDoc` and `getDocs` to verify logical correctness without live network calls.
- Verified sanitization logic prevents path traversal attacks.

### 3. Data Quality Validation (`scripts/validate-illustrations.js`)
- A Node.js administrative script that scans the `topicIllustrations` collection.
- Reports missing `contentKey`, malformed `images` arrays, and missing URLs/fileNames.
- Enforces **D-04** by flagging Gem images that lack explicit URLs.

## Verification Results

### Automated Tests
- `npm test src/services/__tests__/topicIllustrations.test.js`: **PASSED** (5 tests)
- `node scripts/validate-illustrations.js`: **PASSED** (Scanned 41 documents, 0 issues)

## Deviations from Plan
None. All tasks were executed according to the plan specifications.

## Threat Flags
None. Added sanitization mitigated the identified `T-02-01` threat.

## Self-Check: PASSED
- [x] Gem images use 'gems/' path in Storage URLs
- [x] Illustrations fetch falls back to contentKey query if docId fails
- [x] Validation script identifies illustrations missing URLs
- [x] Unit tests cover core scenarios
