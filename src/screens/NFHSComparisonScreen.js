import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, SegmentedButtons, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import {
  NFHS_COMPARISON_CATEGORIES,
  NFHS_COMPARISON_INDICATORS,
  NFHS_COMPARISON_SOURCES,
} from "../data/nfhsComparisonData";

const AREA_LABELS = {
  total: "India",
  urban: "Urban",
  rural: "Rural",
};

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return "NR";
  if (unit === "females/1000 males") return `${Math.round(value)}`;
  if (unit === "children/woman") return value.toFixed(1);
  return `${value.toFixed(1)}%`;
};

const getDeltaTone = (delta, lowerIsBetter) => {
  if (delta === null || delta === undefined) return "neutral";
  if (Math.abs(delta) < 0.05 || lowerIsBetter === null) return "neutral";
  const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
  return isImprovement ? "good" : "watch";
};

const IndicatorRow = ({ item, area }) => {
  const nfhs6Value = item.nfhs6[area];
  const hasComparison = nfhs6Value !== null && nfhs6Value !== undefined;
  const delta = hasComparison ? nfhs6Value - item.nfhs5 : null;
  const tone = getDeltaTone(delta, item.lowerIsBetter);
  const maxValue = Math.max(item.nfhs5, hasComparison ? nfhs6Value : 0, 1);
  const nfhs5Width = `${Math.max((item.nfhs5 / maxValue) * 100, 8)}%`;
  const nfhs6Width = hasComparison ? `${Math.max((nfhs6Value / maxValue) * 100, 8)}%` : "0%";

  return (
    <View style={styles.indicatorRow}>
      <View style={styles.rowHeader}>
        <Text style={styles.indicatorTitle}>{item.title}</Text>
        <View style={[styles.deltaPill, styles[`${tone}Pill`]]}>
          <MaterialIcons
            name={!hasComparison ? "remove" : delta < 0 ? "south" : delta > 0 ? "north" : "remove"}
            size={14}
            color={tone === "good" ? "#047857" : tone === "watch" ? "#B45309" : "#4B5563"}
          />
          <Text style={[styles.deltaText, styles[`${tone}Text`]]}>
            {hasComparison ? Math.abs(delta).toFixed(item.unit === "females/1000 males" ? 0 : 1) : "NR"}
          </Text>
        </View>
      </View>

      <View style={styles.matrixRow}>
        <View style={styles.yearCell}>
          <Text style={styles.yearLabel}>NFHS-5</Text>
          <Text style={styles.nfhs5Value}>{formatValue(item.nfhs5, item.unit)}</Text>
        </View>
        <View style={styles.yearCell}>
          <Text style={styles.yearLabel}>NFHS-6</Text>
          <Text style={styles.nfhs6Value}>{formatValue(nfhs6Value, item.unit)}</Text>
        </View>
      </View>

      <View style={styles.barArea}>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, styles.nfhs5Bar, { width: nfhs5Width }]} />
        </View>
        <View style={styles.barTrack}>
          {hasComparison ? <View style={[styles.barFill, styles.nfhs6Bar, { width: nfhs6Width }]} /> : null}
        </View>
      </View>

      {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
    </View>
  );
};

