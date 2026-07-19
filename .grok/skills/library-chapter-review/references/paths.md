# Fixed paths for this skill

| Resource | Path |
|----------|------|
| App root | `D:\The App` |
| Bundled Library | `D:\The App\src\data\mockData.json` |
| Live overrides (Firestore) | collection `libraryContentOverrides` (status `active` / `approved`) |
| Firebase project | `community-med-app` |
| Service account | `D:\The App\serviceAccountKey.json` (or env `FIREBASE_SERVICE_ACCOUNT_JSON`) |
| Park chapter PDFs | `D:\Study Related\Books\Park Split\` |
| PYQ list | `D:\IGIMS\Major Tests & Question Papers\categorized_questions_report.md` |
| Review bundles | `D:\The App\dist\library_chapter_reviews\` |
| Library update workflow | `D:\The App\docs\library-update-review-workflow.md` |
| Publish one leaf override | `python scripts/publish_library_override.py <leafId> --reason "..."` |

## On report approval (ship path)

When the user approves a chapter review report:

1. Apply fixes to `mockData.json` leaves.
2. **Git commit + push** (related files only).
3. **Firebase override** every changed leaf (`status: active`).
4. **Ask before `eas update`** — only if renderer/app JS (not leaf text) must ship; leaf overrides alone do not need OTA.

## Park PDF naming (examples)

- `Chapter 2_Park.pdf`
- `1. Man and Medicine.pdf`
- `11. Nutrition.pdf`

Match by chapter number first, then fuzzy title.

## App chapter ids

Top-level Library ids are `"1"` … `"27"`. Subsections use `"7-2"`, `"11-11"`, etc. Firebase overrides are keyed by **leaf** `libraryId` (often a subsection id).
