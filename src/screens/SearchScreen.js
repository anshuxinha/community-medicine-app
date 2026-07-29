import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Badge,
  Chip,
  Searchbar,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { AppContext } from "../context/AppContext";
import {
  getContentSignature,
  getItemStatus,
  getUpdatedSegmentsForItem,
} from "../utils/contentRegistry";
import {
  buildGemsIndex,
  buildLibraryIndex,
  buildMuseumIndex,
  buildVideosIndex,
  getExcerptAroundMatch,
  getSnippetSource,
  searchAll,
  SEARCH_TYPES,
  typesWithResults,
} from "../utils/globalSearch";
import { subscribeToVideos } from "../services/videoService";
import gemsData from "../data/gemsData.json";
import { MUSEUM_ITEMS } from "../data/museumData";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";

const RECENT_SEARCHES_KEY = "globalSearchRecent:v1";
const MAX_RECENT = 8;
const DEBOUNCE_MS = 280;

const TYPE_ICON = {
  library: { lib: "MaterialIcons", name: "menu-book" },
  gems: { lib: "MaterialCommunityIcons", name: "diamond-stone" },
  museum: { lib: "MaterialIcons", name: "museum" },
  videos: { lib: "MaterialIcons", name: "ondemand-video" },
};

const TypeIcon = ({ type, size = 22, color }) => {
  const meta = TYPE_ICON[type] || TYPE_ICON.library;
  if (meta.lib === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={meta.name} size={size} color={color} />;
  }
  return <MaterialIcons name={meta.name} size={size} color={color} />;
};

const HighlightedExcerpt = ({ text, query, styles }) => {
  const excerpt = getExcerptAroundMatch(text, query);
  if (!excerpt) {
    if (!text) return null;
    return (
      <Text style={styles.snippet} numberOfLines={2}>
        {text}
      </Text>
    );
  }
  return (
    <Text style={styles.snippet} numberOfLines={2}>
      <Text style={styles.snippetPlain}>{excerpt.prefix}</Text>
      <Text style={styles.snippetMatch}>{excerpt.match}</Text>
      <Text style={styles.snippetPlain}>{excerpt.suffix}</Text>
    </Text>
  );
};

const SearchScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { isPremium, readItemVersions, contentRegistryVersion } =
    useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const searchbarRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((raw) => {
        if (!mounted || !raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setRecentSearches(parsed.slice(0, MAX_RECENT));
        } catch (_err) {
          // ignore corrupt storage
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      setVideosLoading(true);
      const unsubscribe = subscribeToVideos({
        onData: (list) => {
          setVideos(list);
          setVideosLoading(false);
        },
        onError: () => {
          setVideosLoading(false);
        },
      });
      return () => {
        unsubscribe?.();
      };
    }, []),
  );

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const indexes = useMemo(() => {
    return {
      library: buildLibraryIndex(),
      gems: buildGemsIndex(gemsData),
      museum: buildMuseumIndex(MUSEUM_ITEMS),
      videos: buildVideosIndex(videos),
    };
    // contentRegistryVersion refreshes library when overrides hydrate
  }, [contentRegistryVersion, videos]);

  const grouped = useMemo(
    () => searchAll(indexes, debouncedQuery),
    [indexes, debouncedQuery],
  );

  const availableTypes = useMemo(
    () => typesWithResults(grouped),
    [grouped],
  );

  const totalCount = useMemo(
    () =>
      availableTypes.reduce((sum, t) => sum + t.count, 0),
    [availableTypes],
  );

  useEffect(() => {
    if (!debouncedQuery) {
      setActiveType(null);
      return;
    }
    if (
      activeType &&
      availableTypes.some((t) => t.id === activeType)
    ) {
      return;
    }
    setActiveType(availableTypes[0]?.id ?? null);
  }, [debouncedQuery, availableTypes, activeType]);

  const activeResults = activeType ? grouped[activeType] || [] : [];

  const persistRecent = useCallback(async (term) => {
    const clean = term.trim();
    if (clean.length < 2) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  const handleChangeText = (text) => {
    setSearchQuery(text);
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (searchQuery.trim()) persistRecent(searchQuery);
  };

  const openResult = useCallback(
    (item) => {
      persistRecent(debouncedQuery || searchQuery);
      Keyboard.dismiss();

      if (item.type === "library") {
        const status = getItemStatus(
          item.rawItem,
          item.section,
          readItemVersions,
        );
        const readingParams = {
          id: item.id,
          title: item.title,
          content: item.content || "# No Content\n\nThis topic has no content yet.",
          quizzes: item.quizzes,
          section: item.section,
          contentKey: item.contentKey,
          contentSignature: getContentSignature(item.rawItem),
          updatedSegments: getUpdatedSegmentsForItem(item.rawItem),
          showUpdateHighlights: status === "updated",
          searchTerms: debouncedQuery,
        };
        if (item.isFree) {
          navigation.navigate("Reading", readingParams);
        } else {
          navigation.navigate("PremiumGuard", {
            destination: "Reading",
            readingParams,
          });
        }
        return;
      }

      if (item.type === "gems") {
        if (!isPremium) {
          navigation.navigate("Paywall");
          return;
        }
        navigation.navigate("Reading", {
          id: item.id,
          content: item.content,
          title: item.title,
          section: item.sectionTitle,
          contentKey: item.contentKey,
          isGem: true,
          searchTerms: debouncedQuery,
        });
        return;
      }

      if (item.type === "museum") {
        if (!item.isFree && !isPremium) {
          navigation.navigate("Paywall");
          return;
        }
        navigation.navigate("VirtualMuseum", {
          focusItemId: item.id,
        });
        return;
      }

      if (item.type === "videos") {
        if (!item.isFree && !isPremium) {
          navigation.navigate("Paywall");
          return;
        }
        navigation.navigate("MainTabs", {
          screen: "Videos",
          params: { openVideoId: item.id },
        });
      }
    },
    [
      debouncedQuery,
      isPremium,
      navigation,
      persistRecent,
      readItemVersions,
      searchQuery,
    ],
  );

  const renderResult = ({ item }) => (
    <Pressable
      style={styles.resultRow}
      onPress={() => openResult(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.subtitle || item.type}`}
    >
      <View style={styles.resultIconWrap}>
        <TypeIcon type={item.type} color={colors.secondary} size={22} />
      </View>
      <View style={styles.resultBody}>
        <View style={styles.resultTitleRow}>
          <Text style={styles.resultTitle} numberOfLines={2}>
            {item.emoji ? `${item.emoji} ` : ""}
            {item.title}
          </Text>
          {item.isFree && !isPremium ? (
            <Badge style={styles.freeBadge}>FREE</Badge>
          ) : null}
        </View>
        {item.subtitle ? (
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        ) : null}
        <HighlightedExcerpt
          text={getSnippetSource(item)}
          query={debouncedQuery}
          styles={styles}
        />
      </View>
      <MaterialIcons
        name="chevron-right"
        size={22}
        color={colors.textPlaceholder}
      />
    </Pressable>
  );

  const showEmptyQuery = !debouncedQuery;
  const showNoResults =
    Boolean(debouncedQuery) && totalCount === 0 && !videosLoading;
  const showResults = Boolean(debouncedQuery) && totalCount > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <View style={styles.container}>
        <Searchbar
          ref={searchbarRef}
          placeholder="Search library, gems, museum, videos…"
          onChangeText={handleChangeText}
          value={searchQuery}
          onSubmitEditing={handleSubmit}
          style={styles.searchBar}
          inputStyle={styles.searchBarInput}
          iconColor={colors.textPlaceholder}
          elevation={0}
          autoFocus
          returnKeyType="search"
          clearIcon="close"
        />

        {showEmptyQuery ? (
          <ScrollView
            contentContainerStyle={styles.emptyQueryContent}
            keyboardShouldPersistTaps="handled"
          >
            <MaterialIcons
              name="manage-search"
              size={52}
              color={colors.textPlaceholder}
            />
            <Text style={styles.emptyTitle}>Search across STROMA</Text>
            <Text style={styles.emptySubtitle}>
              Find topics in Library, Study Gems, Virtual Museum, and Videos in
              one place.
            </Text>

            <View style={styles.hintChipRow}>
              {SEARCH_TYPES.map((t) => (
                <Chip
                  key={t.id}
                  mode="outlined"
                  style={styles.hintChip}
                  textStyle={styles.hintChipText}
                  compact
                >
                  {t.label}
                </Chip>
              ))}
            </View>

            {recentSearches.length > 0 ? (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentHeading}>Recent</Text>
                  <Pressable onPress={clearRecent} hitSlop={8}>
                    <Text style={styles.clearRecent}>Clear</Text>
                  </Pressable>
                </View>
                {recentSearches.map((term) => (
                  <Pressable
                    key={term}
                    style={styles.recentRow}
                    onPress={() => {
                      setSearchQuery(term);
                      setDebouncedQuery(term);
                    }}
                  >
                    <MaterialIcons
                      name="history"
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.recentText} numberOfLines={1}>
                      {term}
                    </Text>
                    <MaterialIcons
                      name="north-west"
                      size={18}
                      color={colors.textPlaceholder}
                    />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </ScrollView>
        ) : null}

        {showNoResults ? (
          <View style={styles.centered}>
            <MaterialIcons
              name="search-off"
              size={48}
              color={colors.textPlaceholder}
            />
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySubtitle}>
              Try another keyword, or check spelling.
            </Text>
            {videosLoading ? (
              <View style={styles.videosHint}>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text style={styles.videosHintText}>Still loading videos…</Text>
              </View>
            ) : null}
            <Pressable
              style={styles.clearQueryBtn}
              onPress={() => {
                setSearchQuery("");
                setDebouncedQuery("");
              }}
            >
              <Text style={styles.clearQueryBtnText}>Clear search</Text>
            </Pressable>
          </View>
        ) : null}

        {showResults ? (
          <>
            <FlatList
              horizontal
              data={availableTypes}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              keyboardShouldPersistTaps="handled"
              style={styles.chipList}
              renderItem={({ item }) => (
                <Chip
                  selected={activeType === item.id}
                  mode={activeType === item.id ? "flat" : "outlined"}
                  selectedColor={theme.colors.primary}
                  style={[
                    styles.filterChip,
                    activeType === item.id && styles.filterChipSelected,
                  ]}
                  textStyle={[
                    styles.filterChipText,
                    activeType === item.id && styles.filterChipTextSelected,
                  ]}
                  onPress={() => setActiveType(item.id)}
                  showSelectedOverlay={false}
                  icon={
                    activeType === item.id
                      ? ({ size }) => (
                          <MaterialIcons
                            name="check"
                            size={18}
                            color={theme.colors.primary}
                          />
                        )
                      : undefined
                  }
                >
                  {`${item.label} · ${item.count}`}
                </Chip>
              )}
            />

            {videosLoading && activeType === "videos" ? (
              <View style={styles.videosHintInline}>
                <ActivityIndicator size="small" color={colors.secondary} />
                <Text style={styles.videosHintText}>Updating videos…</Text>
              </View>
            ) : null}

            <FlatList
              data={activeResults}
              keyExtractor={(item) => `${item.type}:${item.id}:${item.contentKey || item.subtitle || ""}`}
              renderItem={renderResult}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContainer}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Text style={styles.emptySubtitle}>No results in this tab.</Text>
                </View>
              }
            />
          </>
        ) : null}

        {Boolean(debouncedQuery) && totalCount === 0 && videosLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
              Searching…
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surfacePrimary,
    },
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: colors.surfacePrimary,
    },
    searchBar: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      elevation: 0,
      height: 48,
      marginBottom: 12,
    },
    searchBarInput: {
      fontSize: 16,
      color: colors.textTitle,
      minHeight: 48,
      alignSelf: "center",
    },
    chipList: {
      flexGrow: 0,
      marginBottom: 8,
    },
    categoryList: {
      gap: 8,
      paddingRight: 8,
      paddingBottom: 4,
    },
    filterChip: {
      backgroundColor: colors.surfacePrimary,
      borderColor: colors.border,
      borderRadius: 20,
    },
    filterChipSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    filterChipText: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 14,
    },
    filterChipTextSelected: {
      color: colors.primary,
      fontWeight: "bold",
    },
    listContainer: {
      paddingBottom: 32,
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    resultIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceSecondary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    resultBody: {
      flex: 1,
      minWidth: 0,
    },
    resultTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 6,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textTitle,
      flexShrink: 1,
    },
    resultSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontStyle: "italic",
    },
    snippet: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.textTertiary,
      marginTop: 4,
    },
    snippetPlain: {
      color: colors.textTertiary,
    },
    snippetMatch: {
      color: colors.secondary,
      fontWeight: "700",
    },
    freeBadge: {
      backgroundColor: colors.secondary,
      color: colors.onPrimary,
      fontSize: 10,
      fontWeight: "900",
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 52,
    },
    emptyQueryContent: {
      alignItems: "center",
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 8,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    emptyTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: "700",
      color: colors.textTitle,
      textAlign: "center",
    },
    emptySubtitle: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textTertiary,
      textAlign: "center",
    },
    hintChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      marginTop: 20,
    },
    hintChip: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.border,
    },
    hintChipText: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    recentSection: {
      width: "100%",
      marginTop: 28,
    },
    recentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    recentHeading: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 1,
      color: colors.textTertiary,
    },
    clearRecent: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.secondary,
    },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    recentText: {
      flex: 1,
      fontSize: 15,
      color: colors.textTitle,
    },
    clearQueryBtn: {
      marginTop: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.surfaceSecondary,
    },
    clearQueryBtnText: {
      color: colors.secondary,
      fontWeight: "700",
    },
    videosHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
    },
    videosHintInline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    videosHintText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

export default SearchScreen;
