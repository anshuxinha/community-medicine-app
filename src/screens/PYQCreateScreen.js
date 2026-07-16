import React, { useState, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Button,
  Chip,
  List,
  Divider,
  ActivityIndicator,
  Portal,
  Dialog,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme, useResponsive } from "../styles/theme";
import { AppContext } from "../context/AppContext";
import pyqData from "../data/pyq_data.json";

const STORAGE_ATTEMPTS_KEY = "pyq_attempts_v1";
const STORAGE_BOOKMARKS_KEY = "pyq_bookmarks_v1";

const PYQCreateScreen = ({ navigation }) => {
  const { isPremium } = useContext(AppContext);
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();

  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState({});
  const [bookmarks, setBookmarks] = useState([]);

  // Selections
  const [selectedExams, setSelectedExams] = useState(isPremium ? ["AIIMS", "NEET", "INI-CET"] : ["AIIMS"]);
  const [selectedStatus, setSelectedStatus] = useState("all"); // all, unattempted, correct, incorrect, bookmarked
  const [questionCount, setQuestionCount] = useState(isPremium ? 10 : 5); // 5, 10, 15, 20, 30, 50
  const [mode, setMode] = useState("study"); // study, exam

  useEffect(() => {
    loadUserHistory();
  }, []);

  const loadUserHistory = async () => {
    try {
      const storedAttempts = await AsyncStorage.getItem(STORAGE_ATTEMPTS_KEY);
      const storedBookmarks = await AsyncStorage.getItem(STORAGE_BOOKMARKS_KEY);
      
      if (storedAttempts) setAttempts(JSON.parse(storedAttempts));
      if (storedBookmarks) setBookmarks(JSON.parse(storedBookmarks));
    } catch (e) {
      console.warn("Failed to load user PYQ history:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExamSelection = (examGroup) => {
    // If not premium, they can only practice AIIMS (and only AIIMS 2017, enforced later)
    if (!isPremium && examGroup !== "AIIMS") {
      navigation.navigate("Paywall");
      return;
    }

    if (selectedExams.includes(examGroup)) {
      if (selectedExams.length > 1) {
        setSelectedExams(selectedExams.filter((e) => e !== examGroup));
      }
    } else {
      setSelectedExams([...selectedExams, examGroup]);
    }
  };

  const handleSelectStatus = (status) => {
    if (!isPremium && status !== "all") {
      navigation.navigate("Paywall");
      return;
    }
    setSelectedStatus(status);
  };

  const handleSelectCount = (count) => {
    if (!isPremium && count > 5) {
      navigation.navigate("Paywall");
      return;
    }
    setQuestionCount(count);
  };

  // Helper to filter and build the question list
  const getFilteredQuestions = () => {
    return pyqData.filter((q) => {
      // 1. Exam group filter
      // Exam names are e.g. "AIIMS 2017", "NEET 2018", "INI-CET 2021"
      const isMatchGroup = selectedExams.some((group) =>
        q.exam.toUpperCase().includes(group.toUpperCase())
      );
      if (!isMatchGroup) return false;

      // 1b. Premium check: non-premium can only practice AIIMS 2017
      if (!isPremium) {
        if (q.exam !== "AIIMS 2017") return false;
      }

      // 2. Status filter
      const attempt = attempts[q.id];
      const isBmk = bookmarks.includes(q.id);

      if (selectedStatus === "unattempted") {
        return !attempt;
      } else if (selectedStatus === "correct") {
        return attempt && attempt.correct === true;
      } else if (selectedStatus === "incorrect") {
        return attempt && attempt.correct === false;
      } else if (selectedStatus === "bookmarked") {
        return isBmk;
      }

      return true;
    });
  };

  const handleCreateModule = () => {
    const filtered = getFilteredQuestions();

    if (filtered.length === 0) {
      Alert.alert(
        "No Questions Found",
        "No questions match your selected criteria. Try changing your filters."
      );
      return;
    }

    // Shuffle and slice to selected count
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, questionCount);

    navigation.navigate("PYQPractice", {
      questions: selectedQuestions,
      mode: mode,
      title: `${selectedStatus === "bookmarked" ? "Bookmarked" : "Custom"} Module`,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  // Count matches
  const totalMatches = getFilteredQuestions().length;

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Custom Module Creator
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Filter, configure, and generate custom practice sessions based on past years questions.
          </Text>
        </View>

        {!isPremium && (
          <Card style={styles.premiumBanner} onPress={() => navigation.navigate("Paywall")}>
            <Card.Content style={styles.premiumBannerContent}>
              <MaterialCommunityIcons name="crown" size={32} color="#F59E0B" />
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Unlock Full QBank Access</Text>
                <Text style={styles.premiumDesc}>
                  Upgrade to Premium to practice NEET/INI-CET, custom filters, and all 330+ questions.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Section 1: Exam Group */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="source" size={22} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Exam Sources
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.sectionDesc}>
              Select one or more exam pools to pull questions from.
            </Text>
            <View style={styles.chipsContainer}>
              {["AIIMS", "NEET", "INI-CET"].map((group) => {
                const isSelected = selectedExams.includes(group);
                const isLocked = !isPremium && group !== "AIIMS";
                const isVisuallySelected = isSelected && !isLocked;
                return (
                  <Chip
                    key={group}
                    selected={isVisuallySelected}
                    onPress={() => toggleExamSelection(group)}
                    style={[
                      styles.chip,
                      isVisuallySelected && styles.selectedChip,
                      isLocked && styles.lockedChip,
                    ]}
                    selectedColor={isVisuallySelected ? "#FFFFFF" : (isLocked ? "#9CA3AF" : theme.colors.textSecondary)}
                    showSelectedOverlay={false}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={isLocked ? "lock" : (isVisuallySelected ? "check" : "school-outline")}
                        size={16}
                        color={isVisuallySelected ? "#FFFFFF" : (isLocked ? "#9CA3AF" : theme.colors.textSecondary)}
                      />
                    )}
                  >
                    {group}
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Section 2: Question Status */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="filter-alt" size={22} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Question Status
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.sectionDesc}>
              Practice unattempted questions or review your mistakes.
            </Text>
            <View style={styles.chipsContainer}>
              {[
                { label: "All", value: "all", icon: "all-inclusive" },
                { label: "Unattempted", value: "unattempted", icon: "help-circle-outline" },
                { label: "Incorrect", value: "incorrect", icon: "close-circle-outline" },
                { label: "Correct", value: "correct", icon: "check-circle-outline" },
                { label: "Bookmarked", value: "bookmarked", icon: "bookmark-outline" },
              ].map((status) => {
                const isSelected = selectedStatus === status.value;
                const isLocked = !isPremium && status.value !== "all";
                const isVisuallySelected = isSelected && !isLocked;
                return (
                  <Chip
                    key={status.value}
                    selected={isVisuallySelected}
                    onPress={() => handleSelectStatus(status.value)}
                    style={[
                      styles.chip,
                      isVisuallySelected && styles.selectedChip,
                      isLocked && styles.lockedChip,
                    ]}
                    selectedColor={isVisuallySelected ? "#FFFFFF" : (isLocked ? "#9CA3AF" : theme.colors.textSecondary)}
                    showSelectedOverlay={false}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={isLocked ? "lock" : status.icon}
                        size={16}
                        color={isVisuallySelected ? "#FFFFFF" : (isLocked ? "#9CA3AF" : theme.colors.textSecondary)}
                      />
                    )}
                  >
                    {status.label}
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Section 3: Question Count */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="format-list-numbered" size={22} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Number of Questions
              </Text>
            </View>
            <View style={styles.chipsContainer}>
              {[5, 10, 15, 20, 30, 50].map((count) => {
                const isSelected = questionCount === count;
                const isLocked = !isPremium && count > 5;
                const isVisuallySelected = isSelected && !isLocked;
                return (
                  <Chip
                    key={count}
                    selected={isVisuallySelected}
                    onPress={() => handleSelectCount(count)}
                    style={[
                      styles.chipSmall,
                      isVisuallySelected && styles.selectedChip,
                      isLocked && styles.lockedChip,
                    ]}
                    selectedColor={isVisuallySelected ? "#FFFFFF" : (isLocked ? "#9CA3AF" : theme.colors.textSecondary)}
                    showSelectedOverlay={false}
                    icon={() =>
                      isLocked ? (
                        <MaterialCommunityIcons name="lock" size={12} color="#9CA3AF" />
                      ) : null
                    }
                  >
                    {count} Qs
                  </Chip>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Section 4: Mode */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="compass-outline" size={22} color={theme.colors.primary} />
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Practice Mode
              </Text>
            </View>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeOption,
                  mode === "study" && styles.selectedModeOption,
                ]}
                onPress={() => setMode("study")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="book-open-page-variant"
                  size={28}
                  color={mode === "study" ? theme.colors.primary : "#4B5563"}
                />
                <Text style={[styles.modeTitle, mode === "study" && styles.selectedModeText]}>
                  Study Mode
                </Text>
                <Text style={styles.modeDesc}>
                  Instant explanations after every answer. Perfect for learning.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeOption,
                  mode === "exam" && styles.selectedModeOption,
                  { marginLeft: 12 },
                ]}
                onPress={() => setMode("exam")}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="timer-outline"
                  size={28}
                  color={mode === "exam" ? theme.colors.primary : "#4B5563"}
                />
                <Text style={[styles.modeTitle, mode === "exam" && styles.selectedModeText]}>
                  Exam Mode
                </Text>
                <Text style={styles.modeDesc}>
                  Timed test without explanations until submission. Test your speed.
                </Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.summaryContainer}>
          <View style={styles.matchingStats}>
            <Text style={styles.matchingText}>
              Matching Questions: <Text style={styles.matchingBold}>{totalMatches}</Text>
            </Text>
            <Text style={styles.matchingText}>
              Selected for practice: <Text style={styles.matchingBold}>{Math.min(totalMatches, questionCount)}</Text>
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleCreateModule}
            style={styles.createButton}
            contentStyle={{ paddingVertical: 8 }}
            icon="play"
            disabled={totalMatches === 0}
          >
            Start Module
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.backgroundMain,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: "bold",
    color: theme.colors.textTitle,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  premiumBanner: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FCD34D",
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 0,
  },
  premiumBannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    fontWeight: "bold",
    color: "#92400E",
    fontSize: 15,
  },
  premiumDesc: {
    color: "#B45309",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginLeft: 8,
  },
  sectionDesc: {
    color: theme.colors.textTertiary,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    borderWidth: 0,
  },
  chipSmall: {
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 4,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
  },
  lockedChip: {
    opacity: 0.6,
    backgroundColor: "#E5E7EB",
  },
  modeContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  modeOption: {
    flex: 1,
    backgroundColor: theme.colors.surfaceTertiary,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "flex-start",
  },
  selectedModeOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  modeTitle: {
    fontWeight: "bold",
    color: theme.colors.textTitle,
    marginTop: 8,
    fontSize: 14,
  },
  selectedModeText: {
    color: theme.colors.primaryDark,
  },
  modeOptionContainer: {
    flexDirection: "row",
    width: "100%",
  },
  modeDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  summaryContainer: {
    marginTop: 10,
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  matchingStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  matchingText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  matchingBold: {
    fontWeight: "bold",
    color: theme.colors.textTitle,
  },
  createButton: {
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
  },
});

export default PYQCreateScreen;
