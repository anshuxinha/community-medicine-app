import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import ReadingScreen from '../screens/ReadingScreen';
import SubTopicsScreen from '../screens/SubTopicsScreen';
import ChatScreen from '../screens/ChatScreen';
import QuizScreen from '../screens/QuizScreen';
import LoginScreen from '../screens/LoginScreen';
import PaywallScreen from '../screens/PaywallScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContext } from '../context/AppContext';

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
                        iconName = 'dashboard';
                    } else if (route.name === 'Library') {
                        iconName = 'book';
                    } else if (route.name === 'Search') {
                        iconName = 'search';
                    } else if (route.name === 'Bookmarks') {
                        iconName = 'bookmark';
                    } else if (route.name === 'Tutor') {
                        iconName = 'face';
                    }

                    return <MaterialIcons name={iconName} color={color} size={size} />;
                },
                tabBarActiveTintColor: '#6200ee',
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Library" component={LibraryScreen} />
            <Tab.Screen
                name="Tutor"
                component={ChatScreen}
                listeners={({ navigation }) => ({
                    tabPress: e => {
                        e.preventDefault();
                        navigation.navigate('PremiumGuard', { destination: 'TutorTab' });
                    },
                })}
            />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
        </Tab.Navigator>
    );
};

// A silent functional component to act as an interceptor
const PremiumGuard = ({ navigation, route }) => {
    const { user, isPremium } = React.useContext(AppContext);

    React.useEffect(() => {
        if (!user) {
            navigation.replace('Login');
        } else if (!isPremium) {
            navigation.replace('Paywall');
        } else {
            // User is auth'd and premium, route them to their actual destination
            if (route.params?.destination === 'TutorTab') {
                navigation.navigate('MainTabs', { screen: 'Tutor' });
            } else if (route.params?.destination === 'Reading') {
                navigation.replace('Reading', route.params?.readingParams);
            } else if (route.params?.destination === 'SubTopics') {
                navigation.replace('SubTopics', route.params?.subTopicsParams);
            }
        }
    }, []);

    return null;
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
                <Stack.Screen
                    name="Quiz"
                    component={QuizScreen}
                    options={({ route }) => ({ title: `${route.params.title} Quiz` })}
                />
                {/* Auth and Paywall Screens */}
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false, presentation: 'modal' }}
                />
                <Stack.Screen
                    name="Paywall"
                    component={PaywallScreen}
                    options={{ headerShown: false, presentation: 'fullScreenModal' }}
                />
                <Stack.Screen
                    name="PremiumGuard"
                    component={PremiumGuard}
                    options={{ headerShown: false, presentation: 'transparentModal' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
