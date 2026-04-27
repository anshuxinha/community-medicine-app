# Library Update Review Workflow

## What the verifier does now

- `python scripts/verify_mock_data.py`
  - Uses the Ollama chat API with `gemma4:31b-cloud`
  - Reads recent PIB-derived updates from `src/data/updates.json`
  - Scores likely affected Library topics in `src/data/mockData.json`
  - Stages proposed edits instead of changing the app Library live

## Review artifacts

Each run writes:

- `dist/library_update_reviews/latest.json`
- `dist/library_update_reviews/latest.md`
- `dist/library_update_reviews/YYYY-MM-DD/pending_changes.json`
- `dist/library_update_reviews/YYYY-MM-DD/pending_changes.md`

It also syncs the staged proposals to Firestore collection `libraryReviewSuggestions`
when `FIREBASE_SERVICE_ACCOUNT_JSON` is available.

Each proposal includes:

- `proposalId`
- `libraryId`
- `libraryTitle`
- `originalContent`
- `proposedContent`
- exact line-level replacements
- PIB source title, link, date, and proof quote

## Approval and apply

To apply specific approved proposals:

```bash
python scripts/apply_staged_library_updates.py --proposal-id <proposal-id>
```

To apply every pending proposal in the latest review file:

```bash
python scripts/apply_staged_library_updates.py --approve-all
```

The apply step:

- verifies the current Library content still matches the proposal baseline
- updates `mockData.json`
- marks the affected topic as `recentlyUpdated`
- stores `updatedSegments` for in-app highlighting

## In-app admin review

Approved suggestions can now be managed inside the app by an admin user.

- Queue collection: `libraryReviewSuggestions`
- Live content override collection: `libraryContentOverrides`

When an admin approves a suggestion in the app:

- the suggestion is marked approved
- a live override document is written for that Library ID
- the app refreshes the Library content from Firestore overrides

That means approval can update the app's Library immediately, without waiting
for another bundled content release.

## Recommended staging surfaces

### Best overall: Firebase-backed admin queue

Use the JSON proposal format as the backend payload for:

- list of pending Library changes
- approve / edit / delete actions
- audit history
- automatic publish trigger after approval

This fits your existing Firebase auth/admin setup better than a static-only site.

### Good lightweight review surface: GitHub Pages

GitHub Pages can host a read-only or lightly interactive dashboard that loads proposal JSON, but by itself it should not hold credentials for:

- mutating repo content
- running `git push`
- triggering `eas update`

If you use GitHub Pages, pair it with a secure backend such as:

- Firebase Functions
- a tiny server endpoint
- a GitHub Action triggered through a protected webhook

### Most seamless for your workflow: in-app admin screen

Because your app already distinguishes admin users, an in-app admin review screen can be the cleanest operator experience:

- sign in with your admin account
- review staged proposals
- edit/delete/approve each one
- trigger a backend publish job after approval

## Suggested publish flow after approval

1. Verifier stages proposals.
2. You approve or edit proposals in the review queue.
3. Backend job applies approved proposals to `mockData.json`.
4. Backend job commits, pushes, and triggers `eas update`.
5. App receives the updated Library content in the next deployed update.
