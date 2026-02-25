import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import { TextInput, Button, Card, Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import mockData from '../data/mockData.json';
import practicalData from '../data/practical.json';

// Step 3: Textbook Context Optimization
// Instead of sending the entire textbook, we will find the most relevant section to the user's query
// to keep token usage minimal and costs low.

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyAtcVnqlN2oYlfdDGms35rx_lV_TGYUE3c";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper to find relevant context
const findRelevantContext = (query) => {
    const lowerQuery = query.toLowerCase();
    const allData = [...mockData, ...practicalData];

    // Simple keyword matching to find the best chapter
    let bestMatch = null;
    let highestScore = 0;

    for (const item of allData) {
        let score = 0;
        const titleWords = item.title.toLowerCase().split(' ');
        const contentWords = (item.content || '').toLowerCase().split(' ');

        // Check if query words exist in title (high weight) or content (lower weight)
        const queryWords = lowerQuery.split(/\s+/);
        queryWords.forEach(word => {
            if (word.length > 3) { // Ignore short words like "is", "the"
                if (titleWords.some(t => t.includes(word))) score += 5;
                if (contentWords.some(c => c.includes(word))) score += 1;
            }
        });

        if (score > highestScore) {
            highestScore = score;
            bestMatch = item;
        }
    }

    // If we have a good match, return its content, otherwise return a broad summary
    if (bestMatch && highestScore > 0) {
        return `Relevant Section: ${bestMatch.title}\n\n${bestMatch.content || JSON.stringify(bestMatch.subsections)}`;
    }

    return "The user's question does not perfectly match a specific chapter. Use your general knowledge of Community Medicine to answer.";
};

const ChatScreen = () => {
    // Step 2: State Management
    const [messages, setMessages] = useState([
        { id: 'start', text: 'Hello Dr., ask me any question about Preventive and Social Medicine.', sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef();

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    // Step 4: Gemini API Integration
    const sendMessage = async () => {
        if (inputText.trim() === '') return;

        const userMessage = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        const relevantContext = findRelevantContext(userMessage.text);

        const promptTemplate = `
You are a Community Medicine tutor. Answer the user's question accurately using ONLY the following textbook data if it is relevant. 
If the answer is not in the data, state that you do not know. 

Relevant Textbook Data: 
${relevantContext}

User Question: 
${userMessage.text}`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: promptTemplate
                        }]
                    }]
                }),
            });

            const data = await response.json();

            let aiTextResponse = "I'm sorry, I encountered an error and could not process your request.";

            if (data && data.candidates && data.candidates.length > 0) {
                // Extract the text part from the Gemini Response body
                aiTextResponse = data.candidates[0].content.parts[0].text;
            } else if (data.error) {
                aiTextResponse = `API Error: ${data.error.message}`;
            }

            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: aiTextResponse,
                sender: 'ai',
            };

            setMessages((prev) => [...prev, aiMessage]);

        } catch (error) {
            console.error('Error fetching from Gemini API:', error);
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "Network error trying to reach the tutor. Please try again.",
                sender: 'ai',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Step 1: UI Setup
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.header}>
                    <FontAwesome name="circle" size={40} color="#A855F7" style={styles.headerOrb} />
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                >
                    {messages.map((msg) => {
                        if (msg.sender === 'user') {
                            return (
                                <View key={msg.id} style={styles.messageWrapperUser}>
                                    <View style={styles.userMessageBubbleLabel}>
                                        <Text style={styles.messageTextUser}>{msg.text}</Text>
                                        <View style={styles.userMessageUnderline} />
                                    </View>
                                </View>
                            );
                        } else {
                            return (
                                <View key={msg.id} style={styles.messageWrapperAI}>
                                    <View style={styles.messageCardAI}>
                                        <Text style={styles.messageTextAI}>{msg.text}</Text>
                                    </View>
                                </View>
                            );
                        }
                    })}
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#6200ee" />
                            <Text style={styles.loadingText}>Tutor is typing...</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.bottomSection}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ask anything..."
                            placeholderTextColor="#9CA3AF"
                            textColor="#111827"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            disabled={isLoading}
                            activeUnderlineColor="transparent"
                            underlineColor="transparent"
                        />
                        <TouchableOpacity
                            onPress={sendMessage}
                            disabled={isLoading || inputText.trim() === ''}
                            style={styles.sendButton}
                        >
                            <MaterialIcons name="send" size={24} color="#8A2BE2" style={{ transform: [{ rotate: '-45deg' }] }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFE',
    },
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    headerOrb: {
        elevation: 10,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        padding: 24,
        paddingBottom: 24,
    },
    messageWrapperUser: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    userMessageBubbleLabel: {
        maxWidth: '80%',
    },
    messageTextUser: {
        color: '#111827',
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 4,
    },
    userMessageUnderline: {
        height: 2,
        backgroundColor: '#A855F7', // Purple underline
        width: '100%',
    },
    messageWrapperAI: {
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    messageCardAI: {
        maxWidth: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    messageTextAI: {
        color: '#111827',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: 24,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    bottomSection: {
        backgroundColor: '#FBFCFE',
        paddingBottom: 16,
    },
    quickActions: {
        marginBottom: 16,
    },
    quickActionsContent: {
        paddingHorizontal: 16,
    },
    actionPill: {
        backgroundColor: '#E5E7EB',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    actionPillText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 30,
        paddingLeft: 16,
        paddingRight: 8,
        minHeight: 56,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    textInput: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 16,
    },
    sendButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;
