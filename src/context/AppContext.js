import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import mockData from '../data/mockData.json';

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
            } catch (error) {
                console.error("Failed to save state to AsyncStorage:", error);
            }
        };

        saveState();
    }, [readItems, bookmarks, highlights, currentStreak, lastReadDate, studyScore]);

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
                clearStorage
            }}
        >
            {children}
        </AppContext.Provider>
    );
};
