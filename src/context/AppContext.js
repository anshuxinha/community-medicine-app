import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
// import * as Notifications from 'expo-notifications'; // Disabled for Expo Go SDK 53 Compatibility
import Constants from 'expo-constants';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, getIdTokenResult, signOut } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
let Purchases;
let GoogleSignin;
if (Constants.appOwnership !== 'expo') {
    Purchases = require('react-native-purchases').default;
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin.configure({
        webClientId: '856703659616-8e0k1obmgom04783jjf695hkianm4hme.apps.googleusercontent.com',
    });
}
import mockData from '../data/mockData.json';
import practicalData from '../data/practical.json';
import { theme } from '../styles/theme';

const allData = [...mockData, ...practicalData];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const getAccountStateKey = (uid) => `accountState:${uid}`;

const normalizeBookmarks = (items) => {
    if (!Array.isArray(items)) return [];
    const validTitles = new Set(allData.map(item => item.title));
    return items.filter(item => item && typeof item.title === 'string' && validTitles.has(item.title));
};

const sanitizeCloudState = (data = {}) => ({
    readItems: Array.isArray(data.readItems) ? data.readItems : [],
    bookmarks: normalizeBookmarks(data.bookmarks),
    currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : 0,
    lastReadDate: typeof data.lastReadDate === 'string' ? data.lastReadDate : null,
    studyScore: typeof data.studyScore === 'number' ? data.studyScore : 0,
    dailyReadHistory: data.dailyReadHistory && typeof data.dailyReadHistory === 'object' ? data.dailyReadHistory : {},
    quizScores: Array.isArray(data.quizScores) ? data.quizScores : [],
});

const dayDiffFromToday = (dateString) => {
    if (!dateString) return null;
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return null;

    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startParsed = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    return Math.round((startToday - startParsed) / MS_PER_DAY);
};

// Expo Notifications is fully supported in production builds.
const SafeNotifications = Notifications;

if (Device.isDevice) {
    try {
        SafeNotifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
    } catch (e) {
        // ignore
    }
}

export const AppContext = createContext();

const countTotalContentItems = (items) => {
    let count = 0;
    items.forEach(item => {
        if (item.subsections) {
            count += countTotalContentItems(item.subsections);
        } else {
            count++;
        }
    });
    return count;
};

