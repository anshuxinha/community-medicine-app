import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import DashboardScreen from '../screens/DashboardScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import ReadingScreen from '../screens/ReadingScreen';
import SubTopicsScreen from '../screens/SubTopicsScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = 'view-dashboard';
                    } else if (route.name === 'Library') {
                        iconName = 'book-open-variant';
                    } else if (route.name === 'Search') {
                        iconName = 'magnify';
                    } else if (route.name === 'Bookmarks') {
                        iconName = 'bookmark';
                    }

                    return <IconButton icon={iconName} iconColor={color} size={size} />;
                },
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Library" component={LibraryScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    name="MainTabs"
                    component={TabNavigator}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Reading"
                    component={ReadingScreen}
                    options={({ route }) => ({ title: route.params.title })}
                />
                <Stack.Screen
                    name="SubTopics"
                    component={SubTopicsScreen}
                    options={({ route }) => ({ title: route.params.title })}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
