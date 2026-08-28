import React, { useContext, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Button, List, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { AppContext } from "../context/AppContext";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import {
  buildLibraryReadingParams,
  getContentKey,
  getCurrentContentEntry,
  getItemStatus,
} from "../utils/contentRegistry";
import {
  isFreeLibraryItem,
  navigateToLibraryContent,
} from "../utils/libraryNavigation";

const BookmarksScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { bookmarks, readItemVersions, isPremium } = useContext(AppContext);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  const openBookmark = (bookmark) => {
    const currentEntry = getCurrentContentEntry(bookmark);
    const currentItem = currentEntry?.item || bookmark;
    const effectiveSection = currentEntry?.section || bookmark.section || null;
    const itemStatus = effectiveSection
      ? getItemStatus(currentItem, effectiveSection, readItemVersions)
      : "none";

    const readingParams = bookmark.isGem
      ? {
          id: currentItem.id,
          title: currentItem.title,
          content: currentItem.content,
          section: effectiveSection,
          contentKey:
            bookmark.contentKey ||
            (effectiveSection
              ? getContentKey(effectiveSection, currentItem.id)
              : null),
          isGem: true,
        }
      : {
          ...buildLibraryReadingParams(currentItem, effectiveSection, {
            status: itemStatus,
          }),
          contentKey:
            bookmark.contentKey ||
            (effectiveSection
              ? getContentKey(effectiveSection, currentItem.id)
              : null),
        };

    navigateToLibraryContent(navigation, {
      isPremium,
      isFree: !bookmark.isGem && isFreeLibraryItem(currentItem),
      destination: "Reading",
      params: readingParams,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.header}>
          Bookmarks
        </Text>
        {bookmarks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No bookmarks yet.
            </Text>
            <Button mode="text" onPress={() => navigation.navigate("MainTabs", { screen: "Library" })}>
              Browse Library
            </Button>
          </View>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(item, index) =>
              item.contentKey || `${item.title}-${index}`
            }
            renderItem={({ item }) => (
              <List.Item
                title={item.title}
                titleStyle={styles.itemTitle}
                left={(leftProps) => (
                  <List.Icon
                    {...leftProps}
                    icon={() => (
                      <MaterialIcons
                        name="bookmark"
                        size={24}
                        color={theme.colors.secondary}
                      />
                    )}
                  />
                )}
                right={(rightProps) => (
                  <List.Icon
                    {...rightProps}
                    icon={() => (
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color={theme.colors.textTertiary}
                      />
                    )}
                  />
                )}
                onPress={() => openBookmark(item)}
              />
            )}
            ItemSeparatorComponent={Divider}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.surfacePrimary,
  },
  header: {
    marginBottom: 16,
    fontWeight: "bold",
    color: colors.textTitle,
  },
  itemTitle: {
    color: colors.textTitle,
    fontWeight: "600",
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: colors.textBody,
  },
});

export default BookmarksScreen;
