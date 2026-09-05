import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Share,
  Platform,
  KeyboardAvoidingView,
  Clipboard,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Card,
  Divider,
  Chip,
  IconButton,
  ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import foodData from "../data/foodData.json";
import {
  REFERENCE_PROFILES,
  MEAL_SLOTS,
  CU_COEFFICIENT_OPTIONS,
  FOOD_CATEGORIES,
  SAMPLE_RECALL_ITEMS,
  SAMPLE_FAMILY_MEMBERS,
  SAMPLE_FAMILY_RATIONS,
  calculateIndividualIntake,
  calculateFamilySurvey,
  generateClinicalImpression,
  generateDietaryCounseling,
  generateCaseSheetSummary,
  findFood,
  gramsForItem,
  intakeStatus,
  formatPct,
} from "../data/dietaryReferenceData";
import { ALL_ORIENTATIONS } from "../constants/orientations";
import { useThemedStyles } from "../styles/useThemedStyles";

const EMPTY_RATIONS = {
  cerealsKg: "",
  pulsesKg: "",
  oilKg: "",
  milkL: "",
  sugarKg: "",
  glvKg: "",
  otherVegKg: "",
  tubersKg: "",
  fruitsKg: "",
  nutsKg: "",
};

const RATION_FIELDS = [
  { key: "cerealsKg", label: "Cereals (kg)" },
  { key: "pulsesKg", label: "Pulses (kg)" },
  { key: "oilKg", label: "Visible fat, oil/ghee (kg)" },
  { key: "milkL", label: "Milk (L)" },
  { key: "sugarKg", label: "Sugar (kg)" },
  { key: "glvKg", label: "Green leafy veg (kg)" },
  { key: "otherVegKg", label: "Other vegetables (kg)" },
  { key: "tubersKg", label: "Roots and tubers (kg)" },
  { key: "fruitsKg", label: "Fruits (kg)" },
  { key: "nutsKg", label: "Nuts and oilseeds (kg)" },
];

const DietarySurveyScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);
  const [activeMode, setActiveMode] = useState("individual");
  const [selectedProfileKey, setSelectedProfileKey] = useState("man_sedentary");
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [recallItems, setRecallItems] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [targetMealId, setTargetMealId] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [activeItemForPortion, setActiveItemForPortion] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([
    { id: "m1", label: "Member 1", cu: 1.0, cuLabel: "Adult male, sedentary (1.0 CU)" },
  ]);
  const [familyRationPeriod, setFamilyRationPeriod] = useState("monthly");
  const [familyRations, setFamilyRations] = useState({ ...EMPTY_RATIONS });
  const [cuModalVisible, setCuModalVisible] = useState(false);
  const [cuMemberId, setCuMemberId] = useState(null);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => disableScreenCaptureProtection();
  }, []);

  const currentProfile =
    REFERENCE_PROFILES[selectedProfileKey] || REFERENCE_PROFILES.man_sedentary;

  const filteredFoods = useMemo(() => {
    return foodData.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.ifctCode || "").toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  const individualResult = useMemo(
    () => calculateIndividualIntake(recallItems, foodData, currentProfile),
    [recallItems, currentProfile]
  );

  const familyResult = useMemo(
    () =>
      calculateFamilySurvey({
        members: familyMembers,
        rations: familyRations,
        period: familyRationPeriod,
      }),
    [familyMembers, familyRations, familyRationPeriod]
  );

  const totalFamilyCU = useMemo(
    () => familyMembers.reduce((sum, m) => sum + (parseFloat(m.cu) || 0), 0),
    [familyMembers]
  );

  const handleOpenAddPicker = (mealId) => {
    setTargetMealId(mealId);
    setSearchQuery("");
    setSelectedCategory("All");
    setPickerVisible(true);
  };

  const handleSelectFood = (food) => {
    const defaultPortion =
      food.portions && food.portions.length > 0
        ? food.portions[0]
        : { id: "g", label: "Grams", grams: 1 };
    setRecallItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        mealId: targetMealId,
        foodId: food.id,
        portionId: defaultPortion.id,
        quantity: "1",
      },
    ]);
    setPickerVisible(false);
  };

  const handleRemoveItem = (id) => {
    setRecallItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id, newQty) => {
    const cleaned = newQty.replace(/[^0-9.]/g, "");
    setRecallItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: cleaned } : item))
    );
  };

  const handleSelectPortion = (portion) => {
    if (!activeItemForPortion) return;
    setRecallItems((prev) =>
      prev.map((item) =>
        item.id === activeItemForPortion.id ? { ...item, portionId: portion.id } : item
      )
    );
    setPortionModalVisible(false);
    setActiveItemForPortion(null);
  };

  const handleAddFamilyMember = () => {
    setFamilyMembers((prev) => [
      ...prev,
      {
        id: `fam_${Date.now()}`,
        label: `Member ${prev.length + 1}`,
        cu: 1.0,
        cuLabel: "Adult male, sedentary (1.0 CU)",
      },
    ]);
  };

  const handleRemoveFamilyMember = (id) => {
    if (familyMembers.length <= 1) {
      Alert.alert("Keep one member", "A family roster needs at least one person.");
      return;
    }
    setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handlePickCU = (opt) => {
    setFamilyMembers((prev) =>
      prev.map((m) =>
        m.id === cuMemberId ? { ...m, cu: opt.cu, cuLabel: opt.label } : m
      )
    );
    setCuModalVisible(false);
    setCuMemberId(null);
  };

  const loadSampleIndividual = () => {
    setSelectedProfileKey("preg_3rd_sedentary");
    setRecallItems(SAMPLE_RECALL_ITEMS.map((item) => ({ ...item })));
  };

  const clearIndividual = () => setRecallItems([]);

  const loadSampleFamily = () => {
    setFamilyMembers(SAMPLE_FAMILY_MEMBERS.map((m) => ({ ...m })));
    setFamilyRations({ ...SAMPLE_FAMILY_RATIONS });
    setFamilyRationPeriod("monthly");
  };

  const clearFamily = () => {
    setFamilyMembers([
      { id: "m1", label: "Member 1", cu: 1.0, cuLabel: "Adult male, sedentary (1.0 CU)" },
    ]);
    setFamilyRations({ ...EMPTY_RATIONS });
    setFamilyRationPeriod("monthly");
  };

  const handleShareSummary = async (alsoCopy) => {
    let summaryText = "";
    if (activeMode === "individual") {
      if (!individualResult) {
        Alert.alert("Add food first", "Log at least one food with a quantity.");
        return;
      }
      summaryText = generateCaseSheetSummary({
        mode: "individual",
        profile: currentProfile,
        result: individualResult,
        mealRows: individualResult.calculatedMealRows,
      });
    } else {
      if (familyResult?.error) {
        Alert.alert("Check the roster", familyResult.error);
        return;
      }
      if (!familyResult || familyResult.dailyKcal <= 0) {
        Alert.alert("Enter rations", "Fill at least one ration field.");
        return;
      }
      summaryText = generateCaseSheetSummary({
        mode: "family",
        familyData: {
          members: familyMembers,
          rations: familyRations,
          period: familyRationPeriod,
          result: familyResult,
        },
      });
    }

    if (alsoCopy) {
      try {
        Clipboard.setString(summaryText);
        Alert.alert("Copied", "Case-sheet text is on the clipboard.");
      } catch (error) {
        Alert.alert("Copy failed", error?.message || "Could not copy.");
      }
      return;
    }

    try {
      await Share.share({
        title: "Dietary survey case summary",
        message: summaryText,
      });
    } catch (error) {
      console.warn("Share failed:", error?.message);
    }
  };

  const renderNutrientRow = (row, idx) => (
    <View key={row.label} style={[styles.tableDataRow, idx % 2 === 0 && styles.tableDataRowAlt]}>
      <View style={{ flex: 2.1 }}>
        <Text style={styles.tableCellName}>{row.label}</Text>
        <Text style={styles.tableCellUnit}>({row.unit})</Text>
      </View>
      <Text style={[styles.tableCellGot, { flex: 1.4 }]}>{row.got}</Text>
      <Text style={[styles.tableCellRef, { flex: 1.3 }]}>{row.ear}</Text>
      <Text style={[styles.tableCellRef, { flex: 1.3 }]}>{row.rda}</Text>
      <View style={{ flex: 2.1, alignItems: "flex-end" }}>
        <Text style={[styles.diffBadge, { color: row.status.color }]}>{row.status.label}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerBox}>
            <View style={styles.headerIconCircle}>
              <MaterialIcons name="restaurant-menu" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Dietary Survey</Text>
              <Text style={styles.headerSubtitle}>
                IFCT 2017 composition • ICMR-NIN 2020 EER / EAR / RDA
              </Text>
            </View>
          </View>

          <View style={styles.segmentContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveMode("individual")}
              style={[styles.segmentBtn, activeMode === "individual" && styles.segmentBtnActive]}
            >
              <MaterialIcons
                name="person"
                size={18}
                color={activeMode === "individual" ? "#FFFFFF" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  activeMode === "individual" && styles.segmentBtnTextActive,
                ]}
              >
                24-hour recall
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveMode("family")}
              style={[styles.segmentBtn, activeMode === "family" && styles.segmentBtnActive]}
            >
              <MaterialIcons
                name="group"
                size={18}
                color={activeMode === "family" ? "#FFFFFF" : colors.textSecondary}
              />
              <Text
                style={[
                  styles.segmentBtnText,
                  activeMode === "family" && styles.segmentBtnTextActive,
                ]}
              >
                Family CU
              </Text>
            </TouchableOpacity>
          </View>

          {activeMode === "individual" ? (
            <View>
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardTitleRow}>
                    <MaterialIcons name="badge" size={20} color={colors.secondary} />
                    <Text style={styles.sectionTitle}>Subject and ICMR-NIN 2020 values</Text>
                  </View>
                  <Text style={styles.captionText}>
                    Adequacy is judged against EAR. Energy is EER (no RDA). Protein RDA is 0.83 g/kg.
                  </Text>
                  <TouchableOpacity
                    style={styles.profilePickerBtn}
                    onPress={() => setProfileModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileCategoryLabel}>{currentProfile.category}</Text>
                      <Text style={styles.profileSelectedText}>{currentProfile.label}</Text>
                    </View>
                    <MaterialIcons name="arrow-drop-down-circle" size={24} color={colors.secondary} />
                  </TouchableOpacity>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.rdaChipRow}>
                      {[
                        { v: `${currentProfile.kcal}`, l: "kcal EER" },
                        { v: `${currentProfile.proteinEar}/${currentProfile.proteinRda}g`, l: "Pro EAR/RDA" },
                        { v: `${currentProfile.ironEar}/${currentProfile.ironRda}`, l: "Fe mg" },
                        { v: `${currentProfile.calciumEar}/${currentProfile.calciumRda}`, l: "Ca mg" },
                        { v: `${currentProfile.folateEar}/${currentProfile.folateRda}`, l: "Folate µg" },
                      ].map((chip) => (
                        <View key={chip.l} style={styles.rdaBadge}>
                          <Text style={styles.rdaBadgeValue}>{chip.v}</Text>
                          <Text style={styles.rdaBadgeLabel}>{chip.l}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <View style={styles.actionRow}>
                    <Button compact mode="outlined" onPress={loadSampleIndividual} textColor={colors.secondary}>
                      Load sample
                    </Button>
                    <Button compact mode="text" onPress={clearIndividual} textColor="#B91C1C">
                      Clear foods
                    </Button>
                  </View>
                </Card.Content>
              </Card>

              <Text style={styles.groupHeading}>Meals (add what was eaten)</Text>
              {MEAL_SLOTS.map((slot) => {
                const itemsInMeal = recallItems.filter((i) => i.mealId === slot.id);
                return (
                  <Card key={slot.id} style={styles.mealCard}>
                    <Card.Content style={{ paddingVertical: 12 }}>
                      <View style={styles.mealHeaderRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                          <MaterialCommunityIcons name={slot.icon} size={22} color={colors.secondary} />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.mealTitle}>{slot.title}</Text>
                            <Text style={styles.mealTip} numberOfLines={1}>
                              {slot.tip}
                            </Text>
                          </View>
                        </View>
                        <Button
                          mode="contained-tonal"
                          compact
                          icon="plus"
                          onPress={() => handleOpenAddPicker(slot.id)}
                          style={styles.addBtnSmall}
                          labelStyle={{ fontSize: 12 }}
                        >
                          Add
                        </Button>
                      </View>
                      {itemsInMeal.length === 0 ? (
                        <Text style={styles.emptyMealText}>Nothing logged</Text>
                      ) : (
                        itemsInMeal.map((item) => {
                          const food = findFood(foodData, item.foodId);
                          const portion =
                            food?.portions?.find((p) => p.id === item.portionId) || {
                              label: "Portion",
                              grams: 1,
                            };
                          const grams = gramsForItem(item, food);
                          return (
                            <View key={item.id} style={styles.itemRowContainer}>
                              <View style={styles.itemInfoCol}>
                                <Text style={styles.foodNameText} numberOfLines={2}>
                                  {food?.name || "Unknown food"}
                                </Text>
                                <TouchableOpacity
                                  style={styles.portionBadgeBtn}
                                  onPress={() => {
                                    setActiveItemForPortion(item);
                                    setPortionModalVisible(true);
                                  }}
                                >
                                  <Text style={styles.portionBadgeText} numberOfLines={2}>
                                    {portion.label}
                                  </Text>
                                  <MaterialIcons name="arrow-drop-down" size={16} color={colors.secondary} />
                                </TouchableOpacity>
                              </View>
                              <View style={styles.quantityCol}>
                                <TextInput
                                  dense
                                  mode="outlined"
                                  keyboardType="decimal-pad"
                                  value={item.quantity}
                                  onChangeText={(val) => handleUpdateQuantity(item.id, val)}
                                  style={styles.qtyInput}
                                  outlineColor={colors.borderStrong}
                                  activeOutlineColor={colors.secondary}
                                  textColor={colors.textTitle}
                                />
                                <Text style={styles.computedGramsText}>
                                  {grams.toFixed(0)} g
                                  {portion.rawEquivalent ? " raw eq." : ""}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => handleRemoveItem(item.id)}
                                style={styles.removeBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <MaterialIcons name="close" size={18} color="#B91C1C" />
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}
                    </Card.Content>
                  </Card>
                );
              })}

              {individualResult ? (
                <View style={{ marginTop: 8 }}>
                  <Card style={styles.resultCard}>
                    <Card.Content>
                      <View style={styles.cardTitleRow}>
                        <MaterialIcons name="analytics" size={22} color={colors.secondary} />
                        <Text style={styles.sectionTitle}>Intake vs EER / EAR / RDA</Text>
                      </View>
                      <Text style={styles.captionText}>
                        Status uses EAR (energy uses EER). Visible fat is oil/ghee logged, not total IFCT fat.
                      </Text>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableColHeader, { flex: 2.1 }]}>Nutrient</Text>
                        <Text style={[styles.tableColHeader, { flex: 1.4 }]}>Intake</Text>
                        <Text style={[styles.tableColHeader, { flex: 1.3 }]}>EAR</Text>
                        <Text style={[styles.tableColHeader, { flex: 1.3 }]}>RDA</Text>
                        <Text style={[styles.tableColHeader, { flex: 2.1, textAlign: "right" }]}>
                          Status
                        </Text>
                      </View>
                      {[
                        {
                          label: "Energy",
                          unit: "kcal",
                          got: individualResult.kcal.toFixed(0),
                          ear: currentProfile.kcal,
                          rda: "none",
                          status: intakeStatus(individualResult.kcal, currentProfile.kcal, null, {
                            isEnergy: true,
                          }),
                        },
                        {
                          label: "Protein",
                          unit: "g",
                          got: individualResult.protein.toFixed(1),
                          ear: individualResult.proteinEar,
                          rda: currentProfile.proteinRda,
                          status: intakeStatus(
                            individualResult.protein,
                            individualResult.proteinEar,
                            currentProfile.proteinRda
                          ),
                        },
                        {
                          label: "Visible fat",
                          unit: "g",
                          got: individualResult.visibleFatGrams.toFixed(1),
                          ear: currentProfile.visibleFat,
                          rda: currentProfile.visibleFat,
                          status: intakeStatus(
                            individualResult.visibleFatGrams,
                            currentProfile.visibleFat,
                            currentProfile.visibleFat,
                            { refLabel: "target" }
                          ),
                        },
                        {
                          label: "Total fat (IFCT)",
                          unit: "g",
                          got: individualResult.fat.toFixed(1),
                          ear: "AMDR",
                          rda: "20-30%",
                          status: {
                            key: "info",
                            label: `${individualResult.amdr.fatPct}% energy`,
                            color: colors.textSecondary,
                          },
                        },
                        {
                          label: "Calcium",
                          unit: "mg",
                          got: individualResult.calcium.toFixed(0),
                          ear: currentProfile.calciumEar,
                          rda: currentProfile.calciumRda,
                          status: intakeStatus(
                            individualResult.calcium,
                            currentProfile.calciumEar,
                            currentProfile.calciumRda
                          ),
                        },
                        {
                          label: "Iron",
                          unit: "mg",
                          got: individualResult.iron.toFixed(1),
                          ear: currentProfile.ironEar,
                          rda: currentProfile.ironRda,
                          status: intakeStatus(
                            individualResult.iron,
                            currentProfile.ironEar,
                            currentProfile.ironRda
                          ),
                        },
                        {
                          label: "Vitamin C",
                          unit: "mg",
                          got: individualResult.vitC.toFixed(1),
                          ear: currentProfile.vitCEar,
                          rda: currentProfile.vitCRda,
                          status: intakeStatus(
                            individualResult.vitC,
                            currentProfile.vitCEar,
                            currentProfile.vitCRda
                          ),
                        },
                        {
                          label: "Folate",
                          unit: "µg",
                          got: individualResult.folate.toFixed(0),
                          ear: currentProfile.folateEar,
                          rda: currentProfile.folateRda,
                          status: intakeStatus(
                            individualResult.folate,
                            currentProfile.folateEar,
                            currentProfile.folateRda
                          ),
                        },
                      ].map(renderNutrientRow)}
                      {individualResult.lowQualityProtein ? (
                        <Text style={styles.captionText}>
                          Cereal-heavy pattern: ICMR 2020 uses 1 g protein/kg (about{" "}
                          {individualResult.proteinOneGPerKg} g) when pulse is very low. The table
                          still uses official EAR.
                        </Text>
                      ) : null}
                    </Card.Content>
                  </Card>

                  <Card style={styles.resultCard}>
                    <Card.Content>
                      <View style={styles.cardTitleRow}>
                        <MaterialCommunityIcons name="chart-pie" size={20} color={colors.secondary} />
                        <Text style={styles.sectionTitle}>AMDR and cereal:pulse:milk</Text>
                      </View>
                      {[
                        {
                          name: "Carbohydrate",
                          pct: individualResult.amdr.carbPct,
                          rec: "50-60%",
                          color:
                            individualResult.amdr.carbPct > 65 || individualResult.amdr.carbPct < 45
                              ? "#DC2626"
                              : individualResult.amdr.carbPct > 60 || individualResult.amdr.carbPct < 50
                              ? "#F59E0B"
                              : "#16A34A",
                        },
                        {
                          name: "Protein",
                          pct: individualResult.amdr.proteinPct,
                          rec: "10-15%",
                          color:
                            individualResult.amdr.proteinPct < 10
                              ? "#DC2626"
                              : individualResult.amdr.proteinPct > 15
                              ? "#2563EB"
                              : "#16A34A",
                        },
                        {
                          name: "Total fat",
                          pct: individualResult.amdr.fatPct,
                          rec: "20-30%",
                          color:
                            individualResult.amdr.fatPct > 35 || individualResult.amdr.fatPct < 15
                              ? "#DC2626"
                              : individualResult.amdr.fatPct > 30 || individualResult.amdr.fatPct < 20
                              ? "#F59E0B"
                              : "#16A34A",
                        },
                      ].map((row) => (
                        <View key={row.name} style={styles.amdrItem}>
                          <View style={styles.amdrLabelRow}>
                            <Text style={styles.amdrName}>{row.name}</Text>
                            <Text style={styles.amdrPct}>
                              {row.pct}% <Text style={styles.amdrTarget}>({row.rec})</Text>
                            </Text>
                          </View>
                          <ProgressBar
                            progress={Math.min(row.pct / 100, 1)}
                            color={row.color}
                            style={styles.amdrBar}
                          />
                        </View>
                      ))}
                      <Text style={styles.captionText}>
                        Percentages use Atwater (4/4/9). They may sum to 99 or 101 after rounding.
                      </Text>
                      <Divider style={{ marginVertical: 12 }} />
                      <View style={styles.ratioRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.ratioTitle}>Cereal : pulse (raw eq.)</Text>
                          <Text style={styles.ratioSubtitle}>
                            Cereals {individualResult.cerealGrams.toFixed(0)} g • Pulses{" "}
                            {individualResult.pulseGrams.toFixed(0)} g • Milk{" "}
                            {individualResult.milkGrams.toFixed(0)} g
                          </Text>
                          <Text style={styles.ratioSubtitle}>{individualResult.cpRatio.text}</Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.ratioBadge}>{individualResult.cpRatio.ratio}</Text>
                          <Text
                            style={[
                              styles.ratioStatus,
                              { color: individualResult.cpRatio.isBalanced ? "#15803D" : "#D97706" },
                            ]}
                          >
                            {individualResult.cpRatio.isBalanced ? "In range" : "Off target"}
                          </Text>
                        </View>
                      </View>
                    </Card.Content>
                  </Card>

                  <Card style={styles.resultCard}>
                    <Card.Content>
                      <View style={styles.cardTitleRow}>
                        <MaterialIcons name="psychology" size={22} color={colors.secondary} />
                        <Text style={styles.sectionTitle}>Clinical impression</Text>
                      </View>
                      <Text style={styles.impressionText}>
                        {generateClinicalImpression(individualResult, currentProfile)}
                      </Text>
                    </Card.Content>
                  </Card>

                  <Card style={styles.resultCard}>
                    <Card.Content>
                      <View style={styles.cardTitleRow}>
                        <MaterialIcons name="health-and-safety" size={22} color={colors.secondary} />
                        <Text style={styles.sectionTitle}>Low-cost counseling</Text>
                      </View>
                      {generateDietaryCounseling(individualResult, currentProfile).map((tip, idx) => (
                        <View key={idx} style={styles.counselingItem}>
                          <View style={styles.counselingHeader}>
                            <MaterialCommunityIcons name={tip.icon} size={20} color={colors.secondary} />
                            <Text style={styles.counselingTitle}>{tip.title}</Text>
                          </View>
                          <Text style={styles.counselingDesc}>{tip.description}</Text>
                          {tip.bullets.map((b, bIdx) => (
                            <View key={bIdx} style={styles.bulletRow}>
                              <Text style={styles.bulletDot}>•</Text>
                              <Text style={styles.bulletText}>{b}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </Card.Content>
                  </Card>

                  <View style={styles.actionRow}>
                    <Button
                      mode="outlined"
                      icon="content-copy"
                      onPress={() => handleShareSummary(true)}
                      style={[styles.shareBtn, { flex: 1, marginRight: 8 }]}
                      textColor={colors.secondary}
                    >
                      Copy
                    </Button>
                    <Button
                      mode="contained"
                      icon="share-variant"
                      onPress={() => handleShareSummary(false)}
                      style={[styles.shareBtn, { flex: 1, backgroundColor: colors.secondary }]}
                    >
                      Share
                    </Button>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyMealText}>
                  Add foods above. Results appear as you type. Tea: log milk and sugar, not the brew.
                </Text>
              )}
            </View>
          ) : (
            <View>
              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardTitleRow}>
                    <MaterialIcons name="people" size={22} color={colors.secondary} />
                    <Text style={styles.sectionTitle}>Family roster (ICMR-NIN 2020 CU)</Text>
                  </View>
                  <Text style={styles.captionText}>
                    1.0 CU = sedentary adult man, 2110 kcal. Pick the labelled row, not a bare number.
                  </Text>
                  <View style={styles.cuSummaryBanner}>
                    <View style={styles.cuSummaryItem}>
                      <Text style={styles.cuSummaryVal}>{familyMembers.length}</Text>
                      <Text style={styles.cuSummaryLbl}>Members</Text>
                    </View>
                    <View style={styles.cuSummaryDivider} />
                    <View style={styles.cuSummaryItem}>
                      <Text style={[styles.cuSummaryVal, { color: colors.secondary }]}>
                        {totalFamilyCU.toFixed(2)}
                      </Text>
                      <Text style={styles.cuSummaryLbl}>Total CU</Text>
                    </View>
                  </View>
                  {familyMembers.map((member) => (
                    <View key={member.id} style={styles.familyMemberRow}>
                      <View style={{ flex: 1.4, marginRight: 8 }}>
                        <TextInput
                          dense
                          mode="outlined"
                          value={member.label}
                          onChangeText={(t) =>
                            setFamilyMembers((prev) =>
                              prev.map((m) => (m.id === member.id ? { ...m, label: t } : m))
                            )
                          }
                          style={{ backgroundColor: colors.surfacePrimary, fontSize: 13 }}
                          textColor={colors.textTitle}
                          outlineColor={colors.borderStrong}
                          activeOutlineColor={colors.secondary}
                        />
                      </View>
                      <View style={{ flex: 1.8, marginRight: 8 }}>
                        <TouchableOpacity
                          style={styles.cuSelectBtn}
                          onPress={() => {
                            setCuMemberId(member.id);
                            setCuModalVisible(true);
                          }}
                        >
                          <Text style={styles.cuSelectText} numberOfLines={2}>
                            {member.cuLabel || `${member.cu} CU`}
                          </Text>
                          <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoveFamilyMember(member.id)}
                        style={styles.removeBtn}
                      >
                        <MaterialIcons name="delete-outline" size={20} color="#B91C1C" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.actionRow}>
                    <Button
                      mode="outlined"
                      icon="account-plus"
                      onPress={handleAddFamilyMember}
                      textColor={colors.secondary}
                    >
                      Add member
                    </Button>
                    <Button compact mode="text" onPress={loadSampleFamily} textColor={colors.secondary}>
                      Sample
                    </Button>
                    <Button compact mode="text" onPress={clearFamily} textColor="#B91C1C">
                      Clear
                    </Button>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.card}>
                <Card.Content>
                  <View style={styles.cardTitleRow}>
                    <MaterialIcons name="inventory" size={22} color={colors.secondary} />
                    <Text style={styles.sectionTitle}>Household ration</Text>
                  </View>
                  <View style={styles.periodRow}>
                    <TouchableOpacity
                      style={[
                        styles.periodChip,
                        familyRationPeriod === "monthly" && styles.periodChipActive,
                      ]}
                      onPress={() => setFamilyRationPeriod("monthly")}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          familyRationPeriod === "monthly" && styles.periodChipTextActive,
                        ]}
                      >
                        Monthly (÷ 30)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.periodChip,
                        familyRationPeriod === "daily" && styles.periodChipActive,
                      ]}
                      onPress={() => setFamilyRationPeriod("daily")}
                    >
                      <Text
                        style={[
                          styles.periodChipText,
                          familyRationPeriod === "daily" && styles.periodChipTextActive,
                        ]}
                      >
                        Daily
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.captionText}>
                    Numbers are {familyRationPeriod === "monthly" ? "monthly purchase" : "one day's use"}.
                  </Text>
                  <View style={styles.rationGrid}>
                    {RATION_FIELDS.map((field) => (
                      <View key={field.key} style={styles.rationField}>
                        <Text style={styles.rationFieldLabel}>{field.label}</Text>
                        <TextInput
                          dense
                          mode="outlined"
                          keyboardType="decimal-pad"
                          value={familyRations[field.key]}
                          onChangeText={(t) =>
                            setFamilyRations((prev) => ({
                              ...prev,
                              [field.key]: t.replace(/[^0-9.]/g, ""),
                            }))
                          }
                          style={styles.rationInput}
                          textColor={colors.textTitle}
                          outlineColor={colors.borderStrong}
                          activeOutlineColor={colors.secondary}
                        />
                      </View>
                    ))}
                  </View>
                </Card.Content>
              </Card>

              {familyResult?.error ? (
                <Text style={styles.emptyMealText}>{familyResult.error}</Text>
              ) : familyResult && familyResult.dailyKcal > 0 ? (
                <View>
                  <Card style={styles.resultCard}>
                    <Card.Content>
                      <View style={styles.cardTitleRow}>
                        <MaterialIcons name="assessment" size={22} color={colors.secondary} />
                        <Text style={styles.sectionTitle}>Per CU vs sedentary man</Text>
                      </View>
                      <Text style={styles.captionText}>
                        Energy vs EER 2110 kcal. Protein vs EAR 42.9 g (RDA 54 g).
                      </Text>
                      <View style={styles.familyMetricGrid}>
                        <View style={styles.familyMetricBox}>
                          <Text style={styles.familyMetricVal}>
                            {familyResult.perCUKcal.toFixed(0)} kcal
                          </Text>
                          <Text style={styles.familyMetricLabel}>Per CU energy</Text>
                          <Text
                            style={[
                              styles.diffBadge,
                              {
                                color: intakeStatus(familyResult.perCUKcal, 2110, null, {
                                  isEnergy: true,
                                }).color,
                              },
                            ]}
                          >
                            {formatPct(familyResult.kcalDiff)} vs EER
                          </Text>
                        </View>
                        <View style={styles.familyMetricBox}>
                          <Text style={styles.familyMetricVal}>
                            {familyResult.perCUProtein.toFixed(1)} g
                          </Text>
                          <Text style={styles.familyMetricLabel}>Per CU protein</Text>
                          <Text
                            style={[
                              styles.diffBadge,
                              {
                                color: intakeStatus(
                                  familyResult.perCUProtein,
                                  familyResult.refManProteinEar,
                                  familyResult.refManProteinRda
                                ).color,
                              },
                            ]}
                          >
                            {formatPct(familyResult.proteinDiffEar)} vs EAR
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.perCapitaText}>
                        Per capita: {familyResult.perCapitaKcal.toFixed(0)} kcal and{" "}
                        {familyResult.perCapitaProtein.toFixed(1)} g protein. Use per CU in viva.
                      </Text>
                      <Divider style={{ marginVertical: 12 }} />
                      <Text style={styles.ratioTitle}>Food group per CU vs ICMR plate</Text>
                      {familyResult.foodGroups.map((g) => (
                        <View key={g.key} style={styles.foodGroupRow}>
                          <Text style={styles.foodGroupLabel}>{g.label}</Text>
                          <Text style={styles.foodGroupVal}>
                            {g.got.toFixed(0)} / {g.target} {g.unit} ({g.pctOfTarget.toFixed(0)}%)
                          </Text>
                        </View>
                      ))}
                    </Card.Content>
                  </Card>
                  <View style={styles.actionRow}>
                    <Button
                      mode="outlined"
                      icon="content-copy"
                      onPress={() => handleShareSummary(true)}
                      style={[styles.shareBtn, { flex: 1, marginRight: 8 }]}
                      textColor={colors.secondary}
                    >
                      Copy
                    </Button>
                    <Button
                      mode="contained"
                      icon="share-variant"
                      onPress={() => handleShareSummary(false)}
                      style={[styles.shareBtn, { flex: 1, backgroundColor: colors.secondary }]}
                    >
                      Share
                    </Button>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyMealText}>
                  Enter ration amounts. Results update as you type.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={profileModalVisible}
        animationType="slide"
        transparent
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Physiological group</Text>
              <IconButton icon="close" size={22} onPress={() => setProfileModalVisible(false)} />
            </View>
            <Divider />
            <FlatList
              data={Object.values(REFERENCE_PROFILES)}
              keyExtractor={(prof) => prof.id}
              style={{ maxHeight: 480 }}
              renderItem={({ item: prof }) => {
                const isSelected = prof.id === selectedProfileKey;
                return (
                  <TouchableOpacity
                    style={[styles.profileModalItem, isSelected && styles.profileModalItemSelected]}
                    onPress={() => {
                      setSelectedProfileKey(prof.id);
                      setProfileModalVisible(false);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileModalCategory}>{prof.category}</Text>
                      <Text
                        style={[
                          styles.profileModalLabel,
                          isSelected && { color: colors.secondary, fontWeight: "bold" },
                        ]}
                      >
                        {prof.label}
                      </Text>
                      <Text style={styles.profileModalStats}>
                        {prof.kcal} kcal EER • Pro {prof.proteinEar}/{prof.proteinRda} g • Fe{" "}
                        {prof.ironEar}/{prof.ironRda} mg
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={22} color={colors.secondary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetContainer, { height: "85%" }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add food</Text>
                <Text style={styles.captionText}>
                  {MEAL_SLOTS.find((m) => m.id === targetMealId)?.title} • IFCT 2017 per 100 g
                </Text>
              </View>
              <IconButton icon="close" size={22} onPress={() => setPickerVisible(false)} />
            </View>
            <View style={styles.searchBarContainer}>
              <MaterialIcons name="search" size={22} color={colors.textSecondary} />
              <TextInput
                placeholder="Search atta, rice, dal, milk..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                textColor={colors.textTitle}
                placeholderTextColor={colors.textPlaceholder}
                dense
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {FOOD_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Chip
                    key={cat}
                    selected={isSelected}
                    onPress={() => setSelectedCategory(cat)}
                    style={[styles.catChip, isSelected && { backgroundColor: colors.secondary }]}
                    textStyle={{ fontSize: 12, color: isSelected ? "#FFFFFF" : colors.textTitle }}
                  >
                    {cat}
                  </Chip>
                );
              })}
            </ScrollView>
            <Divider />
            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.foodListItem}
                  onPress={() => handleSelectFood(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodListTitle}>{item.name}</Text>
                    <Text style={styles.foodListCat}>
                      {item.category}
                      {item.ifctCode ? ` • ${item.ifctCode}` : ""}
                    </Text>
                    <Text style={styles.foodListNutrients}>
                      Per 100 g: {item.calories} kcal • {item.protein} g protein • {item.iron} mg Fe
                    </Text>
                  </View>
                  <MaterialIcons name="add-circle-outline" size={24} color={colors.secondary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No matching IFCT foods</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={portionModalVisible}
        animationType="fade"
        transparent
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => {
          setPortionModalVisible(false);
          setActiveItemForPortion(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Household measure</Text>
              <IconButton
                icon="close"
                size={22}
                onPress={() => {
                  setPortionModalVisible(false);
                  setActiveItemForPortion(null);
                }}
              />
            </View>
            <Divider />
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 16 }}>
              {activeItemForPortion && (
                <Text style={styles.portionFoodName}>
                  {findFood(foodData, activeItemForPortion.foodId)?.name}
                </Text>
              )}
              {activeItemForPortion &&
                findFood(foodData, activeItemForPortion.foodId)?.portions?.map((port) => {
                  const isSelected = port.id === activeItemForPortion.portionId;
                  return (
                    <TouchableOpacity
                      key={port.id}
                      style={[
                        styles.portionOptionRow,
                        isSelected && styles.portionOptionRowSelected,
                      ]}
                      onPress={() => handleSelectPortion(port)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.portionOptionLabel,
                            isSelected && { color: colors.secondary, fontWeight: "bold" },
                          ]}
                        >
                          {port.label}
                        </Text>
                        <Text style={styles.portionOptionWeight}>
                          {port.grams} g{port.rawEquivalent ? " raw equivalent" : ""}
                        </Text>
                      </View>
                      {isSelected && <MaterialIcons name="check" size={20} color={colors.secondary} />}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={cuModalVisible}
        animationType="slide"
        transparent
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => {
          setCuModalVisible(false);
          setCuMemberId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheetContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Consumption unit</Text>
              <IconButton icon="close" size={22} onPress={() => setCuModalVisible(false)} />
            </View>
            <Divider />
            <FlatList
              data={CU_COEFFICIENT_OPTIONS}
              keyExtractor={(item) => item.label}
              style={{ maxHeight: 480 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.profileModalItem} onPress={() => handlePickCU(item)}>
                  <Text style={styles.profileModalLabel}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundMain },
    container: { padding: 16, paddingBottom: 48 },
    headerBox: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    headerIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
    },
    headerTitle: { fontSize: 20, fontWeight: "bold", color: colors.textTitle },
    headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    segmentContainer: {
      flexDirection: "row",
      backgroundColor: colors.surfaceSecondary || "#E2E8F0",
      borderRadius: 10,
      padding: 4,
      marginBottom: 16,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 8,
    },
    segmentBtnActive: { backgroundColor: colors.secondary, elevation: 2 },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginLeft: 6,
    },
    segmentBtnTextActive: { color: "#FFFFFF", fontWeight: "bold" },
    card: {
      marginBottom: 16,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 12,
      elevation: 2,
    },
    cardTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.textTitle,
      marginLeft: 6,
      flex: 1,
    },
    captionText: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
    groupHeading: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.textTitle,
      marginBottom: 10,
      marginTop: 4,
    },
    profilePickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      marginBottom: 12,
    },
    profileCategoryLabel: {
      fontSize: 11,
      color: colors.secondary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    profileSelectedText: { fontSize: 14, fontWeight: "600", color: colors.textTitle, marginTop: 2 },
    rdaChipRow: { flexDirection: "row", marginTop: 4, paddingRight: 8 },
    rdaBadge: {
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: colors.primaryLight || "#EEF2FF",
      borderRadius: 6,
      marginRight: 6,
    },
    rdaBadgeValue: { fontSize: 12, fontWeight: "bold", color: colors.secondary },
    rdaBadgeLabel: { fontSize: 10, color: colors.textSecondary },
    actionRow: { flexDirection: "row", alignItems: "center", marginTop: 8, marginBottom: 8 },
    mealCard: {
      marginBottom: 12,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 10,
      elevation: 1,
      borderLeftWidth: 4,
      borderLeftColor: colors.secondary,
    },
    mealHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    mealTitle: { fontSize: 15, fontWeight: "bold", color: colors.textTitle },
    mealTip: { fontSize: 11, color: colors.textSecondary },
    addBtnSmall: { backgroundColor: colors.primaryLight || "#EEF2FF", borderRadius: 6 },
    emptyMealText: {
      fontSize: 12,
      color: colors.textPlaceholder,
      fontStyle: "italic",
      paddingVertical: 8,
    },
    itemRowContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceSecondary || "#F1F5F9",
    },
    itemInfoCol: { flex: 3, paddingRight: 6 },
    foodNameText: { fontSize: 14, fontWeight: "600", color: colors.textTitle },
    portionBadgeBtn: { flexDirection: "row", alignItems: "center", marginTop: 3 },
    portionBadgeText: { fontSize: 12, color: colors.secondary, fontWeight: "500", maxWidth: 180 },
    quantityCol: { flex: 1.5, alignItems: "center" },
    qtyInput: {
      width: 64,
      height: 38,
      textAlign: "center",
      backgroundColor: colors.surfacePrimary,
      fontSize: 14,
    },
    computedGramsText: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
    removeBtn: { padding: 6, marginLeft: 4 },
    resultCard: {
      backgroundColor: colors.surfacePrimary,
      borderRadius: 12,
      marginBottom: 16,
      elevation: 2,
    },
    tableHeaderRow: {
      flexDirection: "row",
      paddingVertical: 8,
      borderBottomWidth: 1.5,
      borderBottomColor: colors.borderStrong,
    },
    tableColHeader: {
      fontSize: 11,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
    tableDataRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceSecondary || "#F1F5F9",
    },
    tableDataRowAlt: { backgroundColor: colors.backgroundMain },
    tableCellName: { fontSize: 13, fontWeight: "bold", color: colors.textTitle },
    tableCellUnit: { fontSize: 10, color: colors.textSecondary },
    tableCellGot: { fontSize: 13, fontWeight: "600", color: colors.textTitle },
    tableCellRef: { fontSize: 12, color: colors.textSecondary },
    diffBadge: { fontSize: 11, fontWeight: "bold", textAlign: "right" },
    amdrItem: { marginBottom: 12 },
    amdrLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    amdrName: { fontSize: 13, fontWeight: "600", color: colors.textTitle },
    amdrPct: { fontSize: 13, fontWeight: "bold", color: colors.textTitle },
    amdrTarget: { fontSize: 11, color: colors.textSecondary, fontWeight: "normal" },
    amdrBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary || "#E2E8F0",
    },
    ratioRow: { flexDirection: "row", justifyContent: "space-between" },
    ratioTitle: { fontSize: 13, fontWeight: "bold", color: colors.textTitle },
    ratioSubtitle: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    ratioBadge: { fontSize: 16, fontWeight: "bold", color: colors.secondary },
    ratioStatus: { fontSize: 11, fontWeight: "600" },
    impressionText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textTitle,
      marginTop: 6,
    },
    counselingItem: { marginBottom: 14 },
    counselingHeader: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    counselingTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.secondary,
      marginLeft: 6,
    },
    counselingDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    bulletRow: { flexDirection: "row", marginLeft: 4, marginBottom: 2 },
    bulletDot: { fontSize: 14, color: colors.secondary, marginRight: 6 },
    bulletText: { fontSize: 12, color: colors.textTitle, flex: 1, lineHeight: 18 },
    shareBtn: { marginBottom: 8, borderColor: colors.secondary, borderRadius: 8 },
    cuSummaryBanner: {
      flexDirection: "row",
      backgroundColor: colors.primaryLight || "#EEF2FF",
      borderRadius: 8,
      padding: 12,
      marginBottom: 14,
      alignItems: "center",
      justifyContent: "space-around",
    },
    cuSummaryItem: { alignItems: "center" },
    cuSummaryVal: { fontSize: 22, fontWeight: "bold", color: colors.textTitle },
    cuSummaryLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    cuSummaryDivider: { width: 1, height: 36, backgroundColor: colors.borderStrong },
    familyMemberRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    cuSelectBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 4,
    },
    cuSelectText: { fontSize: 11, fontWeight: "600", color: colors.textTitle, flex: 1 },
    periodRow: { flexDirection: "row", marginBottom: 8 },
    periodChip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      marginHorizontal: 3,
      alignItems: "center",
    },
    periodChipActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
    periodChipText: { fontSize: 11, color: colors.textSecondary },
    periodChipTextActive: { color: "#FFFFFF", fontWeight: "bold" },
    rationGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    rationField: { width: "48%", marginBottom: 12 },
    rationFieldLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    rationInput: { backgroundColor: colors.surfacePrimary, fontSize: 14 },
    familyMetricGrid: { flexDirection: "row", marginBottom: 12 },
    familyMetricBox: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    familyMetricVal: { fontSize: 18, fontWeight: "bold", color: colors.textTitle },
    familyMetricLabel: { fontSize: 11, color: colors.textSecondary, marginVertical: 4 },
    perCapitaText: { fontSize: 12, color: colors.textTitle, marginBottom: 4 },
    foodGroupRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceSecondary || "#F1F5F9",
    },
    foodGroupLabel: { fontSize: 12, color: colors.textTitle, flex: 1, paddingRight: 8 },
    foodGroupVal: { fontSize: 12, fontWeight: "600", color: colors.textTitle },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalSheetContainer: {
      backgroundColor: colors.surfacePrimary,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      paddingBottom: 20,
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    modalTitle: { fontSize: 17, fontWeight: "bold", color: colors.textTitle },
    profileModalItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceSecondary || "#F1F5F9",
    },
    profileModalItemSelected: { backgroundColor: colors.primaryLight || "#EEF2FF" },
    profileModalCategory: {
      fontSize: 10,
      color: colors.secondary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    profileModalLabel: { fontSize: 14, color: colors.textTitle, marginTop: 2 },
    profileModalStats: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    searchBarContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.backgroundMain,
      marginHorizontal: 16,
      marginVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong,
    },
    searchInput: { flex: 1, backgroundColor: "transparent", fontSize: 13, height: 40 },
    categoryScroll: { paddingHorizontal: 16, paddingBottom: 8 },
    catChip: { marginRight: 6, backgroundColor: colors.backgroundMain },
    foodListItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceSecondary || "#F1F5F9",
    },
    foodListTitle: { fontSize: 14, fontWeight: "600", color: colors.textTitle },
    foodListCat: { fontSize: 11, color: colors.secondary, marginTop: 1 },
    foodListNutrients: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    emptyList: { padding: 32, alignItems: "center" },
    emptyListText: { color: colors.textSecondary, fontSize: 14 },
    portionFoodName: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.textTitle,
      marginBottom: 12,
    },
    portionOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      marginBottom: 8,
    },
    portionOptionRowSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.primaryLight || "#EEF2FF",
    },
    portionOptionLabel: { fontSize: 14, color: colors.textTitle },
    portionOptionWeight: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  });

export default DietarySurveyScreen;
