# Graph Report - The App  (2026-05-07)

## Corpus Check
- 130 files · ~801,559 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 585 nodes · 641 edges · 88 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

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
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
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
3. `roundRect()` - 9 edges
4. `drawTitle()` - 9 edges
5. `getContentKey()` - 9 edges
6. `ScreenCaptureProtectionModule` - 8 edges
7. `uploadVideo()` - 7 edges
8. `wrapText()` - 7 edges
9. `_normalize_whitespace()` - 7 edges
10. `getContentSignature()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `EAS Update` --semantically_similar_to--> `EAS Update`  [INFERRED] [semantically similar]
  CUSTOM_INSTRUCTION_EAS.md → EAS_UPDATE_GUIDELINES.md
- `Android MDPI Launcher Icon` --semantically_similar_to--> `App Icon`  [INFERRED] [semantically similar]
  android/app/src/main/res/mipmap-mdpi/ic_launcher.webp → assets/icon.png
- `Android MDPI Launcher Icon` --semantically_similar_to--> `Adaptive App Icon`  [INFERRED] [semantically similar]
  android/app/src/main/res/mipmap-mdpi/ic_launcher.webp → assets/adaptive-icon.png
- `App()` --calls--> `ensureFirebaseApp()`  [INFERRED]
  App.js → scripts\bunny-videos.js
- `parseFirestoreDate()` --calls--> `toDate()`  [INFERRED]
  scripts\bunny-videos.js → src\services\videoService.js

## Hyperedges (group relationships)
- **Firebase Services Usage** — library_update_review_workflow_firestore, privacy_firebase, purposeful_image_placement_firestore [INFERRED 0.80]
- **Android Launcher Icons (Multi-Density)** — ic_launcher_mdpi, ic_launcher_xhdpi, ic_launcher_xxhdpi, ic_launcher_xxxhdpi [INFERRED 0.90]
- **Android Launcher Foreground Icons (Multi-Density)** — ic_launcher_foreground_mdpi, ic_launcher_foreground_xhdpi, ic_launcher_foreground_xxhdpi, ic_launcher_foreground_xxxhdpi [INFERRED 0.90]
- **Android Launcher Round Icons (Multi-Density)** — ic_launcher_round_mdpi, ic_launcher_round_xhdpi, ic_launcher_round_xxhdpi, ic_launcher_round_xxxhdpi [INFERRED 0.90]
- **Stage 7 Indian Public Health Program Illustrations** — stage_7_10_npncd_npncd, stage_7_11_nmhp_nmhp, stage_7_12_idsp_idsp, stage_7_13_pmjay_pmjay, stage_7_2_inap_inap, stage_7_2_laqshya_laqshya, stage_7_2_maa_maa, stage_7_2_pmmvy_pmmvy, stage_7_2_pmsma_pmsma, stage_7_2_rksk_rksk, stage_7_2_suman_suman, stage_7_3_nvbdcp_nvbdcp, stage_7_4_nlep_nlep, stage_7_5_ntep_ntep, stage_7_5_rntcp_dots_rntcp_dots, stage_7_6_naco_naco, stage_7_7_npcbvi_npcbvi [INFERRED 0.90]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (40): apply_corrections(), _batched(), build_candidate_map(), build_review_markdown(), build_source_context(), build_unified_diff(), call_ollama(), _document_url() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (23): resolveBookmarkContentKey(), applyOverrideToTheory(), buildSections(), cloneDeep(), findItemById(), getContentKey(), getContentSignature(), getCurrentContentEntry() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (17): emitVideoSubscriptionChange(), emitWebinarSubscriptionChange(), ensureNotificationHandler(), getTodayNotificationKey(), isSubscribedToVideoNotifications(), markStreakMilestoneSentToday(), persistVideoNotificationPreference(), requestPermissions() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.24
Nodes (17): buildThumbnailUrl(), bunnyFetch(), discoverPullZoneHostname(), ensureFirebaseApp(), getExpoPushTokens(), main(), markNotified(), parseArgs() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (9): buildTableCellSet(), clamp(), getBlockAnchorText(), isNtruHsHeading(), isNtruHsMetaLine(), normalizeAnchorText(), parseMarkdown(), resolveAspectRatio() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (18): NHP Logo Staging Contact Sheet, Stage7-10 NP-NCD Illustration, Stage7-11 N-MHP Illustration, Stage7-12 IDSP Illustration, Stage7-13 PM-JAY Illustration, Stage7-2 INAP Illustration, Stage7-2 Laqshya Illustration, Stage7-2 MAA Illustration (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.32
Nodes (13): biomedicalWaste(), chainOfInfection(), coldChain(), disasterCycle(), drawArrow(), drawCard(), drawTitle(), healthFramework() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (3): disableScreenCaptureProtection(), enableScreenCaptureProtection(), ScreenCaptureProtectionModule

### Community 8 - "Community 8"
Cohesion: 0.18
Nodes (6): DashboardScreen(), getExcerptAroundMatch(), LibraryScreen(), SearchExcerpt(), useResponsive(), UpdatesScreen()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (4): getSortValue(), formatPublishedDate(), getTimestamp(), toDate()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): App(), ensureFirebaseApp(), loadSeed(), main(), parseArgs(), uploadIfNeeded()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (7): call_ollama(), _extract_candidate_text(), _extract_json_payload(), fetch_health_updates(), Fetches real updates from the Government of India PIB feed for MoHFW., Extract text from Ollama /api/chat response shape., _strip_code_fence()

### Community 12 - "Community 12"
Cohesion: 0.42
Nodes (8): buildContactSheet(), clampCrop(), cropRegion(), ensureDir(), getPagePath(), isNearWhite(), main(), trimCanvas()

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (5): AppProvider(), normalizeBookmarks(), sanitizeCloudState(), sanitizeReadItemVersions(), getEffectiveReadCount()

### Community 14 - "Community 14"
Cohesion: 0.31
Nodes (4): ssSingleProp(), ssTwoMeans(), ssTwoProps(), zForCI()

### Community 15 - "Community 15"
Cohesion: 0.46
Nodes (7): buildContactSheet(), buildPngCanvas(), downloadFile(), ensureDir(), isNearWhite(), main(), trimCanvas()

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (1): MainApplication

### Community 17 - "Community 17"
Cohesion: 0.52
Nodes (6): apply_proposal(), find_item_by_id(), load_json(), main(), save_json(), select_approved_proposals()

### Community 18 - "Community 18"
Cohesion: 0.43
Nodes (5): markAsShown(), maybePromptReview(), openStoreReviewPage(), requestNativeReview(), showPrePrompt()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (1): MainActivity

### Community 20 - "Community 20"
Cohesion: 0.53
Nodes (4): _extract_push_token(), fetch_push_tokens(), _get_firestore_access_token(), _load_service_account_info()

### Community 21 - "Community 21"
Cohesion: 0.33
Nodes (1): ErrorBoundary

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (2): AppNavigator(), useSessionEnforcer()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (2): playerHtml(), VideosScreen()

### Community 24 - "Community 24"
Cohesion: 0.47
Nodes (3): getCacheKey(), loadAnnotations(), saveAnnotations()

### Community 25 - "Community 25"
Cohesion: 0.47
Nodes (3): getCacheKey(), loadHighlights(), saveHighlights()

### Community 26 - "Community 26"
Cohesion: 0.53
Nodes (4): buildSpeechChunks(), buildSpeechText(), cleanSpeechText(), collectSpeechFragments()

### Community 27 - "Community 27"
Cohesion: 0.4
Nodes (4): extract_topic_content(), format_content(), Extract content for a topic from the text, Format content according to rules

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (4): extract_topic_content(), format_content(), Format content according to rules, Extract content for a topic from the text

### Community 29 - "Community 29"
Cohesion: 0.5
Nodes (4): clean_line(), format_content_block(), Clean a single line - remove page markers, swaDesh, fix bullets, Format a block of text with proper rules

### Community 30 - "Community 30"
Cohesion: 0.4
Nodes (4): clean_content(), extract_frequency_and_grade(), Clean and format content according to rules, Extract frequency and grade from topic text

### Community 31 - "Community 31"
Cohesion: 0.6
Nodes (3): getContrastRatio(), getRelativeLuminance(), hexToRgb()

### Community 33 - "Community 33"
Cohesion: 0.6
Nodes (3): buildIllustrationDocId(), getTopicIllustrations(), mergeIllustrations()

### Community 34 - "Community 34"
Cohesion: 0.7
Nodes (4): getDefaultDeviceName(), getDeviceId(), getDeviceInfo(), isFirstDeviceLogin()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (3): process_section(), Reformat content according to ALL rules, reformat_content()

### Community 36 - "Community 36"
Cohesion: 0.67
Nodes (3): process_section(), Reformat content according to ALL rules, reformat_content()

### Community 37 - "Community 37"
Cohesion: 0.67
Nodes (3): fix_content(), process_section(), Fix all formatting issues in content

### Community 38 - "Community 38"
Cohesion: 0.67
Nodes (3): process_section(), Reformat content according to ALL rules, reformat_content()

### Community 39 - "Community 39"
Cohesion: 0.67
Nodes (3): fix_content(), process_section(), Fix all formatting issues

### Community 40 - "Community 40"
Cohesion: 0.67
Nodes (3): process_section(), Reformat text according to rules, reformat_text()

### Community 41 - "Community 41"
Cohesion: 0.5
Nodes (1): ScreenCaptureProtectionPackage

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): extract_text_from_pdf(), main(), Extracts text from a PDF file.     This is a placeholder function. In a real ap

### Community 43 - "Community 43"
Cohesion: 0.67
Nodes (2): processFile(), walkDir()

### Community 45 - "Community 45"
Cohesion: 0.5
Nodes (4): Adaptive App Icon, Web Favicon, Android MDPI Launcher Icon, App Icon

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (4): PYQ Paper 1 Diagram 1, PYQ Paper 2 Diagram 1, PYQ Paper 3 Diagram 1, PYQ Paper 4 Diagram 1

### Community 48 - "Community 48"
Cohesion: 0.67
Nodes (2): format_content(), Format content according to rules

### Community 49 - "Community 49"
Cohesion: 0.67
Nodes (2): format_content(), Format content according to rules

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (2): format_content(), Format content according to rules

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (2): format_content(), Format content according to rules

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (2): format_content(), Format content according to rules

### Community 53 - "Community 53"
Cohesion: 0.67
Nodes (2): clean_and_format_content(), Clean and format content according to rules

### Community 54 - "Community 54"
Cohesion: 0.67
Nodes (2): format_content(), Format content according to rules

### Community 55 - "Community 55"
Cohesion: 0.67
Nodes (1): main()

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (3): Firestore, Firebase, Firestore

### Community 59 - "Community 59"
Cohesion: 0.67
Nodes (3): Privacy Policy URL, STROMA App, STROMA Privacy Policy

### Community 89 - "Community 89"
Cohesion: 1.0
Nodes (2): EAS Update, EAS Update

### Community 90 - "Community 90"
Cohesion: 1.0
Nodes (2): mockData.json, mockData.json

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): Graph-First Protocol

### Community 127 - "Community 127"
Cohesion: 1.0
Nodes (1): graphify query tool

### Community 128 - "Community 128"
Cohesion: 1.0
Nodes (1): graphify explain tool

### Community 129 - "Community 129"
Cohesion: 1.0
Nodes (1): graphify path tool

### Community 130 - "Community 130"
Cohesion: 1.0
Nodes (1): graphify background watcher

### Community 131 - "Community 131"
Cohesion: 1.0
Nodes (1): God Nodes

### Community 132 - "Community 132"
Cohesion: 1.0
Nodes (1): Channel-Branch Mapping

### Community 133 - "Community 133"
Cohesion: 1.0
Nodes (1): eas channel:list command

### Community 134 - "Community 134"
Cohesion: 1.0
Nodes (1): eas update command

### Community 135 - "Community 135"
Cohesion: 1.0
Nodes (1): Channel Configuration

### Community 136 - "Community 136"
Cohesion: 1.0
Nodes (1): Production Channel

### Community 137 - "Community 137"
Cohesion: 1.0
Nodes (1): verify_mock_data.py script

### Community 138 - "Community 138"
Cohesion: 1.0
Nodes (1): Ollama Chat API

### Community 139 - "Community 139"
Cohesion: 1.0
Nodes (1): libraryReviewSuggestions collection

### Community 140 - "Community 140"
Cohesion: 1.0
Nodes (1): AI Tutor Feature

### Community 141 - "Community 141"
Cohesion: 1.0
Nodes (1): Bottlegram Health

### Community 142 - "Community 142"
Cohesion: 1.0
Nodes (1): RevenueCat

### Community 143 - "Community 143"
Cohesion: 1.0
Nodes (1): topicIllustrations collection

### Community 144 - "Community 144"
Cohesion: 1.0
Nodes (1): Android MDPI Launcher Foreground Icon

### Community 145 - "Community 145"
Cohesion: 1.0
Nodes (1): Android MDPI Launcher Round Icon

### Community 146 - "Community 146"
Cohesion: 1.0
Nodes (1): Android XHDPI Launcher Icon

### Community 147 - "Community 147"
Cohesion: 1.0
Nodes (1): Android XHDPI Launcher Foreground Icon

### Community 148 - "Community 148"
Cohesion: 1.0
Nodes (1): Android XHDPI Launcher Round Icon

### Community 149 - "Community 149"
Cohesion: 1.0
Nodes (1): Android XXHDPI Launcher Icon

### Community 150 - "Community 150"
Cohesion: 1.0
Nodes (1): Android XXHDPI Launcher Foreground Icon

### Community 151 - "Community 151"
Cohesion: 1.0
Nodes (1): Android XXHDPI Launcher Round Icon

### Community 152 - "Community 152"
Cohesion: 1.0
Nodes (1): Android XXXHDPI Launcher Icon

### Community 153 - "Community 153"
Cohesion: 1.0
Nodes (1): Android XXXHDPI Launcher Foreground Icon

### Community 154 - "Community 154"
Cohesion: 1.0
Nodes (1): Android XXXHDPI Launcher Round Icon

### Community 155 - "Community 155"
Cohesion: 1.0
Nodes (1): Notification Icon

### Community 156 - "Community 156"
Cohesion: 1.0
Nodes (1): Splash Screen Image

## Knowledge Gaps
- **84 isolated node(s):** `Reformat content according to ALL rules`, `Reformat content according to ALL rules`, `Fix all formatting issues in content`, `Reformat content according to ALL rules`, `Fix all formatting issues` (+79 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 16`** (7 nodes): `MainApplication.kt`, `getJSMainModuleName()`, `getPackages()`, `getUseDeveloperSupport()`, `MainApplication`, `.onConfigurationChanged()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (6 nodes): `MainActivity.kt`, `MainActivity`, `.createReactActivityDelegate()`, `.getMainComponentName()`, `.invokeDefaultOnBackPressed()`, `.onCreate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (6 nodes): `ErrorBoundary`, `.componentDidCatch()`, `.constructor()`, `.getDerivedStateFromError()`, `.render()`, `ErrorBoundary.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (6 nodes): `AppNavigator()`, `PremiumGuard()`, `TabNavigator()`, `useSessionEnforcer.js`, `AppNavigator.js`, `useSessionEnforcer()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (6 nodes): `VideosScreen.js`, `EmptyState()`, `formatCategoryLabel()`, `getThumbnailSource()`, `playerHtml()`, `VideosScreen()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (4 nodes): `ScreenCaptureProtectionPackage.java`, `ScreenCaptureProtectionPackage`, `.createNativeModules()`, `.createViewManagers()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (4 nodes): `normalizeHex()`, `processFile()`, `walkDir()`, `refactor_colors.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `format_content()`, `rebuild_clean.py`, `Format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (3 nodes): `format_content()`, `rebuild_final.py`, `Format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `format_content()`, `rebuild_fixed.py`, `Format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `format_content()`, `rebuild_pyq_v3.py`, `Format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `format_content()`, `rebuild_pyq_v4.py`, `Format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (3 nodes): `clean_and_format_content()`, `rebuild_pyq_v5.py`, `Clean and format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (3 nodes): `format_content()`, `rebuild_v6.py`, `Format content according to rules`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (3 nodes): `upload-biostat-images.js`, `upload-biostat-images.py`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 89`** (2 nodes): `EAS Update`, `EAS Update`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 90`** (2 nodes): `mockData.json`, `mockData.json`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (1 nodes): `Graph-First Protocol`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 127`** (1 nodes): `graphify query tool`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 128`** (1 nodes): `graphify explain tool`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 129`** (1 nodes): `graphify path tool`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 130`** (1 nodes): `graphify background watcher`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 131`** (1 nodes): `God Nodes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 132`** (1 nodes): `Channel-Branch Mapping`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 133`** (1 nodes): `eas channel:list command`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 134`** (1 nodes): `eas update command`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 135`** (1 nodes): `Channel Configuration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 136`** (1 nodes): `Production Channel`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 137`** (1 nodes): `verify_mock_data.py script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 138`** (1 nodes): `Ollama Chat API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 139`** (1 nodes): `libraryReviewSuggestions collection`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 140`** (1 nodes): `AI Tutor Feature`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 141`** (1 nodes): `Bottlegram Health`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 142`** (1 nodes): `RevenueCat`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 143`** (1 nodes): `topicIllustrations collection`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 144`** (1 nodes): `Android MDPI Launcher Foreground Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 145`** (1 nodes): `Android MDPI Launcher Round Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 146`** (1 nodes): `Android XHDPI Launcher Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 147`** (1 nodes): `Android XHDPI Launcher Foreground Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 148`** (1 nodes): `Android XHDPI Launcher Round Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 149`** (1 nodes): `Android XXHDPI Launcher Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 150`** (1 nodes): `Android XXHDPI Launcher Foreground Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 151`** (1 nodes): `Android XXHDPI Launcher Round Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 152`** (1 nodes): `Android XXXHDPI Launcher Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 153`** (1 nodes): `Android XXXHDPI Launcher Foreground Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 154`** (1 nodes): `Android XXXHDPI Launcher Round Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 155`** (1 nodes): `Notification Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 156`** (1 nodes): `Splash Screen Image`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `buildReadingParams()` connect `Community 1` to `Community 8`?**
  _High betweenness centrality (0.003) - this node is a cross-community bridge._
- **Why does `roundRect()` connect `Community 6` to `Community 12`, `Community 15`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `NHP Logo Staging Contact Sheet` (e.g. with `Stage7-10 NP-NCD Illustration` and `Stage7-11 N-MHP Illustration`) actually correct?**
  _`NHP Logo Staging Contact Sheet` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `roundRect()` (e.g. with `buildContactSheet()` and `buildContactSheet()`) actually correct?**
  _`roundRect()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `getContentKey()` (e.g. with `resolveBookmarkContentKey()` and `buildReadingParams()`) actually correct?**
  _`getContentKey()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Reformat content according to ALL rules`, `Reformat content according to ALL rules`, `Fix all formatting issues in content` to the rest of the system?**
  _84 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._