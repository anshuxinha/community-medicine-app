import React, { useContext, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import ReadingView from '../components/ReadingView';
import { AppContext } from '../context/AppContext';

const ReadingScreen = ({ route, navigation }) => {
    const { id, title, content, quizzes } = route.params;
    const { markAsRead, isBookmarked, toggleBookmark } = useContext(AppContext);
    const insets = useSafeAreaInsets();
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
        backgroundColor: '#f0f0f0',
    }
});

export default ReadingScreen;
