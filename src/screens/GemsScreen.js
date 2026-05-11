import React, { useState, useMemo, useContext } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { theme, useResponsive } from "../styles/theme";
import { AppContext } from "../context/AppContext";
import gemsData from "../data/gemsData.json";

const ALL_SECTIONS_ID = "all";

const stripGemMarkup = (value = "") =>
  value
    .replace(/\*\[Image Placeholders?:\s*.+?\]\*/gi, "")
    .replace(/\[REF\].*?\[\/REF\]/gis, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const GemsScreen = ({ navigation }) => {
  const [searchQuery, setSearchbarQuery] = useState("");
  const { isBookmarked, toggleBookmark } = useContext(AppContext);
  
  // Reorder data: Family Health & Nutrition first
  const sortedGemsData = useMemo(() => {
    const data = [...gemsData];
    const familyHealthIdx = data.findIndex(s => s.title.includes("FAMILY HEALTH"));
    if (familyHealthIdx > -1) {
      const [familyHealth] = data.splice(familyHealthIdx, 1);
      data.unshift(familyHealth);
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

  const handleGemPress = (gem, sectionId, sectionTitle) => {
    navigation.navigate("Reading", {
      id: gem.id,
      content: gem.content,
      title: gem.title,
      section: sectionTitle,
      contentKey: `gems:${sectionId}:${gem.id}`,
      isGem: true,
    });
  };

  const handleToggleBookmark = (gem, sectionTitle) => {
    toggleBookmark({
      id: gem.id,
      title: gem.title,
      content: gem.content,
      section: sectionTitle,
      isGem: true,
      category: "Gems"
    });
  };

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

      <ScrollView 
        style={styles.gemsList}
        contentContainerStyle={[
          styles.gemsListContent,
          isTablet && { maxWidth: contentMaxWidth, alignSelf: 'center' }
        ]}
      >
        {visibleGemItems.map(({ gem, sectionId, sectionTitle }) => {
          const isGemBookmarked = isBookmarked({ id: gem.id, title: gem.title, isGem: true });
          
          return (
            <Card 
              key={`${sectionId}:${gem.id}`}
              style={styles.gemCard}
              onPress={() => handleGemPress(gem, sectionId, sectionTitle)}
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
                    onPress={() => handleToggleBookmark(gem, sectionTitle)}
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
        })}

        {visibleGemItems.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={64} color={theme.colors.textPlaceholder} />
            <Text style={styles.emptyText}>No gems found matching your search</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: theme.colors.surfacePrimary,
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
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 20,
  },
  selectedChip: {
    backgroundColor: theme.colors.secondary,
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontWeight: "600",
  },
  selectedChipText: {
    color: "#FFF",
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
    backgroundColor: theme.colors.surfacePrimary,
    elevation: 3,
    shadowColor: "#000",
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
    backgroundColor: theme.colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  gemTitle: {
    flex: 1,
    fontWeight: "bold",
    color: theme.colors.textTitle,
    lineHeight: 22,
  },
  gemSnippet: {
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceSecondary,
    paddingTop: 8,
  },
  readMoreText: {
    fontSize: 12,
    color: theme.colors.secondary,
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
    color: theme.colors.textSecondary,
    fontSize: 16,
  }
});

export default GemsScreen;
