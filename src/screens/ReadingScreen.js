import React from 'react';
import { View, StyleSheet } from 'react-native';
import ReadingView from '../components/ReadingView';

const ReadingScreen = ({ route }) => {
    const { content } = route.params;

    return (
        <View style={styles.container}>
            <ReadingView content={content} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
});

export default ReadingScreen;
