import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppContext } from "../context/AppContext";
import { useSessionEnforcer } from "../hooks/useSessionEnforcer";
import { setupNotificationTapHandler } from "../services/notificationService";

// Eager: first-paint surfaces only
import DashboardScreen from "../screens/DashboardScreen";
import LibraryScreen from "../screens/LibraryScreen";
import VideosScreen from "../screens/VideosScreen";
import LoginScreen from "../screens/LoginScreen";
import PaywallScreen from "../screens/PaywallScreen";
import { theme } from "../styles/theme";

// Deferred screens: loaded on first navigation via getComponent (not parsed at cold start)
const getUpdatesScreen = () => require("../screens/UpdatesScreen").default;
const getPYQCreateScreen = () => require("../screens/PYQCreateScreen").default;
const getReadingScreen = () => require("../screens/ReadingScreen").default;
const getSubTopicsScreen = () => require("../screens/SubTopicsScreen").default;
const getQuizScreen = () => require("../screens/QuizScreen").default;
const getPYQPracticeScreen = () => require("../screens/PYQPracticeScreen").default;
const getFieldToolboxScreen = () => require("../screens/FieldToolboxScreen").default;
const getSESCalculatorScreen = () => require("../screens/SESCalculatorScreen").default;
const getDietarySurveyScreen = () => require("../screens/DietarySurveyScreen").default;
const getAnthropometryScreen = () => require("../screens/AnthropometryScreen").default;
const getNFHSComparisonScreen = () => require("../screens/NFHSComparisonScreen").default;
const getNFHSRuralUrbanScreen = () => require("../screens/NFHSRuralUrbanScreen").default;
const getNFHSTrendsScreen = () => require("../screens/NFHSTrendsScreen").default;
const getVirtualMuseumScreen = () => require("../screens/VirtualMuseumScreen").default;
const getBiostatsAssistantScreen = () =>
  require("../screens/BiostatsAssistantScreen").default;
const getGemsScreen = () => require("../screens/GemsScreen").default;
const getNotificationsScreen = () => require("../screens/NotificationsScreen").default;
const getProfileScreen = () => require("../screens/ProfileScreen").default;
const getBookmarksScreen = () => require("../screens/BookmarksScreen").default;
const getAdminLibraryReviewScreen = () =>
  require("../screens/AdminLibraryReviewScreen").default;

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { isPremium } = React.useContext(AppContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "dashboard";
          else if (route.name === "Library") iconName = "book";
          else if (route.name === "QBank") iconName = "assignment";
          else if (route.name === "Updates") iconName = "update";
          else if (route.name === "Videos") iconName = "ondemand-video";
          return <MaterialIcons name={iconName} color={color} size={size} />;
        },
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textPlaceholder,
        tabBarStyle: {
          backgroundColor: theme.colors.surfacePrimary,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -5 },
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom || 8,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Videos" component={VideosScreen} />
      <Tab.Screen
        name="Updates"
        getComponent={getUpdatesScreen}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            if (isPremium) return;

            event.preventDefault();
            navigation.getParent()?.navigate("Paywall");
          },
        })}
      />
      <Tab.Screen name="QBank" getComponent={getPYQCreateScreen} />
    </Tab.Navigator>
  );
};

// Silent route guard for premium content
const PremiumGuard = ({ navigation, route }) => {
  const { user, isPremium } = React.useContext(AppContext);
  React.useEffect(() => {
    // user === undefined means auth is still resolving — don't redirect yet
    if (user === undefined) return;

    if (!user) {
      navigation.replace("Login");
    } else if (!isPremium) {
      navigation.replace("Paywall");
    } else {
      const dest = route.params?.destination;
      if (dest === "Reading")
        navigation.replace("Reading", route.params?.readingParams);
      else if (dest === "SubTopics")
        navigation.replace("SubTopics", route.params?.subTopicsParams);
      else if (dest === "Gems") navigation.replace("Gems");
    }
  }, [user, isPremium, navigation, route.params]);
  return null;
};

const AppNavigator = () => {
  const { user } = React.useContext(AppContext);

  useSessionEnforcer();

  useEffect(() => {
    setupNotificationTapHandler(navigationRef);
  }, []);

  // undefined = still resolving auth state (onAuthStateChanged not yet fired)
  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.colors.textPrimary,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            {/* ── Main tabs ── */}
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />

            {/* ── Library sub-screens ── */}
            <Stack.Screen
              name="Reading"
              getComponent={getReadingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SubTopics"
              getComponent={getSubTopicsScreen}
              options={({ route }) => ({ title: route.params.title })}
            />
            <Stack.Screen
              name="Quiz"
              getComponent={getQuizScreen}
              options={({ route }) => ({ title: `${route.params.title} Quiz` })}
            />
            <Stack.Screen
              name="PYQPractice"
              getComponent={getPYQPracticeScreen}
              options={{ headerShown: false }}
            />

            {/* ── Field Toolbox ── */}
            <Stack.Screen
              name="FieldToolbox"
              getComponent={getFieldToolboxScreen}
              options={{ title: "🧰 Field Toolbox" }}
            />
            <Stack.Screen
              name="SESCalculator"
              getComponent={getSESCalculatorScreen}
              options={{ title: "SES Calculator" }}
            />
            <Stack.Screen
              name="DietarySurvey"
              getComponent={getDietarySurveyScreen}
              options={{ title: "Dietary Survey" }}
            />
            <Stack.Screen
              name="Anthropometry"
              getComponent={getAnthropometryScreen}
              options={{ title: "Anthropometry" }}
            />
            <Stack.Screen
              name="NFHSComparison"
              getComponent={getNFHSComparisonScreen}
              options={{ title: "NFHS-5 vs NFHS-6" }}
            />
            <Stack.Screen
              name="NFHSRuralUrban"
              getComponent={getNFHSRuralUrbanScreen}
              options={{ title: "NFHS-6 Rural vs Urban" }}
            />
            <Stack.Screen
              name="NFHSTrends"
              getComponent={getNFHSTrendsScreen}
              options={{ title: "NFHS Trends" }}
            />

            {/* ── Other Modules ── */}
            <Stack.Screen
              name="VirtualMuseum"
              getComponent={getVirtualMuseumScreen}
              options={{ title: "🏛️ Virtual Museum" }}
            />
            <Stack.Screen
              name="BiostatsAssistant"
              getComponent={getBiostatsAssistantScreen}
              options={{ title: "📊 Biostats Assistant" }}
            />
            <Stack.Screen
              name="Gems"
              getComponent={getGemsScreen}
              options={{ title: "💎 Study Gems" }}
            />

            {/* ── Paywall / Guards ── */}
            <Stack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ headerShown: false, presentation: "fullScreenModal" }}
            />
            <Stack.Screen
              name="PremiumGuard"
              component={PremiumGuard}
              options={{ headerShown: false, presentation: "transparentModal" }}
            />

            {/* ── Drawer-linked screens ── */}
            <Stack.Screen
              name="Notifications"
              getComponent={getNotificationsScreen}
              options={{ title: "Notifications" }}
            />
            <Stack.Screen
              name="Profile"
              getComponent={getProfileScreen}
              options={{ title: "My Profile" }}
            />
            <Stack.Screen
              name="Bookmarks"
              getComponent={getBookmarksScreen}
              options={{ title: "Bookmarks" }}
            />
            <Stack.Screen
              name="AdminLibraryReview"
              getComponent={getAdminLibraryReviewScreen}
              options={{ title: "Library Review Queue" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
