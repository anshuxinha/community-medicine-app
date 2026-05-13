import React, { useContext, useMemo, useRef, useEffect, useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import * as Speech from "expo-speech";
import ReadingView from "../components/ReadingView";
import { AppContext } from "../context/AppContext";
import { theme } from "../styles/theme";
import { buildSpeechChunks, buildSpeechText } from "../utils/tts";
import {
  getContentKey,
  getContentSignature,
  getCurrentContentEntry,
  getItemStatus,
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

const ReadingScreen = ({ route, navigation }) => {
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
  const [annotations, setAnnotations] = useState([]);
  const [userHighlights, setUserHighlights] = useState({});

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

  const handleReachEnd = () => {
    if (effectiveTitle && effectiveContentKey && effectiveContentSignature) {
      markAsRead({
        itemTitle: effectiveTitle,
        contentKey: effectiveContentKey,
        contentSignature: effectiveContentSignature,
      });
    }
  };

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
});

export default ReadingScreen;