export const AppProvider = ({ children }) => {
    const [readItems, setReadItems] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [totalItems, setTotalItems] = useState(0);
    const [highlights, setHighlights] = useState({});
    const [currentStreak, setCurrentStreak] = useState(0);
    const [lastReadDate, setLastReadDate] = useState(null);
    const [studyScore, setStudyScore] = useState(0);
    const [dailyReadHistory, setDailyReadHistory] = useState({});
    const [quizScores, setQuizScores] = useState([]);

    // Auth & Premium State — null = not yet resolved, false/obj = resolved
    const [user, setUser] = useState(undefined); // undefined = loading
    const [isPremium, setIsPremium] = useState(false);
    const isLoggingOutRef = useRef(false);
    const cloudHydratedRef = useRef(false);

    // ── Timeout helper for Firestore queries (prevents freezing on offline) ───
    const timeoutPromise = (ms) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Request Timed Out (Offline/Slow Network)')), ms)
    );

    // ── Auth state listener (Firebase + AsyncStorage fallback) ────────────────
    useEffect(() => {
        // 1. Listen to Firebase auth state changes (handles real accounts)
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                cloudHydratedRef.current = false;
                // Read custom claims first (always available, no Firestore needed)
                let claimsPremium = false;
                let claimsAdmin = false;
                try {
                    const tokenResult = await getIdTokenResult(firebaseUser, true);
                    claimsPremium = tokenResult.claims.isPremium === true;
                    claimsAdmin = tokenResult.claims.isAdmin === true;
                } catch { /* ignore */ }

                // Then try Firestore for richer profile data (Firestore wins over claims)
                try {
                    // 8-second timeout balances responsiveness with reliable cloud state restore
                    const userDoc = await Promise.race([
                        getDoc(doc(db, 'users', firebaseUser.uid)),
                        timeoutPromise(8000)
                    ]);

                    const data = userDoc.exists() ? userDoc.data() : {};
                    const premiumStatus = data.isPremium !== undefined ? data.isPremium : claimsPremium;
                    const isAdmin = data.isAdmin !== undefined ? data.isAdmin : claimsAdmin;
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        username: firebaseUser.displayName || data.username || 'User',
                        isPremium: premiumStatus,
                        isAdmin,
                    };
                    // Sync logic: hydrate local state from cloud so progress/streak stay account-linked.
                    const cloudState = sanitizeCloudState(data);
                    setReadItems(cloudState.readItems);
                    setBookmarks(cloudState.bookmarks);
                    setCurrentStreak(cloudState.currentStreak);
                    setLastReadDate(cloudState.lastReadDate);
                    setStudyScore(cloudState.studyScore);
                    setDailyReadHistory(cloudState.dailyReadHistory);
                    setQuizScores(cloudState.quizScores);

                    setUser(userData);
                    setIsPremium(premiumStatus);
                    cloudHydratedRef.current = true;
                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                    await AsyncStorage.setItem(getAccountStateKey(firebaseUser.uid), JSON.stringify(cloudState));
                } catch (err) {
                    // Firestore failed (offline or timeout) - use claims-based data so user stays logged in & app loads instantly
                    console.warn('Firestore fetch failed/timed out, using auth claims:', err?.message);
                    const userData = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        username: firebaseUser.displayName || 'User',
                        isPremium: claimsPremium,
                        isAdmin: claimsAdmin,
                    };

                    try {
                        const cachedAccountState = await AsyncStorage.getItem(getAccountStateKey(firebaseUser.uid));
                        if (cachedAccountState) {
                            const parsed = sanitizeCloudState(JSON.parse(cachedAccountState));
                            setReadItems(parsed.readItems);
                            setBookmarks(parsed.bookmarks);
                            setCurrentStreak(parsed.currentStreak);
                            setLastReadDate(parsed.lastReadDate);
                            setStudyScore(parsed.studyScore);
                            setDailyReadHistory(parsed.dailyReadHistory);
                            setQuizScores(parsed.quizScores);
                        }
                    } catch (_) {
                        // ignore account cache parse failures
                    }

                    setUser(userData);
                    setIsPremium(claimsPremium);
                    cloudHydratedRef.current = true;
                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                }
            } else {
                cloudHydratedRef.current = false;
                // No Firebase session — check AsyncStorage for bypass/admin users
                try {
                    const storedUser = await AsyncStorage.getItem('user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        setUser(parsed);
                        setIsPremium(parsed.isPremium || false);
                    } else {
                        setUser(null);
                    }
                } catch {
                    setUser(null);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Release logout sync lock once user is fully cleared by auth state.
    useEffect(() => {
        if (user === null) {
            isLoggingOutRef.current = false;
        }
    }, [user]);

    // Initialize other state from AsyncStorage
    useEffect(() => {
        const loadState = async () => {
            try {
                const storedReadItems = await AsyncStorage.getItem('readItems');
                if (storedReadItems) {
                    setReadItems(JSON.parse(storedReadItems));
                }

                const storedBookmarks = await AsyncStorage.getItem('bookmarks');
                if (storedBookmarks) {
                    const parsed = JSON.parse(storedBookmarks);
                    const validTitles = new Set(allData.map(item => item.title));
                    const validBookmarks = parsed.filter(b => validTitles.has(b.title));
                    setBookmarks(validBookmarks);
                }

                const storedHighlights = await AsyncStorage.getItem('highlights');
                if (storedHighlights) {
                    setHighlights(JSON.parse(storedHighlights));
                }

                const storedStreak = await AsyncStorage.getItem('currentStreak');
                if (storedStreak) {
                    setCurrentStreak(parseInt(storedStreak, 10));
                }

                const storedLastRead = await AsyncStorage.getItem('lastReadDate');
                if (storedLastRead) {
                    setLastReadDate(storedLastRead);
                }

                const storedScore = await AsyncStorage.getItem('studyScore');
                if (storedScore) {
                    setStudyScore(parseInt(storedScore, 10));
                }

                const storedDailyHistory = await AsyncStorage.getItem('dailyReadHistory');
                if (storedDailyHistory) {
                    setDailyReadHistory(JSON.parse(storedDailyHistory));
                }

                const storedQuizScores = await AsyncStorage.getItem('quizScores');
                if (storedQuizScores) {
                    setQuizScores(JSON.parse(storedQuizScores));
                }

                // Check streak validity on load
                if (storedLastRead) {
                    const diffDays = dayDiffFromToday(storedLastRead);
                    if (diffDays !== null && diffDays > 1) {
                        // Streak broken
                        setCurrentStreak(0);
                    }
                }
            } catch (error) {
                console.error("Failed to load state from AsyncStorage:", error);
            }

            // Calculate total items once at startup
            const total = countTotalContentItems(allData);
            setTotalItems(total > 0 ? total : 1); // Avoid division by zero
        };

        loadState();
    }, []);


    // Save state to AsyncStorage whenever it changes
    useEffect(() => {
        const saveState = async () => {
            try {
                await AsyncStorage.setItem('readItems', JSON.stringify(readItems));
                await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                await AsyncStorage.setItem('highlights', JSON.stringify(highlights));
                await AsyncStorage.setItem('currentStreak', currentStreak.toString());
                if (lastReadDate) await AsyncStorage.setItem('lastReadDate', lastReadDate);
                else await AsyncStorage.removeItem('lastReadDate');
                await AsyncStorage.setItem('studyScore', studyScore.toString());
                await AsyncStorage.setItem('dailyReadHistory', JSON.stringify(dailyReadHistory));
                await AsyncStorage.setItem('quizScores', JSON.stringify(quizScores));

                if (user && user.uid) {
                    const accountStateSnapshot = {
                        readItems,
                        bookmarks,
                        currentStreak,
                        lastReadDate: lastReadDate || null,
                        dailyReadHistory,
                        studyScore,
                        quizScores,
                    };
                    await AsyncStorage.setItem(getAccountStateKey(user.uid), JSON.stringify(accountStateSnapshot));
                }

                if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
                else await AsyncStorage.removeItem('user');
                await AsyncStorage.setItem('isPremium', JSON.stringify(isPremium));

                // Sync to Firebase if logged in (cloud source for progress + streak)
                if (user && user.uid && !isLoggingOutRef.current && cloudHydratedRef.current) {
                    try {
                        await setDoc(doc(db, 'users', user.uid), {
                            readItems,
                            bookmarks,
                            currentStreak,
                            lastReadDate: lastReadDate || null,
                            dailyReadHistory,
                            studyScore,
                            quizScores,
                            syncedAt: serverTimestamp(),
                        }, { merge: true });
                    } catch (e) {
                        // silently handle if they are offline
                    }
                }
            } catch (error) {
                console.error("Failed to save state to AsyncStorage:", error);
            }
        };

        saveState();
    }, [readItems, bookmarks, highlights, currentStreak, lastReadDate, studyScore, dailyReadHistory, quizScores, user, isPremium]);

    // Push token registration
    useEffect(() => {
        if (user && user.uid) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    setDoc(doc(db, 'users', user.uid), {
                        pushToken: token,
                        pushTokenUpdatedAt: serverTimestamp(),
                    }, { merge: true }).catch(err => console.log('Error saving push token', err));
                }
            });
        }
    }, [user]);

    async function registerForPushNotificationsAsync() {
        let token;

        // Push notifications are not supported in Expo Go as of SDK 53
        if (!SafeNotifications) {
            console.log('Skipping push notification registration in Expo Go.');
            return null;
        }

        if (Device.isDevice) {
            try {
                const { status: existingStatus } = await SafeNotifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await SafeNotifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    console.log('Push notification permission denied.');
                    return;
                }
                token = (await SafeNotifications.getExpoPushTokenAsync()).data;
            } catch (err) {
                console.log('Expo notification error:', err);
                return;
            }
        } else {
            console.log('Must use physical device for Push Notifications');
            return;
        }

        if (Platform.OS === 'android') {
            await SafeNotifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: SafeNotifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: theme.colors.primaryDark,
            });
        }
        return token;
    }

    // Derived properties and actions
    const readingProgress = totalItems === 0 ? 0 : Math.min(readItems.length / totalItems, 1);

    const markAsRead = (itemTitle) => {
        setReadItems((prev) => {
            if (!prev.includes(itemTitle)) {
                // Update streak logic
                const todayStr = new Date().toDateString();
                if (lastReadDate !== todayStr) {
                    if (!lastReadDate) {
                        setCurrentStreak(1);
                    } else {
                        const diffDays = dayDiffFromToday(lastReadDate);

                        if (diffDays === 1) {
                            setCurrentStreak((prev) => prev + 1);
                        } else if (diffDays === null || diffDays > 1) {
                            setCurrentStreak(1);
                        }
                    }
                    setLastReadDate(todayStr);
                    // Reward points for reading
                    setStudyScore((prevScore) => prevScore + 10);
                }

                // Update daily read history for the bar chart
                const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                setDailyReadHistory((prevHistory) => ({
                    ...prevHistory,
                    [dateKey]: (prevHistory[dateKey] || 0) + 1,
                }));

                return [...prev, itemTitle];
            }
            return prev;
        });
    };

    const recordQuizScore = (score, total) => {
        const entry = {
            date: new Date().toISOString().split('T')[0],
            score,
            total,
            percent: Math.round((score / total) * 100),
        };
        setQuizScores((prev) => [...prev.slice(-29), entry]); // keep last 30
        setStudyScore((prev) => prev + score * 5);
    };

    const isBookmarked = (itemTitle) => {
        return bookmarks.some((bookmark) => bookmark.title === itemTitle);
    };

    const toggleBookmark = (item) => {
        setBookmarks((prev) => {
            if (isBookmarked(item.title)) {
                return prev.filter((bookmark) => bookmark.title !== item.title);
            } else {
                return [...prev, item]; // Store the whole item so we can navigate to it
            }
        });
    };

    const saveHighlight = (id, htmlContent) => {
        setHighlights((prev) => ({
            ...prev,
            [id]: htmlContent
        }));
    };

    // Payment SDK Initialization
    useEffect(() => {
        if (Constants.appOwnership === 'expo') return;

        if (Purchases) {
            Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_API_KEY || "test_vulmIhXWwQBkNrLyBuwhSPgPwut" });

            Purchases.addCustomerInfoUpdateListener((info) => {
                if (info.entitlements.active['Premium'] !== undefined) {
                    setIsPremium(true);
                } else {
                    setIsPremium(false);
                }
            });
        }
    }, []);

    const completeDailyGoal = (score) => {
        setStudyScore((prev) => prev + score);
    };

    // Force clear for debug/testing
    const clearStorage = async () => {
        await AsyncStorage.multiRemove(['readItems', 'bookmarks', 'highlights', 'currentStreak', 'lastReadDate', 'studyScore', 'dailyReadHistory', 'quizScores']);
        setReadItems([]);
        setBookmarks([]);
        setHighlights({});
        setCurrentStreak(0);
        setLastReadDate(null);
        setStudyScore(0);
        setDailyReadHistory({});
        setQuizScores([]);
        setUser(null);
        setIsPremium(false);
    };

    const login = (userData) => {
        setUser(userData);
        if (userData.isPremium !== undefined) {
            setIsPremium(userData.isPremium);
        }
    };

    const logout = async () => {
        isLoggingOutRef.current = true;
        // Sign out from Firebase first to stop onAuthStateChanged from restoring the session
        try { await signOut(auth); } catch (_) { }
        // Sign out from Native Google Sign-In to show the account chooser next time
        if (Constants.appOwnership !== 'expo' && GoogleSignin) {
            try { await GoogleSignin.signOut(); } catch (_) { }
        }
        // Clear all persisted state
        await AsyncStorage.multiRemove([
            'user', 'isPremium', 'readItems', 'bookmarks', 'highlights',
            'currentStreak', 'lastReadDate', 'studyScore', 'dailyReadHistory', 'quizScores'
        ]);
        setReadItems([]);
        setBookmarks([]);
        setHighlights({});
        setCurrentStreak(0);
        setLastReadDate(null);
        setStudyScore(0);
        setDailyReadHistory({});
        setQuizScores([]);
        setUser(null);
        setIsPremium(false);
    };

    const upgradeToPremium = () => {
        setIsPremium(true);
    };

    return (
        <AppContext.Provider
            value={{
                readItems,
                bookmarks,
                totalItems,
                readingProgress,
                highlights,
                currentStreak,
                lastReadDate,
                studyScore,
                dailyReadHistory,
                quizScores,
                markAsRead,
                isBookmarked,
                toggleBookmark,
                saveHighlight,
                completeQuiz: completeDailyGoal,
                recordQuizScore,
                clearStorage,
                user,
                isPremium,
                login,
                logout,
                upgradeToPremium
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