const NFHSComparisonScreen = () => {
  const [area, setArea] = useState("total");
  const [category, setCategory] = useState("headline");

  const filteredIndicators = useMemo(
    () => NFHS_COMPARISON_INDICATORS.filter((item) => item.category === category),
    [category]
  );

  const featured = useMemo(
    () =>
      ["under15", "institutionalBirths", "womenAnaemia", "stunting"]
        .map((id) => NFHS_COMPARISON_INDICATORS.find((item) => item.id === id))
        .filter(Boolean),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>NFHS-5 vs NFHS-6</Text>
          <Text style={styles.title}>Master Matrix</Text>
          <Text style={styles.subtitle}>Side-by-side comparison of India key indicators</Text>

          <View style={styles.yearCards}>
            <View style={[styles.yearBadge, styles.nfhs5Badge]}>
              <Text style={styles.badgeTitle}>NFHS-5</Text>
              <Text style={styles.badgeSubtitle}>2019-21</Text>
            </View>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={[styles.yearBadge, styles.nfhs6Badge]}>
              <Text style={styles.badgeTitle}>NFHS-6</Text>
              <Text style={styles.badgeSubtitle}>2023-24</Text>
            </View>
          </View>
        </View>

        <Card style={styles.controlCard}>
          <Card.Content>
            <Text style={styles.controlLabel}>NFHS-6 area lens</Text>
            <SegmentedButtons
              value={area}
              onValueChange={setArea}
              buttons={[
                { value: "total", label: "India" },
                { value: "rural", label: "Rural" },
                { value: "urban", label: "Urban" },
              ]}
              style={styles.segmented}
            />
            <Text style={styles.helperText}>
              NFHS-5 column uses national totals. NFHS-6 can be viewed as {AREA_LABELS[area].toLowerCase()} values
              from the attached fact sheet.
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.featureGrid}>
          {featured.map((item) => {
            const nfhs6Value = item.nfhs6.total;
            const hasComparison = nfhs6Value !== null && nfhs6Value !== undefined;
            const delta = hasComparison ? nfhs6Value - item.nfhs5 : null;
            const tone = getDeltaTone(delta, item.lowerIsBetter);
            return (
              <View key={item.id} style={styles.featureCard}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <View style={styles.featureValues}>
                  <Text style={styles.nfhs5Value}>{formatValue(item.nfhs5, item.unit)}</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#64748B" />
                  <Text style={styles.nfhs6Value}>{formatValue(nfhs6Value, item.unit)}</Text>
                </View>
                <Text style={[styles.featureDelta, styles[`${tone}Text`]]}>
                  {hasComparison
                    ? `${delta > 0 ? "+" : ""}${delta.toFixed(
                        item.unit === "females/1000 males" ? 0 : 1
                      )} since NFHS-5`
                    : "Not reported in attached NFHS-6 fact sheet"}
                </Text>
              </View>
            );
          })}
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
                <Text style={styles.matrixSubtitle}>{AREA_LABELS[area]} lens</Text>
              </View>
              <MaterialIcons name="compare-arrows" size={28} color={theme.colors.secondary} />
            </View>
            {filteredIndicators.map((item) => (
              <IndicatorRow key={item.id} item={item} area={area} />
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.sourceCard}>
          <Card.Content>
            <Text style={styles.sourceTitle}>Sources</Text>
            {NFHS_COMPARISON_SOURCES.map((source) => (
              <View key={source.label} style={styles.sourceItem}>
                <Text style={styles.sourceLabel}>{source.label}</Text>
                <Text style={styles.sourceDetail}>{source.detail}</Text>
              </View>
            ))}
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
    backgroundColor: "#08111F",
    borderRadius: 8,
    padding: 22,
    marginBottom: 16,
  },
  kicker: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
  },
  title: {
    color: "#A855F7",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center",
    marginTop: 4,
  },
  subtitle: {
    alignSelf: "center",
    color: "#FACC15",
    borderWidth: 1,
    borderColor: "#FACC15",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 14,
  },
  yearCards: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  yearBadge: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  nfhs5Badge: {
    backgroundColor: "#3B1479",
    borderColor: "#8B5CF6",
  },
  nfhs6Badge: {
    backgroundColor: "#047A3D",
    borderColor: "#22C55E",
  },
  badgeTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "900",
  },
  badgeSubtitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
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
  controlCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 8,
    marginBottom: 16,
  },
  controlLabel: {
    color: theme.colors.textTitle,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  segmented: {
    marginBottom: 10,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  featureGrid: {
    gap: 10,
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  featureTitle: {
    color: theme.colors.textTitle,
    fontSize: 15,
    fontWeight: "800",
  },
  featureValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  featureDelta: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6,
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
  indicatorRow: {
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
  deltaPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 2,
  },
  goodPill: {
    backgroundColor: "#DCFCE7",
  },
  watchPill: {
    backgroundColor: "#FEF3C7",
  },
  neutralPill: {
    backgroundColor: "#E5E7EB",
  },
  deltaText: {
    fontSize: 12,
    fontWeight: "900",
  },
  goodText: {
    color: "#047857",
  },
  watchText: {
    color: "#B45309",
  },
  neutralText: {
    color: "#4B5563",
  },
  matrixRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  yearCell: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 10,
  },
  yearLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  nfhs5Value: {
    color: "#5B21B6",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 2,
  },
  nfhs6Value: {
    color: "#15803D",
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
  nfhs5Bar: {
    backgroundColor: "#7C3AED",
  },
  nfhs6Bar: {
    backgroundColor: "#16A34A",
  },
  noteText: {
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
  sourceItem: {
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

export default NFHSComparisonScreen;
