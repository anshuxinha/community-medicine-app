import React, { useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import {
  Text,
  List,
  Divider,
  Searchbar,
  SegmentedButtons,
  Badge,
  Menu,
} from "react-native-paper";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { AppContext } from "../context/AppContext";
import {
  CONTENT_SECTIONS,
  getContentKey,
  getContentSignature,
  getItemStatus,
  getLeafContentRefsForItem,
  getUpdatedSegmentsForItem,
} from "../utils/contentRegistry";
import { theme, useResponsive } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import {
  NMC_PAPERS,
  getPrimaryPaperForChapterId,
  getPaperMeta,
} from "../data/nmcCurriculum";
import { isResidentModeEnabled } from "../utils/residentMode";

const SECTION_ID_ICON_MAP = {
  "theory:27": "clipboard-text-search-outline",
  "practical:2": "home-heart",
  "practical:3": "clipboard-text-search-outline",
  "practical:4": "map-marker-path",
  "practical:5": "calculator",
};

const StatusMark = ({ status }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  if (status === "updated") {
    return <Badge style={styles.newBadge}>NEW</Badge>;
  }

  if (status === "read") {
    return (
      <View style={styles.readTickWrap}>
        <MaterialCommunityIcons
          name="check-bold"
          size={13}
          color={colors.onPrimary}
        />
      </View>
    );
  }

  return (
    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.borderStrong} />
  );
};

const FreeLabel = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  return <Badge style={styles.freeBadge}>FREE</Badge>;
};

const buildReadingParams = (item, section, status, searchTerms = "") => ({
  id: item.id,
  title: item.title,
  content: item.content || "# No Content\n\nThis topic has no content yet.",
  quizzes: item.quizzes,
  section,
  contentKey: getContentKey(section, item.id),
  contentSignature: getContentSignature(item),
  updatedSegments: getUpdatedSegmentsForItem(item),
  showUpdateHighlights: status === "updated",
  searchTerms,
});

// ── Search excerpt: finds keyword context in body content ──────────────────
const EXCERPT_CONTEXT = 55; // chars of context before/after match
// Use theme secondary; fallback for static excerpt styles module-level
const SEARCH_PURPLE = "#A855F7";

const getExcerptAroundMatch = (text, query) => {
  if (!text || !query) return null;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);
  if (idx === -1) return null;

  const start = Math.max(0, idx - EXCERPT_CONTEXT);
  const end = Math.min(text.length, idx + query.length + EXCERPT_CONTEXT);
  const prefix = (start > 0 ? "\u2026" : "") + text.slice(start, idx);
  const match = text.slice(idx, idx + query.length);
  const suffix =
    text.slice(idx + query.length, end) + (end < text.length ? "\u2026" : "");
  return { prefix, match, suffix };
};

const findFirstMatchingItemOrSub = (item, query) => {
  if (!item || !query) return null;
  const normalizedQuery = query.toLowerCase();
  if (
    (item.title && item.title.toLowerCase().includes(normalizedQuery)) ||
    (item.content && item.content.toLowerCase().includes(normalizedQuery))
  ) {
    return item;
  }
  if (Array.isArray(item.subsections) && item.subsections.length > 0) {
    for (const sub of item.subsections) {
      const matched = findFirstMatchingItemOrSub(sub, query);
      if (matched) return matched;
    }
  }
  return null;
};

const SearchExcerpt = ({ item, searchQuery }) => {
  const { colors } = useThemedStyles(createStyles);
  const excerptStyles = getExcerptStyles(colors);
  if (!searchQuery) return null;
  const matchItem = findFirstMatchingItemOrSub(item, searchQuery);
  if (!matchItem) return null;

  const bodyText = matchItem.content || "";
  const bodyMatch = bodyText.toLowerCase().includes(searchQuery.toLowerCase());
  if (!bodyMatch) {
    if (matchItem !== item) {
      return (
        <Text style={excerptStyles.container} numberOfLines={2}>
          <Text style={excerptStyles.plain}>Matches subtopic: </Text>
          <Text style={excerptStyles.match}>{matchItem.title}</Text>
        </Text>
      );
    }
    return null;
  }

  const excerpt = getExcerptAroundMatch(bodyText, searchQuery);
  if (!excerpt) return null;

  return (
    <Text style={excerptStyles.container} numberOfLines={2}>
      {matchItem !== item && (
        <Text style={{ ...excerptStyles.plain, fontStyle: "italic" }}>
          In {matchItem.title}:{" "}
        </Text>
      )}
      <Text style={excerptStyles.plain}>{excerpt.prefix}</Text>
      <Text style={excerptStyles.match}>{excerpt.match}</Text>
      <Text style={excerptStyles.plain}>{excerpt.suffix}</Text>
    </Text>
  );
};

