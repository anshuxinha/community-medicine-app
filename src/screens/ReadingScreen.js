import React, { useContext, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Speech from 'expo-speech';
import ReadingView from '../components/ReadingView';
import { AppContext } from '../context/AppContext';
import { theme } from '../styles/theme';

const ReadingScreen = ({ route, navigation }) => {
    const { id, title, content, quizzes } = route.params;
    const { markAsRead, isBookmarked, toggleBookmark } = useContext(AppContext);
    const [isSpeaking, setIsSpeaking] = React.useState(false);

    useEffect(() => {
        if (title) {
            markAsRead(title);
        }
    }, [title]);

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    const bookmarked = isBookmarked(title);

    const handleSpeak = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            // Strip markdown formatting for better reading
            const cleanText = content.replace(/[#*]/g, '');
            Speech.speak(cleanText, {
                onDone: () => setIsSpeaking(false),
                onError: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false)
            });
            setIsSpeaking(true);
        }
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
