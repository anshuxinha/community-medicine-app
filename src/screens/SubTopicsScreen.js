import React, {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Text, List, Divider, Badge, Menu } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import { AppContext } from "../context/AppContext";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import {
  buildLibraryReadingParams,
  getContentItemById,
  getItemStatus,
  getLeafContentRefsForItem,
} from "../utils/contentRegistry";
import {
  isFreeLibraryItem,
  navigateToLibraryContent,
} from "../utils/libraryNavigation";

const TOPIC_ID_ICON_MAP = {
  "27-1": "chart-line-variant",
  "27-2": "file-document-edit-outline",
  "27-3": "hospital-building",
  "27-4": "clipboard-check-outline",
  "27-5": "calendar-check-outline",
  "27-6": "monitor-dashboard",
  "27-7": "hospital-box-outline",
  "27-8": "radar",
  "27-9": "alert-outline",
  "27-10": "biohazard",
  "27-11": "scale-balance",
  "27-12": "earth",
};

const getIconForSubtopic = (item) => {
  const mapped = TOPIC_ID_ICON_MAP[item?.id];
  if (mapped) return mapped;

  const loweredTitle = (item?.title || "").toLowerCase();
  if (loweredTitle.includes("tuberculosis") || loweredTitle.includes("ntep"))
    return "lungs";
  if (loweredTitle.includes("mental")) return "brain";
  if (loweredTitle.includes("blindness") || loweredTitle.includes("eye"))
    return "eye-outline";
  if (loweredTitle.includes("immunization") || loweredTitle.includes("vaccin"))
    return "needle";
  if (
    loweredTitle.includes("family planning") ||
    loweredTitle.includes("contraceptive")
  )
    return "home-heart";
  if (loweredTitle.includes("demography") || loweredTitle.includes("fertility"))
    return "account-group-outline";
  if (
    loweredTitle.includes("biostatistics") ||
    loweredTitle.includes("chi-square") ||
    loweredTitle.includes("sampling")
  )
    return "chart-bell-curve-cumulative";
  if (
    loweredTitle.includes("epidemiology") ||
    loweredTitle.includes("surveillance")
  )
    return "chart-timeline-variant";
  if (loweredTitle.includes("disaster")) return "alert-outline";
  if (loweredTitle.includes("waste")) return "delete-outline";
  return "file-document-outline";
};

const SubtopicRow = memo(function SubtopicRow({
  item,
  itemStatus,
  iconName,
  menuOpen,
  menuKey,
  onOpen,
  onOpenMenu,
  onCloseMenu,
  onMarkUnread,
}) {
  const { styles } = useThemedStyles(createStyles);
  return (
    <List.Item
      title={item.title}
      titleNumberOfLines={3}
      titleStyle={styles.itemTitle}
      description={item.description}
      descriptionStyle={styles.itemDescription}
      left={(leftProps) => (
        <List.Icon
          {...leftProps}
          icon={() => (
            <MaterialCommunityIcons
              name={iconName}
              size={24}
              color={theme.colors.secondary}
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
      onPress={() => onOpen(item, itemStatus)}
    />
  );
});

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
    <MaterialCommunityIcons
      name="chevron-right"
      size={22}
      color={colors.textTertiary}
    />
  );
};

const SubTopicsScreen = ({ route, navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    items: paramItems,
    section = "theory",
    parentId,
  } = route.params;
  const { readItemVersions, markAsUnread, contentRegistryVersion, isPremium } =
    useContext(AppContext);

  const items = useMemo(() => {
    if (parentId != null && parentId !== undefined) {
      const parent = getContentItemById(section, parentId);
      if (Array.isArray(parent?.subsections)) return parent.subsections;
    }
    return Array.isArray(paramItems) ? paramItems : [];
  }, [parentId, section, paramItems, contentRegistryVersion]);
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  const getMenuKey = (item) => `${section}:${item.id}`;

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
            section,
            parentId: item.id,
          },
          mode: "push",
        });
        return;
      }

      navigateToLibraryContent(navigation, {
        isPremium,
        isFree,
        destination: "Reading",
        params: buildLibraryReadingParams(item, section, {
          status: itemStatus,
        }),
      });
    },
    [isPremium, navigation, section],
  );

  const handleMarkUnread = useCallback(
    (item) => {
      markAsUnread(getLeafContentRefsForItem(item, section));
      closeMenu();
    },
    [closeMenu, markAsUnread, section],
  );

  const renderSubtopic = useCallback(
    ({ item }) => {
      const itemStatus = getItemStatus(item, section, readItemVersions);
      const menuKey = getMenuKey(item);
      return (
        <SubtopicRow
          item={item}
          itemStatus={itemStatus}
          iconName={getIconForSubtopic(item)}
          menuOpen={openMenuKey === menuKey}
          menuKey={menuKey}
          onOpen={openItem}
          onOpenMenu={setOpenMenuKey}
          onCloseMenu={closeMenu}
          onMarkUnread={handleMarkUnread}
        />
      );
    },
    [
      closeMenu,
      handleMarkUnread,
      openItem,
      openMenuKey,
      readItemVersions,
      section,
    ],
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 28 },
        ]}
        renderItem={renderSubtopic}
        extraData={openMenuKey}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={8}
        removeClippedSubviews
        ItemSeparatorComponent={Divider}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemTitle: {
    color: colors.textTitle,
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 22,
    paddingRight: 12,
  },
  itemDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  rightSlot: {
    minWidth: 56,
    alignItems: "flex-end",
    justifyContent: "center",
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
  },
  newBadge: {
    backgroundColor: colors.secondary,
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "900",
  },
});

export default SubTopicsScreen;
