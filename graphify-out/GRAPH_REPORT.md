# Graph Report - The App  (2026-05-12)

## Corpus Check
- 120 files · ~762,445 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 725 nodes · 861 edges · 157 communities (108 shown, 49 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 54 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9cd201c1`
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
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
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
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]
- [[_COMMUNITY_Community 147|Community 147]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 149|Community 149]]
- [[_COMMUNITY_Community 150|Community 150]]
- [[_COMMUNITY_Community 151|Community 151]]
- [[_COMMUNITY_Community 152|Community 152]]
- [[_COMMUNITY_Community 153|Community 153]]
- [[_COMMUNITY_Community 154|Community 154]]
- [[_COMMUNITY_Community 155|Community 155]]
- [[_COMMUNITY_Community 156|Community 156]]

## God Nodes (most connected - your core abstractions)
1. `NHP Logo Staging Contact Sheet` - 17 edges
2. `generate_review_bundle()` - 14 edges
3. `getContentKey()` - 11 edges
4. `roundRect()` - 9 edges
5. `drawTitle()` - 9 edges
6. `getContentSignature()` - 9 edges
7. `ScreenCaptureProtectionModule` - 8 edges
8. `main()` - 7 edges
9. `uploadVideo()` - 7 edges
10. `wrapText()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `EAS Update` --semantically_similar_to--> `EAS Update`  [INFERRED] [semantically similar]
  CUSTOM_INSTRUCTION_EAS.md → EAS_UPDATE_GUIDELINES.md
- `Android MDPI Launcher Icon` --semantically_similar_to--> `App Icon`  [INFERRED] [semantically similar]
  android/app/src/main/res/mipmap-mdpi/ic_launcher.webp → assets/icon.png
- `Android MDPI Launcher Icon` --semantically_similar_to--> `Adaptive App Icon`  [INFERRED] [semantically similar]
  android/app/src/main/res/mipmap-mdpi/ic_launcher.webp → assets/adaptive-icon.png
- `App()` --calls--> `ensureFirebaseApp()`  [INFERRED]
  App.js → scripts/bunny-videos.js
- `parseFirestoreDate()` --calls--> `toDate()`  [INFERRED]
  scripts/bunny-videos.js → src/services/videoService.js

## Hyperedges (group relationships)
- **Firebase Services Usage** — library_update_review_workflow_firestore, privacy_firebase, purposeful_image_placement_firestore [INFERRED 0.80]
- **Android Launcher Icons (Multi-Density)** — ic_launcher_mdpi, ic_launcher_xhdpi, ic_launcher_xxhdpi, ic_launcher_xxxhdpi [INFERRED 0.90]
- **Android Launcher Foreground Icons (Multi-Density)** — ic_launcher_foreground_mdpi, ic_launcher_foreground_xhdpi, ic_launcher_foreground_xxhdpi, ic_launcher_foreground_xxxhdpi [INFERRED 0.90]
- **Android Launcher Round Icons (Multi-Density)** — ic_launcher_round_mdpi, ic_launcher_round_xhdpi, ic_launcher_round_xxhdpi, ic_launcher_round_xxxhdpi [INFERRED 0.90]
- **Stage 7 Indian Public Health Program Illustrations** — stage_7_10_npncd_npncd, stage_7_11_nmhp_nmhp, stage_7_12_idsp_idsp, stage_7_13_pmjay_pmjay, stage_7_2_inap_inap, stage_7_2_laqshya_laqshya, stage_7_2_maa_maa, stage_7_2_pmmvy_pmmvy, stage_7_2_pmsma_pmsma, stage_7_2_rksk_rksk, stage_7_2_suman_suman, stage_7_3_nvbdcp_nvbdcp, stage_7_4_nlep_nlep, stage_7_5_ntep_ntep, stage_7_5_rntcp_dots_rntcp_dots, stage_7_6_naco_naco, stage_7_7_npcbvi_npcbvi [INFERRED 0.90]

## Communities (157 total, 49 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (40): apply_corrections(), _batched(), build_candidate_map(), build_review_markdown(), build_source_context(), build_unified_diff(), call_ollama(), _document_url() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (24): buildTableCellSet(), clamp(), getBlockAnchorText(), isNtruHsHeading(), isNtruHsMetaLine(), normalizeAnchorText(), parseMarkdown(), parseTextTable() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (14): getDefaultDeviceName(), getDeviceId(), getDeviceInfo(), isFirstDeviceLogin(), disableScreenCaptureProtection(), enableScreenCaptureProtection(), ScreenCaptureProtectionModule, styles (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (25): resolveBookmarkContentKey(), applyOverrideToTheory(), buildSections(), cloneDeep(), findItemById(), getContentKey(), getContentSignature(), getCurrentContentEntry() (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (14): getCacheKey(), loadAnnotations(), saveAnnotations(), getCacheKey(), loadHighlights(), saveHighlights(), styles, buildIllustrationDocId() (+6 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (20): buildContactSheet(), buildPngCanvas(), downloadFile(), ensureDir(), isNearWhite(), main(), trimCanvas(), biomedicalWaste() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (6): AppNavigator(), AppNavigator(), navigationRef, Stack, Tab, useSessionEnforcer()

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (17): emitVideoSubscriptionChange(), emitWebinarSubscriptionChange(), ensureNotificationHandler(), getTodayNotificationKey(), isSubscribedToVideoNotifications(), markStreakMilestoneSentToday(), persistVideoNotificationPreference(), requestPermissions() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.15
Nodes (18): apply_proposal(), find_item_by_id(), load_json(), main(), save_json(), select_approved_proposals(), admin, ensureFirebaseApp() (+10 more)

### Community 9 - "Community 9"
Cohesion: 0.24
Nodes (17): buildThumbnailUrl(), bunnyFetch(), discoverPullZoneHostname(), ensureFirebaseApp(), getExpoPushTokens(), main(), markNotified(), parseArgs() (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (18): NHP Logo Staging Contact Sheet, Stage7-10 NP-NCD Illustration, Stage7-11 N-MHP Illustration, Stage7-12 IDSP Illustration, Stage7-13 PM-JAY Illustration, Stage7-2 INAP Illustration, Stage7-2 Laqshya Illustration, Stage7-2 MAA Illustration (+10 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (7): DashboardScreen(), LibraryScreen(), DashboardScreen(), styles, LibraryScreen(), useResponsive(), UpdatesScreen()

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (7): getExcerptAroundMatch(), SearchExcerpt(), excerptStyles, getExcerptAroundMatch(), SearchExcerpt(), SECTION_ID_ICON_MAP, styles

### Community 13 - "Community 13"
Cohesion: 0.17
Nodes (11): 1. Think Before Coding, 2. Simplicity First, 3. Surgical Changes, 4. Goal-Driven Execution, Background Watcher, Graph-First Protocol (graphify), graphify, Guidelines (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (4): getSortValue(), formatPublishedDate(), getTimestamp(), toDate()

### Community 15 - "Community 15"
Cohesion: 0.2
Nodes (9): 1. Coupon Logic Strategy, 2. UI/UX Changes (`PaywallScreen.js`), 3. Native Support, 4. Data Persistence (`AppContext.js`), Decisions & Implementation Detail, Goals, Locked Choices, Next Steps (+1 more)

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (8): find_tables(), process_content(), process_content_v2(), Process content to find and convert tables, Find table structures in content, Process content - rebuild with table conversions, Convert headers and flat list of data cells to markdown table, table_to_markdown()

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (7): call_ollama(), _extract_candidate_text(), _extract_json_payload(), fetch_health_updates(), Fetches real updates from the Government of India PIB feed for MoHFW., Extract text from Ollama /api/chat response shape., _strip_code_fence()

### Community 18 - "Community 18"
Cohesion: 0.42
Nodes (8): buildContactSheet(), clampCrop(), cropRegion(), ensureDir(), getPagePath(), isNearWhite(), main(), trimCanvas()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (6): App(), ensureFirebaseApp(), loadSeed(), main(), parseArgs(), uploadIfNeeded()

### Community 20 - "Community 20"
Cohesion: 0.31
Nodes (4): ssSingleProp(), ssTwoMeans(), ssTwoProps(), zForCI()

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (3): styles, GemsScreen(), styles

### Community 22 - "Community 22"
Cohesion: 0.28
Nodes (5): AppProvider(), normalizeBookmarks(), sanitizeCloudState(), sanitizeReadItemVersions(), getEffectiveReadCount()

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): 1. UI Reveal & Hide, 2. Custom Coupon Validation (Firestore), 3. Dynamic Pricing & UI Updates, 4. RevenueCat Synchronization, 5. Network Resiliency, Phase 1 UAT: Coupon Integration, Summary, Test Scenarios

### Community 25 - "Community 25"
Cohesion: 0.43
Nodes (5): markAsShown(), maybePromptReview(), openStoreReviewPage(), requestNativeReview(), showPrePrompt()

### Community 27 - "Community 27"
Cohesion: 0.53
Nodes (4): _extract_push_token(), fetch_push_tokens(), _get_firestore_access_token(), _load_service_account_info()

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (5): code:json ({), Coupon Firestore Setup, Document Structure, Example Document (`PROMO20`):, Script for Bulk Upload

### Community 31 - "Community 31"
Cohesion: 0.6
Nodes (3): getContrastRatio(), getRelativeLuminance(), hexToRgb()

### Community 33 - "Community 33"
Cohesion: 0.4
Nodes (4): Architecture, Goals, Overview, Project: STROMA (Community Medicine)

### Community 34 - "Community 34"
Cohesion: 0.4
Nodes (4): extract_topic_content(), format_content(), Extract content for a topic from the text, Format content according to rules

### Community 35 - "Community 35"
Cohesion: 0.4
Nodes (4): extract_topic_content(), format_content(), Format content according to rules, Extract content for a topic from the text

### Community 36 - "Community 36"
Cohesion: 0.7
Nodes (4): clean_text(), is_heading(), process_tables(), rebuild_pyq_data()

### Community 37 - "Community 37"
Cohesion: 0.4
Nodes (4): clean_content(), extract_frequency_and_grade(), Clean and format content according to rules, Extract frequency and grade from topic text

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (3): extract_text_from_pdf(), main(), Extracts text from a PDF file.     This is a placeholder function. In a real ap

### Community 42 - "Community 42"
Cohesion: 0.5
Nodes (3): Phase 1: Coupon Integration, Phase 2: Deferred Ideas, Roadmap

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (3): process_section(), Reformat content according to ALL rules, reformat_content()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (3): process_section(), Reformat content according to ALL rules, reformat_content()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (3): fix_content(), process_section(), Fix all formatting issues in content

### Community 46 - "Community 46"
Cohesion: 0.67
Nodes (3): process_section(), Reformat content according to ALL rules, reformat_content()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (3): fix_content(), process_section(), Fix all formatting issues

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (3): process_section(), Reformat text according to rules, reformat_text()

### Community 49 - "Community 49"
Cohesion: 0.5
Nodes (4): Adaptive App Icon, Web Favicon, Android MDPI Launcher Icon, App Icon

### Community 50 - "Community 50"
Cohesion: 0.5
Nodes (4): PYQ Paper 1 Diagram 1, PYQ Paper 2 Diagram 1, PYQ Paper 3 Diagram 1, PYQ Paper 4 Diagram 1

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (3): Firestore, Firebase, Firestore

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (3): Privacy Policy URL, STROMA App, STROMA Privacy Policy

## Knowledge Gaps
- **140 isolated node(s):** `Extract text from Ollama /api/chat response shape.`, `Fetches real updates from the Government of India PIB feed for MoHFW.`, `Extracts text from a PDF file.     This is a placeholder function. In a real ap`, `admin`, `fs` (+135 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **49 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `toDate()` connect `Community 14` to `Community 9`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `parseFirestoreDate()` connect `Community 9` to `Community 14`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `NHP Logo Staging Contact Sheet` (e.g. with `Stage7-10 NP-NCD Illustration` and `Stage7-11 N-MHP Illustration`) actually correct?**
  _`NHP Logo Staging Contact Sheet` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `getContentKey()` (e.g. with `resolveBookmarkContentKey()` and `buildReadingParams()`) actually correct?**
  _`getContentKey()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `roundRect()` (e.g. with `buildContactSheet()` and `buildContactSheet()`) actually correct?**
  _`roundRect()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Extract text from Ollama /api/chat response shape.`, `Fetches real updates from the Government of India PIB feed for MoHFW.`, `Extracts text from a PDF file.     This is a placeholder function. In a real ap` to the rest of the system?**
  _140 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._