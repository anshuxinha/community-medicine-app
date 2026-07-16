import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import {
  NFHS_COMPARISON_CATEGORIES,
  NFHS_COMPARISON_INDICATORS,
  NFHS_COMPARISON_SOURCES,
} from "../data/nfhsComparisonData";

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return "NR";
  if (unit === "females/1000 males") return `${Math.round(value)}`;
  if (unit === "children/woman") return value.toFixed(1);
  return `${value.toFixed(1)}%`;
};

const getGapTone = (gap, lowerIsBetter) => {
  if (gap === null || lowerIsBetter === null) return "neutral";
  if (Math.abs(gap) < 0.05) return "neutral";
  const ruralBetter = lowerIsBetter ? gap < 0 : gap > 0;
  return ruralBetter ? "rural" : "urban";
};

const RuralUrbanRow = ({ item }) => {
  const rural = item.nfhs6.rural;
  const urban = item.nfhs6.urban;
  const hasComparison = rural !== null && urban !== null && rural !== undefined && urban !== undefined;
  const gap = hasComparison ? rural - urban : null;
  const tone = getGapTone(gap, item.lowerIsBetter);
  const maxValue = Math.max(hasComparison ? rural : 0, hasComparison ? urban : 0, 1);
  const ruralWidth = hasComparison ? `${Math.max((rural / maxValue) * 100, 8)}%` : "0%";
  const urbanWidth = hasComparison ? `${Math.max((urban / maxValue) * 100, 8)}%` : "0%";

  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.indicatorTitle}>{item.title}</Text>
        <View style={[styles.gapPill, styles[`${tone}Pill`]]}>
          <MaterialIcons
            name="swap-horiz"
            size={15}
            color={tone === "rural" ? "#047857" : tone === "urban" ? "#1D4ED8" : "#4B5563"}
          />
          <Text style={[styles.gapText, styles[`${tone}Text`]]}>
            {hasComparison ? Math.abs(gap).toFixed(item.unit === "females/1000 males" ? 0 : 1) : "NR"}
          </Text>
        </View>
      </View>

      <View style={styles.valueRow}>
        <View style={styles.valueCell}>
          <Text style={styles.cellLabel}>Rural</Text>
          <Text style={styles.ruralValue}>{formatValue(rural, item.unit)}</Text>
        </View>
        <View style={styles.valueCell}>
          <Text style={styles.cellLabel}>Urban</Text>
          <Text style={styles.urbanValue}>{formatValue(urban, item.unit)}</Text>
        </View>
      </View>

      <View style={styles.barArea}>
        <View style={styles.barTrack}>
          {hasComparison ? <View style={[styles.barFill, styles.ruralBar, { width: ruralWidth }]} /> : null}
        </View>
        <View style={styles.barTrack}>
          {hasComparison ? <View style={[styles.barFill, styles.urbanBar, { width: urbanWidth }]} /> : null}
        </View>
      </View>

      <Text style={styles.gapNote}>
        {hasComparison
          ? `${gap > 0 ? "Rural" : "Urban"} is higher by ${Math.abs(gap).toFixed(
              item.unit === "females/1000 males" ? 0 : 1
            )}${item.unit === "%" ? " percentage points" : ""}.`
          : "Not reported in the attached NFHS-6 India fact sheet."}
      </Text>
    </View>
  );
};

const NFHSRuralUrbanScreen = () => {
  const [category, setCategory] = useState("headline");
  const filteredIndicators = useMemo(
    () =>
      NFHS_COMPARISON_INDICATORS.filter(
        (item) => item.category === category && item.nfhs6.rural !== undefined && item.nfhs6.urban !== undefined
      ),
    [category]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>NFHS-6</Text>
          <Text style={styles.title}>Rural vs Urban</Text>
          <Text style={styles.subtitle}>2023-24 India fact sheet comparison</Text>
          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, styles.ruralBadge]}>
              <Text style={styles.badgeTitle}>Rural</Text>
            </View>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.heroBadge, styles.urbanBadge]}>
              <Text style={styles.badgeTitle}>Urban</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {NFHS_COMPARISON_CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <Text
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[styles.categoryTab, active && styles.categoryTabActive]}
              >
                {item.label}
              </Text>
            );
          })}
        </ScrollView>

        <Card style={styles.matrixCard}>
          <Card.Content>
            <View style={styles.matrixHeader}>
              <View>
                <Text style={styles.matrixTitle}>
                  {NFHS_COMPARISON_CATEGORIES.find((item) => item.id === category)?.label} Indicators
                </Text>
                <Text style={styles.matrixSubtitle}>NFHS-6 rural and urban columns only</Text>
              </View>
              <MaterialIcons name="location-city" size={28} color={theme.colors.secondary} />
            </View>
            {filteredIndicators.map((item) => (
              <RuralUrbanRow key={item.id} item={item} />
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.sourceCard}>
          <Card.Content>
            <Text style={styles.sourceTitle}>Source</Text>
            <Text style={styles.sourceLabel}>{NFHS_COMPARISON_SOURCES[0].label}</Text>
            <Text style={styles.sourceDetail}>{NFHS_COMPARISON_SOURCES[0].detail}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundMain,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: "#0F172A",
    borderRadius: 8,
    padding: 22,
    marginBottom: 16,
  },
  kicker: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  title: {
    color: "#38BDF8",
    fontSize: 33,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 8,
  },
  heroBadges: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  heroBadge: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  ruralBadge: {
    backgroundColor: "#065F46",
    borderColor: "#34D399",
  },
  urbanBadge: {
    backgroundColor: "#1D4ED8",
    borderColor: "#60A5FA",
  },
  badgeTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },
  vsCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  vsText: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
  },
  categoryTabs: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryTab: {
    backgroundColor: "#EEF2F7",
    color: "#334155",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: "800",
    overflow: "hidden",
  },
  categoryTabActive: {
    backgroundColor: theme.colors.secondary,
    color: "#FFFFFF",
  },
  matrixCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 16,
  },
  matrixHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  matrixTitle: {
    color: theme.colors.textTitle,
    fontSize: 20,
    fontWeight: "900",
  },
  matrixSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  row: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
    marginTop: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  indicatorTitle: {
    flex: 1,
    color: theme.colors.textTitle,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  gapPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  ruralPill: {
    backgroundColor: "#DCFCE7",
  },
  urbanPill: {
    backgroundColor: "#DBEAFE",
  },
  neutralPill: {
    backgroundColor: "#E5E7EB",
  },
  gapText: {
    fontSize: 12,
    fontWeight: "900",
  },
  ruralText: {
    color: "#047857",
  },
  urbanText: {
    color: "#1D4ED8",
  },
  neutralText: {
    color: "#4B5563",
  },
  valueRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  valueCell: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
  },
  cellLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  ruralValue: {
    color: "#047857",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  urbanValue: {
    color: "#1D4ED8",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  barArea: {
    marginTop: 10,
    gap: 6,
  },
  barTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 8,
  },
  ruralBar: {
    backgroundColor: "#10B981",
  },
  urbanBar: {
    backgroundColor: "#3B82F6",
  },
  gapNote: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  sourceCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  sourceTitle: {
    color: theme.colors.textTitle,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 10,
  },
  sourceLabel: {
    color: theme.colors.textTitle,
    fontSize: 13,
    fontWeight: "800",
  },
  sourceDetail: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});

export default NFHSRuralUrbanScreen;
