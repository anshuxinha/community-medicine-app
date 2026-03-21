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
import { theme } from '../styles/theme';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'could', 'did', 'do', 'does',
    'for', 'from', 'had', 'has', 'have', 'how', 'i', 'in', 'into', 'is', 'it', 'its', 'may',
    'me', 'my', 'of', 'on', 'or', 'our', 'should', 'tell', 'than', 'that', 'the', 'their',
    'them', 'there', 'these', 'they', 'this', 'those', 'to', 'us', 'was', 'we', 'were',
    'what', 'when', 'where', 'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);

const CURRENT_INFO_PATTERN = /\b(latest|recent|recently|current|currently|today|yesterday|tomorrow|updated|update|guideline|guidelines|as of|20\d{2})\b/i;
const FOLLOW_UP_PATTERN = /\b(it|its|that|this|they|them|their|these|those|he|she|his|her)\b/i;
const BROAD_QUERY_PATTERN = /\b(explain|describe|how|why|compare|difference|differentiate|classification|classify|types|causes|features|steps|approach|management|treatment|prevention|strategy|program|programme|enumerate|discuss|write short note)\b/i;
const MAX_FACT_EXCERPTS = 1;
const MAX_BROAD_EXCERPTS = 2;
const MAX_FACT_PASSAGE_CHARS = 500;
const MAX_BROAD_PASSAGE_CHARS = 700;
const MAX_HISTORY_ENTRIES = 4;
const MAX_HISTORY_ENTRY_CHARS = 220;
const MAX_OUTPUT_TOKENS = 320;

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

const normalizeText = (text = '') => text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeQuery = (text = '') => normalizeText(text)
    .split(' ')
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));

const buildQueryMeta = (query) => {
    const normalizedQuery = normalizeText(query);
    const tokens = tokenizeQuery(query);

    return {
        normalizedQuery,
        tokens,
        joinedTokens: tokens.join(' '),
    };
};

const trimText = (text = '', maxChars = 500) => {
    if (text.length <= maxChars) {
        return text;
    }
    return `${text.slice(0, maxChars).trimEnd()}...`;
};

const scoreTextMatch = (text, queryMeta) => {
    const normalizedText = normalizeText(text);
    const { normalizedQuery, tokens, joinedTokens } = queryMeta;
    let score = 0;
    let matchedTokens = 0;

    if (normalizedQuery && normalizedText.includes(normalizedQuery)) {
        score += 24;
    }

    if (joinedTokens && normalizedText.includes(joinedTokens)) {
        score += 12;
    }

    for (const token of tokens) {
        if (normalizedText.includes(token)) {
            matchedTokens += 1;
            score += 7;
        }
    }

    if (tokens.length > 0 && matchedTokens === tokens.length) {
        score += 18;
    }

    return {
        score,
        matchedTokens,
        coverage: tokens.length > 0 ? matchedTokens / tokens.length : 0,
    };
};

const splitIntoPassages = (content) => {
    const blocks = content
        .split(/\n{2,}/)
        .map(block => block.trim())
        .filter(Boolean);

    return blocks.flatMap((block) => {
        if (block.length <= 900) {
            return [block];
        }

        const lines = block
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (lines.length <= 1) {
            const windows = [];
            for (let i = 0; i < block.length; i += 700) {
                windows.push(block.slice(i, i + 900));
            }
            return windows;
        }

        const windows = [];
        for (let i = 0; i < lines.length; i += 3) {
            windows.push(lines.slice(i, i + 5).join('\n'));
        }
        return windows;
    });
};

const scoreItem = (item, queryMeta) => {
    const titleMatch = scoreTextMatch(item.title, queryMeta);
    const contentMatch = scoreTextMatch(item.content, queryMeta);
    const passages = splitIntoPassages(item.content);

    const bestPassage = passages.reduce((best, passage) => {
        const match = scoreTextMatch(passage, queryMeta);
        if (!best || match.score > best.score) {
            return { text: passage, ...match };
        }
        return best;
    }, null);

    return {
        item,
        score: (titleMatch.score * 2) + contentMatch.score + ((bestPassage?.score || 0) * 3),
        bestPassage,
    };
};

const buildRetrievalQuery = (userText, conversationHistory) => {
    const compactQuery = tokenizeQuery(userText);
    const previousUserTurn = [...conversationHistory]
        .reverse()
        .find(entry => entry.role === 'user')
        ?.parts?.[0]?.text;

    if (!previousUserTurn) {
        return userText;
    }

    if (compactQuery.length >= 4 && !FOLLOW_UP_PATTERN.test(userText)) {
        return userText;
    }

    return `${previousUserTurn} ${userText}`;
};

