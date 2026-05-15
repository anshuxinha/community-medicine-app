# Phase 2: Deferred Ideas - Context

**Gathered:** 2026-05-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 focuses on "Deferred Ideas" from Phase 1, specifically addressing Coupon Analytics and resolving the Gem image reliability issue while maintaining a minimal app bundle size.

</domain>

<decisions>
## Implementation Decisions

### Gem Image Reliability (High Priority)
- **D-01:** **Strictly Dynamic Assets:** Gem images will NOT be added to `topicIllustrations.seed.json`. They must remain strictly dynamic to keep the app bundle size small.
- **D-02:** **Path Logic Fix:** Update `topicIllustrations.js` to intelligently handle different storage paths. If a `contentKey` starts with `gems:`, the fallback URL construction must use the `gems/` folder in Firebase Storage instead of `reading-illustrations/`.
- **D-03:** **Fetching Hardening:** The logic for fetching Gem images from Firestore must be made more resilient to title mismatches and network failures. 
- **D-04:** **Metadata Validation:** Ensure that the Firestore `topicIllustrations` collection contains valid `url` fields for all synced Gems to avoid falling back to the "guess" logic.

### Coupon Analytics
- **D-05:** **Firebase Analytics:** Use Firebase Analytics to log coupon events (apply attempt, success, failure with reason).
- **D-06:** **Firestore Sync:** Continue syncing the `appliedCoupon` to the user's document in Firestore for billing/support visibility.

### Claude's Discretion
- The exact wording of analytics event names.
- The retry logic implementation for failed Firestore asset fetches.

</decisions>

<specifics>
## Specific Ideas

- "Gems are supposed to be fetched from Firebase as in mockData.json" - Users expect a consistent experience where images appear seamlessly in the reading view for both chapters and gems.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Foundation
- `PROJECT.md` — High-level project goals and architecture.
- `ROADMAP.md` — Current phase goals and deferred items.
- `STATE.md` — Current technical state and known issues.

### Prior Context
- `1-CONTEXT.md` — Decisions made during Phase 1 (Coupon Integration).

### Tech Stack & Codebase Maps
- `.planning/codebase/STACK.md` — Technology choices.
- `.planning/codebase/ARCHITECTURE.md` — System design and data flow.
- `.planning/codebase/INTEGRATIONS.md` — Firebase and RevenueCat setup.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/services/topicIllustrations.js`: The central service for fetching and merging illustration metadata.
- `src/components/ReadingView.js`: The component responsible for merging text blocks with illustrations and rendering them.
- `scripts/sync-gem-images.js` & `scripts/sync-reading-illustrations.js`: Scripts used to populate the cloud storage and database.

### Established Patterns
- **Anchor Text Insertion:** Images are inserted into content based on `anchorText` matching.
- **Firestore-First Fetching:** Fetching metadata from `topicIllustrations` collection before falling back to local seeds.

### Integration Points
- `ReadingScreen`: Fetches illustrations and passes them to `ReadingView`.
- `GemsScreen`: Sets the `isGem` flag and passes `contentKey` to the `Reading` route.

</code_context>

<deferred>
## Deferred Ideas

- Referral system (Moved to backlog).
- Advanced analytics dashboard (Still deferred, focus is on logging for now).

</deferred>

---

*Phase: 02-deferred-ideas*
*Context gathered: 2026-05-13*
