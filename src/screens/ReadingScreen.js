import React, { useContext, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Platform, Vibration } from "react-native";
import * as Speech from "expo-speech";
import ReadingView from "../components/ReadingView";
import ChapterCompleteSheet from "../components/ChapterCompleteSheet";
import { AppContext } from "../context/AppContext";
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import { buildSpeechChunks, buildSpeechText } from "../utils/tts";
import {
  getContentKey,
  getContentSignature,
  getCurrentContentEntry,
  getItemStatus,
  getNextUnreadLeafEntry,
  getUpdatedSegmentsForItem,
} from "../utils/contentRegistry";
import { getTopicIllustrations } from "../services/topicIllustrations";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import {
  subscribeAnnotations,
  saveAnnotations,
} from "../services/annotationService";
import {
  subscribeHighlights,
  saveHighlights,
} from "../services/highlightService";

const isFreeLibraryItem = (item) =>
  String(item?.id) === "1" || item?.title === "Man and Medicine";

const buildReadingParamsFromEntry = (entry) => {
  const item = entry?.item || {};
  const section = entry.section;
  const status = "none";
  return {
    id: item.id,
    title: item.title,
    content: item.content || "# No Content\n\nThis topic has no content yet.",
    quizzes: item.quizzes,
    section,
    contentKey: entry.key || getContentKey(section, item.id),
    contentSignature: entry.signature || getContentSignature(item),
    updatedSegments: getUpdatedSegmentsForItem(item),
    showUpdateHighlights: status === "updated",
  };
};

const triggerCompleteHaptic = () => {
  try {
    if (Platform.OS === "android") {
      Vibration.vibrate(20);
    } else if (Platform.OS === "ios") {
      Vibration.vibrate();
    }
  } catch {
    // Haptics are optional; ignore failures.
  }
};