const getExcerptStyles = (colors) => ({
  container: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textTertiary,
    marginTop: 2,
  },
  plain: { color: colors.textTertiary },
  match: { color: colors.secondary, fontWeight: "700" },
});

const LibraryScreen = (props) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { navigation } = props;
  const route = useRoute();
  const {
    readItemVersions,
    markAsUnread,
    isPremium,
    isScreenCapturePrevented,
    contentRegistryVersion,
    user,
    setResidentMode,
  } = useContext(AppContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("theory");
  const residentMode = isResidentModeEnabled(user);
  const [residentModeSaving, setResidentModeSaving] = useState(false);
  const initialPaper =
    route?.params?.paperFilter ||
    (user?.preferredPaperFocus && user.preferredPaperFocus !== "all"
      ? String(user.preferredPaperFocus)
      : "all");
  const [paperFilter, setPaperFilter] = useState(String(initialPaper));
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const insets = useSafeAreaInsets();
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  useEffect(() => {
    if (!residentMode) return;
    if (route?.params?.paperFilter != null) {
      setPaperFilter(String(route.params.paperFilter));
      setActiveSection("theory");
    }
  }, [route?.params?.paperFilter, residentMode]);

  const handleResidentModeToggle = async (value) => {
    if (residentModeSaving || !setResidentMode) return;
    setResidentModeSaving(true);
    try {
      await setResidentMode(value);
      if (!value) {
        setPaperFilter("all");
      }
    } catch (err) {
      console.warn("Resident mode toggle failed:", err?.message);
    } finally {
      setResidentModeSaving(false);
    }
  };

  const currentTopics = useMemo(
    () =>
      activeSection === "theory"
        ? CONTENT_SECTIONS.theory
        : CONTENT_SECTIONS.practical,
    [activeSection, contentRegistryVersion],
  );

  const filteredTopics = useMemo(() => {
    let topics = currentTopics;
    if (
      residentMode &&
      activeSection === "theory" &&
      paperFilter !== "all"
    ) {
      const paperId = Number(paperFilter);
      topics = topics.filter(
        (topic) => getPrimaryPaperForChapterId(topic.id) === paperId,
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      topics = topics.filter(
        (topic) => findFirstMatchingItemOrSub(topic, q) !== null,
      );
    }
    return topics;
  }, [currentTopics, activeSection, paperFilter, searchQuery, residentMode]);

  /** FlatList data: chapters or paper group headers when Theory + All + resident mode */
  const listData = useMemo(() => {
    if (
      !residentMode ||
      activeSection !== "theory" ||
      paperFilter !== "all" ||
      searchQuery.trim()
    ) {
      return filteredTopics.map((item) => ({ type: "chapter", item }));
    }

    const rows = [];
    NMC_PAPERS.forEach((paper) => {
      const chapters = filteredTopics.filter(
        (topic) => getPrimaryPaperForChapterId(topic.id) === paper.id,
      );
      if (chapters.length === 0) return;
      rows.push({
        type: "header",
        paperId: paper.id,
        title: paper.title,
        domains: paper.domains,
      });
      chapters.forEach((item) => rows.push({ type: "chapter", item }));
    });
    return rows;
  }, [residentMode, activeSection, paperFilter, searchQuery, filteredTopics]);

  const getMenuKey = (item) => `${activeSection}:${item.id}`;

  const closeMenu = () => setOpenMenuKey(null);

  const openItem = useCallback(
    (item, itemStatus) => {
      const isFree = item.id === "1" || item.title === "Man and Medicine";

      if (item.subsections) {
        const subTopicsParams = {
          title: item.title,
          items: item.subsections,
          section: activeSection,
        };

        if (isFree) {
          navigation.navigate("SubTopics", subTopicsParams);
        } else {
          navigation.navigate("PremiumGuard", {
            destination: "SubTopics",
            subTopicsParams,
          });
        }
        return;
      }

      const readingParams = buildReadingParams(
        item,
        activeSection,
        itemStatus,
        searchQuery.trim(),
      );
      if (isFree) {
        navigation.navigate("Reading", readingParams);
      } else {
        navigation.navigate("PremiumGuard", {
          destination: "Reading",
          readingParams,
        });
      }
    },
    [activeSection, navigation, searchQuery],
  );

  const handleMarkUnread = (item) => {
    markAsUnread(getLeafContentRefsForItem(item, activeSection));
    closeMenu();
  };

  const getIconForTopic = (section, id, title) => {
    const idMapped = SECTION_ID_ICON_MAP[`${section}:${id}`];
    if (idMapped) return idMapped;

    const loweredTitle = title.toLowerCase();
    if (loweredTitle.includes("concept of health")) return "leaf";
    if (loweredTitle.includes("epidemiology")) return "chart-line-variant";
    if (loweredTitle.includes("screening")) return "magnify-scan";
    if (loweredTitle.includes("respiratory")) return "lungs";
    if (loweredTitle.includes("intestinal")) return "stomach";
    if (
      loweredTitle.includes("arthropod") ||
      loweredTitle.includes("entomology") ||
      loweredTitle.includes("insecticide")
    )
      return "bug-outline";
    if (loweredTitle.includes("zoonoses")) return "paw";
    if (loweredTitle.includes("demography")) return "account-group-outline";
    if (loweredTitle.includes("environment")) return "tree-outline";
    if (loweredTitle.includes("nutrition")) return "food-apple-outline";
    if (loweredTitle.includes("social")) return "handshake-outline";
    if (loweredTitle.includes("occupational")) return "briefcase-outline";
    if (loweredTitle.includes("genetics")) return "dna";
    if (loweredTitle.includes("mental")) return "brain";
    if (
      loweredTitle.includes("health information") ||
      loweredTitle.includes("statistics")
    )
      return "chart-bar";
    if (
      loweredTitle.includes("communication") ||
      loweredTitle.includes("pedagogy")
    )
      return "bullhorn-outline";
    if (loweredTitle.includes("planning")) return "clipboard-list-outline";
    if (
      loweredTitle.includes("international") ||
      loweredTitle.includes("sustainable development")
    )
      return "earth";
    if (loweredTitle.includes("biostatistics")) return "chart-bar";
    if (
      loweredTitle.includes("health program") ||
      loweredTitle.includes("programmes") ||
      loweredTitle.includes("programme") ||
      loweredTitle.includes("mission")
    )
      return "flag-outline";
    if (
      loweredTitle.includes("ayushman") ||
      loweredTitle.includes("health care delivery") ||
      loweredTitle.includes("delivery system")
    )
      return "shield-cross";
    if (loweredTitle.includes("specialized target")) return "target";
    if (
      loweredTitle.includes("targeted care") ||
      loweredTitle.includes("present health status")
    )
      return "heart-pulse";
    if (
      loweredTitle.includes("administration") ||
      loweredTitle.includes("organization") ||
      loweredTitle.includes("community")
    )
      return "hospital-building";
    if (
      loweredTitle.includes("man and medicine") ||
      loweredTitle.includes("history")
    )
      return "history";
    if (
      loweredTitle.includes("obstetrics") ||
      loweredTitle.includes("paediatrics") ||
      loweredTitle.includes("geriatrics") ||
      loweredTitle.includes("maternity") ||
      loweredTitle.includes("child health")
    )
      return "human-male-female-child";
    if (loweredTitle.includes("tribal")) return "tent";
    if (
      loweredTitle.includes("waste management") ||
      loweredTitle.includes("sanitation")
    )
      return "trash-can-outline";
    if (loweredTitle.includes("disaster")) return "alert-octagon-outline";
    if (
      loweredTitle.includes("essential medicines") ||
      loweredTitle.includes("counterfeit")
    )
      return "pill";
    if (loweredTitle.includes("management")) return "briefcase-check-outline";
    if (loweredTitle.includes("family") || loweredTitle.includes("rmncah"))
      return "home-heart";
    if (loweredTitle.includes("economics")) return "currency-inr";
    if (
      loweredTitle.includes("non-communicable") ||
      loweredTitle.includes("non communicable") ||
      loweredTitle.includes("ncd")
    )
      return "heart-broken";
    if (loweredTitle.includes("communicable")) return "virus-outline";
    if (
      loweredTitle.includes("immunization") ||
      loweredTitle.includes("vaccin")
    )
      return "needle";
    if (loweredTitle.includes("disinfection")) return "spray-bottle";
    if (loweredTitle.includes("water")) return "water-outline";
    if (
      loweredTitle.includes("bacteriology") ||
      loweredTitle.includes("staining") ||
      loweredTitle.includes("microscopy")
    )
      return "microscope";
    if (loweredTitle.includes("ayush")) return "leaf";
    if (loweredTitle.includes("adolescent")) return "human-child";
    if (
      loweredTitle.includes("idsp") ||
      loweredTitle.includes("surveillance") ||
      loweredTitle.includes("ncvbdc")
    )
      return "radar";
    if (loweredTitle.includes("imnci") || loweredTitle.includes("neonatal"))
      return "baby-bottle-outline";
    if (loweredTitle.includes("rehabilitation"))
      return "wheelchair-accessibility";
    if (
      loweredTitle.includes("swine flu") ||
      loweredTitle.includes("influenza")
    )
      return "pig";
    if (
      loweredTitle.includes("aids") ||
      loweredTitle.includes("std") ||
      loweredTitle.includes("nacp")
    )
      return "ribbon";
    if (loweredTitle.includes("leprosy") || loweredTitle.includes("nlep"))
      return "human-handsup";
    if (loweredTitle.includes("tuberculosis") || loweredTitle.includes("ntep"))
      return "lungs";
    if (loweredTitle.includes("blindness") || loweredTitle.includes("npcbvi"))
      return "eye-off-outline";
    if (loweredTitle.includes("mental health") || loweredTitle.includes("nmhp"))
      return "brain";
    if (loweredTitle.includes("exercises") || loweredTitle.includes("problems"))
      return "clipboard-text-outline";
    if (loweredTitle.includes("field visits"))
      return "map-marker-radius-outline";
    if (
      loweredTitle.includes("appendix") ||
      loweredTitle.includes("legislation") ||
      loweredTitle.includes("days")
    )
      return "scale-balance";
    return "book-open-outline";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {isScreenCapturePrevented && (
        <View style={styles.captureProtectedOverlay}>
          <Text style={styles.captureProtectedText}>
            Screen recording is not allowed
          </Text>
        </View>
      )}
      <View
        style={[
          styles.container,
          isTablet && { paddingHorizontal: horizontalPadding },
        ]}
      >
        <View style={styles.searchBarContainer}>
          <Searchbar
            placeholder="Search topics..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchBarInput}
            iconColor={colors.textPlaceholder}
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>

        {searchQuery.length === 0 && <Text style={styles.header}>Library</Text>}

        <View style={styles.segmentedButtonsContainer}>
          <SegmentedButtons
            value={activeSection}
            onValueChange={(value) => {
              setActiveSection(value);
              if (value === "practical") setPaperFilter("all");
            }}
            buttons={[
              {
                value: "theory",
                label: "Theory",
                icon: "book-open-page-variant",
              },
              {
                value: "practical",
                label: "Practical",
                icon: "stethoscope",
              },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <View
          style={styles.residentModeRow}
          accessibilityRole="switch"
          accessibilityState={{ checked: residentMode }}
          accessibilityLabel="Resident Mode"
        >
          <View style={styles.residentModeTextCol}>
            <Text style={styles.residentModeTitle}>Resident Mode</Text>
            <Text style={styles.residentModeHint}>
              NMC paper layout for MD exams
            </Text>
          </View>
          <Switch
            value={residentMode}
            onValueChange={handleResidentModeToggle}
            disabled={residentModeSaving || !user?.uid}
            trackColor={{
              false: colors.borderStrong,
              true: colors.primaryMuted || colors.primaryLight,
            }}
            thumbColor={residentMode ? colors.secondary : colors.surfacePrimary}
            ios_backgroundColor={colors.borderStrong}
          />
        </View>

        {activeSection === "theory" && residentMode ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paperChipRow}
            style={styles.paperChipScroll}
          >
            {[
              { id: "all", label: "All" },
              ...NMC_PAPERS.map((p) => ({
                id: String(p.id),
                label: `Paper ${p.roman}`,
              })),
            ].map((chip) => {
              const selected = paperFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[
                    styles.paperChip,
                    selected && {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.secondary,
                    },
                  ]}
                  onPress={() => setPaperFilter(chip.id)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.paperChipText,
                      selected && { color: colors.primary, fontWeight: "700" },
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <FlatList
          data={listData}
          keyExtractor={(row, index) =>
            row.type === "header"
              ? `header-${row.paperId}`
              : `chapter-${row.item.id}-${index}`
          }
          style={styles.list}
          renderItem={({ item: row }) => {
            if (row.type === "header") {
              return (
                <View style={styles.paperHeaderBlock}>
                  <Text style={styles.paperHeaderTitle}>{row.title}</Text>
                  <Text style={styles.paperHeaderDomains} numberOfLines={2}>
                    {row.domains}
                  </Text>
                </View>
              );
            }

            const item = row.item;
            const itemStatus = getItemStatus(
              item,
              activeSection,
              readItemVersions,
            );
            const iconName = getIconForTopic(
              activeSection,
              item.id,
              item.title,
            );
            const menuKey = getMenuKey(item);
            const primaryPaper =
              residentMode && activeSection === "theory"
                ? getPrimaryPaperForChapterId(item.id)
                : null;
            const paperMeta = primaryPaper ? getPaperMeta(primaryPaper) : null;
            return (
              <List.Item
                title={item.title}
                titleNumberOfLines={3}
                titleStyle={styles.listItemTitle}
                style={styles.listItem}
                onPress={() => openItem(item, itemStatus)}
                description={() => {
                  if (searchQuery.trim().length > 0) {
                    return (
                      <SearchExcerpt
                        item={item}
                        searchQuery={searchQuery.trim()}
                      />
                    );
                  }
                  if (item.id === "1" && !isPremium) {
                    return (
                      <Text style={styles.freeDescText}>
                        Free for all users
                      </Text>
                    );
                  }
                  return null;
                }}
                left={(leftProps) => (
                  <List.Icon
                    {...leftProps}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={iconName}
                        size={24}
                        color={colors.textTertiary}
                      />
                    )}
                  />
                )}
                right={() => (
                  <Menu
                    visible={openMenuKey === menuKey}
                    onDismiss={closeMenu}
                    anchor={
                      <TouchableOpacity
                        style={styles.rightSlot}
                        activeOpacity={0.7}
                        onPress={() => setOpenMenuKey(menuKey)}
                      >
                        {item.id === "1" && !isPremium && <FreeLabel />}
                        {paperMeta ? (
                          <View style={styles.paperPill}>
                            <Text style={styles.paperPillText}>
                              P{paperMeta.roman}
                            </Text>
                          </View>
                        ) : null}
                        <StatusMark status={itemStatus} />
                      </TouchableOpacity>
                    }
                  >
                    <Menu.Item
                      title={
                        itemStatus === "updated"
                          ? "Open updated topic"
                          : "Open topic"
                      }
                      onPress={() => {
                        closeMenu();
                        openItem(item, itemStatus);
                      }}
                    />
                    {itemStatus === "read" ? (
                      <Menu.Item
                        title="Mark as unread"
                        onPress={() => handleMarkUnread(item)}
                      />
                    ) : null}
                  </Menu>
                )}
              />
            );
          }}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={[
            styles.listContent,
            isTablet && { maxWidth: contentMaxWidth, alignSelf: "center" },
            { paddingBottom: insets.bottom + 88 },
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  captureProtectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundMain,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  captureProtectedText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchBar: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    elevation: 0,
    height: 48,
    marginBottom: 0,
  },
  searchBarInput: {
    fontSize: 16,
    color: colors.textTitle,
    minHeight: 48,
    alignSelf: "center",
  },
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textTitle,
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
  },
  segmentedButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  residentModeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfacePrimary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  residentModeTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  residentModeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textTitle,
  },
  residentModeHint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  paperChipScroll: {
    maxHeight: 44,
    marginBottom: 8,
  },
  paperChipRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  paperChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surfacePrimary,
  },
  paperChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  paperHeaderBlock: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: colors.backgroundMain,
  },
  paperHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
  },
  paperHeaderDomains: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
    lineHeight: 15,
  },
  paperPill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  paperPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  listItem: {
    paddingVertical: 8,
    backgroundColor: colors.backgroundMain,
  },
  listItemTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textTitle,
    fontWeight: "500",
    paddingRight: 12,
  },
  freeDescText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
    marginTop: 2,
  },
  rightSlot: {
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    alignSelf: "center",
    marginRight: 8,
    paddingVertical: 6,
  },
  readTickWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.secondary,
    borderWidth: 0,
    overflow: "visible",
  },
  newBadge: {
    backgroundColor: colors.secondary,
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "900",
  },
  freeBadge: {
    backgroundColor: colors.success,
    color: colors.surfacePrimary,
    fontWeight: "700",
    marginRight: 6,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginLeft: 64,
  },
});

export default LibraryScreen;
