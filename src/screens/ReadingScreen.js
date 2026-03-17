import React, { useContext, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import ReadingView from '../components/ReadingView';
import { AppContext } from '../context/AppContext';
import { theme } from '../styles/theme';
import { buildSpeechChunks, buildSpeechText } from '../utils/tts';

const ReadingScreen = ({ route, navigation }) => {
    const { id, title, content, quizzes } = route.params;
    const { markAsRead, isBookmarked, toggleBookmark } = useContext(AppContext);
    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const speechSessionRef = useRef(0);
    const speechQueueRef = useRef([]);

    useEffect(() => {
        if (title) {
            markAsRead(title);
        }
    }, [title]);

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
            }
        });
    };

    useEffect(() => {
        return () => {
            stopSpeech();
        };
    }, []);

    const bookmarked = isBookmarked(title);

    const handleSpeak = () => {
        if (isSpeaking) {
            stopSpeech();
            return;
        }

        const speechText = buildSpeechText({ title, content });
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
                content={content}
                title={title}
                topicId={id}
                isBookmarked={bookmarked}
                onToggleBookmark={() => toggleBookmark(route.params)}
                isSpeaking={isSpeaking}
                onToggleSpeak={handleSpeak}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundMain,
    }
});

export default ReadingScreen;
