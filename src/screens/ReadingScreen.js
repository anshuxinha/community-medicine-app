import React, { useContext, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import ReadingView from '../components/ReadingView';
import { AppContext } from '../context/AppContext';
import { theme } from '../styles/theme';
import { buildSpeechChunks, buildSpeechText } from '../utils/tts';
import {
    getContentKey,
    getContentSignature,
    getCurrentContentEntry,
    getItemStatus,
    getUpdatedSegmentsForItem,
} from '../utils/contentRegistry';
import { getTopicIllustrations } from '../services/topicIllustrations';

const ReadingScreen = ({ route }) => {
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
    } = route.params;

    const { markAsRead, isBookmarked, toggleBookmark, readItemVersions } = useContext(AppContext);
    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const speechSessionRef = useRef(0);
    const speechQueueRef = useRef([]);

    const currentEntry = useMemo(() => getCurrentContentEntry(route.params), [route.params]);
    const currentItem = currentEntry?.item || null;

    const effectiveSection = currentEntry?.section || section || null;
    const effectiveId = currentItem?.id || id;
    const effectiveTitle = currentItem?.title || title;
    const effectiveContent = currentItem?.content || content;
    const effectiveQuizzes = currentItem?.quizzes || quizzes;
    const effectiveContentKey = contentKey || (effectiveSection ? getContentKey(effectiveSection, effectiveId) : null);
    const effectiveContentSignature = contentSignature || getContentSignature(currentItem || route.params);
    const effectiveUpdatedSegments = currentItem ? getUpdatedSegmentsForItem(currentItem) : (updatedSegments || []);
    const [topicIllustrations, setTopicIllustrations] = React.useState([]);
    const [sessionHighlightUpdates] = React.useState(() => {
        if (showUpdateHighlights === true) {
            return true;
        }
        if (!effectiveSection || !currentItem) {
            return false;
        }
        return getItemStatus(currentItem, effectiveSection, readItemVersions) === 'updated';
    });

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

    React.useEffect(() => () => {
        stopSpeech();
    }, []);

    React.useEffect(() => {
        let isMounted = true;

        const loadIllustrations = async () => {
            if (!effectiveSection || effectiveId === undefined || effectiveId === null) {
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

            if (isMounted) {
                setTopicIllustrations(illustrations);
            }
        };

        loadIllustrations();

        return () => {
            isMounted = false;
        };
    }, [effectiveSection, effectiveId, effectiveContentKey]);

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

        const speechText = buildSpeechText({ title: effectiveTitle, content: effectiveContent });
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

    return (
        <View style={styles.container}>
            <ReadingView
                content={effectiveContent}
                title={effectiveTitle}
                topicId={effectiveId}
                isBookmarked={bookmarked}
                onToggleBookmark={() => toggleBookmark(bookmarkPayload)}
                isSpeaking={isSpeaking}
                onToggleSpeak={handleSpeak}
                highlightedSegments={effectiveUpdatedSegments}
                showUpdateHighlights={sessionHighlightUpdates}
                illustrations={topicIllustrations}
                onReachEnd={handleReachEnd}
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
