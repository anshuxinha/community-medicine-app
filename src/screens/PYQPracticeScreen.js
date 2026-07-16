import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  BackHandler,
} from "react-native";
import {
  Text,
  Card,
  Button,
  IconButton,
  ProgressBar,
  Portal,
  Dialog,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme, useResponsive } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import { AppContext } from "../context/AppContext";
import { PYQ_IMAGES } from "../data/pyq_images_map";

const STORAGE_ATTEMPTS_KEY = "pyq_attempts_v1";
const STORAGE_BOOKMARKS_KEY = "pyq_bookmarks_v1";
const WINDOW_WIDTH = Dimensions.get("window").width;

const PYQPracticeScreen = ({ route, navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { questions, mode, title } = route.params;
  const { completeDailyGoal } = useContext(AppContext);
  const { isTablet, horizontalPadding, contentMaxWidth } = useResponsive();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: 'a'/'b'/'c'/'d' }
  const [studyRevealed, setStudyRevealed] = useState({}); // { [qId]: boolean } for study mode
  const [bookmarks, setBookmarks] = useState([]);
  
  // Timer & Test state
  const [timeRemaining, setTimeRemaining] = useState(questions.length * 60); // 60s per question
  const [testFinished, setTestFinished] = useState(false);
  const [confirmSubmitVisible, setConfirmSubmitVisible] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(null); // for review modal
  
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const actualDurationRef = useRef(0);

  // Back handler to warn user before exiting
  useEffect(() => {
    const backAction = () => {
      if (testFinished) {
        navigation.goBack();
        return true;
      }
      Alert.alert(
        "Exit Practice?",
        "Are you sure you want to exit? Your current progress will be lost.",
        [
          { text: "Cancel", onPress: () => null, style: "cancel" },
          { text: "Exit", onPress: () => navigation.goBack() },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [testFinished]);

  // Load bookmarks on mount
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_BOOKMARKS_KEY);
        if (stored) setBookmarks(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed to load PYQ bookmarks:", e);
      }
    };
    loadBookmarks();

    // Start timer for Exam Mode
    if (mode === "exam") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitTest(true); // Force submit when timer ends
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleBookmark = async (qId) => {
    let updated;
    if (bookmarks.includes(qId)) {
      updated = bookmarks.filter((id) => id !== qId);
    } else {
      updated = [...bookmarks, qId];
    }
    setBookmarks(updated);
    try {
      await AsyncStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save bookmarks:", e);
    }
  };

  const handleSelectOption = (qId, optionLetter) => {
    if (testFinished) return;

    if (mode === "study") {
      // In study mode, once answered, you cannot change it
      if (studyRevealed[qId]) return;
      
      setSelectedAnswers({ ...selectedAnswers, [qId]: optionLetter });
      setStudyRevealed({ ...studyRevealed, [qId]: true });
    } else {
      // In exam mode, you can change answer as many times as you like
      setSelectedAnswers({ ...selectedAnswers, [qId]: optionLetter });
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitTest = async (force = false) => {
    setConfirmSubmitVisible(false);
    if (timerRef.current) clearInterval(timerRef.current);

    actualDurationRef.current = Math.round((Date.now() - startTimeRef.current) / 1000);

    // Save attempts to local history
    try {
      const storedAttempts = await AsyncStorage.getItem(STORAGE_ATTEMPTS_KEY) || "{}";
      const attempts = JSON.parse(storedAttempts);

      let correctCount = 0;
      questions.forEach((q) => {
        const selected = selectedAnswers[q.id];
        const isCorrect = selected === q.correctAnswer;
        if (isCorrect) correctCount++;

        // Only save/overwrite if it wasn't previously correct (to allow repeating until correct)
        const prev = attempts[q.id];
        if (!prev || prev.correct !== true) {
          attempts[q.id] = {
            correct: isCorrect,
            selected: selected || null,
            attemptedAt: Date.now(),
          };
        }
      });

      await AsyncStorage.setItem(STORAGE_ATTEMPTS_KEY, JSON.stringify(attempts));

      // Award Study Stars (points) for finishing
      const starReward = correctCount * 2; // 2 stars per correct answer
      completeDailyGoal(starReward);

    } catch (e) {
      console.warn("Failed to save test attempts:", e);
    }

    setTestFinished(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const currentQ = questions[currentIdx];
  const isBookmarked = bookmarks.includes(currentQ?.id);
  const selectedOpt = selectedAnswers[currentQ?.id];
  const isRevealed = mode === "study" && studyRevealed[currentQ?.id];

  // Calculate results stats
  const totalCorrect = questions.reduce((acc, q) => {
    return acc + (selectedAnswers[q.id] === q.correctAnswer ? 1 : 0);
  }, 0);
  const accuracyPercent = Math.round((totalCorrect / questions.length) * 100);

  // Result screen layout
  if (testFinished) {
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
          <View style={styles.resultHeader}>
            <Text variant="headlineMedium" style={styles.resultTitle}>
              Practice Completed
            </Text>
            <Text variant="bodyMedium" style={styles.resultSubtitle}>
              Here is your performance breakdown. Practice makes perfect!
            </Text>
          </View>

          <Card style={styles.scoreCard}>
            <Card.Content style={styles.scoreContent}>
              <View style={styles.scoreCircle}>
                <Text variant="displaySmall" style={styles.scoreText}>
                  {accuracyPercent}%
                </Text>
                <Text variant="labelMedium" style={styles.scoreSubtext}>
                  Accuracy
                </Text>
              </View>

              <View style={styles.statsColumn}>
                <View style={styles.statRow}>
                  <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
                  <Text style={styles.statText}>
                    Correct: <Text style={styles.statBold}>{totalCorrect} / {questions.length}</Text>
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <MaterialIcons name="cancel" size={20} color={theme.colors.error} />
                  <Text style={styles.statText}>
                    Incorrect: <Text style={styles.statBold}>{questions.length - totalCorrect}</Text>
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <MaterialIcons name="timer" size={20} color={theme.colors.secondary} />
                  <Text style={styles.statText}>
                    Time: <Text style={styles.statBold}>{formatTime(actualDurationRef.current)}</Text>
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <Text variant="titleMedium" style={styles.reviewHeader}>
            Question Review
          </Text>

          {questions.map((q, idx) => {
            const userAns = selectedAnswers[q.id];
            const isCorrect = userAns === q.correctAnswer;
            return (
              <Card
                key={q.id}
                style={[
                  styles.reviewItemCard,
                  { borderLeftColor: isCorrect ? theme.colors.success : theme.colors.error },
                ]}
                onPress={() => setReviewIdx(idx)}
              >
                <Card.Content style={styles.reviewItemContent}>
                  <View style={styles.reviewItemHeader}>
                    <Text style={styles.reviewItemNumber}>Q{idx + 1}</Text>
                    <MaterialIcons
                      name={isCorrect ? "check-circle" : "cancel"}
                      size={22}
                      color={isCorrect ? theme.colors.success : theme.colors.error}
                    />
                  </View>
                  <Text numberOfLines={2} style={styles.reviewItemText}>
                    {q.question}
                  </Text>
                  <Text variant="bodySmall" style={styles.reviewItemExam}>
                    {q.exam}
                  </Text>
                </Card.Content>
              </Card>
            );
          })}

          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.doneButton}
            contentStyle={{ paddingVertical: 8 }}
          >
            Create New Module
          </Button>
        </ScrollView>

        {/* Detailed Question Review Dialog */}
        <Portal>
          <Dialog
            visible={reviewIdx !== null}
            onDismiss={() => setReviewIdx(null)}
            style={styles.reviewDialog}
          >
            <Dialog.Title style={styles.reviewDialogTitle}>
              Review Question {reviewIdx !== null ? reviewIdx + 1 : ""}
            </Dialog.Title>
            <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
              {reviewIdx !== null && (
                <ScrollView contentContainerStyle={styles.dialogScrollContent}>
                  <Text style={styles.dialogQuestion}>{questions[reviewIdx].question}</Text>

                  {questions[reviewIdx].image && PYQ_IMAGES[questions[reviewIdx].image] && (
                    <Image
                      source={PYQ_IMAGES[questions[reviewIdx].image]}
                      style={styles.dialogImage}
                      resizeMode="contain"
                    />
                  )}

                  <View style={styles.optionsContainer}>
                    {questions[reviewIdx].options.map((opt, i) => {
                      const letter = ["a", "b", "c", "d"][i];
                      const isCorrectOpt = letter === questions[reviewIdx].correctAnswer;
                      const isUserSelected = letter === selectedAnswers[questions[reviewIdx].id];

                      let rowStyle = styles.optionRow;
                      let labelStyle = styles.optionLabel;

                      if (isCorrectOpt) {
                        rowStyle = [styles.optionRow, styles.correctOptionRow];
                        labelStyle = [styles.optionLabel, styles.correctOptionText];
                      } else if (isUserSelected && !isCorrectOpt) {
                        rowStyle = [styles.optionRow, styles.incorrectOptionRow];
                        labelStyle = [styles.optionLabel, styles.incorrectOptionText];
                      }

                      return (
                        <View key={i} style={rowStyle}>
                          <View
                            style={[
                              styles.optionCircle,
                              isCorrectOpt && styles.correctOptionCircle,
                              isUserSelected && !isCorrectOpt && styles.incorrectOptionCircle,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionCircleText,
                                (isCorrectOpt || isUserSelected) && { color: "#FFFFFF" },
                              ]}
                            >
                              {letter.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={labelStyle}>{opt}</Text>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ marginVertical: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }} />

                  <View style={styles.explanationSection}>
                    <Text style={styles.explanationHeader}>Detailed Explanation</Text>
                    <Text style={styles.explanationText}>{questions[reviewIdx].explanation}</Text>
                  </View>
                </ScrollView>
              )}
            </Dialog.ScrollArea>
            <Dialog.Actions>
              <Button onPress={() => setReviewIdx(null)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </SafeAreaView>
    );
  }

  // Practice session layout
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Session progress and timer header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textTitle} />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Q {currentIdx + 1} of {questions.length}
          </Text>
          <ProgressBar
            progress={(currentIdx + 1) / questions.length}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
        </View>

        {mode === "exam" ? (
          <View style={styles.timerContainer}>
            <MaterialIcons name="timer" size={16} color={theme.colors.primary} />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
        ) : (
          <IconButton
            icon={isBookmarked ? "bookmark" : "bookmark-outline"}
            iconColor={isBookmarked ? theme.colors.primary : theme.colors.textSecondary}
            size={24}
            onPress={() => toggleBookmark(currentQ.id)}
          />
        )}
      </View>

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
        <Card style={styles.questionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.questionText}>
              {currentQ.question}
            </Text>

            {/* Render question image if present */}
            {currentQ.image && PYQ_IMAGES[currentQ.image] && (
              <View style={styles.imageWrapper}>
                <Image
                  source={PYQ_IMAGES[currentQ.image]}
                  style={styles.questionImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.optionsList}>
              {currentQ.options.map((optionText, i) => {
                const letter = ["a", "b", "c", "d"][i];
                const isSelected = selectedOpt === letter;
                const isCorrect = letter === currentQ.correctAnswer;

                let rowStyle = styles.optionRow;
                let labelStyle = styles.optionLabel;

                // Color coding for options based on state
                if (mode === "study" && isRevealed) {
                  if (isCorrect) {
                    rowStyle = [styles.optionRow, styles.correctOptionRow];
                    labelStyle = [styles.optionLabel, styles.correctOptionText];
                  } else if (isSelected && !isCorrect) {
                    rowStyle = [styles.optionRow, styles.incorrectOptionRow];
                    labelStyle = [styles.optionLabel, styles.incorrectOptionText];
                  }
                } else {
                  if (isSelected) {
                    rowStyle = [styles.optionRow, styles.selectedOptionRow];
                    labelStyle = [styles.optionLabel, styles.selectedOptionText];
                  }
                }

                return (
                  <TouchableOpacity
                    key={i}
                    style={rowStyle}
                    onPress={() => handleSelectOption(currentQ.id, letter)}
                    activeOpacity={0.7}
                    disabled={isRevealed}
                  >
                    <View
                      style={[
                        styles.optionCircle,
                        isSelected && styles.selectedOptionCircle,
                        mode === "study" && isRevealed && isCorrect && styles.correctOptionCircle,
                        mode === "study" && isRevealed && isSelected && !isCorrect && styles.incorrectOptionCircle,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionCircleText,
                          (isSelected || (mode === "study" && isRevealed && isCorrect)) && { color: "#FFFFFF" },
                        ]}
                      >
                        {letter.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={labelStyle}>{optionText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Study Mode Explanation slide-reveal */}
        {mode === "study" && isRevealed && (
          <Card style={styles.explanationCard}>
            <Card.Content>
              <View style={styles.explanationHeaderRow}>
                <MaterialCommunityIcons
                  name={selectedOpt === currentQ.correctAnswer ? "check-decagram" : "alert-decagram"}
                  size={24}
                  color={selectedOpt === currentQ.correctAnswer ? theme.colors.success : theme.colors.error}
                />
                <Text style={styles.explanationHeaderTitle}>
                  {selectedOpt === currentQ.correctAnswer ? "Correct Answer!" : "Incorrect"}
                </Text>
              </View>
              <Text style={styles.explanationBodyText}>{currentQ.explanation}</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.navRow}>
          <Button
            mode="outlined"
            onPress={handlePrev}
            disabled={currentIdx === 0}
            style={styles.navButton}
            labelStyle={{ color: currentIdx === 0 ? "#9CA3AF" : theme.colors.primary }}
          >
            Previous
          </Button>

          {currentIdx === questions.length - 1 ? (
            mode === "study" ? (
              <Button
                mode="contained"
                onPress={() => handleSubmitTest(false)}
                style={styles.submitButton}
                buttonColor="#000000"
              >
                Submit Module
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleNext}
                disabled={true}
                style={styles.navButton}
              >
                Next
              </Button>
            )
          ) : (
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.navButton}
            >
              Next
            </Button>
          )}
        </View>

        {mode === "exam" && (
          <Button
            mode="contained"
            onPress={() => setConfirmSubmitVisible(true)}
            style={styles.examSubmitBelowButton}
            contentStyle={{ paddingVertical: 4 }}
            buttonColor="#000000"
          >
            Submit Test
          </Button>
        )}
      </View>

      {/* Confirm Submit Dialog */}
      <Portal>
        <Dialog
          visible={confirmSubmitVisible}
          onDismiss={() => setConfirmSubmitVisible(false)}
          style={{ backgroundColor: theme.colors.surfacePrimary }}
        >
          <Dialog.Title>Submit Test?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              You have answered {Object.keys(selectedAnswers).length} of {questions.length} questions.
              Are you sure you want to submit and view your results?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmSubmitVisible(false)}>Cancel</Button>
            <Button onPress={() => handleSubmitTest(false)} textColor={theme.colors.error}>
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surfacePrimary,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E9FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    color: colors.primaryDark,
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 4,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  questionCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 16,
  },
  questionText: {
    fontWeight: "800",
    color: colors.textTitle,
    lineHeight: 24,
    marginBottom: 16,
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 12,
    padding: 8,
    height: 220,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  questionImage: {
    width: "100%",
    height: "100%",
  },
  optionsList: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceTertiary,
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  selectedOptionRow: {
    backgroundColor: "#EDE9FE",
    borderColor: colors.primary,
  },
  correctOptionRow: {
    backgroundColor: "#D1FAE5",
    borderColor: colors.success,
  },
  incorrectOptionRow: {
    backgroundColor: "#FEE2E2",
    borderColor: colors.error,
  },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedOptionCircle: {
    backgroundColor: colors.primary,
  },
  correctOptionCircle: {
    backgroundColor: colors.success,
  },
  incorrectOptionCircle: {
    backgroundColor: colors.error,
  },
  optionCircleText: {
    fontWeight: "bold",
    fontSize: 13,
    color: colors.textTitle,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  selectedOptionText: {
    color: colors.primaryDark,
    fontWeight: "bold",
  },
  correctOptionText: {
    color: "#065F46",
    fontWeight: "bold",
  },
  incorrectOptionText: {
    color: "#991B1B",
    fontWeight: "bold",
  },
  explanationCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  explanationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  explanationHeaderTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textTitle,
    marginLeft: 8,
  },
  explanationBodyText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  footerContainer: {
    padding: 16,
    backgroundColor: colors.surfacePrimary,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 10,
  },
  submitButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 10,
    backgroundColor: "#000000",
  },
  examSubmitBelowButton: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: "#000000",
    marginHorizontal: 6,
  },

  // Results Screen Styles
  resultHeader: {
    marginBottom: 20,
  },
  resultTitle: {
    fontWeight: "bold",
    color: colors.textTitle,
  },
  resultSubtitle: {
    color: colors.textSecondary,
    marginTop: 6,
  },
  scoreCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    marginBottom: 24,
  },
  scoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontWeight: "bold",
    color: colors.primary,
  },
  scoreSubtext: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 2,
  },
  statsColumn: {
    justifyContent: "center",
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  statBold: {
    fontWeight: "bold",
    color: colors.textTitle,
  },
  reviewHeader: {
    fontWeight: "bold",
    color: colors.textTitle,
    marginBottom: 12,
  },
  reviewItemCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 12,
    borderLeftWidth: 5,
    marginBottom: 10,
    elevation: 1,
  },
  reviewItemContent: {
    paddingVertical: 10,
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewItemNumber: {
    fontWeight: "bold",
    color: colors.textTitle,
    fontSize: 13,
  },
  reviewItemText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: 4,
  },
  reviewItemExam: {
    fontSize: 11,
    color: colors.textTertiary,
    alignSelf: "flex-end",
  },
  doneButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },

  // Review Dialog Styles
  reviewDialog: {
    maxHeight: "85%",
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
  },
  reviewDialogTitle: {
    fontWeight: "bold",
    color: colors.textTitle,
  },
  dialogScrollContent: {
    padding: 16,
  },
  dialogQuestion: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.textTitle,
    lineHeight: 22,
    marginBottom: 12,
  },
  dialogImage: {
    width: "100%",
    height: 180,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 10,
    marginBottom: 16,
  },
  explanationSection: {
    backgroundColor: colors.surfaceTertiary,
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  explanationHeader: {
    fontWeight: "bold",
    color: colors.primary,
    fontSize: 13,
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default PYQPracticeScreen;