const ReadingScreen = ({ route, navigation }) => {
  const { styles, colors } = useThemedStyles(createStyles);

  const {
    id,
    title,
    content,
    quizzes,
    section,
    contentKey,
    contentSignature,
    updatedSegments,
    showUpdateHighlights,
    searchTerms = "",
    isGem = false,
  } = route.params;

  const {
    markAsRead,
    isBookmarked,
    toggleBookmark,
    readItemVersions,
    isScreenCapturePrevented,
    contentRegistryVersion,
    user,
  } = useContext(AppContext);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSessionRef = useRef(0);
  const speechQueueRef = useRef([]);
  const openedUpdateRef = useRef(false);
  const [annotations, setAnnotations] = useState([]);
  const [userHighlights, setUserHighlights] = useState({});
  const [celebration, setCelebration] = useState(null);

  const currentEntry = useMemo(
    () => getCurrentContentEntry(route.params),
    [route.params, contentRegistryVersion],
  );
  const currentItem = currentEntry?.item || null;

  const effectiveSection = currentEntry?.section || section || null;
  const effectiveId = currentItem?.id || id;
  const effectiveTitle = currentItem?.title || title;
  const effectiveContent = currentItem?.content || content;
  const effectiveQuizzes = currentItem?.quizzes || quizzes;
  const effectiveContentKey =
    contentKey ||
    (effectiveSection ? getContentKey(effectiveSection, effectiveId) : null);
  const effectiveContentSignature =
    contentSignature || getContentSignature(currentItem || route.params);
  const effectiveUpdatedSegments = currentItem
    ? getUpdatedSegmentsForItem(currentItem)
    : updatedSegments || [];
  const [topicIllustrations, setTopicIllustrations] = useState([]);
  const [sessionHighlightUpdates] = useState(() => {
    if (showUpdateHighlights === true) {
      return true;
    }
    if (!effectiveSection || !currentItem) {
      return false;
    }
    return (
      getItemStatus(currentItem, effectiveSection, readItemVersions) ===
      "updated"
    );
  });


  // ── Annotations ──
  useEffect(() => {
    if (!user?.uid || !effectiveContentKey) return;
    
    const unsubscribe = subscribeAnnotations(user.uid, effectiveContentKey, (serverData) => {
      setAnnotations(serverData);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, effectiveContentKey]);

  // ── Highlights ──
  useEffect(() => {
    if (!user?.uid || !effectiveContentKey) return;
    
    const unsubscribe = subscribeHighlights(user.uid, effectiveContentKey, (serverData) => {
      setUserHighlights(serverData);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.uid, effectiveContentKey]);

  const handleToggleHighlight = useCallback(
    (key) => {
      setUserHighlights((prev) => {
        const next = { ...prev };
        if (next[key]) {
          delete next[key];
        } else {
          next[key] = true;
        }
        if (user?.uid && effectiveContentKey) {
          saveHighlights(user.uid, effectiveContentKey, next);
        }
        return next;
      });
    },
    [user?.uid, effectiveContentKey],
  );

  const handleSaveAnnotation = useCallback(
    (annotation) => {
      setAnnotations((prev) => {
        const existing = prev.findIndex((a) => a.id === annotation.id);
        const next =
          existing >= 0
            ? prev.map((a) => (a.id === annotation.id ? annotation : a))
            : [...prev, annotation];
        if (user?.uid && effectiveContentKey) {
          saveAnnotations(user.uid, effectiveContentKey, next);
        }
        return next;
      });
    },
    [user?.uid, effectiveContentKey],
  );

  const handleDeleteAnnotation = useCallback(
    (annotationId) => {
      setAnnotations((prev) => {
        const next = prev.filter((a) => a.id !== annotationId);
        if (user?.uid && effectiveContentKey) {
          saveAnnotations(user.uid, effectiveContentKey, next);
        }
        return next;
      });
    },
    [user?.uid, effectiveContentKey],
  );

  // ── TTS ──
  const stopSpeech = () => {
    speechSessionRef.current += 1;
    speechQueueRef.current = [];
    Speech.stop();
    setIsSpeaking(false);
  };

  const speakNextChunk = (sessionId) => {
    const [nextChunk, ...remainingChunks] = speechQueueRef.current;

    if (!nextChunk) {
      if (speechSessionRef.current === sessionId) {
        setIsSpeaking(false);
      }
      return;
    }

    speechQueueRef.current = remainingChunks;
    Speech.speak(nextChunk, {
      onDone: () => {
        if (speechSessionRef.current === sessionId) {
          speakNextChunk(sessionId);
        }
      },
      onError: () => {
        if (speechSessionRef.current === sessionId) {
          stopSpeech();
        }
      },
      onStopped: () => {
        if (speechSessionRef.current === sessionId) {
          setIsSpeaking(false);
        }
      },
    });
  };

  useEffect(
    () => () => {
      stopSpeech();
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadIllustrations = async () => {
      if (
        !effectiveSection ||
        effectiveId === undefined ||
        effectiveId === null
      ) {
        if (isMounted) {
          setTopicIllustrations([]);
        }
        return;
      }

      const illustrations = await getTopicIllustrations({
        section: effectiveSection,
        topicId: effectiveId,
        contentKey: effectiveContentKey,
      });

      console.log(
        "ReadingScreen: illustrations fetched for",
        {
          section: effectiveSection,
          topicId: effectiveId,
          contentKey: effectiveContentKey,
        },
        illustrations,
      );
      if (isMounted) {
        setTopicIllustrations(illustrations);
      }
    };

    loadIllustrations();

    return () => {
      isMounted = false;
    };
  }, [effectiveSection, effectiveId, effectiveContentKey]);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  const bookmarkPayload = {
    ...route.params,
    id: effectiveId,
    title: effectiveTitle,
    content: effectiveContent,
    quizzes: effectiveQuizzes,
    section: effectiveSection,
    contentKey: effectiveContentKey,
  };

  const bookmarked = isBookmarked(bookmarkPayload);

  useEffect(() => {
    if (
      !openedUpdateRef.current &&
      sessionHighlightUpdates &&
      effectiveTitle &&
      effectiveContentKey &&
      effectiveContentSignature
    ) {
      openedUpdateRef.current = true;
      markAsRead({
        itemTitle: effectiveTitle,
        contentKey: effectiveContentKey,
        contentSignature: effectiveContentSignature,
      });
    }
  }, [
    effectiveContentKey,
    effectiveContentSignature,
    effectiveTitle,
    sessionHighlightUpdates,
  ]);

  const handleReachEnd = () => {
    if (!effectiveTitle || !effectiveContentKey || !effectiveContentSignature) {
      return;
    }

    const result = markAsRead({
      itemTitle: effectiveTitle,
      contentKey: effectiveContentKey,
      contentSignature: effectiveContentSignature,
    });

    if (!result?.didComplete || isGem) {
      return;
    }

    const nextEntry = getNextUnreadLeafEntry(
      result.contentKey,
      result.readItemVersions || {},
    );

    triggerCompleteHaptic();
    setCelebration({
      title: result.itemTitle || effectiveTitle,
      previousProgress: result.previousProgress || 0,
      nextProgress: result.nextProgress || 0,
      currentStreak: result.currentStreak || 0,
      showStreakChip: Boolean(result.streakIncremented),
      nextEntry,
    });
  };

  const dismissCelebration = useCallback(() => {
    setCelebration(null);
  }, []);

  const handleBackToLibrary = useCallback(() => {
    setCelebration(null);
    navigation.navigate("MainTabs", { screen: "Library" });
  }, [navigation]);

  const handleNextChapter = useCallback(() => {
    const nextEntry = celebration?.nextEntry;
    setCelebration(null);
    if (!nextEntry?.item) {
      return;
    }

    const readingParams = buildReadingParamsFromEntry(nextEntry);
    if (isFreeLibraryItem(nextEntry.item)) {
      navigation.replace("Reading", readingParams);
      return;
    }

    navigation.replace("PremiumGuard", {
      destination: "Reading",
      readingParams,
    });
  }, [celebration, navigation]);

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const speechText = buildSpeechText({
      title: effectiveTitle,
      content: effectiveContent,
    });
    const speechChunks = buildSpeechChunks(speechText);
    if (speechChunks.length === 0) {
      return;
    }

    Speech.stop();
    const sessionId = speechSessionRef.current + 1;
    speechSessionRef.current = sessionId;
    speechQueueRef.current = speechChunks;
    setIsSpeaking(true);
    speakNextChunk(sessionId);
  };

  const headerTitle = isGem ? (effectiveTitle || title) : (effectiveId ? `Chapter ${effectiveId}` : effectiveSection || "");

  return (
    <View style={styles.container}>
      <ReadingView
        content={effectiveContent}
        title={effectiveTitle}
        headerTitle={headerTitle}
        topicId={effectiveId}
        isGem={isGem}
        isBookmarked={bookmarked}
        onToggleBookmark={() => toggleBookmark(bookmarkPayload)}
        isSpeaking={isSpeaking}
        onToggleSpeak={handleSpeak}
        highlightedSegments={effectiveUpdatedSegments}
        showUpdateHighlights={sessionHighlightUpdates}
        illustrations={topicIllustrations}
        onReachEnd={handleReachEnd}
        isScreenCapturePrevented={isScreenCapturePrevented}
        navigation={navigation}
        section={effectiveSection}
        annotations={annotations}
        onSaveAnnotation={handleSaveAnnotation}
        onDeleteAnnotation={handleDeleteAnnotation}
        userHighlights={userHighlights}
        onToggleHighlight={handleToggleHighlight}
        searchTerms={searchTerms}
        contentKey={effectiveContentKey}
      />
      <ChapterCompleteSheet
        visible={Boolean(celebration)}
        title={celebration?.title}
        previousProgress={celebration?.previousProgress}
        nextProgress={celebration?.nextProgress}
        currentStreak={celebration?.currentStreak}
        showStreakChip={celebration?.showStreakChip}
        nextChapterTitle={celebration?.nextEntry?.title || null}
        onNextChapter={
          celebration?.nextEntry ? handleNextChapter : undefined
        }
        onBackToLibrary={handleBackToLibrary}
        onDismiss={dismissCelebration}
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundMain,
  },
});

export default ReadingScreen;
