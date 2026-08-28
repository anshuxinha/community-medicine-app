import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
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
  buildLibraryReadingParams,
  getItemStatus,
  getLeafContentRefsForItem,
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
import {
  isFreeLibraryItem,
  navigateToLibraryContent,
} from "../utils/libraryNavigation";

const topicIconCache = new Map();

const SECTION_ID_ICON_MAP = {
  "theory:28": "microscope",
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

const libraryKeyExtractor = (row, index) =>
  row.type === "header"
    ? `header-${row.paperId}`
    : `chapter-${row.item.id}-${index}`;

const LibrarySeparator = memo(function LibrarySeparator() {
  const { styles } = useThemedStyles(createStyles);
  return <Divider style={styles.divider} />;
});

const PaperHeaderRow = memo(function PaperHeaderRow({ title, domains }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.paperHeaderBlock}>
      <Text style={styles.paperHeaderTitle}>{title}</Text>
      <Text style={styles.paperHeaderDomains} numberOfLines={2}>
        {domains}
      </Text>
    </View>
  );
});

const ChapterRow = memo(function ChapterRow({
  item,
  itemStatus,
  iconName,
  menuOpen,
  menuKey,
  paperMeta,
  isPremium,
  onOpen,
  onOpenMenu,
  onCloseMenu,
  onMarkUnread,
}) {
  const { styles, colors } = useThemedStyles(createStyles);
  return (
    <List.Item
      title={item.title}
      titleNumberOfLines={3}
      titleStyle={styles.listItemTitle}
      style={styles.listItem}
      onPress={() => onOpen(item, itemStatus)}
      description={() => {
        if (item.id === "1" && !isPremium) {
          return (
            <Text style={styles.freeDescText}>Free for all users</Text>
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
          visible={menuOpen}
          onDismiss={onCloseMenu}
          anchor={
            <TouchableOpacity
              style={styles.rightSlot}
              activeOpacity={0.7}
              onPress={() => onOpenMenu(menuKey)}
            >
              {item.id === "1" && !isPremium && <FreeLabel />}
              {paperMeta ? (
                <View style={styles.paperPill}>
                  <Text style={styles.paperPillText}>P{paperMeta.roman}</Text>
                </View>
              ) : null}
              <StatusMark status={itemStatus} />
            </TouchableOpacity>
          }
        >
          <Menu.Item
            title={
              itemStatus === "updated" ? "Open updated topic" : "Open topic"
            }
            onPress={() => {
              onCloseMenu();
              onOpen(item, itemStatus);
            }}
          />
          {itemStatus === "read" ? (
            <Menu.Item
              title="Mark as unread"
              onPress={() => onMarkUnread(item)}
            />
          ) : null}
        </Menu>
      )}
    />
  );
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
    return topics;
  }, [currentTopics, activeSection, paperFilter, residentMode]);

  /** FlatList data: chapters or paper group headers when Theory + All + resident mode */
  const listData = useMemo(() => {
    if (
      !residentMode ||
      activeSection !== "theory" ||
      paperFilter !== "all"
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
  }, [residentMode, activeSection, paperFilter, filteredTopics]);

  const getMenuKey = (item) => `${activeSection}:${item.id}`;

  const closeMenu = useCallback(() => setOpenMenuKey(null), []);

  const openItem = useCallback(
    (item, itemStatus) => {
      const isFree = isFreeLibraryItem(item);

      if (item.subsections) {
        navigateToLibraryContent(navigation, {
          isPremium,
          isFree,
          destination: "SubTopics",
          params: {
            title: item.title,
            section: activeSection,
            parentId: item.id,
          },
        });
        return;
      }

      navigateToLibraryContent(navigation, {
        isPremium,
        isFree,
        destination: "Reading",
        params: buildLibraryReadingParams(item, activeSection, {
          status: itemStatus,
        }),
      });
    },
    [activeSection, isPremium, navigation],
  );

  const handleMarkUnread = useCallback(
    (item) => {
      markAsUnread(getLeafContentRefsForItem(item, activeSection));
      closeMenu();
    },
    [activeSection, closeMenu, markAsUnread],
  );

  const getIconForTopic = (section, id, title) => {
    const cacheKey = `${section}:${id}:${title || ""}`;
    const cached = topicIconCache.get(cacheKey);
    if (cached) return cached;
    const icon = (() => {
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
    if (loweredTitle.includes("research methodology")) return "microscope";
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
    })();
    topicIconCache.set(cacheKey, icon);
    return icon;
  };

  const renderLibraryRow = useCallback(
    ({ item: row }) => {
      if (row.type === "header") {
        return (
          <PaperHeaderRow title={row.title} domains={row.domains} />
        );
      }

      const item = row.item;
      const itemStatus = getItemStatus(
        item,
        activeSection,
        readItemVersions,
      );
      const menuKey = getMenuKey(item);
      const primaryPaper =
        residentMode && activeSection === "theory"
          ? getPrimaryPaperForChapterId(item.id)
          : null;
      const paperMeta = primaryPaper ? getPaperMeta(primaryPaper) : null;
      return (
        <ChapterRow
          item={item}
          itemStatus={itemStatus}
          iconName={getIconForTopic(activeSection, item.id, item.title)}
          menuOpen={openMenuKey === menuKey}
          menuKey={menuKey}
          paperMeta={paperMeta}
          isPremium={isPremium}
          onOpen={openItem}
          onOpenMenu={setOpenMenuKey}
          onCloseMenu={closeMenu}
          onMarkUnread={handleMarkUnread}
        />
      );
    },
    [
      activeSection,
      closeMenu,
      handleMarkUnread,
      isPremium,
      openItem,
      openMenuKey,
      readItemVersions,
      residentMode,
    ],
  );

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
        <Text style={styles.header}>Library</Text>

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
              NMC curriculum for MD exams
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
          keyExtractor={libraryKeyExtractor}
          style={styles.list}
          renderItem={renderLibraryRow}
          extraData={`${openMenuKey || ""}:${activeSection}`}
          initialNumToRender={12}
          maxToRenderPerBatch={8}
          windowSize={8}
          removeClippedSubviews
          ItemSeparatorComponent={LibrarySeparator}
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
  header: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textTitle,
    paddingHorizontal: 16,
    paddingTop: 16,
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
