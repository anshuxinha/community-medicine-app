import React, { memo, useCallback, useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text, Button, List, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useSession, useLearning } from "../context/AppContext";
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
import {
  buildGemContentKey,
  findGemRecord,
  getBookmarkIdentity,
  isGemBookmark,
} from "../utils/bookmarkIdentity";

const bookmarkKeyExtractor = (row, index) => {
  if (row.type === "header") return `header-${row.id}`;
  return row.item.contentKey || `${row.item.title}-${index}`;
};

const bookmarkLeft = (leftProps) => (
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
);

const bookmarkRight = (rightProps) => (
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
);

const BookmarkSeparator = ({ leadingItem }) =>
  leadingItem?.type === "header" ? null : <Divider />;

const BookmarkSectionHeader = memo(function BookmarkSectionHeader({ title }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
});

const BookmarkRow = memo(function BookmarkRow({ title, item, onOpen }) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <List.Item
      title={title}
      titleStyle={styles.itemTitle}
      titleNumberOfLines={3}
      left={bookmarkLeft}
      right={bookmarkRight}
      onPress={() => onOpen(item)}
    />
  );
});

const BookmarksScreen = ({ navigation }) => {
  const { styles } = useThemedStyles(createStyles);

  const { isPremium } = useSession();
  const { bookmarks, readItemVersions } = useLearning();

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  const listData = useMemo(() => {
    const library = [];
    const gems = [];
    const seen = new Set();
    bookmarks.forEach((bookmark) => {
      const identity = getBookmarkIdentity(bookmark);
      if (identity) {
        if (seen.has(identity)) return;
        seen.add(identity);
      }
      if (isGemBookmark(bookmark)) gems.push(bookmark);
      else library.push(bookmark);
    });
    const rows = [];
    if (library.length > 0) {
      rows.push({ type: "header", id: "library", title: "Library" });
      library.forEach((item) => rows.push({ type: "item", item }));
    }
    if (gems.length > 0) {
      rows.push({ type: "header", id: "gems", title: "Gems" });
      gems.forEach((item) => rows.push({ type: "item", item }));
    }
    return rows;
  }, [bookmarks]);

  const openBookmark = useCallback((bookmark) => {
    if (isGemBookmark(bookmark)) {
      const record = findGemRecord(bookmark);
      const gem = record?.gem || bookmark;
      const sectionId = record?.sectionId || bookmark.sectionId;
      const sectionTitle =
        record?.sectionTitle || bookmark.section || "Gems";
      navigation.navigate("Reading", {
        id: gem.id,
        title: gem.title,
        content: gem.content,
        section: sectionTitle,
        sectionId,
        contentKey:
          bookmark.contentKey || buildGemContentKey(sectionId, gem.id),
        isGem: true,
      });
      return;
    }

    const currentEntry = getCurrentContentEntry(bookmark);
    const currentItem = currentEntry?.item || bookmark;
    const effectiveSection = currentEntry?.section || bookmark.section || null;
    const itemStatus = effectiveSection
      ? getItemStatus(currentItem, effectiveSection, readItemVersions)
      : "none";

    const readingParams = {
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
      isFree: isFreeLibraryItem(currentItem),
      destination: "Reading",
      params: readingParams,
    });
  }, [isPremium, navigation, readItemVersions]);

  const renderBookmark = useCallback(({ item: row }) => {
    if (row.type === "header") {
      return <BookmarkSectionHeader title={row.title} />;
    }
    return (
      <BookmarkRow title={row.item.title} item={row.item} onOpen={openBookmark} />
    );
  }, [openBookmark]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <View style={styles.container}>
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
            data={listData}
            keyExtractor={bookmarkKeyExtractor}
            renderItem={renderBookmark}
            ItemSeparatorComponent={BookmarkSeparator}
            initialNumToRender={12}
            maxToRenderPerBatch={8}
            windowSize={8}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: colors.surfacePrimary,
  },
  sectionHeader: {
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textTertiary,
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
