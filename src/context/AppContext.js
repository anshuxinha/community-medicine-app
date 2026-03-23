import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, getIdTokenResult, signOut } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import { theme } from '../styles/theme';
import {
    VALID_MASTER_TITLES,
    VALID_CONTENT_KEYS,
    TOTAL_LEAF_CONTENT_ITEMS,
    getEffectiveReadCount,
    getContentKey,
    getReadTitles,
    migrateLegacyReadItems,
} from '../utils/contentRegistry';

let Purchases;
let GoogleSignin;
if (Constants.appOwnership !== 'expo') {
    Purchases = require('react-native-purchases').default;
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    GoogleSignin.configure({
        webClientId: '856703659616-8e0k1obmgom04783jjf695hkianm4hme.apps.googleusercontent.com',
    });
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const getAccountStateKey = (uid) => `accountState:${uid}`;

const sanitizeReadItemVersions = (value) => {
    if (!value || typeof value !== 'object') return {};

    return Object.entries(value).reduce((accumulator, [key, version]) => {
        if (VALID_CONTENT_KEYS.has(key) && typeof version === 'string') {
            accumulator[key] = version;
        }
        return accumulator;
    }, {});
};

const resolveBookmarkContentKey = (item) => {
    if (!item || typeof item !== 'object') return null;
    if (typeof item.contentKey === 'string' && VALID_CONTENT_KEYS.has(item.contentKey)) {
        return item.contentKey;
    }
    if (typeof item.section === 'string' && item.id !== undefined) {
        const derivedKey = getContentKey(item.section, item.id);
        if (VALID_CONTENT_KEYS.has(derivedKey)) {
            return derivedKey;
        }
    }
    return null;
};

const normalizeBookmarks = (items) => {
    if (!Array.isArray(items)) return [];
    return items
        .filter((item) => item && typeof item.title === 'string' && VALID_MASTER_TITLES.has(item.title))
        .map((item) => ({
            ...item,
            contentKey: resolveBookmarkContentKey(item) || item.contentKey || null,
        }));
};

const sanitizeCloudState = (data = {}) => ({
    readItems: Array.isArray(data.readItems) ? data.readItems.filter((title) => VALID_MASTER_TITLES.has(title)) : [],
    readItemVersions: sanitizeReadItemVersions(data.readItemVersions),
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

export const AppProvider = ({ children }) => {
    const [readItems, setReadItems] = useState([]);
    const [readItemVersions, setReadItemVersions] = useState({});
    const [bookmarks, setBookmarks] = useState([]);
    const [highlights, setHighlights] = useState({});
    const [currentStreak, setCurrentStreak] = useState(0);
    const [lastReadDate, setLastReadDate] = useState(null);
    const [studyScore, setStudyScore] = useState(0);
    const [dailyReadHistory, setDailyReadHistory] = useState({});
    const [quizScores, setQuizScores] = useState([]);

    const [user, setUser] = useState(undefined);
    const [isPremium, setIsPremium] = useState(false);
    const isLoggingOutRef = useRef(false);
    const cloudHydratedRef = useRef(false);

    const totalItems = TOTAL_LEAF_CONTENT_ITEMS > 0 ? TOTAL_LEAF_CONTENT_ITEMS : 1;

    const timeoutPromise = (ms) => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firebase Request Timed Out (Offline/Slow Network)')), ms)
    );

    const hydrateStoredState = (rawState = {}) => {
        const parsedState = sanitizeCloudState(rawState);
        const migratedReadItemVersions = migrateLegacyReadItems(parsedState.readItems, parsedState.readItemVersions);

        setReadItems(parsedState.readItems);
        setReadItemVersions(migratedReadItemVersions);
        setBookmarks(parsedState.bookmarks);
        setCurrentStreak(parsedState.currentStreak);
        setLastReadDate(parsedState.lastReadDate);
        setStudyScore(parsedState.studyScore);
        setDailyReadHistory(parsedState.dailyReadHistory);
        setQuizScores(parsedState.quizScores);

        return {
            ...parsedState,
            readItemVersions: migratedReadItemVersions,
        };
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                cloudHydratedRef.current = false;
                let claimsPremium = false;
                let claimsAdmin = false;
                try {
                    const tokenResult = await getIdTokenResult(firebaseUser, true);
                    claimsPremium = tokenResult.claims.isPremium === true;
                    claimsAdmin = tokenResult.claims.isAdmin === true;
                } catch {
                    // ignore
                }

                try {
                    const userDoc = await Promise.race([
                        getDoc(doc(db, 'users', firebaseUser.uid)),
                        timeoutPromise(8000),
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

                    const cloudState = hydrateStoredState(data);
                    setUser(userData);
                    setIsPremium(premiumStatus);
                    cloudHydratedRef.current = true;
                    await AsyncStorage.setItem('user', JSON.stringify(userData));
                    await AsyncStorage.setItem(getAccountStateKey(firebaseUser.uid), JSON.stringify(cloudState));
                } catch (err) {
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
                            hydrateStoredState(JSON.parse(cachedAccountState));
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

    useEffect(() => {
        if (user === null) {
            isLoggingOutRef.current = false;
        }
    }, [user]);

    useEffect(() => {
        const loadState = async () => {
            try {
                const storedReadItems = await AsyncStorage.getItem('readItems');
                if (cloudHydratedRef.current) return;

                const parsedReadItems = storedReadItems ? JSON.parse(storedReadItems) : [];
                const safeReadItems = Array.isArray(parsedReadItems)
                    ? parsedReadItems.filter((title) => VALID_MASTER_TITLES.has(title))
                    : [];

                const storedReadItemVersions = await AsyncStorage.getItem('readItemVersions');
                if (cloudHydratedRef.current) return;
                const parsedReadItemVersions = storedReadItemVersions ? JSON.parse(storedReadItemVersions) : {};

                setReadItems(safeReadItems);
                setReadItemVersions(migrateLegacyReadItems(safeReadItems, sanitizeReadItemVersions(parsedReadItemVersions)));

                const storedBookmarks = await AsyncStorage.getItem('bookmarks');
                if (cloudHydratedRef.current) return;
                if (storedBookmarks) {
                    setBookmarks(normalizeBookmarks(JSON.parse(storedBookmarks)));
                }

                const storedHighlights = await AsyncStorage.getItem('highlights');
                if (cloudHydratedRef.current) return;
                if (storedHighlights) {
                    setHighlights(JSON.parse(storedHighlights));
                }

                const storedStreak = await AsyncStorage.getItem('currentStreak');
                if (cloudHydratedRef.current) return;
                if (storedStreak) {
                    setCurrentStreak(parseInt(storedStreak, 10));
                }

                const storedLastRead = await AsyncStorage.getItem('lastReadDate');
                if (cloudHydratedRef.current) return;
                if (storedLastRead) {
                    setLastReadDate(storedLastRead);
                }

                const storedScore = await AsyncStorage.getItem('studyScore');
                if (cloudHydratedRef.current) return;
                if (storedScore) {
                    setStudyScore(parseInt(storedScore, 10));
                }

                const storedDailyHistory = await AsyncStorage.getItem('dailyReadHistory');
                if (cloudHydratedRef.current) return;
                if (storedDailyHistory) {
                    setDailyReadHistory(JSON.parse(storedDailyHistory));
                }

                const storedQuizScores = await AsyncStorage.getItem('quizScores');
                if (cloudHydratedRef.current) return;
                if (storedQuizScores) {
                    setQuizScores(JSON.parse(storedQuizScores));
                }

                if (storedLastRead) {
                    const diffDays = dayDiffFromToday(storedLastRead);
                    if (diffDays !== null && diffDays > 1) {
                        setCurrentStreak(0);
                    }
                }
            } catch (error) {
                console.error('Failed to load state from AsyncStorage:', error);
            }
        };

        loadState();
    }, []);

    useEffect(() => {
        const saveState = async () => {
            try {
                await AsyncStorage.setItem('readItems', JSON.stringify(readItems));
                await AsyncStorage.setItem('readItemVersions', JSON.stringify(readItemVersions));
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
                        readItemVersions,
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

                if (user && user.uid && !isLoggingOutRef.current && cloudHydratedRef.current) {
                    try {
                        await setDoc(doc(db, 'users', user.uid), {
                            readItems,
                            readItemVersions,
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
                console.error('Failed to save state to AsyncStorage:', error);
            }
        };

        saveState();
    }, [readItems, readItemVersions, bookmarks, highlights, currentStreak, lastReadDate, studyScore, dailyReadHistory, quizScores, user, isPremium]);

    useEffect(() => {
        if (user && user.uid) {
            registerForPushNotificationsAsync().then((token) => {
                if (token) {
                    setDoc(doc(db, 'users', user.uid), {
                        pushToken: token,
                        pushTokenUpdatedAt: serverTimestamp(),
                    }, { merge: true }).catch((err) => console.log('Error saving push token', err));
                }
            });
        }
    }, [user]);

    async function registerForPushNotificationsAsync() {
        let token;

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
                    return null;
                }
                token = (await SafeNotifications.getExpoPushTokenAsync()).data;
            } catch (err) {
                console.log('Expo notification error:', err);
                return null;
            }
        } else {
            console.log('Must use physical device for Push Notifications');
            return null;
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

    const effectiveReadCount = getEffectiveReadCount(readItemVersions);
    const readingProgress = totalItems === 0 ? 0 : Math.min(effectiveReadCount / totalItems, 1);

    const markAsRead = ({ itemTitle, contentKey, contentSignature }) => {
        if (!itemTitle || !contentKey || !contentSignature) {
            return;
        }

        setReadItemVersions((previousVersions) => {
            if (previousVersions[contentKey] === contentSignature) {
                return previousVersions;
            }

            const todayStr = new Date().toDateString();
            if (lastReadDate !== todayStr) {
                if (!lastReadDate) {
                    setCurrentStreak(1);
                } else {
                    const diffDays = dayDiffFromToday(lastReadDate);

                    if (diffDays === 1) {
                        setCurrentStreak((previousStreak) => previousStreak + 1);
                    } else if (diffDays === null || diffDays > 1) {
                        setCurrentStreak(1);
                    }
                }
                setLastReadDate(todayStr);
                setStudyScore((previousScore) => previousScore + 10);
            }

            const dateKey = new Date().toISOString().split('T')[0];
            setDailyReadHistory((previousHistory) => ({
                ...previousHistory,
                [dateKey]: (previousHistory[dateKey] || 0) + 1,
            }));

            setReadItems((previousTitles) => (
                previousTitles.includes(itemTitle) ? previousTitles : [...previousTitles, itemTitle]
            ));

            return {
                ...previousVersions,
                [contentKey]: contentSignature,
            };
        });
    };

    const markAsUnread = (contentRefs = []) => {
        const refsToClear = contentRefs.filter((ref) => ref?.contentKey);
        if (refsToClear.length === 0) {
            return;
        }

        setReadItemVersions((previousVersions) => {
            let changed = false;
            const nextVersions = { ...previousVersions };

            refsToClear.forEach(({ contentKey }) => {
                if (nextVersions[contentKey]) {
                    delete nextVersions[contentKey];
                    changed = true;
                }
            });

            if (!changed) {
                return previousVersions;
            }

            setReadItems(getReadTitles(nextVersions));
            return nextVersions;
        });
    };

    const recordQuizScore = (score, total) => {
        const entry = {
            date: new Date().toISOString().split('T')[0],
            score,
            total,
            percent: Math.round((score / total) * 100),
        };
        setQuizScores((prev) => [...prev.slice(-29), entry]);
        setStudyScore((prev) => prev + score * 5);
    };

    const getBookmarkIdentity = (itemOrTitle) => {
        if (!itemOrTitle) return null;
        if (typeof itemOrTitle === 'string') return itemOrTitle;
        return resolveBookmarkContentKey(itemOrTitle)
            || itemOrTitle.contentKey
            || itemOrTitle.title
            || null;
    };

    const isBookmarked = (itemOrTitle) => {
        const targetIdentity = getBookmarkIdentity(itemOrTitle);
        if (!targetIdentity) return false;
        return bookmarks.some((bookmark) => getBookmarkIdentity(bookmark) === targetIdentity);
    };

    const toggleBookmark = (item) => {
        const targetIdentity = getBookmarkIdentity(item);
        if (!targetIdentity) return;

        setBookmarks((previousBookmarks) => {
            const alreadyBookmarked = previousBookmarks.some(
                (bookmark) => getBookmarkIdentity(bookmark) === targetIdentity
            );

            if (alreadyBookmarked) {
                return previousBookmarks.filter(
                    (bookmark) => getBookmarkIdentity(bookmark) !== targetIdentity
                );
            }

            return [
                ...previousBookmarks,
                {
                    ...item,
                    contentKey: resolveBookmarkContentKey(item) || item.contentKey || null,
                },
            ];
        });
    };

    const saveHighlight = (id, htmlContent) => {
        setHighlights((prev) => ({
            ...prev,
            [id]: htmlContent,
        }));
    };

    useEffect(() => {
        if (Constants.appOwnership === 'expo') return;

        if (Purchases) {
            const rcApiKey = process.env.EXPO_PUBLIC_RC_API_KEY;
            const isTestKey = typeof rcApiKey === 'string' && rcApiKey.startsWith('test_');
            const isProdRuntime = !__DEV__;

            if (!rcApiKey || (isProdRuntime && isTestKey)) {
                console.warn('RevenueCat initialization skipped: missing or non-production API key.');
                return;
            }

            Purchases.configure({ apiKey: rcApiKey });

            Purchases.addCustomerInfoUpdateListener((info) => {
                if (info.entitlements.active.Premium !== undefined) {
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

    const clearStorage = async () => {
        await AsyncStorage.multiRemove([
            'readItems', 'readItemVersions', 'bookmarks', 'highlights', 'currentStreak',
            'lastReadDate', 'studyScore', 'dailyReadHistory', 'quizScores',
        ]);
        setReadItems([]);
        setReadItemVersions({});
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
        try { await signOut(auth); } catch (_) { }
        if (Constants.appOwnership !== 'expo' && GoogleSignin) {
            try { await GoogleSignin.signOut(); } catch (_) { }
        }
        await AsyncStorage.multiRemove([
            'user', 'isPremium', 'readItems', 'readItemVersions', 'bookmarks', 'highlights',
            'currentStreak', 'lastReadDate', 'studyScore', 'dailyReadHistory', 'quizScores',
        ]);

        setUser(null);
        setIsPremium(false);
        setReadItems([]);
        setReadItemVersions({});
        setBookmarks([]);
        setHighlights({});
        setCurrentStreak(0);
        setLastReadDate(null);
        setStudyScore(0);
        setDailyReadHistory({});
        setQuizScores([]);
    };

    const upgradeToPremium = () => {
        setIsPremium(true);
    };

    return (
        <AppContext.Provider
            value={{
                readItems,
                readItemVersions,
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
                markAsUnread,
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
                upgradeToPremium,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
