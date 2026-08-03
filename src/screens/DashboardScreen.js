import React, { useContext, useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Animated,
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
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import publicHealthDays from "../data/publicHealthDays.json";
import { AppContext } from "../context/AppContext";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import DrawerMenu from "../components/DrawerMenu";
import UpdateDetailDialog from "../components/UpdateDetailDialog";
import { scheduleAllNotifications } from "../services/notificationService";
import { auth } from "../config/firebase";
import useUpdatesFeed from "../hooks/useUpdatesFeed";
import { pickDashboardUpdates } from "../services/updatesService";
import { theme, useResponsive } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
  getLastSeenReadingProgress,
  progressToPercent,
  setLastSeenReadingProgress,
} from "../utils/progressPresentation";
import {
  computeProgressByPaper,
  getNextIncompleteLeaf,
} from "../utils/learningProgress";
import { isResidentModeEnabled } from "../utils/residentMode";

const DASHBOARD_NEW_BADGES_STORAGE_KEY = "dashboardNewBadgesSeen:v1";
const SEARCH_FEATURE_TIP_STORAGE_KEY = "searchFeatureTipSeen:v1";

const OTA_RELOAD_TIMEOUT_MS = 10000;
const OTA_RELOAD_SETTLE_MS = 3000;

const UpdateDownloadIndicator = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    isDownloading,
    isUpdatePending,
    downloadProgress,
  } = Updates.useUpdates();
  const [phase, setPhase] = useState("idle"); // idle | checking | downloading | applying | error
  const [errorMessage, setErrorMessage] = useState(null);
  const checkedRef = React.useRef(false);
  const installingRef = React.useRef(false);

  const installNow = React.useCallback(async () => {
    // Guard: reloadAsync can hang; never stack multiple attempts.
    if (installingRef.current) return;
    installingRef.current = true;
    setPhase("applying");
    setErrorMessage(null);
    try {
      // Paint "Installing…" before native reload; calling reload in the same
      // tick as the press can hang on some Android devices.
      await new Promise((resolve) => setTimeout(resolve, 150));

      await Promise.race([
        Updates.reloadAsync(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("RELOAD_TIMEOUT")),
            OTA_RELOAD_TIMEOUT_MS,
          ),
        ),
      ]);

      // reloadAsync resolves immediately before the actual reload. If JS is
      // still alive after a short settle window, the native reload never ran.
      await new Promise((resolve) =>
        setTimeout(resolve, OTA_RELOAD_SETTLE_MS),
      );
      setPhase("error");
      setErrorMessage(
        "Update is ready, but the app did not refresh. Close the app fully and open it again.",
      );
    } catch (error) {
      const isTimeout = error?.message === "RELOAD_TIMEOUT";
      setPhase("error");
      setErrorMessage(
        isTimeout
          ? "Update is ready, but the app did not refresh. Close the app fully and open it again."
          : "Couldn't apply the update. Please close the app fully and open it again.",
      );
      console.warn("Updates.reloadAsync failed:", error);
    } finally {
      installingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled || checkedRef.current) return;
    checkedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        if (Updates.isUpdatePending) {
          if (!cancelled) setPhase("ready");
          return;
        }
        // Silent check — only show UI when something needs user action
        const result = await Updates.checkForUpdateAsync();
        if (cancelled) return;
        if (!result.isAvailable) {
          setPhase("idle");
          return;
        }
        setPhase("downloading");
        await Updates.fetchUpdateAsync();
        if (!cancelled) setPhase("ready");
      } catch (error) {
        if (!cancelled) {
          setPhase("idle");
          console.warn("App update check failed:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showDownloading = phase === "downloading" || isDownloading;
  const showReady = phase === "ready" || isUpdatePending;
  const showApplying = phase === "applying";
  // Never show technical codes or idle "checking" state to users.
  const showBanner =
    errorMessage || showDownloading || showReady || showApplying;

  if (!showBanner) return null;

  return (
    <View style={styles.updateDownloadIndicator}>
      <View style={styles.updateDownloadIcon}>
        <MaterialIcons
          name={
            errorMessage
              ? "error-outline"
              : showApplying || showReady
                ? "system-update"
                : "cloud-download"
          }
          size={20}
          color={
            errorMessage
              ? colors.error
              : showApplying || showReady
                ? colors.successStrong
                : colors.secondary
          }
        />
      </View>
      <View style={styles.updateDownloadTextColumn}>
        <Text style={styles.updateDownloadTitle}>
          {errorMessage
            ? "Update couldn't install"
            : showApplying
              ? "Installing update"
              : showReady
                ? "Update available"
                : "Downloading update"}
        </Text>
        <Text style={styles.updateDownloadSubtitle}>
          {errorMessage
            ? errorMessage
            : showApplying
              ? "Almost done. The app will refresh shortly."
              : showReady
                ? "A new version is ready. Tap below to install it now."
                : "Please keep the app open while we finish downloading."}
        </Text>
        {showDownloading && !showReady && !showApplying ? (
          <ProgressBar
            progress={downloadProgress || 0.12}
            color={colors.secondary}
            style={styles.updateDownloadProgress}
          />
        ) : null}
        {(showReady || errorMessage) && !showApplying ? (
          <TouchableOpacity
            style={styles.updateInstallButton}
            onPress={installNow}
          >
            <Text style={styles.updateInstallButtonText}>
              {errorMessage ? "Try again" : "Install now"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const DashboardScreen = ({ navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    readingProgress,
    currentStreak,
    studyScore,
    user,
    refreshFromCloud,
    isPremium,
    readItemVersions,
    lastOpenedContentKey,
    contentRegistryVersion,
  } = useContext(AppContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seenNewBadges, setSeenNewBadges] = useState({});
  const [searchTipEligible, setSearchTipEligible] = useState(false);
  const [displayedProgressPercent, setDisplayedProgressPercent] = useState(
    () => progressToPercent(readingProgress),
  );
  const [progressDeltaPercent, setProgressDeltaPercent] = useState(0);
  const progressAnim = useRef(new Animated.Value(readingProgress || 0)).current;
  const progressAnimListenerRef = useRef(null);
  const { isTablet, horizontalPadding, scaleFactor, contentMaxWidth } =
    useResponsive();

  // Refresh learning progress from cloud when Dashboard mounts
  useEffect(() => {
    if (refreshFromCloud) refreshFromCloud();
  }, []);

  useEffect(() => {
    progressAnimListenerRef.current = progressAnim.addListener(({ value }) => {
      setDisplayedProgressPercent(progressToPercent(value));
    });
    return () => {
      if (progressAnimListenerRef.current != null) {
        progressAnim.removeListener(progressAnimListenerRef.current);
      }
    };
  }, [progressAnim]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let hideDeltaTimer = null;
      let animRef = null;

      const runProgressPresentation = async () => {
        const current = Math.min(Math.max(Number(readingProgress) || 0, 0), 1);
        const lastSeen = await getLastSeenReadingProgress();

        if (cancelled) return;

        if (lastSeen === null) {
          progressAnim.setValue(current);
          setDisplayedProgressPercent(progressToPercent(current));
          setProgressDeltaPercent(0);
          await setLastSeenReadingProgress(current);
          return;
        }

        const fromPct = progressToPercent(lastSeen);
        const toPct = progressToPercent(current);
        const shouldAnimate = current > lastSeen + 0.0005 && toPct > fromPct;

        if (!shouldAnimate) {
          progressAnim.setValue(current);
          setDisplayedProgressPercent(toPct);
          setProgressDeltaPercent(0);
          if (Math.abs(current - lastSeen) > 0.00001) {
            await setLastSeenReadingProgress(current);
          }
          return;
        }

        progressAnim.setValue(lastSeen);
        setDisplayedProgressPercent(fromPct);
        setProgressDeltaPercent(toPct - fromPct);

        animRef = Animated.timing(progressAnim, {
          toValue: current,
          duration: 800,
          useNativeDriver: false,
        });
        animRef.start(async ({ finished }) => {
          if (cancelled || !finished) return;
          setDisplayedProgressPercent(toPct);
          await setLastSeenReadingProgress(current);
          hideDeltaTimer = setTimeout(() => {
            if (!cancelled) setProgressDeltaPercent(0);
          }, 2200);
        });
      };

      void runProgressPresentation();

      return () => {
        cancelled = true;
        if (hideDeltaTimer) clearTimeout(hideDeltaTimer);
        if (animRef) animRef.stop();
      };
    }, [readingProgress, progressAnim]),
  );

  // One-time premium-only coachmark for global search (never again after dismiss).
  useEffect(() => {
    let mounted = true;
    let showTimer = null;

    if (!isPremium) {
      setSearchTipEligible(false);
      return () => {
        mounted = false;
      };
    }

    const checkSearchTip = async () => {
      try {
        const seen = await AsyncStorage.getItem(SEARCH_FEATURE_TIP_STORAGE_KEY);
        if (mounted && !seen) {
          showTimer = setTimeout(() => {
            if (mounted) setSearchTipEligible(true);
          }, 900);
        }
      } catch (error) {
        console.warn("Failed to check search feature tip status:", error?.message);
      }
    };

    checkSearchTip();

    return () => {
      mounted = false;
      if (showTimer) clearTimeout(showTimer);
    };
  }, [isPremium]);

  const dismissSearchFeatureTip = useCallback(async () => {
    setSearchTipEligible(false);
    try {
      await AsyncStorage.setItem(SEARCH_FEATURE_TIP_STORAGE_KEY, "true");
    } catch (error) {
      console.warn("Failed to save search feature tip status:", error?.message);
    }
  }, []);

  const searchTipVisible = searchTipEligible && isPremium;

  const residentMode = isResidentModeEnabled(user);

  const paperProgress = React.useMemo(
    () => computeProgressByPaper(readItemVersions),
    [readItemVersions, contentRegistryVersion],
  );

  const nextLeaf = React.useMemo(
    () =>
      getNextIncompleteLeaf(readItemVersions, {
        preferredContentKey: lastOpenedContentKey,
      }),
    [readItemVersions, lastOpenedContentKey, contentRegistryVersion],
  );

  const paperColor = React.useCallback(
    (token) => {
      if (token === "secondary") return colors.secondary;
      if (token === "success") return colors.successStrong || colors.success;
      if (token === "warning") return colors.warningStrong || colors.warning;
      return colors.primary;
    },
    [colors],
  );

  const openSearch = useCallback(() => {
    void dismissSearchFeatureTip();
    navigation.navigate("Search");
  }, [dismissSearchFeatureTip, navigation]);

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

  const { months: updatesMonths } = useUpdatesFeed();
  const visibleUpdates = React.useMemo(
    () => pickDashboardUpdates(updatesMonths, { maxItems: 5 }),
    [updatesMonths],
  );

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
          <View style={styles.topBarActions}>
            <TouchableOpacity
              onPress={openSearch}
              style={[
                styles.iconBtn,
                searchTipVisible && styles.iconBtnHighlighted,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              <MaterialIcons
                name="search"
                size={26}
                color={
                  searchTipVisible ? colors.secondary : colors.textTitle
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("Bookmarks")}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Bookmarks"
            >
              <MaterialIcons
                name="bookmark-border"
                size={26}
                color={colors.textTitle}
              />
            </TouchableOpacity>
          </View>
        </View>

        {searchTipVisible ? (
          <View
            style={styles.searchTipWrap}
            accessibilityRole="text"
            accessibilityLabel="New: Search Library, Gems, Museum, and Videos from here"
          >
            <View style={styles.searchTipArrow} />
            <View style={styles.searchTipContent}>
              <View style={styles.searchTipIconBadge}>
                <MaterialIcons name="search" size={18} color={colors.onPrimary} />
              </View>
              <View style={styles.searchTipTextCol}>
                <Text style={styles.searchTipTitle}>New: Global Search</Text>
                <Text style={styles.searchTipBody}>
                  Tap the search icon to find Library, Gems, Museum, and Videos in
                  one place.
                </Text>
              </View>
              <TouchableOpacity
                onPress={dismissSearchFeatureTip}
                style={styles.searchTipClose}
                accessibilityRole="button"
                accessibilityLabel="Dismiss search tip"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

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

        <Card
          style={styles.progressCard}
          onPress={() => navigation.navigate("LearningProgress")}
          accessibilityRole="button"
          accessibilityLabel={`Learning progress ${displayedProgressPercent} percent. Open details.`}
        >
          <Card.Title
            title="Learning Progress"
            titleStyle={styles.cardTitle}
            subtitle="Tap for details"
            subtitleStyle={styles.progressCardSubtitle}
            right={() => (
              <MaterialIcons
                name="chevron-right"
                size={26}
                color={colors.textTertiary}
                style={{ marginRight: 12 }}
              />
            )}
          />
          <Card.Content>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                      extrapolate: "clamp",
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.progressMetaRow}>
              {progressDeltaPercent > 0 ? (
                <View style={styles.progressDeltaBadge}>
                  <Text style={styles.progressDeltaText}>
                    {`+${progressDeltaPercent}%`}
                  </Text>
                </View>
              ) : (
                <View />
              )}
              <Text variant="bodyMedium" style={styles.progressText}>
                {`${displayedProgressPercent}% Completed`}
              </Text>
            </View>
            {residentMode ? (
              <View style={styles.paperMiniRow}>
                {paperProgress.map((paper) => (
                  <View key={paper.paperId} style={styles.paperMiniCol}>
                    <View style={styles.paperMiniTrack}>
                      <View
                        style={[
                          styles.paperMiniFill,
                          {
                            width: `${paper.percent}%`,
                            backgroundColor: paperColor(paper.colorToken),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.paperMiniLabel}>
                      P{paper.roman} · {paper.percent}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.nextTopicLine} numberOfLines={1}>
              {nextLeaf
                ? `Next: ${nextLeaf.title}`
                : "All theory topics complete"}
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
                  { marginTop: 4, color: theme.colors.secondary },
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
                color={theme.colors.secondary}
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
                color={theme.colors.secondary}
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
                color={theme.colors.secondary}
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
                color={theme.colors.secondary}
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
                {update.summary && update.summary.length > 100
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
                textColor={theme.colors.secondary}
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

      <Portal>
        <Dialog
          visible={healthDaysVisible}
          onDismiss={() => setHealthDaysVisible(false)}
          style={styles.healthDaysDialog}
        >
          <Dialog.Title style={styles.healthDaysDialogTitle}>
            Public Health Days
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.healthDaysScrollArea}>
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
            <Button
              textColor={colors.secondary}
              onPress={() => setHealthDaysVisible(false)}
            >
              Close
            </Button>
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
  topBarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  iconBtnHighlighted: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  searchTipWrap: {
    alignSelf: "flex-end",
    maxWidth: 320,
    width: "100%",
    marginBottom: 8,
    marginTop: 2,
    zIndex: 10,
  },
  searchTipArrow: {
    alignSelf: "flex-end",
    marginRight: 52,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: colors.secondary,
  },
  searchTipContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchTipIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginRight: 10,
    marginTop: 1,
  },
  searchTipTextCol: {
    flex: 1,
    paddingRight: 4,
  },
  searchTipTitle: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  searchTipBody: {
    color: colors.onPrimary,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.95,
  },
  searchTipClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    marginLeft: 2,
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
    alignItems: "flex-start",
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
    marginTop: 2,
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
  updateInstallButton: {
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  updateInstallButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  progressCard: {
    marginBottom: 24,
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: colors.textTitle,
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
  progressTrack: {
    height: 12,
    borderRadius: 6,
    marginVertical: 12,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#A855F7",
  },
  progressMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressDeltaBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.14)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  progressDeltaText: {
    color: "#A855F7",
    fontWeight: "800",
    fontSize: 13,
  },
  progressText: {
    textAlign: "right",
    color: colors.textSecondary,
    fontWeight: "600",
    marginLeft: "auto",
  },
  progressCardSubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  paperMiniRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 8,
  },
  paperMiniCol: {
    flex: 1,
  },
  paperMiniTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
  },
  paperMiniFill: {
    height: "100%",
    borderRadius: 3,
  },
  paperMiniLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
    fontWeight: "600",
  },
  nextTopicLine: {
    marginTop: 12,
    fontSize: 13,
    color: colors.secondary,
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
    shadowColor: colors.textTitle,
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
    shadowColor: colors.textTitle,
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
    shadowColor: colors.textTitle,
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
  healthDaysDialog: {
    maxHeight: "82%",
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
  },
  healthDaysDialogTitle: {
    color: colors.textTitle,
    fontWeight: "bold",
  },
  healthDaysScrollArea: {
    paddingHorizontal: 0,
    borderColor: "transparent",
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
    shadowColor: colors.textTitle,
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
