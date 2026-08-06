---
name: publish-video
description: >
  Publish the latest Bunny Stream video into the app: sync Firestore category,
  send Expo push notifications, and attach a Notes PDF. User only provides the
  local PDF path and video category (theory / practicals / webinars). Use when
  the user runs /publish-video, "publish video", "sync video with notes",
  "attach notes and notify", "ship new bunny video", or pastes a STROMA PDF
  path plus a category for a newly uploaded lecture.
metadata:
  short-description: "Sync latest Bunny video + notify + attach Notes PDF"
---

# /publish-video: Sync latest Bunny video + notify + Notes PDF

End-to-end publish for a video **already uploaded to Bunny Stream**. The agent
only needs two inputs from the user; everything else is automated.

## User inputs (required)

| Input | Examples |
|-------|----------|
| **PDF path** | `D:\Stroma Files\Videos\Theory\NTDs\Neglected Tropical Diseases (NTDs) - STROMA.pdf` |
| **Category** | `theory`, `practicals`, `webinars` (or another slug already used in the app) |

Optional:

| Input | Default | Notes |
|-------|---------|--------|
| **Category label** | Title-cased category (`theory` → `Theory`) | Override with a nicer label if needed |
| **Push body** | Video title | Custom Expo notification body text |
| **Skip notify** | off | Only if the user explicitly says no push |

## Preconditions

1. Repo root is `D:\The App` (or the app workspace).
2. Video file is already in the **Bunny Stream** library (this skill does **not** upload the mp4).
3. `.env` has Bunny keys; `serviceAccountKey.json` exists for Firestore/Storage.
4. PDF path exists on disk.

If the PDF path or category is missing, **ask once** for the missing field(s). Do not invent a path.

## One-shot command (preferred)

From the app root, run:

```bash
node scripts/publish-video.js --file="<ABSOLUTE_PDF_PATH>" --category=<slug>
```

With optional label / custom push body:

```bash
node scripts/publish-video.js --file="<ABSOLUTE_PDF_PATH>" --category=theory --category-label=Theory "Neglected Tropical Diseases lecture is live"
```

Skip push only when the user asks:

```bash
node scripts/publish-video.js --file="<ABSOLUTE_PDF_PATH>" --category=theory --skip-notify
```

### What the script does

1. **`bunny-videos.js sync`** with `--category`, `--category-label`, and `--notify-new` (unless skipped).
   - Applies category **only to the latest** Bunny video (first item returned).
   - Notifies devices for videos that are new **or** already `isNew` with no `notifiedAt` (recovery path).
2. **`attach-pdf-to-video.js`** on that same latest video id (not a random older doc).
3. Prints a final JSON summary: `videoId`, `title`, `category`, `pdfUrl`, `notified`.

Use a long timeout (up to a few minutes): push can send to hundreds of Expo tokens.

## If the orchestrator is unavailable

Run the two steps manually in order:

```bash
node scripts/bunny-videos.js sync --notify-new --category=<slug> --category-label=<Label>
node scripts/attach-pdf-to-video.js --file="<ABSOLUTE_PDF_PATH>" --id=<videoIdFromFirstUpsertLine>
```

Parse the first `Upserting video <id> (<title>) in category ...` line for `--id`.

Manual notify only (if sync already happened without push):

```bash
node scripts/bunny-videos.js notify --id=<videoId>
```

## Agent checklist after run

Confirm from logs / final JSON:

- [ ] Sync completed without error
- [ ] Notify targets ≥ 1 **or** user asked `--skip-notify` **or** video was already `notifiedAt`
- [ ] Expo token count logged and accepted tickets look healthy (warn on mass ticket errors)
- [ ] PDF attach `ok: true` for the **same** `videoId` that received the category
- [ ] Category matches user request

## Ship protocol for this skill

- **No app JS change** → no EAS Update.
- Commit/push only if you changed `scripts/*` or this skill in the same session and those changes should land on GitHub.
- Do **not** commit `serviceAccountKey.json`, `.env`, or unrelated `graphify-out/*` noise unless the user asked for graph updates.

## Close-out message

Report a short table:

| Field | Value |
|-------|--------|
| Title | from sync |
| Video ID | Bunny guid |
| Category | slug + label |
| Notes PDF | basename + public URL |
| Push | tokens sent / skipped / already notified |

Then give a **manual test checklist**:

1. Open **Videos** → correct category tab → find the title.
2. Play the video (happy path).
3. Open **Notes** tab → PDF loads.
4. If notify ran: device shows **New Video Available** (Android: notifications allowed for the app).
5. Regression: one older video in the same category still opens and keeps its own notes if any.

## Do not

- Upload a local `.mp4` unless the user explicitly asks for `bunny-videos.js upload`.
- Apply the category to every video (sync already scopes category to the latest only).
- Attach the PDF to "latest by publishedAt" when a specific id is known from this sync: always prefer the id from the first upsert / orchestrator JSON.
- Use em-dashes in any user-facing text you generate.
