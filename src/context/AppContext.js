import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import mockData from '../data/mockData.json';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

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

    // Auth & Premium State
    const [user, setUser] = useState(null);
    const [isPremium, setIsPremium] = useState(false);

    // Initialize state from AsyncStorage
    useEffect(() => {
        const loadState = async () => {
            try {
                const storedReadItems = await AsyncStorage.getItem('readItems');
                if (storedReadItems) {
                    setReadItems(JSON.parse(storedReadItems));
                }

                const storedBookmarks = await AsyncStorage.getItem('bookmarks');
                if (storedBookmarks) {
                    setBookmarks(JSON.parse(storedBookmarks));
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

                const storedUser = await AsyncStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }

                const storedPremium = await AsyncStorage.getItem('isPremium');
                if (storedPremium) {
                    setIsPremium(JSON.parse(storedPremium));
                }

                // Check streak validity on load
                if (storedLastRead) {
                    const lastDate = new Date(storedLastRead);
                    const today = new Date();
                    const diffTime = Math.abs(today - lastDate);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays > 1 && today.toDateString() !== lastDate.toDateString()) {
                        // Streak broken
                        setCurrentStreak(0);
                    }
                }
            } catch (error) {
                console.error("Failed to load state from AsyncStorage:", error);
            }

            // Calculate total items once at startup
            const total = countTotalContentItems(mockData);
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
                await AsyncStorage.setItem('studyScore', studyScore.toString());
                if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
                else await AsyncStorage.removeItem('user');
                await AsyncStorage.setItem('isPremium', JSON.stringify(isPremium));
            } catch (error) {
                console.error("Failed to save state to AsyncStorage:", error);
            }
        };

        saveState();
    }, [readItems, bookmarks, highlights, currentStreak, lastReadDate, studyScore, user, isPremium]);

    // Push token registration
    useEffect(() => {
        if (user && user.uid) {
            registerForPushNotificationsAsync().then(token => {
                if (token) {
                    updateDoc(doc(db, 'users', user.uid), {
                        pushToken: token
                    }).catch(err => console.log('Error saving push token', err));
                }
            });
        }
    }, [user]);

    async function registerForPushNotificationsAsync() {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Push notification permission denied.');
                return;
            }
            token = (await Notifications.getExpoPushTokenAsync()).data;
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
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
                        const lastDate = new Date(lastReadDate);
                        const today = new Date();
                        const diffTime = Math.abs(today - lastDate);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays === 1 || (diffDays === 0 && todayStr !== lastDate.toDateString())) {
                            setCurrentStreak(currentStreak + 1);
                        } else if (diffDays > 1) {
                            setCurrentStreak(1);
                        }
                    }
                    setLastReadDate(todayStr);
                    // Reward points for reading
                    setStudyScore((prevScore) => prevScore + 10);
                }

                return [...prev, itemTitle];
            }
            return prev;
        });
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

    const completeQuiz = (score) => {
        setStudyScore((prev) => prev + score);
    };

    // Force clear for debug/testing
    const clearStorage = async () => {
        await AsyncStorage.multiRemove(['readItems', 'bookmarks', 'highlights', 'currentStreak', 'lastReadDate', 'studyScore']);
        setReadItems([]);
        setBookmarks([]);
        setHighlights({});
        setCurrentStreak(0);
        setLastReadDate(null);
        setStudyScore(0);
        setUser(null);
        setIsPremium(false);
    };

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
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
                readingProgress,
                highlights,
                currentStreak,
                studyScore,
                markAsRead,
                isBookmarked,
                toggleBookmark,
                saveHighlight,
                completeQuiz,
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
