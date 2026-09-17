import React, { useState, useMemo, useContext, useCallback, memo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
} from "react-native";
import {
  Text,
  Card,
  Searchbar,
  Chip,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme, useResponsive } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import { AppContext } from "../context/AppContext";
import gemsData from "../data/gemsData.json";
import { buildGemContentKey } from "../utils/bookmarkIdentity";

const ALL_SECTIONS_ID = "all";

const gemKeyExtractor = (row) => `${row.sectionId}:${row.gem.id}`;

const stripGemMarkup = (value = "") =>
  value
    .replace(/\*\[Image Placeholders?:\s*.+?\]\*/gi, "")
    .replace(/\[REF\].*?\[\/REF\]/gis, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const GemRow = memo(function GemRow({
  gem,
  sectionId,
  sectionTitle,
  isGemBookmarked,
  onOpen,
  onToggleBookmark,
}) {
  const { styles } = useThemedStyles(createStyles);

  return (
    <Card
      style={styles.gemCard}
      onPress={() => onOpen(gem, sectionId, sectionTitle)}
    >
      <Card.Content style={styles.gemCardContent}>
        <View style={styles.gemHeader}>
          <View style={styles.gemIconContainer}>
            <MaterialIcons name="diamond" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.gemTitle} variant="titleMedium">{gem.title}</Text>
          <IconButton
            icon={isGemBookmarked ? "bookmark" : "bookmark-outline"}
            iconColor={isGemBookmarked ? theme.colors.secondary : undefined}
            size={20}
            onPress={() => onToggleBookmark(gem, sectionId, sectionTitle)}
          />
        </View>
        <Text
          numberOfLines={3}
          style={styles.gemSnippet}
          variant="bodyMedium"
        >
          {stripGemMarkup(gem.content)}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.readMoreText}>Tap to read full gem</Text>
          <MaterialIcons name="chevron-right" size={18} color={theme.colors.secondary} />
        </View>
      </Card.Content>
    </Card>
  );
});

const GemsEmpty = memo(function GemsEmpty() {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.emptyState}>
      <MaterialIcons name="search-off" size={64} color={theme.colors.textPlaceholder} />
      <Text style={styles.emptyText}>No gems found matching your search</Text>
    </View>
  );
});

const GemsScreen = ({ navigation }) => {
  const { styles } = useThemedStyles(createStyles);

  const [searchQuery, setSearchbarQuery] = useState("");
  const { isBookmarked, toggleBookmark, isPremium } = useContext(AppContext);
  
    // Reorder data: Vital Indicators & Surveys first
    const sortedGemsData = useMemo(() => {
      const data = [...gemsData];
      const section9Idx = data.findIndex((s) => s.id === "section_9");
      if (section9Idx > -1) {
        const [section9] = data.splice(section9Idx, 1);
        data.unshift(section9);
      } else {
        const familyHealthIdx = data.findIndex((s) => s.title.includes("FAMILY HEALTH"));
        if (familyHealthIdx > -1) {
          const [familyHealth] = data.splice(familyHealthIdx, 1);
          data.unshift(familyHealth);
        }
      }
      return data;
    }, []);

  const [selectedSection, setSelectedSection] = useState(ALL_SECTIONS_ID);
  const { isTablet, contentMaxWidth } = useResponsive();

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sortedGemsData;
    
    return sortedGemsData.map(section => ({
      ...section,
      gems: section.gems.filter(gem => 
        gem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gem.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.gems.length > 0);
  }, [searchQuery, sortedGemsData]);

  const visibleGemItems = useMemo(() => {
    const sections =
      selectedSection === ALL_SECTIONS_ID
        ? filteredSections
        : filteredSections.filter((section) => section.id === selectedSection);

    return sections.flatMap((section) =>
      section.gems.map((gem) => ({
        gem,
        sectionId: section.id,
        sectionTitle: section.title,
      })),
    );
  }, [filteredSections, selectedSection]);

  const handleGemPress = useCallback((gem, sectionId, sectionTitle) => {
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }
    navigation.navigate("Reading", {
      id: gem.id,
      content: gem.content,
      title: gem.title,
      section: sectionTitle,
      sectionId,
      contentKey: buildGemContentKey(sectionId, gem.id),
      isGem: true,
    });
  }, [isPremium, navigation]);

  const handleToggleBookmark = useCallback((gem, sectionId, sectionTitle) => {
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }
    toggleBookmark({
      id: gem.id,
      title: gem.title,
      content: gem.content,
      section: sectionTitle,
      sectionId,
      contentKey: buildGemContentKey(sectionId, gem.id),
      isGem: true,
      category: "Gems",
    });
  }, [isPremium, navigation, toggleBookmark]);

  const renderGemItem = useCallback(({ item }) => (
    <GemRow
      gem={item.gem}
      sectionId={item.sectionId}
      sectionTitle={item.sectionTitle}
      isGemBookmarked={isBookmarked({
        id: item.gem.id,
        title: item.gem.title,
        sectionId: item.sectionId,
        contentKey: buildGemContentKey(item.sectionId, item.gem.id),
        isGem: true,
      })}
      onOpen={handleGemPress}
      onToggleBookmark={handleToggleBookmark}
    />
  ), [handleGemPress, handleToggleBookmark, isBookmarked]);

  const gemsListContentStyle = useMemo(
    () => [
      styles.gemsListContent,
      isTablet && { maxWidth: contentMaxWidth, alignSelf: "center" },
    ],
    [styles.gemsListContent, isTablet, contentMaxWidth],
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search gems..."
          onChangeText={setSearchbarQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchbarInput}
        />
      </View>

      <View style={styles.sectionTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <Chip
            selected={selectedSection === ALL_SECTIONS_ID}
            onPress={() => setSelectedSection(ALL_SECTIONS_ID)}
            style={[
              styles.chip,
              selectedSection === ALL_SECTIONS_ID && styles.selectedChip
            ]}
            textStyle={[
              styles.chipText,
              selectedSection === ALL_SECTIONS_ID && styles.selectedChipText
            ]}
            showSelectedCheck={false}
          >
            All
          </Chip>
          {filteredSections.map((section) => (
            <Chip
              key={section.id}
              selected={selectedSection === section.id}
              onPress={() => setSelectedSection(section.id)}
              style={[
                styles.chip,
                selectedSection === section.id && styles.selectedChip
              ]}
              textStyle={[
                styles.chipText,
                selectedSection === section.id && styles.selectedChipText
              ]}
              showSelectedCheck={false}
            >
              {section.title.replace(/SECTION \d+:\s*/i, '')}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visibleGemItems}
        keyExtractor={gemKeyExtractor}
        renderItem={renderGemItem}
        style={styles.gemsList}
        contentContainerStyle={gemsListContentStyle}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={8}
        removeClippedSubviews
        ListEmptyComponent={GemsEmpty}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 12,
    elevation: 2,
  },
  searchbarInput: {
    fontSize: 16,
  },
  sectionTabsContainer: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
  },
  selectedChip: {
    backgroundColor: colors.secondary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  selectedChipText: {
    color: colors.surfacePrimary,
  },
  gemsList: {
    flex: 1,
  },
  gemsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  gemCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: colors.surfacePrimary,
    elevation: 3,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  gemCardContent: {
    paddingBottom: 8,
  },
  gemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  gemIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  gemTitle: {
    flex: 1,
    fontWeight: "bold",
    color: colors.textTitle,
    lineHeight: 22,
  },
  gemSnippet: {
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSecondary,
    paddingTop: 8,
  },
  readMoreText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 64,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 16,
  }
});

export default GemsScreen;
