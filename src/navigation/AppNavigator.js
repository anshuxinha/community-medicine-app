import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator, useWindowDimensions } from "react-native";
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
import { useAppTheme } from "../styles/ThemeContext";

// Eager: first-paint surfaces only
import DashboardScreen from "../screens/DashboardScreen";
import LibraryScreen from "../screens/LibraryScreen";
import LoginScreen from "../screens/LoginScreen";
import PaywallScreen from "../screens/PaywallScreen";

// Deferred screens: loaded on first navigation via getComponent
const getVideosScreen = () => require("../screens/VideosScreen").default;
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
const getSearchScreen = () => require("../screens/SearchScreen").default;
const getAdminLibraryReviewScreen = () =>
  require("../screens/AdminLibraryReviewScreen").default;
const getAdminAppFeedbackScreen = () =>
  require("../screens/AdminAppFeedbackScreen").default;
const getLearningProgressScreen = () =>
  require("../screens/LearningProgressScreen").default;
const getOnboardingScreen = () => require("../screens/OnboardingScreen").default;
const getSupportScreen = () => require("../screens/SupportScreen").default;

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const tabBarBaseHeight = isLandscape ? 48 : 60;
  const { isPremium } = React.useContext(AppContext);
  const { colors } = useAppTheme();

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
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textPlaceholder,
        tabBarStyle: {
          backgroundColor: colors.surfacePrimary,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: colors.shadow,
          shadowOpacity: 0.1,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -5 },
          height: tabBarBaseHeight + insets.bottom,
          paddingBottom: insets.bottom || (isLandscape ? 4 : 8),
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Videos" getComponent={getVideosScreen} />
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

const PremiumGuard = ({ navigation, route }) => {
  const { user, isPremium } = React.useContext(AppContext);
  React.useEffect(() => {
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
  const { colors, navigationTheme } = useAppTheme();
  const onboardingPromptedRef = useRef(false);

  useSessionEnforcer();

  useEffect(() => {
    setupNotificationTapHandler(navigationRef);
  }, []);

  // One-time onboarding after login. Never re-prompt once completed on device
  // (OTA remounts reset refs; sparse cloud docs used to re-open this screen).
  useEffect(() => {
    if (!user?.uid) {
      onboardingPromptedRef.current = false;
      return;
    }
    if (user.onboardingCompleted === true) {
      onboardingPromptedRef.current = true;
      return;
    }
    if (onboardingPromptedRef.current) return;
    if (!navigationRef.isReady()) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const {
          getLocalOnboardingCompleted,
        } = require("../utils/onboardingStorage");
        const localDone = await getLocalOnboardingCompleted(user.uid);
        if (cancelled) return;
        if (localDone) {
          onboardingPromptedRef.current = true;
          return;
        }
        if (onboardingPromptedRef.current) return;
        onboardingPromptedRef.current = true;
        navigationRef.navigate("Onboarding");
      } catch (_) {}
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user?.uid, user?.onboardingCompleted]);

  if (user === undefined) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.inverseSurface,
        }}
      >
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfacePrimary },
          headerTintColor: colors.textTitle,
          headerTitleStyle: { color: colors.textTitle },
          contentStyle: { backgroundColor: colors.backgroundMain },
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
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
              name="Support"
              getComponent={getSupportScreen}
              options={{ title: "Support" }}
            />
            <Stack.Screen
              name="Bookmarks"
              getComponent={getBookmarksScreen}
              options={{ title: "Bookmarks" }}
            />
            <Stack.Screen
              name="Search"
              getComponent={getSearchScreen}
              options={{ title: "Search" }}
            />
            <Stack.Screen
              name="AdminLibraryReview"
              getComponent={getAdminLibraryReviewScreen}
              options={{ title: "Library Review Queue" }}
            />
            <Stack.Screen
              name="AdminAppFeedback"
              getComponent={getAdminAppFeedbackScreen}
              options={{ title: "Feedback & Requests" }}
            />
            <Stack.Screen
              name="LearningProgress"
              getComponent={getLearningProgressScreen}
              options={{ title: "Learning Progress" }}
            />
            <Stack.Screen
              name="Onboarding"
              getComponent={getOnboardingScreen}
              options={{
                headerShown: false,
                presentation: "modal",
                gestureEnabled: true,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
