import React, { useState, useRef, useEffect } from 'react';
import {
    View, StyleSheet, ScrollView, KeyboardAvoidingView,
    Platform, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mockData from '../data/mockData.json';
import practicalData from '../data/practical.json';

// ── API config ────────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'AIzaSyAtcVnqlN2oYlfdDGms35rx_lV_TGYUE3c';
// Using gemini-2.5-flash to support Google Search Grounding at no extra cost under the free daily limit of 1500 queries
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Context retrieval ─────────────────────────────────────────────────────────
/**
 * Recursively flattens an item tree into a flat list of { title, content } objects.
 * This ensures subsections (e.g. BPaLM inside NTEP) are individually searchable.
 */
const flattenItems = (items, parentTitle = '') => {
    const results = [];
    for (const item of items) {
        const effectiveTitle = parentTitle ? `${parentTitle} > ${item.title}` : item.title;
        if (item.content) {
            results.push({ title: effectiveTitle, content: item.content });
        }
        if (item.subsections && item.subsections.length > 0) {
            results.push(...flattenItems(item.subsections, effectiveTitle));
        }
    }
    return results;
};

const ALL_ITEMS = flattenItems([...mockData, ...practicalData]);

/**
 * Scores how well an item matches a query.
 * - Exact phrase match in content: highest
 * - Title word match: high
 * - Content word match: medium
 * - Short words (≤3 chars) are still checked for acronyms like "TB", "ORS"
 */
const scoreItem = (item, queryLower) => {
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    let score = 0;

    // Exact phrase match (highest priority)
    if (contentLower.includes(queryLower)) score += 20;
    if (titleLower.includes(queryLower)) score += 30;

    // Word-by-word scoring
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
    for (const word of queryWords) {
        if (titleLower.includes(word)) score += 5;
        if (contentLower.includes(word)) score += 1;
    }

    return score;
};

/**
 * Returns up to 3 most-relevant sections concatenated, capped at ~3000 chars to
 * stay within Gemini's context window while keeping token cost low.
 */
const findRelevantContext = (query) => {
    const queryLower = query.toLowerCase().trim();

    const scored = ALL_ITEMS
        .map(item => ({ item, score: scoreItem(item, queryLower) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    if (scored.length === 0) {
        return 'No specific textbook section matched this query. Use your general Community Medicine knowledge.';
    }

    return scored
        .map(({ item }) => `=== ${item.title} ===\n${item.content.slice(0, 1200)}`)
        .join('\n\n');
};

// ── Suggested starter questions ───────────────────────────────────────────────
const QUICK_QUESTIONS = [
    'What is the BPaLM regimen?',
    'Explain DOTS strategy',
    'What is SAM?',
    'ICDS beneficiaries?',
    'Herd immunity threshold?',
];

// ── Main component ─────────────────────────────────────────────────────────────
const ChatScreen = () => {
    const [messages, setMessages] = useState([
        { id: 'start', text: 'Hello Dr. 👋\nAsk me anything about Community Medicine — I\'ll search the STROMA library to give you accurate answers.', sender: 'ai' },
    ]);
    // conversationHistory mirrors messages in Gemini's multi-turn format
    const [conversationHistory, setConversationHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [messagesCountToday, setMessagesCountToday] = useState(0);
    const scrollViewRef = useRef();

    useEffect(() => {
        const loadUsage = async () => {
            try {
                const dateKey = new Date().toISOString().split('T')[0];
                const storedDate = await AsyncStorage.getItem('tutor_usage_date');
                if (storedDate === dateKey) {
                    const count = await AsyncStorage.getItem('tutor_usage_count');
                    setMessagesCountToday(parseInt(count || '0', 10));
                } else {
                    await AsyncStorage.setItem('tutor_usage_date', dateKey);
                    await AsyncStorage.setItem('tutor_usage_count', '0');
                    setMessagesCountToday(0);
                }
            } catch (error) {
                console.error("Error loading usage", error);
            }
        };
        loadUsage();
    }, []);

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);

    const sendMessage = async (text) => {
        const userText = (text || inputText).trim();
        if (!userText) return;

        if (messagesCountToday >= 30) {
            setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, sender: 'user' }]);
            setInputText('');
            setTimeout(() => {
                setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: '⚠️ You have reached the daily limit of 30 messages for the STROMA AI Tutor. Please come back tomorrow.', sender: 'ai' }]);
            }, 500);
            return;
        }

        const userMessage = { id: Date.now().toString(), text: userText, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        // Build context from library
        const relevantContext = findRelevantContext(userText);

        // System instruction (sent as the system role in the contents array)
        const systemInstruction = `You are STROMA Tutor, an expert Community Medicine tutor for Indian medical students (MBBS/MD PSM).
Answer accurately using the textbook sections below. If the answer IS in the provided data, use it as the primary source.
If not, answer from your general knowledge but mention it's not from the STROMA library.
Be concise but complete. Use bullet points / numbered lists where helpful. Do NOT make up facts.

RELEVANT TEXTBOOK SECTIONS:
${relevantContext}`;

        // Build the contents array — include last 6 turns of conversation history for memory
        const recentHistory = conversationHistory.slice(-6);
        const contents = [
            { role: 'user', parts: [{ text: systemInstruction }] },
            { role: 'model', parts: [{ text: 'Understood. I am ready to assist using the STROMA library content.' }] },
            ...recentHistory,
            { role: 'user', parts: [{ text: userText }] },
        ];

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    tools: [{
                        google_search: {}
                    }],
                    generationConfig: {
                        temperature: 0.3,       // Low temp → factual, consistent
                        maxOutputTokens: 1024,  // Cap output to control cost
                    },
                }),
            });

            const data = await response.json();
            let aiText = "I'm sorry, I couldn't process your request.";

            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                aiText = data.candidates[0].content.parts[0].text;
            } else if (data?.error) {
                aiText = `API Error: ${data.error.message}`;
            }

            const aiMessage = { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);

            const newCount = messagesCountToday + 1;
            setMessagesCountToday(newCount);
            AsyncStorage.setItem('tutor_usage_count', newCount.toString());

            // Update conversation history for multi-turn memory
            setConversationHistory(prev => [
                ...prev,
                { role: 'user', parts: [{ text: userText }] },
                { role: 'model', parts: [{ text: aiText }] },
            ]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: 'Network error. Please check your connection and try again.',
                sender: 'ai',
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

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
                    {messages.map((msg) => (
                        msg.sender === 'user' ? (
                            <View key={msg.id} style={styles.messageWrapperUser}>
                                <View style={styles.userBubble}>
                                    <Text style={styles.messageTextUser}>{msg.text}</Text>
                                    <View style={styles.userUnderline} />
                                </View>
                            </View>
                        ) : (
                            <View key={msg.id} style={styles.messageWrapperAI}>
                                <View style={styles.messageCardAI}>
                                    <Text style={styles.messageTextAI}>{msg.text}</Text>
                                </View>
                            </View>
                        )
                    ))}

                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#A855F7" />
                            <Text style={styles.loadingText}>Tutor is typing…</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Quick-question chips — only show when chat is empty */}
                {messages.length <= 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.quickBar}
                        contentContainerStyle={styles.quickBarContent}
                    >
                        {QUICK_QUESTIONS.map(q => (
                            <TouchableOpacity
                                key={q}
                                style={styles.chip}
                                onPress={() => sendMessage(q)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.chipText}>{q}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.bottomSection}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Ask anything…"
                            placeholderTextColor="#9CA3AF"
                            textColor="#111827"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            disabled={isLoading}
                            activeUnderlineColor="transparent"
                            underlineColor="transparent"
                            onSubmitEditing={() => sendMessage()}
                        />
                        <TouchableOpacity
                            onPress={() => sendMessage()}
                            disabled={isLoading || inputText.trim() === ''}
                            style={styles.sendButton}
                        >
                            <MaterialIcons
                                name="send"
                                size={24}
                                color={inputText.trim() ? '#8A2BE2' : '#D1D5DB'}
                                style={{ transform: [{ rotate: '-45deg' }] }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FBFCFE' },
    container: { flex: 1 },
    header: { alignItems: 'center', paddingVertical: 16 },
    headerOrb: {
        elevation: 10,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    messageList: { flex: 1 },
    messageListContent: { padding: 24, paddingBottom: 16 },

    // User message
    messageWrapperUser: { alignItems: 'flex-end', marginBottom: 24 },
    userBubble: { maxWidth: '80%' },
    messageTextUser: {
        color: '#111827',
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 4,
    },
    userUnderline: { height: 2, backgroundColor: '#A855F7', width: '100%' },

    // AI message
    messageWrapperAI: { alignItems: 'flex-start', marginBottom: 24 },
    messageCardAI: {
        maxWidth: '88%',
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
        fontSize: 15,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: 23,
    },

    // Loading
    loadingContainer: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    loadingText: { marginLeft: 8, color: '#9CA3AF', fontStyle: 'italic' },

    // Quick chips
    quickBar: { maxHeight: 44, marginBottom: 8 },
    quickBarContent: { paddingHorizontal: 16, gap: 8 },
    chip: {
        backgroundColor: '#F3E8FF',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#C4B5FD',
    },
    chipText: { color: '#6D28D9', fontSize: 13, fontWeight: '500' },

    // Input area
    bottomSection: { backgroundColor: '#FBFCFE', paddingBottom: 16 },
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
    textInput: { flex: 1, backgroundColor: 'transparent', fontSize: 16 },
    sendButton: { padding: 8, justifyContent: 'center', alignItems: 'center' },
});

export default ChatScreen;
