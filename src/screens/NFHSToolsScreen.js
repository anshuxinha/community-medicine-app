import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "../styles/useThemedStyles";
import NFHSComparisonScreen from "./NFHSComparisonScreen";
import NFHSRuralUrbanScreen from "./NFHSRuralUrbanScreen";
import NFHSTrendsScreen from "./NFHSTrendsScreen";

const MODE_FROM_ROUTE = {
  NFHSComparison: "comparison",
  NFHSRuralUrban: "ruralUrban",
  NFHSTrends: "trends",
  NFHSTools: "comparison",
};

const NFHSToolsScreen = ({ route }) => {
  const { styles } = useThemedStyles(createStyles);
  const routeMode =
    route?.params?.mode || MODE_FROM_ROUTE[route?.name] || "comparison";
  const [mode, setMode] = useState(routeMode);

  useEffect(() => {
    setMode(routeMode);
  }, [routeMode]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <View style={styles.tabs}>
        <SegmentedButtons
          value={mode}
          onValueChange={setMode}
          buttons={[
            { value: "comparison", label: "5 vs 6" },
            { value: "ruralUrban", label: "Rural / Urban" },
            { value: "trends", label: "Trends" },
          ]}
        />
      </View>
      <View style={styles.body}>
        {mode === "comparison" ? <NFHSComparisonScreen embedded /> : null}
        {mode === "ruralUrban" ? <NFHSRuralUrbanScreen embedded /> : null}
        {mode === "trends" ? <NFHSTrendsScreen embedded /> : null}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    tabs: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 4,
      backgroundColor: colors.backgroundMain,
    },
    body: {
      flex: 1,
    },
  });

export default NFHSToolsScreen;
