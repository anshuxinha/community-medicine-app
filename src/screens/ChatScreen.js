import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { TextInput, Button, Card, Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import mockData from '../data/mockData.json';

// Step 3: Textbook Context Optimization
// We stringify the entire mock data and limit it to a predefined max length 
// to ensure it fits within token limits, though 2.5 flash handles massive context windows.
const TEXTBOOK_CONTEXT_STRING = JSON.stringify(mockData);

const GEMINI_API_KEY = "AIzaSyAtcVnqlN2oYlfdDGms35rx_lV_TGYUE3c";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

        const promptTemplate = `
You are a Community Medicine tutor. Answer the user's question accurately using ONLY the following textbook data. 
If the answer is not in the data, state that you do not know. 

Textbook Data: 
${TEXTBOOK_CONTEXT_STRING}

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
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            >
                <View style={styles.header}>
                    <Text variant="headlineMedium">AI Tutor</Text>
                </View>

                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messageList}
                    contentContainerStyle={styles.messageListContent}
                >
                    {messages.map((msg) => (
                        <View
                            key={msg.id}
                            style={[
                                styles.messageWrapper,
                                msg.sender === 'user' ? styles.messageWrapperUser : styles.messageWrapperAI,
                            ]}
                        >
                            {msg.sender === 'ai' && (
                                <Avatar.Icon size={32} icon={({ size, color }) => <MaterialIcons name="face" size={size} color={color} />} style={styles.avatar} />
                            )}
                            <Card
                                style={[
                                    styles.messageCard,
                                    msg.sender === 'user' ? styles.messageCardUser : styles.messageCardAI,
                                ]}
                            >
                                <Card.Content>
                                    <Text
                                        style={msg.sender === 'user' ? styles.messageTextUser : styles.messageTextAI}
                                    >
                                        {msg.text}
                                    </Text>
                                </Card.Content>
                            </Card>
                        </View>
                    ))}
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#6200ee" />
                            <Text style={styles.loadingText}>Tutor is typing...</Text>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        mode="outlined"
                        placeholder="Ask a question..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        disabled={isLoading}
                    />
                    <Button
                        mode="contained"
                        onPress={sendMessage}
                        disabled={isLoading || inputText.trim() === ''}
                        style={styles.sendButton}
                        icon={({ size, color }) => <MaterialIcons name="send" size={size} color={color} />}
                    >
                        Send
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        backgroundColor: '#f4f6f8',
    },
    header: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    messageList: {
        flex: 1,
    },
    messageListContent: {
        padding: 16,
        paddingBottom: 24,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    messageWrapperUser: {
        justifyContent: 'flex-end',
    },
    messageWrapperAI: {
        justifyContent: 'flex-start',
    },
    avatar: {
        marginRight: 8,
        backgroundColor: '#6200ee',
    },
    messageCard: {
        maxWidth: '80%',
        borderRadius: 16,
    },
    messageCardUser: {
        backgroundColor: '#6200ee',
        borderBottomRightRadius: 4,
    },
    messageCardAI: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
    },
    messageTextUser: {
        color: '#ffffff',
    },
    messageTextAI: {
        color: '#1c1b1f',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    loadingText: {
        marginLeft: 8,
        color: '#666',
        fontStyle: 'italic',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: '#ffffff',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    textInput: {
        flex: 1,
        maxHeight: 120,
        backgroundColor: '#ffffff',
    },
    sendButton: {
        marginLeft: 8,
        marginBottom: 4,
        justifyContent: 'center',
    },
});

export default ChatScreen;
