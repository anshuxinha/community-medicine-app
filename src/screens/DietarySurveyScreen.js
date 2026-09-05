import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Share,
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
  calculateAMDR,
  calculateCerealPulseRatio,
  generateClinicalImpression,
  generateDietaryCounseling,
  generateCaseSheetSummary,
} from "../data/dietaryReferenceData";
import { theme } from "../styles/theme";
import { useThemedStyles } from "../styles/useThemedStyles";

const FOOD_CATEGORIES = [
  "All",
  "Cereals & Millets",
  "Pulses & Legumes",
  "Green Leafy Vegetables",
  "Roots & Tubers",
  "Other Vegetables",
  "Fruits",
  "Milk & Dairy",
  "Egg & Meat",
  "Nuts & Oilseeds",
  "Fats & Oils",
  "Sugars & Sweets",
  "Cooked Snacks",
];

const DietarySurveyScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  // Active Mode: 'individual' (24-Hour Recall) vs 'family' (FHAS CU Method)
  const [activeMode, setActiveMode] = useState("individual");

  // Mode A: Individual 24-Hr Recall State
  const [selectedProfileKey, setSelectedProfileKey] = useState("preg_3rd_sedentary");
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Items logged: array of { id, mealId, foodId, portionId, quantity, grams }
  const [recallItems, setRecallItems] = useState([
    {
      id: "init_1",
      mealId: "breakfast",
      foodId: "wheat_atta",
      portionId: "roti_med",
      quantity: "2",
      grams: 50,
    },
    {
      id: "init_2",
      mealId: "breakfast",
      foodId: "milk_cow",
      portionId: "cup",
      quantity: "1",
      grams: 100,
    },
    {
      id: "init_3",
      mealId: "lunch",
      foodId: "rice_raw",
      portionId: "katori_cooked",
      quantity: "1",
      grams: 50,
    },
    {
      id: "init_4",
      mealId: "lunch",
      foodId: "dal_toor",
      portionId: "katori_med",
      quantity: "1",
      grams: 25,
    },
    {
      id: "init_5",
      mealId: "lunch",
      foodId: "potato",
      portionId: "katori_sabzi",
      quantity: "1",
      grams: 60,
    },
    {
      id: "init_6",
      mealId: "dinner",
      foodId: "wheat_atta",
      portionId: "roti_med",
      quantity: "2",
      grams: 50,
    },
    {
      id: "init_7",
      mealId: "dinner",
      foodId: "dal_moong",
      portionId: "katori_med",
      quantity: "1",
      grams: 25,
    },
  ]);

  // Food Picker Modal State
  const [pickerVisible, setPickerVisible] = useState(false);
  const [targetMealId, setTargetMealId] = useState("breakfast");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Portion Selector Modal State (to change portion for an item)
  const [portionModalVisible, setPortionModalVisible] = useState(false);
  const [activeItemForPortion, setActiveItemForPortion] = useState(null);

  // Individual Calculation Result
  const [individualResult, setIndividualResult] = useState(null);

  // Mode B: Family CU Survey State
  const [familyMembers, setFamilyMembers] = useState([
    { id: "m1", label: "Husband (Father)", cu: 1.2 },
    { id: "m2", label: "Wife (Mother, Pregnant 3rd Tri)", cu: 1.0 },
    { id: "m3", label: "Child (5 yrs)", cu: 0.6 },
    { id: "m4", label: "Grandmother (65 yrs, Sedentary)", cu: 0.7 },
  ]);
  const [familyRationPeriod, setFamilyRationPeriod] = useState("monthly"); // 'monthly' | 'daily'
  const [familyRations, setFamilyRations] = useState({
    cerealsKg: "30",
    pulsesKg: "4",
    oilKg: "2",
    milkL: "15",
    sugarKg: "2",
    vegKg: "12",
  });
  const [familyResult, setFamilyResult] = useState(null);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);

  // Filtered Food Data for Picker
  const filteredFoods = useMemo(() => {
    return foodData.filter((item) => {
      const matchCat =
        selectedCategory === "All" || item.category === selectedCategory;
      const matchQuery =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [searchQuery, selectedCategory]);

  // Selected Reference Profile
  const currentProfile = REFERENCE_PROFILES[selectedProfileKey] || REFERENCE_PROFILES.man_sedentary;

  // Food Helper: get food object by id
  const getFood = (id) => foodData.find((f) => f.id === id);

  // Add Item handler
  const handleOpenAddPicker = (mealId) => {
    setTargetMealId(mealId);
    setSearchQuery("");
    setSelectedCategory("All");
    setPickerVisible(true);
  };

  const handleSelectFood = (food) => {
    const defaultPortion = food.portions && food.portions.length > 0 ? food.portions[0] : { id: "g", label: "Grams (Raw)", grams: 1 };
    const defaultGrams = defaultPortion.grams * 1;

    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      mealId: targetMealId,
      foodId: food.id,
      portionId: defaultPortion.id,
      quantity: "1",
      grams: defaultGrams,
    };

    setRecallItems((prev) => [...prev, newItem]);
    setPickerVisible(false);
  };

  const handleRemoveItem = (id) => {
    setRecallItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id, newQty) => {
    setRecallItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const food = getFood(item.foodId);
        const portion = food?.portions?.find((p) => p.id === item.portionId) || { grams: 1 };
        const parsedQty = parseFloat(newQty) || 0;
        return {
          ...item,
          quantity: newQty,
          grams: parsedQty * portion.grams,
        };
      })
    );
  };

  const handleOpenPortionModal = (item) => {
    setActiveItemForPortion(item);
    setPortionModalVisible(true);
  };

  const handleSelectPortion = (portion) => {
    if (!activeItemForPortion) return;
    setRecallItems((prev) =>
      prev.map((item) => {
        if (item.id !== activeItemForPortion.id) return item;
        const parsedQty = parseFloat(item.quantity) || 0;
        return {
          ...item,
          portionId: portion.id,
          grams: parsedQty * portion.grams,
        };
      })
    );
    setPortionModalVisible(false);
    setActiveItemForPortion(null);
  };

  // Calculate 24-Hour Recall Intake
  const calculateIndividualIntake = () => {
    let totalKcal = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalCalcium = 0;
    let totalIron = 0;
    let totalVitC = 0;
    let totalCerealGrams = 0;
    let totalPulseGrams = 0;

    const calculatedMealRows = [];

    for (const item of recallItems) {
      const food = getFood(item.foodId);
      const grams = parseFloat(item.grams);
      if (!food || isNaN(grams) || grams <= 0) continue;

      const factor = grams / 100;
      const kcal = food.calories * factor;
      const protein = food.protein * factor;
      const fat = food.fat * factor;
      const carbs = (food.carbs || 0) * factor;
      const calcium = (food.calcium || 0) * factor;
      const iron = (food.iron || 0) * factor;
      const vitC = (food.vitC || 0) * factor;

      totalKcal += kcal;
      totalProtein += protein;
      totalFat += fat;
      totalCarbs += carbs;
      totalCalcium += calcium;
      totalIron += iron;
      totalVitC += vitC;

      if (food.category === "Cereals & Millets") totalCerealGrams += grams;
      if (food.category === "Pulses & Legumes") totalPulseGrams += grams;

      const portionObj = food.portions?.find((p) => p.id === item.portionId);
      const mealObj = MEAL_SLOTS.find((m) => m.id === item.mealId);

      calculatedMealRows.push({
        ...item,
        food,
        mealLabel: mealObj?.title || item.mealId,
        portionLabel: portionObj?.label || "Portion",
        kcal,
        protein,
        fat,
        carbs,
        calcium,
        iron,
        vitC,
      });
    }

    if (totalKcal === 0) {
      Alert.alert("No Food Intake", "Please log at least one food item with quantity.");
      return;
    }

    const ref = currentProfile;
    const kcalDiff = (((totalKcal - ref.kcal) / ref.kcal) * 100).toFixed(1);
    const proteinDiff = (((totalProtein - ref.protein) / ref.protein) * 100).toFixed(1);
    const fatDiff = (((totalFat - ref.fat) / ref.fat) * 100).toFixed(1);
    const calciumDiff = (((totalCalcium - ref.calcium) / ref.calcium) * 100).toFixed(1);
    const ironDiff = (((totalIron - ref.iron) / ref.iron) * 100).toFixed(1);
    const vitCDiff = (((totalVitC - ref.vitC) / ref.vitC) * 100).toFixed(1);

    const amdr = calculateAMDR(totalCarbs, totalProtein, totalFat, totalKcal);
    const cpRatio = calculateCerealPulseRatio(totalCerealGrams, totalPulseGrams);

    const computedResult = {
      kcal: totalKcal,
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      calcium: totalCalcium,
      iron: totalIron,
      vitC: totalVitC,
      kcalDiff,
      proteinDiff,
      fatDiff,
      calciumDiff,
      ironDiff,
      vitCDiff,
      amdr,
      cpRatio,
      totalCerealGrams,
      totalPulseGrams,
      calculatedMealRows,
    };

    setIndividualResult(computedResult);
  };

  // Mode B: Family CU Handlers
  const handleAddFamilyMember = () => {
    const newId = `fam_${Date.now()}`;
    setFamilyMembers([
      ...familyMembers,
      { id: newId, label: `Member ${familyMembers.length + 1}`, cu: 1.0 },
    ]);
  };

  const handleRemoveFamilyMember = (id) => {
    if (familyMembers.length <= 1) {
      Alert.alert("Minimum 1 Member", "Family must have at least one member.");
      return;
    }
    setFamilyMembers(familyMembers.filter((m) => m.id !== id));
  };

  const handleUpdateFamilyMemberCU = (id, cu) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, cu: parseFloat(cu) } : m))
    );
  };

  const handleUpdateFamilyMemberLabel = (id, label) => {
    setFamilyMembers(
      familyMembers.map((m) => (m.id === id ? { ...m, label } : m))
    );
  };

  const totalFamilyCU = useMemo(() => {
    return familyMembers.reduce((sum, m) => sum + (m.cu || 0), 0);
  }, [familyMembers]);

  const calculateFamilySurvey = () => {
    const divisor = familyRationPeriod === "monthly" ? 30 : 1;

    // Daily grams conversion
    const cerealsG = ((parseFloat(familyRations.cerealsKg) || 0) * 1000) / divisor;
    const pulsesG = ((parseFloat(familyRations.pulsesKg) || 0) * 1000) / divisor;
    const oilG = ((parseFloat(familyRations.oilKg) || 0) * 1000) / divisor;
    const milkMl = ((parseFloat(familyRations.milkL) || 0) * 1000) / divisor;
    const sugarG = ((parseFloat(familyRations.sugarKg) || 0) * 1000) / divisor;
    const vegG = ((parseFloat(familyRations.vegKg) || 0) * 1000) / divisor;

    // Standard average nutrient yields per 100g raw staple:
    // Cereals (Wheat/Rice mix): 345 kcal, 9g protein
    // Pulses: 340 kcal, 22g protein
    // Oil: 900 kcal, 0g protein
    // Cow/Buffalo milk avg: 85 kcal, 3.5g protein
    // Sugar: 398 kcal, 0g protein
    // Vegetables avg: 40 kcal, 1.5g protein
    const dailyKcal =
      (cerealsG / 100) * 345 +
      (pulsesG / 100) * 340 +
      (oilG / 100) * 900 +
      (milkMl / 100) * 85 +
      (sugarG / 100) * 398 +
      (vegG / 100) * 40;

    const dailyProtein =
      (cerealsG / 100) * 9 +
      (pulsesG / 100) * 22 +
      (milkMl / 100) * 3.5 +
      (vegG / 100) * 1.5;

    const cu = totalFamilyCU || 1;
    const numMembers = familyMembers.length || 1;

    const perCUKcal = dailyKcal / cu;
    const perCUProtein = dailyProtein / cu;

    const refSedentaryKcal = 2110;
    const refSedentaryProtein = 54.0;

    const kcalDiff = (((perCUKcal - refSedentaryKcal) / refSedentaryKcal) * 100).toFixed(1);
    const proteinDiff = (((perCUProtein - refSedentaryProtein) / refSedentaryProtein) * 100).toFixed(1);

    const res = {
      dailyKcal,
      dailyProtein,
      perCUKcal,
      perCUProtein,
      perCapitaKcal: dailyKcal / numMembers,
      perCapitaProtein: dailyProtein / numMembers,
      kcalDiff,
      proteinDiff,
      totalCU: cu,
      numMembers,
    };

    setFamilyResult(res);
  };

  // Share / Copy to Case Sheet handler
  const handleShareSummary = async () => {
    let summaryText = "";
    if (activeMode === "individual") {
      if (!individualResult) {
        Alert.alert("Calculate First", "Please tap 'Calculate Intake' before exporting summary.");
        return;
      }
      summaryText = generateCaseSheetSummary({
        mode: "individual",
        profile: currentProfile,
        result: individualResult,
        mealRows: individualResult.calculatedMealRows,
      });
    } else {
      if (!familyResult) {
        Alert.alert("Calculate First", "Please tap 'Calculate Family Intake' before exporting summary.");
        return;
      }
      summaryText = generateCaseSheetSummary({
        mode: "family",
        familyData: {
          members: familyMembers,
          rations: familyRations,
          totalCU: familyResult.totalCU,
          perCU: {
            kcal: familyResult.perCUKcal,
            protein: familyResult.perCUProtein,
            kcalDiff: familyResult.kcalDiff,
            proteinDiff: familyResult.proteinDiff,
            perCapitaKcal: familyResult.perCapitaKcal,
            perCapitaProtein: familyResult.perCapitaProtein,
          },
        },
      });
    }

    try {
      await Share.share({
        title: "Dietary Survey Practical Case Summary",
        message: summaryText,
      });
    } catch (error) {
      console.warn("Share failed:", error?.message);
    }
  };

  const getDeficitColor = (val) => {
    const num = parseFloat(val);
    if (num < -30) return "#B91C1C"; // Severe Deficit (Red)
    if (num < -10) return "#D97706"; // Moderate Deficit (Amber)
    if (num <= 10) return "#15803D"; // Adequate (Green)
    return "#2563EB"; // Surplus (Blue)
  };

  const getDeficitBadgeText = (val) => {
    const num = parseFloat(val);
    if (num < -30) return `${val}% (Severe Deficit)`;
    if (num < -10) return `${val}% (Deficit)`;
    if (num <= 10) return `${num > 0 ? "+" : ""}${val}% (Adequate)`;
    return `+${val}% (Surplus)`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header Title */}
        <View style={styles.headerBox}>
          <View style={styles.headerIconCircle}>
            <MaterialIcons name="restaurant-menu" size={28} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Dietary Survey & Nutrition</Text>
            <Text style={styles.headerSubtitle}>
              ICMR-NIN 2020 Standards • IFCT Composition • MD Practical Viva
            </Text>
          </View>
        </View>

        {/* Mode Segment Switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMode("individual")}
            style={[
              styles.segmentBtn,
              activeMode === "individual" && styles.segmentBtnActive,
            ]}
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
              24-Hr Recall (Individual)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveMode("family")}
            style={[
              styles.segmentBtn,
              activeMode === "family" && styles.segmentBtnActive,
            ]}
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
              Family CU (FHAS)
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============================================================ */}
        {/* MODE A: 24-HOUR DIETARY RECALL */}
        {/* ============================================================ */}
        {activeMode === "individual" ? (
          <View>
            {/* Reference Demographic Profile Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="badge" size={20} color={colors.secondary} />
                  <Text style={styles.sectionTitle}>Physiological Profile & RDA</Text>
                </View>
                <Text style={styles.captionText}>
                  Select subject demographic (ICMR-NIN 2020 allowances):
                </Text>

                <TouchableOpacity
                  style={styles.profilePickerBtn}
                  onPress={() => setProfileModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileCategoryLabel}>
                      {currentProfile.category}
                    </Text>
                    <Text style={styles.profileSelectedText} numberOfLines={2}>
                      {currentProfile.label}
                    </Text>
                  </View>
                  <MaterialIcons
                    name="arrow-drop-down-circle"
                    size={24}
                    color={colors.secondary}
                  />
                </TouchableOpacity>

                {/* RDA Reference Chips */}
                <View style={styles.rdaChipRow}>
                  <View style={styles.rdaBadge}>
                    <Text style={styles.rdaBadgeValue}>{currentProfile.kcal}</Text>
                    <Text style={styles.rdaBadgeLabel}>kcal</Text>
                  </View>
                  <View style={styles.rdaBadge}>
                    <Text style={styles.rdaBadgeValue}>{currentProfile.protein}g</Text>
                    <Text style={styles.rdaBadgeLabel}>Protein</Text>
                  </View>
                  <View style={styles.rdaBadge}>
                    <Text style={styles.rdaBadgeValue}>{currentProfile.iron}mg</Text>
                    <Text style={styles.rdaBadgeLabel}>Iron</Text>
                  </View>
                  <View style={styles.rdaBadge}>
                    <Text style={styles.rdaBadgeValue}>{currentProfile.calcium}mg</Text>
                    <Text style={styles.rdaBadgeLabel}>Calcium</Text>
                  </View>
                  <View style={styles.rdaBadge}>
                    <Text style={styles.rdaBadgeValue}>{currentProfile.vitC}mg</Text>
                    <Text style={styles.rdaBadgeLabel}>Vit C</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>

            {/* Meal-by-Meal Timeline Cards */}
            <Text style={styles.groupHeading}>
              Meal-by-Meal Chronological Intake
            </Text>

            {MEAL_SLOTS.map((slot) => {
              const itemsInMeal = recallItems.filter((i) => i.mealId === slot.id);

              return (
                <Card key={slot.id} style={styles.mealCard}>
                  <Card.Content style={{ paddingVertical: 12 }}>
                    <View style={styles.mealHeaderRow}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <MaterialCommunityIcons
                          name={slot.icon}
                          size={22}
                          color={colors.secondary}
                        />
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

                    {/* Items List in this Meal */}
                    {itemsInMeal.length === 0 ? (
                      <Text style={styles.emptyMealText}>No food recorded for this slot</Text>
                    ) : (
                      itemsInMeal.map((item) => {
                        const food = getFood(item.foodId);
                        const portion = food?.portions?.find(
                          (p) => p.id === item.portionId
                        ) || { label: "Portion", grams: 1 };

                        return (
                          <View key={item.id} style={styles.itemRowContainer}>
                            <View style={styles.itemInfoCol}>
                              <Text style={styles.foodNameText} numberOfLines={1}>
                                {food?.name || "Unknown Food"}
                              </Text>

                              {/* Portion Selector Button */}
                              <TouchableOpacity
                                style={styles.portionBadgeBtn}
                                onPress={() => handleOpenPortionModal(item)}
                              >
                                <Text style={styles.portionBadgeText} numberOfLines={1}>
                                  {portion.label}
                                </Text>
                                <MaterialIcons
                                  name="arrow-drop-down"
                                  size={16}
                                  color={colors.secondary}
                                />
                              </TouchableOpacity>
                            </View>

                            {/* Quantity Input */}
                            <View style={styles.quantityCol}>
                              <TextInput
                                dense
                                mode="outlined"
                                keyboardType="numeric"
                                value={item.quantity}
                                onChangeText={(val) => handleUpdateQuantity(item.id, val)}
                                style={styles.qtyInput}
                                outlineColor={colors.borderStrong}
                                activeOutlineColor={colors.secondary}
                                textColor={colors.textTitle}
                              />
                              <Text style={styles.computedGramsText}>
                                {item.grams.toFixed(0)}g raw
                              </Text>
                            </View>

                            {/* Delete Button */}
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

            {/* Calculate Button */}
            <Button
              mode="contained"
              icon="calculator"
              onPress={calculateIndividualIntake}
              style={styles.calcMainBtn}
              labelStyle={{ fontSize: 16, fontWeight: "bold" }}
            >
              Calculate Nutritional Intake
            </Button>

            {/* Individual Results Dashboard */}
            {individualResult && (
              <View style={{ marginTop: 24 }}>
                {/* 1. Nutrient Table Card */}
                <Card style={styles.resultCard}>
                  <Card.Content>
                    <View style={styles.cardTitleRow}>
                      <MaterialIcons name="analytics" size={22} color={colors.secondary} />
                      <Text style={styles.sectionTitle}>
                        Intake vs ICMR-NIN 2020 RDA/EAR
                      </Text>
                    </View>
                    <Text style={styles.captionText}>
                      Comparison for {currentProfile.label}:
                    </Text>

                    <Divider style={{ marginVertical: 10 }} />

                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableColHeader, { flex: 2.2 }]}>Nutrient</Text>
                      <Text style={[styles.tableColHeader, { flex: 1.6 }]}>Intake</Text>
                      <Text style={[styles.tableColHeader, { flex: 1.5 }]}>RDA/EAR</Text>
                      <Text style={[styles.tableColHeader, { flex: 2.3, textAlign: "right" }]}>
                        Deficit/Surplus
                      </Text>
                    </View>

                    {[
                      {
                        label: "Energy",
                        unit: "kcal",
                        got: individualResult.kcal.toFixed(0),
                        ref: currentProfile.kcal,
                        diff: individualResult.kcalDiff,
                      },
                      {
                        label: "Protein",
                        unit: "g",
                        got: individualResult.protein.toFixed(1),
                        ref: currentProfile.protein,
                        diff: individualResult.proteinDiff,
                      },
                      {
                        label: "Total Fat",
                        unit: "g",
                        got: individualResult.fat.toFixed(1),
                        ref: currentProfile.fat,
                        diff: individualResult.fatDiff,
                      },
                      {
                        label: "Calcium",
                        unit: "mg",
                        got: individualResult.calcium.toFixed(0),
                        ref: currentProfile.calcium,
                        diff: individualResult.calciumDiff,
                      },
                      {
                        label: "Iron",
                        unit: "mg",
                        got: individualResult.iron.toFixed(1),
                        ref: currentProfile.iron,
                        diff: individualResult.ironDiff,
                      },
                      {
                        label: "Vitamin C",
                        unit: "mg",
                        got: individualResult.vitC.toFixed(1),
                        ref: currentProfile.vitC,
                        diff: individualResult.vitCDiff,
                      },
                    ].map((row, idx) => (
                      <View key={row.label} style={[styles.tableDataRow, idx % 2 === 0 && styles.tableDataRowAlt]}>
                        <View style={{ flex: 2.2 }}>
                          <Text style={styles.tableCellName}>{row.label}</Text>
                          <Text style={styles.tableCellUnit}>({row.unit})</Text>
                        </View>
                        <Text style={[styles.tableCellGot, { flex: 1.6 }]}>{row.got}</Text>
                        <Text style={[styles.tableCellRef, { flex: 1.5 }]}>{row.ref}</Text>
                        <View style={{ flex: 2.3, alignItems: "flex-end" }}>
                          <Text
                            style={[
                              styles.diffBadge,
                              { color: getDeficitColor(row.diff) },
                            ]}
                          >
                            {getDeficitBadgeText(row.diff)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </Card.Content>
                </Card>

                {/* 2. AMDR Energy Distribution Card */}
                <Card style={styles.resultCard}>
                  <Card.Content>
                    <View style={styles.cardTitleRow}>
                      <MaterialCommunityIcons name="chart-pie" size={20} color={colors.secondary} />
                      <Text style={styles.sectionTitle}>
                        Macronutrient Energy Distribution (AMDR)
                      </Text>
                    </View>
                    <Text style={styles.captionText}>
                      Acceptable Macronutrient Distribution Ranges (% of Total Kcal):
                    </Text>

                    <View style={styles.amdrContainer}>
                      {/* Carbohydrates */}
                      <View style={styles.amdrItem}>
                        <View style={styles.amdrLabelRow}>
                          <Text style={styles.amdrName}>Carbohydrates</Text>
                          <Text style={styles.amdrPct}>
                            {individualResult.amdr.carbPct}%{" "}
                            <Text style={styles.amdrTarget}>(Rec: 50–60%)</Text>
                          </Text>
                        </View>
                        <ProgressBar
                          progress={Math.min(individualResult.amdr.carbPct / 100, 1)}
                          color={
                            individualResult.amdr.carbPct > 65
                              ? "#DC2626"
                              : individualResult.amdr.carbPct < 45
                              ? "#F59E0B"
                              : "#16A34A"
                          }
                          style={styles.amdrBar}
                        />
                      </View>

                      {/* Proteins */}
                      <View style={styles.amdrItem}>
                        <View style={styles.amdrLabelRow}>
                          <Text style={styles.amdrName}>Proteins</Text>
                          <Text style={styles.amdrPct}>
                            {individualResult.amdr.proteinPct}%{" "}
                            <Text style={styles.amdrTarget}>(Rec: 10–15%)</Text>
                          </Text>
                        </View>
                        <ProgressBar
                          progress={Math.min(individualResult.amdr.proteinPct / 100, 1)}
                          color={
                            individualResult.amdr.proteinPct < 10
                              ? "#DC2626"
                              : individualResult.amdr.proteinPct > 20
                              ? "#2563EB"
                              : "#16A34A"
                          }
                          style={styles.amdrBar}
                        />
                      </View>

                      {/* Fats */}
                      <View style={styles.amdrItem}>
                        <View style={styles.amdrLabelRow}>
                          <Text style={styles.amdrName}>Total Fats</Text>
                          <Text style={styles.amdrPct}>
                            {individualResult.amdr.fatPct}%{" "}
                            <Text style={styles.amdrTarget}>(Rec: 20–30%)</Text>
                          </Text>
                        </View>
                        <ProgressBar
                          progress={Math.min(individualResult.amdr.fatPct / 100, 1)}
                          color={
                            individualResult.amdr.fatPct > 35
                              ? "#DC2626"
                              : individualResult.amdr.fatPct < 15
                              ? "#F59E0B"
                              : "#16A34A"
                          }
                          style={styles.amdrBar}
                        />
                      </View>
                    </View>

                    {/* Cereal to Pulse Ratio */}
                    <Divider style={{ marginVertical: 12 }} />
                    <View style={styles.ratioRow}>
                      <View>
                        <Text style={styles.ratioTitle}>Cereal-to-Pulse Ratio (Raw Wt):</Text>
                        <Text style={styles.ratioSubtitle}>
                          Cereals: {individualResult.totalCerealGrams.toFixed(0)}g | Pulses:{" "}
                          {individualResult.totalPulseGrams.toFixed(0)}g
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.ratioBadge}>
                          {individualResult.cpRatio.ratio}
                        </Text>
                        <Text
                          style={[
                            styles.ratioStatus,
                            {
                              color: individualResult.cpRatio.isBalanced
                                ? "#15803D"
                                : "#D97706",
                            },
                          ]}
                        >
                          {individualResult.cpRatio.isBalanced ? "Balanced" : "Skewed"}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>

                {/* 3. Clinical Impression & Viva Diagnosis */}
                <Card style={styles.resultCard}>
                  <Card.Content>
                    <View style={styles.cardTitleRow}>
                      <MaterialIcons name="psychology" size={22} color={colors.secondary} />
                      <Text style={styles.sectionTitle}>
                        Clinical Impression (Viva Ready)
                      </Text>
                    </View>
                    <Text style={styles.impressionText}>
                      {generateClinicalImpression(individualResult, currentProfile)}
                    </Text>
                  </Card.Content>
                </Card>

                {/* 4. Low-Cost Dietary Counseling Card */}
                <Card style={styles.resultCard}>
                  <Card.Content>
                    <View style={styles.cardTitleRow}>
                      <MaterialIcons name="health-and-safety" size={22} color={colors.secondary} />
                      <Text style={styles.sectionTitle}>
                        Low-Cost Practical Counseling
                      </Text>
                    </View>
                    <Text style={styles.captionText}>
                      Evidence-based, culturally acceptable dietary advice for exam presentation:
                    </Text>

                    <Divider style={{ marginVertical: 10 }} />

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

                {/* 5. Case Sheet Export / Share Button */}
                <Button
                  mode="outlined"
                  icon="share-variant"
                  onPress={handleShareSummary}
                  style={styles.shareBtn}
                  textColor={colors.secondary}
                >
                  Copy / Share Case Sheet Summary
                </Button>
              </View>
            )}
          </View>
        ) : (
          /* ============================================================ */
          /* MODE B: FAMILY CONSUMPTION UNIT (CU / ACU) SURVEY */
          /* ============================================================ */
          <View>
            {/* Family Roster Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="people" size={22} color={colors.secondary} />
                  <Text style={styles.sectionTitle}>
                    Family Composition & Adult CU (ACU)
                  </Text>
                </View>
                <Text style={styles.captionText}>
                  Add all family members sharing the common kitchen (ICMR-NIN coefficients):
                </Text>

                {/* Total CU Summary Bar */}
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
                    <Text style={styles.cuSummaryLbl}>Total CU (Units)</Text>
                  </View>
                </View>

                {/* Family Members List */}
                {familyMembers.map((member, index) => (
                  <View key={member.id} style={styles.familyMemberRow}>
                    <View style={{ flex: 1.5, marginRight: 8 }}>
                      <TextInput
                        dense
                        mode="outlined"
                        value={member.label}
                        onChangeText={(t) => handleUpdateFamilyMemberLabel(member.id, t)}
                        style={{ backgroundColor: colors.surfacePrimary, fontSize: 13 }}
                        textColor={colors.textTitle}
                        outlineColor={colors.borderStrong}
                        activeOutlineColor={colors.secondary}
                      />
                    </View>

                    <View style={{ flex: 1.8, marginRight: 8 }}>
                      <View style={styles.cuPickerContainer}>
                        <TouchableOpacity
                          style={styles.cuSelectBtn}
                          onPress={() => {
                            Alert.alert(
                              "Select Consumption Unit",
                              "Choose coefficient based on age/work:",
                              CU_COEFFICIENT_OPTIONS.map((opt) => ({
                                text: `${opt.label}`,
                                onPress: () => handleUpdateFamilyMemberCU(member.id, opt.cu),
                              })),
                              { cancelable: true }
                            );
                          }}
                        >
                          <Text style={styles.cuSelectText} numberOfLines={1}>
                            {member.cu} CU
                          </Text>
                          <MaterialIcons name="arrow-drop-down" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveFamilyMember(member.id)}
                      style={styles.removeBtn}
                    >
                      <MaterialIcons name="delete-outline" size={20} color="#B91C1C" />
                    </TouchableOpacity>
                  </View>
                ))}

                <Button
                  mode="outlined"
                  icon="account-plus"
                  onPress={handleAddFamilyMember}
                  style={{ marginTop: 12 }}
                  textColor={colors.secondary}
                >
                  Add Family Member
                </Button>
              </Card.Content>
            </Card>

            {/* Family Ration Inventory Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.cardTitleRow}>
                  <MaterialIcons name="inventory" size={22} color={colors.secondary} />
                  <Text style={styles.sectionTitle}>Family Ration Inventory</Text>
                </View>
                <Text style={styles.captionText}>
                  Enter gross food rations consumed by the household:
                </Text>

                {/* Period Selector */}
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
                      Monthly Ration (Divided by 30 days)
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
                      Daily Ration
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Ration Input Fields */}
                <View style={styles.rationGrid}>
                  <View style={styles.rationField}>
                    <Text style={styles.rationFieldLabel}>Cereals (Rice+Wheat, kg)</Text>
                    <TextInput
                      dense
                      mode="outlined"
                      keyboardType="numeric"
                      value={familyRations.cerealsKg}
                      onChangeText={(t) =>
                        setFamilyRations({ ...familyRations, cerealsKg: t })
                      }
                      style={styles.rationInput}
                      textColor={colors.textTitle}
                      outlineColor={colors.borderStrong}
                      activeOutlineColor={colors.secondary}
                    />
                  </View>

                  <View style={styles.rationField}>
                    <Text style={styles.rationFieldLabel}>Pulses & Dals (kg)</Text>
                    <TextInput
                      dense
                      mode="outlined"
                      keyboardType="numeric"
                      value={familyRations.pulsesKg}
                      onChangeText={(t) =>
                        setFamilyRations({ ...familyRations, pulsesKg: t })
                      }
                      style={styles.rationInput}
                      textColor={colors.textTitle}
                      outlineColor={colors.borderStrong}
                      activeOutlineColor={colors.secondary}
                    />
                  </View>

                  <View style={styles.rationField}>
                    <Text style={styles.rationFieldLabel}>Cooking Oil / Ghee (kg/L)</Text>
                    <TextInput
                      dense
                      mode="outlined"
                      keyboardType="numeric"
                      value={familyRations.oilKg}
                      onChangeText={(t) =>
                        setFamilyRations({ ...familyRations, oilKg: t })
                      }
                      style={styles.rationInput}
                      textColor={colors.textTitle}
                      outlineColor={colors.borderStrong}
                      activeOutlineColor={colors.secondary}
                    />
                  </View>

                  <View style={styles.rationField}>
                    <Text style={styles.rationFieldLabel}>Milk (Liters)</Text>
                    <TextInput
                      dense
                      mode="outlined"
                      keyboardType="numeric"
                      value={familyRations.milkL}
                      onChangeText={(t) =>
                        setFamilyRations({ ...familyRations, milkL: t })
                      }
                      style={styles.rationInput}
                      textColor={colors.textTitle}
                      outlineColor={colors.borderStrong}
                      activeOutlineColor={colors.secondary}
                    />
                  </View>

                  <View style={styles.rationField}>
                    <Text style={styles.rationFieldLabel}>Sugar / Jaggery (kg)</Text>
                    <TextInput
                      dense
                      mode="outlined"
                      keyboardType="numeric"
                      value={familyRations.sugarKg}
                      onChangeText={(t) =>
                        setFamilyRations({ ...familyRations, sugarKg: t })
                      }
                      style={styles.rationInput}
                      textColor={colors.textTitle}
                      outlineColor={colors.borderStrong}
                      activeOutlineColor={colors.secondary}
                    />
                  </View>

                  <View style={styles.rationField}>
                    <Text style={styles.rationFieldLabel}>Vegetables (kg)</Text>
                    <TextInput
                      dense
                      mode="outlined"
                      keyboardType="numeric"
                      value={familyRations.vegKg}
                      onChangeText={(t) =>
                        setFamilyRations({ ...familyRations, vegKg: t })
                      }
                      style={styles.rationInput}
                      textColor={colors.textTitle}
                      outlineColor={colors.borderStrong}
                      activeOutlineColor={colors.secondary}
                    />
                  </View>
                </View>

                <Button
                  mode="contained"
                  icon="calculator"
                  onPress={calculateFamilySurvey}
                  style={styles.calcMainBtn}
                  labelStyle={{ fontSize: 16, fontWeight: "bold" }}
                >
                  Calculate Family Intake
                </Button>
              </Card.Content>
            </Card>

            {/* Family Survey Results */}
            {familyResult && (
              <View style={{ marginTop: 16 }}>
                <Card style={styles.resultCard}>
                  <Card.Content>
                    <View style={styles.cardTitleRow}>
                      <MaterialIcons name="assessment" size={22} color={colors.secondary} />
                      <Text style={styles.sectionTitle}>
                        Intake per Consumption Unit (CU)
                      </Text>
                    </View>
                    <Text style={styles.captionText}>
                      Comparison against Reference Adult Male (Sedentary, 2,110 kcal, 54g Pro):
                    </Text>

                    <Divider style={{ marginVertical: 12 }} />

                    {/* CU Intake Metrics Grid */}
                    <View style={styles.familyMetricGrid}>
                      <View style={styles.familyMetricBox}>
                        <Text style={styles.familyMetricVal}>
                          {familyResult.perCUKcal.toFixed(0)} kcal
                        </Text>
                        <Text style={styles.familyMetricLabel}>Per CU Daily Energy</Text>
                        <Text
                          style={[
                            styles.diffBadge,
                            { color: getDeficitColor(familyResult.kcalDiff) },
                          ]}
                        >
                          {getDeficitBadgeText(familyResult.kcalDiff)}
                        </Text>
                      </View>

                      <View style={styles.familyMetricBox}>
                        <Text style={styles.familyMetricVal}>
                          {familyResult.perCUProtein.toFixed(1)} g
                        </Text>
                        <Text style={styles.familyMetricLabel}>Per CU Daily Protein</Text>
                        <Text
                          style={[
                            styles.diffBadge,
                            { color: getDeficitColor(familyResult.proteinDiff) },
                          ]}
                        >
                          {getDeficitBadgeText(familyResult.proteinDiff)}
                        </Text>
                      </View>
                    </View>

                    {/* Per Capita Metrics */}
                    <View style={styles.perCapitaBox}>
                      <Text style={styles.perCapitaTitle}>Per Capita (Per Person) Values:</Text>
                      <Text style={styles.perCapitaText}>
                        • Energy: {familyResult.perCapitaKcal.toFixed(0)} kcal / person / day
                      </Text>
                      <Text style={styles.perCapitaText}>
                        • Protein: {familyResult.perCapitaProtein.toFixed(1)} g / person / day
                      </Text>
                      <Text style={styles.perCapitaNote}>
                        Note: In PSM practical viva, emphasize that intake per CU is the biologically valid metric for family dietary surveys, whereas per capita intake underestimates adult requirements.
                      </Text>
                    </View>
                  </Card.Content>
                </Card>

                {/* Share Family Case Sheet */}
                <Button
                  mode="outlined"
                  icon="share-variant"
                  onPress={handleShareSummary}
                  style={styles.shareBtn}
                  textColor={colors.secondary}
                >
                  Copy / Share Family Case Sheet Summary
                </Button>
              </View>
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* MODAL 1: PHYSIOLOGICAL PROFILE SELECTOR */}
        {/* ============================================================ */}
        <Modal
          visible={profileModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setProfileModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheetContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Physiological Group</Text>
                <IconButton
                  icon="close"
                  size={22}
                  onPress={() => setProfileModalVisible(false)}
                />
              </View>
              <Divider />

              <ScrollView style={{ maxHeight: 480 }}>
                {Object.values(REFERENCE_PROFILES).map((prof) => {
                  const isSelected = prof.id === selectedProfileKey;
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={[
                        styles.profileModalItem,
                        isSelected && styles.profileModalItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedProfileKey(prof.id);
                        setProfileModalVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileModalCategory}>
                          {prof.category}
                        </Text>
                        <Text
                          style={[
                            styles.profileModalLabel,
                            isSelected && { color: colors.secondary, fontWeight: "bold" },
                          ]}
                        >
                          {prof.label}
                        </Text>
                        <Text style={styles.profileModalStats}>
                          {prof.kcal} kcal • {prof.protein}g Pro • {prof.iron}mg Fe • {prof.calcium}mg Ca
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialIcons
                          name="check-circle"
                          size={22}
                          color={colors.secondary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 2: SEARCHABLE FOOD PICKER */}
        {/* ============================================================ */}
        <Modal
          visible={pickerVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheetContainer, { height: "85%" }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Add Food Item</Text>
                  <Text style={styles.captionText}>
                    Adding to: {MEAL_SLOTS.find((m) => m.id === targetMealId)?.title}
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  size={22}
                  onPress={() => setPickerVisible(false)}
                />
              </View>

              {/* Search Bar */}
              <View style={styles.searchBarContainer}>
                <MaterialIcons name="search" size={22} color={colors.textSecondary} />
                <TextInput
                  placeholder="Search rice, roti, dal, milk, egg..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.searchInput}
                  textColor={colors.textTitle}
                  placeholderTextColor={colors.textPlaceholder}
                  dense
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <MaterialIcons name="clear" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Chips */}
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
                      style={[
                        styles.catChip,
                        isSelected && { backgroundColor: colors.secondary },
                      ]}
                      textStyle={{
                        fontSize: 12,
                        color: isSelected ? "#FFFFFF" : colors.textTitle,
                      }}
                    >
                      {cat}
                    </Chip>
                  );
                })}
              </ScrollView>

              <Divider />

              {/* Food Items List */}
              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.foodListItem}
                    onPress={() => handleSelectFood(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.foodListTitle}>{item.name}</Text>
                      <Text style={styles.foodListCat}>{item.category}</Text>
                      <Text style={styles.foodListNutrients}>
                        Per 100g raw: {item.calories} kcal • {item.protein}g Pro • {item.fat}g Fat • {item.iron}mg Fe
                      </Text>
                    </View>
                    <MaterialIcons
                      name="add-circle-outline"
                      size={24}
                      color={colors.secondary}
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>No matching foods found</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* ============================================================ */}
        {/* MODAL 3: PORTION SELECTOR MODAL */}
        {/* ============================================================ */}
        <Modal
          visible={portionModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setPortionModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheetContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Household Measure</Text>
                <IconButton
                  icon="close"
                  size={22}
                  onPress={() => setPortionModalVisible(false)}
                />
              </View>
              <Divider />

              <View style={{ padding: 16 }}>
                {activeItemForPortion && (
                  <Text style={styles.portionFoodName}>
                    {getFood(activeItemForPortion.foodId)?.name}
                  </Text>
                )}

                {activeItemForPortion &&
                  getFood(activeItemForPortion.foodId)?.portions?.map((port) => {
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
                            = {port.grams}g raw equivalent
                          </Text>
                        </View>
                        {isSelected && (
                          <MaterialIcons
                            name="check"
                            size={20}
                            color={colors.secondary}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundMain,
    },
    container: {
      padding: 16,
      paddingBottom: 48,
    },
    headerBox: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    headerIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.secondary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Mode Segment Switcher
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
    segmentBtnActive: {
      backgroundColor: colors.secondary,
      elevation: 2,
    },
    segmentBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
      marginLeft: 6,
    },
    segmentBtnTextActive: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },

    // Cards & Sections
    card: {
      marginBottom: 16,
      backgroundColor: colors.surfacePrimary,
      borderRadius: 12,
      elevation: 2,
    },
    cardTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.textTitle,
      marginLeft: 6,
    },
    captionText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    groupHeading: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.textTitle,
      marginBottom: 10,
      marginTop: 4,
    },

    // Profile Picker
    profilePickerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfacePrimary,
      marginTop: 4,
      marginBottom: 12,
    },
    profileCategoryLabel: {
      fontSize: 11,
      color: colors.secondary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    profileSelectedText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
      marginTop: 2,
    },
    rdaChipRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
    },
    rdaBadge: {
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: colors.primaryLight || "#EEF2FF",
      borderRadius: 6,
      flex: 1,
      marginHorizontal: 2,
    },
    rdaBadgeValue: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.secondary,
    },
    rdaBadgeLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },

    // Meal Timeline Cards
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
    mealTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    mealTip: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    addBtnSmall: {
      backgroundColor: colors.primaryLight || "#EEF2FF",
      borderRadius: 6,
    },
    emptyMealText: {
      fontSize: 12,
      color: colors.textPlaceholder,
      fontStyle: "italic",
      paddingVertical: 6,
    },

    // Food Item Rows inside meal
    itemRowContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceSecondary || "#F1F5F9",
    },
    itemInfoCol: {
      flex: 3,
      paddingRight: 6,
    },
    foodNameText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
    },
    portionBadgeBtn: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 3,
    },
    portionBadgeText: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: "500",
      maxWidth: 180,
    },
    quantityCol: {
      flex: 1.5,
      alignItems: "center",
    },
    qtyInput: {
      width: 60,
      height: 38,
      textAlign: "center",
      backgroundColor: colors.surfacePrimary,
      fontSize: 14,
    },
    computedGramsText: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
    },
    removeBtn: {
      padding: 6,
      marginLeft: 4,
      justifyContent: "center",
      alignItems: "center",
    },

    calcMainBtn: {
      marginVertical: 18,
      paddingVertical: 6,
      backgroundColor: colors.secondary,
      borderRadius: 10,
      elevation: 3,
    },

    // Result Cards & Tables
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
      fontSize: 12,
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
    tableDataRowAlt: {
      backgroundColor: colors.backgroundMain,
    },
    tableCellName: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    tableCellUnit: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    tableCellGot: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTitle,
    },
    tableCellRef: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    diffBadge: {
      fontSize: 11,
      fontWeight: "bold",
    },

    // AMDR Section
    amdrContainer: {
      marginTop: 8,
    },
    amdrItem: {
      marginBottom: 12,
    },
    amdrLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    amdrName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textTitle,
    },
    amdrPct: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    amdrTarget: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "normal",
    },
    amdrBar: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceSecondary || "#E2E8F0",
    },
    ratioRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    ratioTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    ratioSubtitle: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    ratioBadge: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.secondary,
    },
    ratioStatus: {
      fontSize: 11,
      fontWeight: "600",
    },

    // Clinical Impression
    impressionText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.textTitle,
      marginTop: 6,
      fontStyle: "italic",
    },

    // Counseling Section
    counselingItem: {
      marginBottom: 14,
    },
    counselingHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    counselingTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.secondary,
      marginLeft: 6,
    },
    counselingDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginLeft: 4,
      marginBottom: 2,
    },
    bulletDot: {
      fontSize: 14,
      color: colors.secondary,
      marginRight: 6,
      lineHeight: 18,
    },
    bulletText: {
      fontSize: 12,
      color: colors.textTitle,
      flex: 1,
      lineHeight: 18,
    },

    shareBtn: {
      marginBottom: 24,
      borderColor: colors.secondary,
      borderRadius: 8,
    },

    // Mode B: Family Survey Styles
    cuSummaryBanner: {
      flexDirection: "row",
      backgroundColor: colors.primaryLight || "#EEF2FF",
      borderRadius: 8,
      padding: 12,
      marginBottom: 14,
      alignItems: "center",
      justifyContent: "space-around",
    },
    cuSummaryItem: {
      alignItems: "center",
    },
    cuSummaryVal: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    cuSummaryLbl: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cuSummaryDivider: {
      width: 1,
      height: 36,
      backgroundColor: colors.borderStrong,
    },
    familyMemberRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    cuPickerContainer: {
      backgroundColor: colors.surfacePrimary,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 4,
    },
    cuSelectBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 10,
    },
    cuSelectText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textTitle,
      flex: 1,
    },
    periodRow: {
      flexDirection: "row",
      marginBottom: 14,
    },
    periodChip: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      marginHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    periodChipActive: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    periodChipText: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: "center",
    },
    periodChipTextActive: {
      color: "#FFFFFF",
      fontWeight: "bold",
    },
    rationGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    rationField: {
      width: "48%",
      marginBottom: 12,
    },
    rationFieldLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 4,
      fontWeight: "500",
    },
    rationInput: {
      backgroundColor: colors.surfacePrimary,
      fontSize: 14,
    },
    familyMetricGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
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
    familyMetricVal: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    familyMetricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginVertical: 4,
      textAlign: "center",
    },
    perCapitaBox: {
      backgroundColor: colors.primaryLight || "#EEF2FF",
      borderRadius: 8,
      padding: 12,
      marginTop: 4,
    },
    perCapitaTitle: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.textTitle,
      marginBottom: 6,
    },
    perCapitaText: {
      fontSize: 12,
      color: colors.textTitle,
      marginBottom: 2,
    },
    perCapitaNote: {
      fontSize: 11,
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: 6,
      lineHeight: 16,
    },

    // Modal Styles
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
    modalTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: colors.textTitle,
    },
    profileModalItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceSecondary || "#F1F5F9",
    },
    profileModalItemSelected: {
      backgroundColor: colors.primaryLight || "#EEF2FF",
    },
    profileModalCategory: {
      fontSize: 10,
      color: colors.secondary,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    profileModalLabel: {
      fontSize: 14,
      color: colors.textTitle,
      marginTop: 2,
    },
    profileModalStats: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Search Bar in Food Modal
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
    searchInput: {
      flex: 1,
      backgroundColor: "transparent",
      fontSize: 13,
      height: 40,
    },
    categoryScroll: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    catChip: {
      marginRight: 6,
      backgroundColor: colors.backgroundMain,
    },
    foodListItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceSecondary || "#F1F5F9",
    },
    foodListTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textTitle,
    },
    foodListCat: {
      fontSize: 11,
      color: colors.secondary,
      marginTop: 1,
    },
    foodListNutrients: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyList: {
      padding: 32,
      alignItems: "center",
    },
    emptyListText: {
      color: colors.textSecondary,
      fontSize: 14,
    },

    // Portion Modal
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
      backgroundColor: colors.surfacePrimary,
    },
    portionOptionRowSelected: {
      borderColor: colors.secondary,
      backgroundColor: colors.primaryLight || "#EEF2FF",
    },
    portionOptionLabel: {
      fontSize: 14,
      color: colors.textTitle,
    },
    portionOptionWeight: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

export default DietarySurveyScreen;
