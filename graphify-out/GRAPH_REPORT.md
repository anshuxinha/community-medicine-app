# Graph Report - The App  (2026-07-05)

## Corpus Check
- 156 files · ~1,416,316 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 975 nodes · 1441 edges · 111 communities (92 shown, 19 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d8a3de3c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `theme` - 36 edges
2. `AppContext` - 22 edges
3. `db` - 15 edges
4. `getContentKey()` - 15 edges
5. `generate_review_bundle()` - 14 edges
6. `enableScreenCaptureProtection()` - 14 edges
7. `disableScreenCaptureProtection()` - 14 edges
8. `useResponsive()` - 13 edges
9. `fetch_health_updates()` - 12 edges
10. `getContentSignature()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `getPackages()` --calls--> `ScreenCaptureProtectionPackage`  [INFERRED]
  android/app/src/main/java/com/communitymed/app/MainApplication.kt → android/app/src/main/java/com/communitymed/app/ScreenCaptureProtectionPackage.java
- `DashboardScreen()` --calls--> `useResponsive()`  [EXTRACTED]
  src/screens/DashboardScreen.js → src/styles/theme.js
- `PYQPracticeScreen()` --calls--> `useResponsive()`  [EXTRACTED]
  src/screens/PYQPracticeScreen.js → src/styles/theme.js
- `test()` --calls--> `update_gems()`  [INFERRED]
  scratch/test_updates.py → scratch/apply_changes.py
- `test()` --calls--> `update_mock()`  [INFERRED]
  scratch/test_updates.py → scratch/apply_changes.py

## Communities (111 total, 19 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (65): AppContext, AppProvider(), normalizeBookmarks(), resolveBookmarkContentKey(), sanitizeCloudState(), sanitizeReadItemVersions(), styles, buildReadingParams() (+57 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (40): styles, pdfViewerHtml(), playerHtml(), styles, VideosScreen(), { width }, addVideoSubscriptionListener(), checkDayBeforeHealthDay() (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (40): apply_corrections(), _batched(), build_candidate_map(), build_review_markdown(), build_source_context(), build_unified_diff(), call_ollama(), _document_url() (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (22): BASE_MENU_ITEMS, styles, { width }, flex1, { height: WINDOW_HEIGHT }, styles, app, auth (+14 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (34): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Anti-Patterns Summary, code:python (def export_users(format='json'):), code:diff (def validate_user(user_data):), code:diff (- def upload_file(file_path, destination):) (+26 more)

### Community 5 - "Community 5"
Cohesion: 0.16
Nodes (24): admin, buildThumbnailUrl(), bunnyFetch(), discoverPullZoneHostname(), dotenv, ensureFirebaseApp(), fs, getExpoPushTokens() (+16 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (14): buildTableCellSet(), clamp(), getBlockAnchorText(), isNtruHsHeading(), isNtruHsMetaLine(), normalizeAnchorText(), parseMarkdown(), parseTextTable() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.13
Nodes (16): PLAN_METADATA, styles, applyDiscount(), claimReferralRewards(), incrementCouponUsage(), processReferralReward(), validateCoupon(), coupon (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (18): biomedicalWaste(), chainOfInfection(), coldChain(), { createCanvas }, disasterCycle(), drawArrow(), drawCard(), drawTitle() (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (16): call_ollama(), _extract_candidate_text(), _extract_json_payload(), fetch_health_updates(), generate_gemini_image(), generate_openai_image(), Fetches real updates from the Government of India PIB feed for MoHFW., Fetches real updates from the Government of India PIB feed for MoHFW. (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (16): buildContactSheet(), clampCrop(), CONTACT_SHEET_PATH, { createCanvas, loadImage }, CROP_SPECS, cropRegion(), ensureDir(), fs (+8 more)

### Community 11 - "Community 11"
Cohesion: 0.19
Nodes (12): NFHS_COMPARISON_CATEGORIES, NFHS_COMPARISON_INDICATORS, NFHS_COMPARISON_SOURCES, AREA_LABELS, formatValue(), getDeltaTone(), IndicatorRow(), styles (+4 more)

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (15): buildContactSheet(), buildPngCanvas(), CONTACT_SHEET_PATH, { createCanvas, loadImage }, DOWNLOAD_SPECS, downloadFile(), ensureDir(), fs (+7 more)

### Community 13 - "Community 13"
Cohesion: 0.14
Nodes (8): styles, styles, REFERENCE_VALUES, styles, EDUCATION_OPTIONS, OCCUPATION_OPTIONS, styles, theme

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (15): 1. Always Check Channel Configuration First, 2. Update Channel if Needed, 3. Publish Update to Correct Branch, 4. Verify Update is Live, 5. Clear Cache for Critical Updates, code:bash (eas channel:list --non-interactive), code:bash (eas channel:edit production --branch main --non-interactive), code:bash (eas update --branch main --message "Your update message" --c) (+7 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (13): colorFreq, colorLocations, content, files, fs, getContrastRatio(), getRelativeLuminance(), hex (+5 more)

### Community 16 - "Community 16"
Cohesion: 0.18
Nodes (10): GemsScreen(), styles, LibraryScreen(), PYQCreateScreen(), styles, MONTH_NAMES, MONTH_SHORT, styles (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (12): admin, ensureFirebaseApp(), fs, GEM_IMAGE_ENTRIES, GEMS_DATA_PATH, getImageMetadata(), loadGemsData(), { loadImage } (+4 more)

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (11): admin, ensureFirebaseApp(), fs, loadSeed(), LOCAL_IMAGE_DIR, main(), parseArgs(), path (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (9): NFHS, NFHS_META, ROUND_ORDER, styles, YEARS, { getByText }, insetContext, React (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): Approval and apply, Best overall: Firebase-backed admin queue, code:bash (python scripts/apply_staged_library_updates.py --proposal-id), code:bash (python scripts/apply_staged_library_updates.py --approve-all), Good lightweight review surface: GitHub Pages, In-app admin review, Library Update Review Workflow, Most seamless for your workflow: in-app admin screen (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.18
Nodes (4): getPackages(), MainApplication, ScreenCaptureProtectionPackage, ReactPackage

### Community 22 - "Community 22"
Cohesion: 0.21
Nodes (11): admin, discoverPullZoneHostname(), dotenv, ensureFirebaseApp(), ffmpeg, ffmpegInstaller, fs, main() (+3 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (7): PRESET_PROBLEMS, SOLVER_OFFSETS, ssSingleProp(), ssTwoMeans(), ssTwoProps(), styles, zForCI()

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (7): useSessionEnforcer(), AppNavigator(), navigationRef, Stack, Tab, styles, setupNotificationTapHandler()

### Community 25 - "Community 25"
Cohesion: 0.17
Nodes (11): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Background Watcher, Graph-First Protocol (graphify), graphify, Guidelines (+3 more)

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (3): ScreenCaptureProtectionModule, LifecycleEventObserver, ReactContextBaseJavaModule

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (7): admin, args, { execSync }, fs, isDryRun, path, SERVICE_ACCOUNT_PATH

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (10): 1. App Details, 2. Graphics Assets Required for Play Console, 3. Link Resources, 🧮 Advanced Medical Calculators & Tools, 🤖 AI Tutor & Chat Support, 📚 Comprehensive Knowledge Library, Google Play Store Metadata, 📝 Interactive Quizzes & Mock Exams (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (7): admin, FILE_TO_ID, fs, MUSEUM_DATA_PATH, MUSEUM_FOLDER, path, SERVICE_ACCOUNT_PATH

### Community 30 - "Community 30"
Cohesion: 0.25
Nodes (7): CM_TO_THEME, fs, lower, normalizedCTM, path, processFile(), walkDir()

### Community 31 - "Community 31"
Cohesion: 0.28
Nodes (4): CATEGORIES, MUSEUM_ITEMS, KNOWN_HEADERS, styles

### Community 32 - "Community 32"
Cohesion: 0.54
Nodes (6): get_diff(), main(), update_gems(), update_mock(), update_pyq(), test()

### Community 33 - "Community 33"
Cohesion: 0.25
Nodes (6): admin, db, fs, path, SERVICE_ACCOUNT_PATH, serviceAccount

### Community 34 - "Community 34"
Cohesion: 0.25
Nodes (6): admin, fs, IMAGES_TO_UPLOAD, main(), path, SERVICE_ACCOUNT_PATH

### Community 35 - "Community 35"
Cohesion: 0.32
Nodes (3): styles, appColors, paperTheme

### Community 36 - "Community 36"
Cohesion: 0.36
Nodes (6): buildSpeechChunks(), buildSpeechText(), cleanSpeechText(), collectSpeechFragments(), OBJECT_KEYS_TO_SKIP, PREFERRED_OBJECT_KEYS

### Community 37 - "Community 37"
Cohesion: 0.52
Nodes (6): apply_proposal(), find_item_by_id(), load_json(), main(), save_json(), select_approved_proposals()

### Community 39 - "Community 39"
Cohesion: 0.43
Nodes (5): markAsShown(), maybePromptReview(), openStoreReviewPage(), requestNativeReview(), showPrePrompt()

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (5): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, code:block1 (1. [Step] → verify: [check])

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): Framework used, Full-content findings, Good next candidates, Initial batch added now, Purposeful Placement Audit, Why Firebase was chosen

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (3): { createCanvas }, fs, path

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (5): content, fs, registerEnd, registerEndAlt, registerStart

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (5): content, data, fs, jsonPart, jsonStart

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (4): admin, fs, path, SERVICE_ACCOUNT_PATH

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (4): admin, fs, path, SERVICE_ACCOUNT_PATH

### Community 48 - "Community 48"
Cohesion: 0.53
Nodes (4): _extract_push_token(), fetch_push_tokens(), _get_firestore_access_token(), _load_service_account_info()

### Community 49 - "Community 49"
Cohesion: 0.33
Nodes (4): admin, db, path, serviceAccount

### Community 50 - "Community 50"
Cohesion: 0.33
Nodes (4): admin, fs, path, SERVICE_ACCOUNT_PATH

### Community 51 - "Community 51"
Cohesion: 0.33
Nodes (4): admin, fs, path, SERVICE_ACCOUNT_PATH

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (5): { getByText }, mockAction, mockDismiss, React, { View }

### Community 53 - "Community 53"
Cohesion: 0.4
Nodes (3): appIcon, styles, UPDATES_IMAGES

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (5): code:json ({), Coupon Firestore Setup, Document Structure, Example Document (`PROMO20`):, Script for Bulk Upload

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (5): code:bash (# 1. Commit & push), Common Pitfall Avoidance, Custom Instruction for EAS Updates, Quick Command Sequence, Rule: Always Verify Channel-Branch Mapping Before EAS Update

### Community 57 - "Community 57"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 58 - "Community 58"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 59 - "Community 59"
Cohesion: 0.4
Nodes (4): data, fs, match, pos

### Community 60 - "Community 60"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 61 - "Community 61"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 62 - "Community 62"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 63 - "Community 63"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 64 - "Community 64"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 65 - "Community 65"
Cohesion: 0.4
Nodes (4): data, fs, mockDataPath, path

### Community 66 - "Community 66"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 68 - "Community 68"
Cohesion: 0.4
Nodes (3): admin, path, SERVICE_ACCOUNT_PATH

### Community 70 - "Community 70"
Cohesion: 0.5
Nodes (3): PYQ_IMAGES, PYQPracticeScreen(), styles

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (3): extract_text_from_pdf(), main(), Extracts text from a PDF file.     This is a placeholder function. In a real ap

## Knowledge Gaps
- **351 isolated node(s):** `admin`, `path`, `SERVICE_ACCOUNT_PATH`, `admin`, `path` (+346 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `theme` connect `Community 13` to `Community 0`, `Community 1`, `Community 35`, `Community 3`, `Community 6`, `Community 38`, `Community 7`, `Community 70`, `Community 11`, `Community 16`, `Community 19`, `Community 53`, `Community 54`, `Community 23`, `Community 24`, `Community 31`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `AppContext` connect `Community 0` to `Community 1`, `Community 3`, `Community 70`, `Community 7`, `Community 16`, `Community 54`, `Community 24`, `Community 31`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Why does `ErrorBoundary` connect `Community 69` to `Community 35`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **What connects `admin`, `path`, `SERVICE_ACCOUNT_PATH` to the rest of the system?**
  _351 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._