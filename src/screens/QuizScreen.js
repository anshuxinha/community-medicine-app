import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, RadioButton } from 'react-native-paper';
import { AppContext } from '../context/AppContext';

const QuizScreen = ({ route, navigation }) => {
    const { title, quizzes } = route.params;
    const { completeQuiz } = useContext(AppContext);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    if (!quizzes || quizzes.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text variant="titleMedium">No quiz found for this topic.</Text>
                <Button mode="contained" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                    Go Back
                </Button>
            </View>
        );
    }

    const currentQuiz = quizzes[currentQuestionIndex];

    const handleNext = () => {
        if (selectedAnswer === currentQuiz.correctAnswer) {
            setScore(score + 10);
        }

        if (currentQuestionIndex < quizzes.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedAnswer(null);
        } else {
            // Quiz finished
            const finalScore = selectedAnswer === currentQuiz.correctAnswer ? score + 10 : score;
            completeQuiz(finalScore);
            setQuizFinished(true);
        }
    };

    if (quizFinished) {
        return (
            <View style={styles.centerContainer}>
                <Card style={styles.resultCard}>
                    <Card.Content style={styles.centerContent}>
                        <Text variant="displayMedium">🎉</Text>
                        <Text variant="headlineSmall" style={styles.titleText}>Quiz Complete!</Text>
                        <Text variant="titleMedium">You earned {score} Study Stars</Text>
                    </Card.Content>
                    <Card.Actions style={styles.centerActions}>
                        <Button mode="contained" onPress={() => navigation.navigate('Library')}>
                            Back to Library
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Text variant="titleMedium" style={styles.progressText}>
                Question {currentQuestionIndex + 1} of {quizzes.length}
            </Text>

            <Card style={styles.questionCard}>
                <Card.Content>
                    <Text variant="titleLarge" style={styles.questionText}>
                        {currentQuiz.question}
                    </Text>

                    <View style={styles.optionsContainer}>
                        <RadioButton.Group
                            onValueChange={newValue => setSelectedAnswer(newValue)}
                            value={selectedAnswer}
                        >
                            {currentQuiz.options.map((option, index) => (
                                <View key={index} style={styles.optionRow}>
                                    <RadioButton value={option} color="#6200ee" />
                                    <Text style={styles.optionText}>{option}</Text>
                                </View>
                            ))}
                        </RadioButton.Group>
                    </View>
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={handleNext}
                disabled={!selectedAnswer}
                style={styles.nextButton}
            >
                {currentQuestionIndex < quizzes.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    progressText: {
        color: '#6750a4',
        marginBottom: 16,
        fontWeight: 'bold',
    },
    questionCard: {
        backgroundColor: '#ffffff',
        elevation: 2,
        marginBottom: 24,
    },
    questionText: {
        fontWeight: 'bold',
        color: '#1c1b1f',
        marginBottom: 16,
        lineHeight: 28,
    },
    optionsContainer: {
        marginTop: 8,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    optionText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#49454f',
        flexShrink: 1,
    },
    nextButton: {
        paddingVertical: 6,
    },
    resultCard: {
        width: '100%',
        backgroundColor: '#ffffff',
        elevation: 3,
        padding: 16,
    },
    centerContent: {
        alignItems: 'center',
    },
    titleText: {
        fontWeight: 'bold',
        marginVertical: 12,
        color: '#1c1b1f',
    },
    centerActions: {
        justifyContent: 'center',
        marginTop: 16,
    }
});

export default QuizScreen;
