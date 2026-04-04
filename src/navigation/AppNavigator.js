import React from "react";
import { Platform, View, ActivityIndicator } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppContext } from "../context/AppContext";

// Tab screens
import DashboardScreen from "../screens/DashboardScreen";
import LibraryScreen from "../screens/LibraryScreen";
import BookmarksScreen from "../screens/BookmarksScreen";
import WebinarsScreen from "../screens/WebinarsScreen";

// Stack screens
import ReadingScreen from "../screens/ReadingScreen";
import SubTopicsScreen from "../screens/SubTopicsScreen";
import QuizScreen from "../screens/QuizScreen";
import LoginScreen from "../screens/LoginScreen";
import PaywallScreen from "../screens/PaywallScreen";

import FieldToolboxScreen from "../screens/FieldToolboxScreen";
import SESCalculatorScreen from "../screens/SESCalculatorScreen";
import DietarySurveyScreen from "../screens/DietarySurveyScreen";
import AnthropometryScreen from "../screens/AnthropometryScreen";
import VirtualMuseumScreen from "../screens/VirtualMuseumScreen";
import BiostatsAssistantScreen from "../screens/BiostatsAssistantScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import { theme } from "../styles/theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "dashboard";
          else if (route.name === "Library") iconName = "book";
          else if (route.name === "Bookmarks") iconName = "bookmark";
          else if (route.name === "Webinars") iconName = "ondemand-video";
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
      <Tab.Screen name="Webinars" component={WebinarsScreen} />
      <Tab.Screen name="Bookmarks" component={BookmarksScreen} />
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
    }
  }, [user, isPremium, navigation, route.params]);
  return null;
};

const AppNavigator = () => {
  const { user } = React.useContext(AppContext);

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
    <NavigationContainer>
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

            {/* ── Field Toolbox ── */}
            <Stack.Screen
              name="FieldToolbox"
              component={FieldToolboxScreen}
              options={{ title: "🧰 Field Toolbox" }}
            />
            <Stack.Screen
              name="SESCalculator"
              component={SESCalculatorScreen}
              options={{ title: "SES Calculator" }}
            />
            <Stack.Screen
              name="DietarySurvey"
              component={DietarySurveyScreen}
              options={{ title: "Dietary Survey" }}
            />
            <Stack.Screen
              name="Anthropometry"
              component={AnthropometryScreen}
              options={{ title: "Anthropometry" }}
            />

            {/* ── Other Modules ── */}
            <Stack.Screen
              name="VirtualMuseum"
              component={VirtualMuseumScreen}
              options={{ title: "🏛️ Virtual Museum" }}
            />
            <Stack.Screen
              name="BiostatsAssistant"
              component={BiostatsAssistantScreen}
              options={{ title: "📊 Biostats Assistant" }}
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
              component={NotificationsScreen}
              options={{ title: "Notifications" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
