import React, { useContext, useState, useEffect } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  Card,
  ProgressBar,
  Button,
  Dialog,
  Portal,
} from "react-native-paper";
import * as Updates from "expo-updates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import recentUpdates from "../data/updates.json";
import archiveData from "../data/updates_archive.json";
import publicHealthDays from "../data/publicHealthDays.json";
import { AppContext } from "../context/AppContext";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import DrawerMenu from "../components/DrawerMenu";
import UpdateDetailDialog from "../components/UpdateDetailDialog";
import ReferralAnnouncementDialog from "../components/ReferralAnnouncementDialog";
import { scheduleAllNotifications } from "../services/notificationService";
import { auth } from "../config/firebase";
import { useResponsive } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";

const DASHBOARD_NEW_BADGES_STORAGE_KEY = "dashboardNewBadgesSeen:v1";
const REFERRAL_ANNOUNCEMENT_STORAGE_KEY = "referralAnnouncementSeen:v1";

const UpdateDownloadIndicator = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    isDownloading,
    isUpdatePending,
    downloadProgress,
  } = Updates.useUpdates();
  const [status, setStatus] = useState("idle");
  const checkedRef = React.useRef(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || checkedRef.current) return;

    checkedRef.current = true;
    let cancelled = false;

    const checkAndDownloadUpdate = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!cancelled && update.isAvailable) {
          setStatus("downloading");
          await Updates.fetchUpdateAsync();
          if (!cancelled) setStatus("ready");
        }
      } catch (error) {
        if (!cancelled) setStatus("idle");
        console.warn("App update check failed:", error);
      }
    };

    checkAndDownloadUpdate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isDownloading) {
      setStatus("downloading");
    } else if (isUpdatePending) {
      setStatus("ready");
    }
  }, [isDownloading, isUpdatePending]);

  const showDownloading = status === "downloading" || isDownloading;
  const showReady = status === "ready" || isUpdatePending;

  if (!showDownloading && !showReady) return null;

  return (
    <View style={styles.updateDownloadIndicator}>
      <View style={styles.updateDownloadIcon}>
        <MaterialIcons
          name={showReady ? "check-circle" : "downloading"}
          size={20}
          color={showReady ? colors.successStrong : colors.secondary}
        />
      </View>
      <View style={styles.updateDownloadTextColumn}>
        <Text style={styles.updateDownloadTitle}>
          {showReady ? "Update ready" : "Downloading update"}
        </Text>
        <Text style={styles.updateDownloadSubtitle}>
          {showReady
            ? "Reopen the app to finish updating."
            : "Please keep the app open for a moment."}
        </Text>
        {showDownloading ? (
          <ProgressBar
            progress={downloadProgress || 0.12}
            color={colors.secondary}
            style={styles.updateDownloadProgress}
          />
        ) : null}
      </View>
    </View>
  );
};

const DashboardScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const { readingProgress, currentStreak, studyScore, user, refreshFromCloud, isPremium } =
    useContext(AppContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seenNewBadges, setSeenNewBadges] = useState({});
  const [referralAnnouncementVisible, setReferralAnnouncementVisible] = useState(false);
  const { isTablet, horizontalPadding, scaleFactor, contentMaxWidth } =
    useResponsive();

  // Refresh learning progress from cloud when Dashboard mounts
  useEffect(() => {
    if (refreshFromCloud) refreshFromCloud();
  }, []);

  // Check and show referral system announcement modal
  useEffect(() => {
    let mounted = true;

    const checkReferralAnnouncement = async () => {
      try {
        const seen = await AsyncStorage.getItem(REFERRAL_ANNOUNCEMENT_STORAGE_KEY);
        if (mounted && !seen) {
          // Add a 1.2 second delay so the app mounts and resolves first
          setTimeout(() => {
            if (mounted) {
              setReferralAnnouncementVisible(true);
            }
          }, 1200);
        }
      } catch (error) {
        console.warn("Failed to check referral announcement status:", error?.message);
      }
    };

    checkReferralAnnouncement();

    return () => {
      mounted = false;
    };
  }, []);

  const dismissReferralAnnouncement = async () => {
    setReferralAnnouncementVisible(false);
    try {
      await AsyncStorage.setItem(REFERRAL_ANNOUNCEMENT_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Failed to save referral announcement status:", error?.message);
    }
  };

  const handleGoToReferrals = async () => {
    await dismissReferralAnnouncement();
    navigation.navigate("Profile");
  };

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(DASHBOARD_NEW_BADGES_STORAGE_KEY)
      .then((storedBadges) => {
        if (!mounted || !storedBadges) return;
        const parsedBadges = JSON.parse(storedBadges);
        if (parsedBadges && typeof parsedBadges === "object" && !Array.isArray(parsedBadges)) {
          setSeenNewBadges(parsedBadges);
        }
      })
      .catch((error) => {
        console.warn("Failed to load dashboard NEW badges:", error?.message);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const markDashboardBadgeSeen = (badgeKey) => {
    setSeenNewBadges((previousBadges) => {
      if (previousBadges[badgeKey]) return previousBadges;

      const nextBadges = {
        ...previousBadges,
        [badgeKey]: true,
      };

      AsyncStorage.setItem(
        DASHBOARD_NEW_BADGES_STORAGE_KEY,
        JSON.stringify(nextBadges),
      ).catch((error) => {
        console.warn("Failed to save dashboard NEW badge:", error?.message);
      });

      return nextBadges;
    });
  };

  const [visible, setVisible] = React.useState(false);
  const [healthDaysVisible, setHealthDaysVisible] = useState(false);

  const getNextHealthDay = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    const sortedDays = [...publicHealthDays].sort((a, b) => {
      if (a.month === b.month) return a.day - b.day;
      return a.month - b.month;
    });

    const nextDay = sortedDays.find(
      (day) =>
        day.month > currentMonth ||
        (day.month === currentMonth && day.day >= currentDay),
    );

    return nextDay || sortedDays[0];
  };
  const nextHealthDay = getNextHealthDay();
  const [selectedUpdate, setSelectedUpdate] = React.useState(null);

  const showDialog = (update) => {
    setSelectedUpdate(update);
    setVisible(true);
  };

  const hideDialog = () => setVisible(false);

  const normalizeHealthDayDescription = (text) =>
    (text || "").replace(/\s+/g, " ").trim();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString(undefined, options);
  };

  const visibleUpdates = React.useMemo(() => {
    const getYearMonthString = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      return `${yyyy}-${mm}`;
    };

    const getPreviousYearMonthString = (date) => {
      const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      const yyyy = prevDate.getFullYear();
      const mm = String(prevDate.getMonth() + 1).padStart(2, "0");
      return `${yyyy}-${mm}`;
    };

    const getUpdatesForMonth = (monthKey) => {
      // 1. Check recentUpdates (updates.json)
      const recent = recentUpdates.filter(
        (u) =>
          u.category !== "Academic Content Update" &&
          u.date &&
          u.date.startsWith(monthKey)
      );
      if (recent.length > 0) {
        return recent;
      }
      // 2. Check updates_archive.json
      const archived = archiveData[monthKey] || [];
      return archived.filter((u) => u.category !== "Academic Content Update");
    };

    const now = new Date();
    const currentMonthKey = getYearMonthString(now);
    const previousMonthKey = getPreviousYearMonthString(now);

    let updates = getUpdatesForMonth(currentMonthKey);
    if (updates.length === 0) {
      updates = getUpdatesForMonth(previousMonthKey);
    }
    if (updates.length === 0) {
      // Fallback: if both are empty, show all non-academic updates from recentUpdates
      updates = recentUpdates.filter(
        (u) => u.category !== "Academic Content Update"
      );
    }
    return updates;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animated side drawer */}
      <DrawerMenu
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          isTablet && {
            paddingHorizontal: horizontalPadding,
            maxWidth: contentMaxWidth,
            alignSelf: "center",
          },
        ]}
      >
        {/* ── Top header bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setDrawerOpen(true)}
            style={styles.iconBtn}
          >
            <MaterialIcons
              name="menu"
              size={26}
              color={colors.textTitle}
            />
          </TouchableOpacity>
          <Text style={styles.appName}>STROMA</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Bookmarks")}
            style={styles.iconBtn}
          >
            <MaterialIcons
              name="bookmark-border"
              size={26}
              color={colors.textTitle}
            />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.headerSection}>
          <Text style={styles.welcomeText}>
            {getGreeting()},{`\n`}
            {user?.username || auth.currentUser?.displayName || "Dr. User"}
          </Text>
          <Text variant="bodyLarge" style={styles.subText}>
            {getFormattedDate()}
          </Text>
        </View>

        <UpdateDownloadIndicator />

        <Card style={styles.progressCard}>
          <Card.Title
            title="Learning Progress"
            titleStyle={styles.cardTitle}
            subtitleStyle={{ color: colors.textTitle }}
          />
          <Card.Content>
            <ProgressBar
              progress={readingProgress}
              color={colors.secondary} // Soft purple
              style={styles.progressBar}
            />
            <Text variant="bodyMedium" style={styles.progressText}>
              {`${Math.round(readingProgress * 100)}% Completed`}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { marginRight: 8 }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="displaySmall">🔥</Text>
              <Text variant="titleLarge" style={styles.statValue}>
                {currentStreak}
              </Text>
              <Text variant="labelMedium" style={styles.statLabel}>
                Day Streak
              </Text>
            </Card.Content>
          </Card>
          <Card
            style={[styles.statCard, { marginLeft: 8 }]}
            onPress={() => setHealthDaysVisible(true)}
          >
            <Card.Content
              style={[styles.statContent, { paddingHorizontal: 4 }]}
            >
              <Text variant="displaySmall" style={{ marginBottom: 4 }}>
                📅
              </Text>
              <Text
                variant="titleMedium"
                style={[
                  styles.statValue,
                  { fontSize: 15, textAlign: "center", lineHeight: 18 },
                ]}
                numberOfLines={2}
              >
                {nextHealthDay.name}
              </Text>
              <Text
                variant="labelSmall"
                style={[
                  styles.statLabel,
                  { marginTop: 4, color: colors.secondary },
                ]}
              >
                {nextHealthDay.dateLabel}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Step 3.5: UI Layout - Quick Access Modules */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Quick Access
        </Text>
        <View style={styles.quickAccessRow}>
          <Card
            style={styles.quickCard}
            onPress={() => {
              markDashboardBadgeSeen("toolbox");
              navigation.navigate("FieldToolbox");
            }}
          >
            <Card.Content style={styles.quickCardContent}>
              {!seenNewBadges.toolbox ? (
                <Text style={styles.quickNewBadge}>NEW</Text>
              ) : null}
              <MaterialIcons
                name="build"
                size={32}
                color={colors.secondary}
              />
              <Text variant="labelMedium" style={styles.quickText}>
                Toolbox
              </Text>
            </Card.Content>
          </Card>
          <Card
            style={[styles.quickCard, { marginLeft: 8 }]}
            onPress={() => {
              markDashboardBadgeSeen("gems");
              navigation.navigate("Gems");
            }}
          >
            <Card.Content style={styles.quickCardContent}>
              {!seenNewBadges.gems ? (
                <Text style={styles.quickNewBadge}>NEW</Text>
              ) : null}
              <MaterialIcons
                name="diamond"
                size={32}
                color={colors.secondary}
              />
              <Text variant="labelMedium" style={styles.quickText}>
                Gems
              </Text>
            </Card.Content>
          </Card>
          <Card
            style={[styles.quickCard, { marginLeft: 8 }]}
            onPress={() => navigation.navigate("VirtualMuseum")}
          >
            <Card.Content style={styles.quickCardContent}>
              <MaterialIcons
                name="museum"
                size={32}
                color={colors.secondary}
              />
              <Text variant="labelMedium" style={styles.quickText}>
                Museum
              </Text>
            </Card.Content>
          </Card>
          <Card
            style={[styles.quickCard, { marginLeft: 8 }]}
            onPress={() => navigation.navigate("BiostatsAssistant")}
          >
            <Card.Content style={styles.quickCardContent}>
              <MaterialIcons
                name="insert-chart"
                size={32}
                color={colors.secondary}
              />
              <Text variant="labelMedium" style={styles.quickText}>
                Biostats
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Step 4: UI Layout - Updates Feed */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Latest Guidelines and Updates
        </Text>

        {visibleUpdates.map((update) => (
          <Card key={update.id} style={styles.updateCard}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.dateText}>
                {update.date}
              </Text>
              {update.category ? (
                <Text variant="labelSmall" style={styles.updateCategory}>
                  {update.category}
                </Text>
              ) : null}
              <Text variant="titleMedium" style={styles.updateTitle}>
                {update.title}
              </Text>
              <Text variant="bodyMedium" style={styles.updateSummary}>
                {update.summary.length > 100
                  ? `${update.summary.substring(0, 100)}...`
                  : update.summary}
              </Text>
              {update.source ? (
                <Text variant="labelSmall" style={styles.updateSource}>
                  Source: {update.source}
                </Text>
              ) : null}
            </Card.Content>
            <Card.Actions>
              <Button
                textColor={colors.secondary}
                onPress={() => {
                  if (!isPremium) {
                    navigation.navigate("Paywall");
                  } else {
                    showDialog(update);
                  }
                }}
                mode="text"
                compact
              >
                Read More
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>

      <UpdateDetailDialog
        visible={visible}
        update={selectedUpdate}
        onDismiss={hideDialog}
      />

      <ReferralAnnouncementDialog
        visible={referralAnnouncementVisible}
        onDismiss={dismissReferralAnnouncement}
        onAction={handleGoToReferrals}
      />

      <Portal>
        <Dialog
          visible={healthDaysVisible}
          onDismiss={() => setHealthDaysVisible(false)}
          style={{
            maxHeight: "82%",
            backgroundColor: colors.surfacePrimary,
            borderRadius: 16,
          }}
        >
          <Dialog.Title
            style={{ color: colors.textTitle, fontWeight: "bold" }}
          >
            Public Health Days
          </Dialog.Title>
          <Dialog.ScrollArea
            style={{ paddingHorizontal: 0, borderColor: "transparent" }}
          >
            <ScrollView contentContainerStyle={styles.healthDaysListContent}>
              {publicHealthDays.map((day, index) => (
                <View key={index} style={styles.healthDayItem}>
                  <View style={styles.healthDayRow}>
                    <View style={styles.healthDayTextColumn}>
                      <Text style={styles.healthDayName}>{day.name}</Text>
                      <Text style={styles.healthDayDescription}>
                        {normalizeHealthDayDescription(day.description)}
                      </Text>
                    </View>
                    <Text style={styles.healthDayDate}>{day.dateLabel}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setHealthDaysVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

// Step 5: Styling
const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingTop: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textTitle,
    letterSpacing: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  headerSection: {
    marginBottom: 24,
    marginTop: 16,
  },
  welcomeText: {
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontSize: 36,
    color: colors.textTitle,
    lineHeight: 40,
  },
  subText: {
    color: colors.textTertiary,
    marginTop: 8,
  },
  updateDownloadIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 16,
  },
  updateDownloadIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginRight: 10,
  },
  updateDownloadTextColumn: {
    flex: 1,
  },
  updateDownloadTitle: {
    color: colors.textTitle,
    fontSize: 14,
    fontWeight: "800",
  },
  updateDownloadSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  updateDownloadProgress: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: 8,
  },
  progressCard: {
    marginBottom: 24,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: colors.textTitle,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    marginVertical: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  progressText: {
    textAlign: "right",
    color: colors.textSecondary,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statLabel: {
    color: colors.textBody,
    fontWeight: "600",
  },
  statContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  statValue: {
    fontWeight: "bold",
    fontSize: 24,
    color: colors.textTitle,
    marginVertical: 4,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 16,
    color: colors.textTitle,
  },
  quickAccessRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickCardContent: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  quickNewBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: colors.primarySoft,
    color: colors.primaryDark,
    borderRadius: 6,
    overflow: "hidden",
    paddingHorizontal: 5,
    paddingVertical: 1,
    fontSize: 9,
    fontWeight: "900",
  },
  quickText: {
    marginTop: 8,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  updateCard: {
    marginBottom: 16,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dateText: {
    color: colors.secondary,
    marginBottom: 6,
    fontWeight: "bold",
    fontSize: 12,
  },
  updateTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: colors.textTitle,
  },
  updateSummary: {
    color: colors.textTertiary,
    lineHeight: 22,
  },
  updateCategory: {
    color: colors.secondary,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  updateSource: {
    marginTop: 8,
    color: colors.textSecondary,
  },
  healthDaysListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  healthDayItem: {
    marginBottom: 10,
  },
  healthDayRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  healthDayTextColumn: {
    flex: 1,
    marginRight: 12,
  },
  healthDayName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textTitle,
    lineHeight: 22,
    marginBottom: 0,
    includeFontPadding: false,
  },
  healthDayDate: {
    marginTop: 1,
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    includeFontPadding: false,
  },
  healthDayDescription: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
  },
  qbankBanner: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qbankBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  qbankBannerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  qbankBannerTextColumn: {
    flex: 1,
    marginRight: 8,
  },
  qbankBannerTitle: {
    fontWeight: "bold",
    color: colors.textTitle,
    fontSize: 16,
  },
  qbankBannerDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});

export default DashboardScreen;