const findRelevantContext = (query) => {
    const queryMeta = buildQueryMeta(query);
    const isBroadQuery = BROAD_QUERY_PATTERN.test(query);
    const maxExcerpts = isBroadQuery ? MAX_BROAD_EXCERPTS : MAX_FACT_EXCERPTS;
    const maxPassageChars = isBroadQuery ? MAX_BROAD_PASSAGE_CHARS : MAX_FACT_PASSAGE_CHARS;

    const scored = ALL_ITEMS
        .map(item => scoreItem(item, queryMeta))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxExcerpts);

    if (scored.length === 0) {
        return {
            text: 'No specific textbook excerpt matched this query. Use general Community Medicine knowledge only if needed.',
            confidence: 'none',
        };
    }

    const topCoverage = scored[0]?.bestPassage?.coverage || 0;
    const topScore = scored[0]?.score || 0;
    const confidence = topCoverage >= 1 && topScore >= 110
        ? 'high'
        : topCoverage >= 0.75 && topScore >= 70
            ? 'medium'
            : 'low';

    return {
        text: scored
            .map(({ item, bestPassage }) => `=== ${item.title} ===\n${trimText(bestPassage?.text || item.content, maxPassageChars)}`)
            .join('\n\n'),
        confidence,
    };
};

const shouldUseGrounding = (query, retrieval) => (
    CURRENT_INFO_PATTERN.test(query) ||
    retrieval.confidence === 'none'
);

const buildRecentHistory = (conversationHistory) => conversationHistory
    .slice(-MAX_HISTORY_ENTRIES)
    .map(entry => ({
        ...entry,
        parts: [{ text: trimText(entry?.parts?.[0]?.text || '', MAX_HISTORY_ENTRY_CHARS) }],
    }));

const QUICK_QUESTIONS = [
    'What is the BPaLM regimen?',
    'Explain DOTS strategy',
    'What is SAM?',
    'ICDS beneficiaries?',
    'Herd immunity threshold?',
];

const ChatScreen = () => {
    const [messages, setMessages] = useState([
        { id: 'start', text: 'Hello Dr. 👋\nAsk me anything about Community Medicine — I\'ll search the STROMA library to give you accurate answers.', sender: 'ai' },
    ]);
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
                console.error('Error loading usage', error);
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

        const retrievalQuery = buildRetrievalQuery(userText, conversationHistory);
        const retrieval = findRelevantContext(retrievalQuery);
        const useGrounding = shouldUseGrounding(userText, retrieval);

        const systemInstruction = `You are STROMA Tutor, an expert Community Medicine tutor for Indian medical students (MBBS/MD PSM).
Use the textbook excerpts below as your first source of truth.
If the excerpts clearly answer the question, answer from them and do not override them with outside knowledge.
Only use outside knowledge when the excerpts do not contain the answer or the question is explicitly about current/recent information.
If the excerpts and outside knowledge conflict, trust the excerpts.
Keep answers compact by default:
- Direct fact questions: 1 to 3 short bullets or 1 short paragraph.
- Broader explanation questions: no more than 6 bullets unless the user asks for detail.
If the excerpts are insufficient, answer carefully and avoid guessing.
Do not make up facts.

RELEVANT TEXTBOOK EXCERPTS:
${retrieval.text}`;

        const recentHistory = buildRecentHistory(conversationHistory);
        const contents = [
            { role: 'user', parts: [{ text: systemInstruction }] },
            { role: 'model', parts: [{ text: 'Understood. I will prioritize the STROMA library excerpts.' }] },
            ...recentHistory,
            { role: 'user', parts: [{ text: userText }] },
        ];

        try {
            const requestBody = {
                contents,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                },
            };

            if (useGrounding) {
                requestBody.tools = [{ google_search: {} }];
            }

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();
            let aiText = "I'm sorry, I couldn't process your request.";

            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                const rawText = data.candidates[0].content.parts[0].text;
                aiText = rawText.replace(/\*\*/g, '').replace(/\*/g, '');
            } else if (data?.error) {
                aiText = `API Error: ${data.error.message}`;
            }

            const aiMessage = { id: (Date.now() + 1).toString(), text: aiText, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);

            const newCount = messagesCountToday + 1;
            setMessagesCountToday(newCount);
            AsyncStorage.setItem('tutor_usage_count', newCount.toString());

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
                            placeholder="Ask anything... (30 messages/day limit)"
                            placeholderTextColor={theme.colors.textPlaceholder}
                            textColor={theme.colors.textTitle}
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
                                color={inputText.trim() ? theme.colors.secondary : '#D1D5DB'}
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
    safeArea: { flex: 1, backgroundColor: theme.colors.backgroundMain },
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

    messageWrapperUser: { alignItems: 'flex-end', marginBottom: 24 },
    userBubble: { maxWidth: '80%' },
    messageTextUser: {
        color: theme.colors.textTitle,
        fontSize: 18,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 4,
    },
    userUnderline: { height: 2, backgroundColor: '#A855F7', width: '100%' },

    messageWrapperAI: { alignItems: 'flex-start', marginBottom: 24 },
    messageCardAI: {
        maxWidth: '88%',
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 12,
        padding: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    messageTextAI: {
        color: theme.colors.textTitle,
        fontSize: 15,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: 23,
    },

    loadingContainer: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    loadingText: { marginLeft: 8, color: theme.colors.textPlaceholder, fontStyle: 'italic' },

    quickBar: { maxHeight: 44, marginBottom: 8 },
    quickBarContent: { paddingHorizontal: 16, gap: 8 },
    chip: {
        backgroundColor: '#F3E8FF',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: theme.colors.primaryLight,
    },
    chipText: { color: theme.colors.primary, fontSize: 13, fontWeight: '500' },

    bottomSection: { backgroundColor: theme.colors.backgroundMain, paddingBottom: 16 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        backgroundColor: theme.colors.surfacePrimary,
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
