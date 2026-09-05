/**
 * ICMR-NIN 2020 EAR / RDA and calculation engines for the Dietary Survey tool.
 * Energy values are Estimated Energy Requirements (there is no energy RDA).
 * Consumption units are energy ratios vs the sedentary adult man (2110 kcal = 1.0 CU).
 */

const REF_MAN_KCAL = 2110;
const REF_MAN_PROTEIN_EAR = 42.9;
const REF_MAN_PROTEIN_RDA = 54.0;

function cuFromKcal(kcal) {
  return Math.round((kcal / REF_MAN_KCAL) * 10) / 10;
}

export const REFERENCE_PROFILES = {
  man_sedentary: {
    id: "man_sedentary",
    category: "Adult male",
    label: "Adult male, sedentary (65 kg)",
    kcal: 2110,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 25,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: 1.0,
  },
  man_moderate: {
    id: "man_moderate",
    category: "Adult male",
    label: "Adult male, moderate work (65 kg)",
    kcal: 2710,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: cuFromKcal(2710),
  },
  man_heavy: {
    id: "man_heavy",
    category: "Adult male",
    label: "Adult male, heavy work (65 kg)",
    kcal: 3470,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 40,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: cuFromKcal(3470),
  },
  woman_sedentary: {
    id: "woman_sedentary",
    category: "Adult female",
    label: "Adult female, sedentary (55 kg)",
    kcal: 1660,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 20,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 29,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(1660),
  },
  woman_moderate: {
    id: "woman_moderate",
    category: "Adult female",
    label: "Adult female, moderate work (55 kg)",
    kcal: 2130,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 25,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 29,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(2130),
  },
  woman_heavy: {
    id: "woman_heavy",
    category: "Adult female",
    label: "Adult female, heavy work (55 kg)",
    kcal: 2720,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 29,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(2720),
  },
  preg_2nd_sedentary: {
    id: "preg_2nd_sedentary",
    category: "Pregnancy",
    label: "Pregnant woman, 2nd trimester, sedentary (+350 kcal, +9.5 g protein)",
    kcal: 2010,
    proteinEar: 43.9,
    proteinRda: 55.2,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2010),
  },
  preg_2nd_moderate: {
    id: "preg_2nd_moderate",
    category: "Pregnancy",
    label: "Pregnant woman, 2nd trimester, moderate (+350 kcal, +9.5 g protein)",
    kcal: 2480,
    proteinEar: 43.9,
    proteinRda: 55.2,
    visibleFat: 35,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2480),
  },
  preg_3rd_sedentary: {
    id: "preg_3rd_sedentary",
    category: "Pregnancy",
    label: "Pregnant woman, 3rd trimester, sedentary (+350 kcal, +22 g protein)",
    kcal: 2010,
    proteinEar: 53.9,
    proteinRda: 67.7,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2010),
  },
  preg_3rd_moderate: {
    id: "preg_3rd_moderate",
    category: "Pregnancy",
    label: "Pregnant woman, 3rd trimester, moderate (+350 kcal, +22 g protein)",
    kcal: 2480,
    proteinEar: 53.9,
    proteinRda: 67.7,
    visibleFat: 35,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2480),
  },
  lact_0_6m: {
    id: "lact_0_6m",
    category: "Lactation",
    label: "Lactating mother, 0 to 6 months (+600 kcal, +16.9 g protein)",
    kcal: 2260,
    proteinEar: 49.9,
    proteinRda: 62.6,
    visibleFat: 30,
    calciumEar: 1000,
    calciumRda: 1200,
    ironEar: 16,
    ironRda: 23,
    vitCEar: 95,
    vitCRda: 115,
    folateEar: 280,
    folateRda: 330,
    cu: cuFromKcal(2260),
  },
  lact_7_12m: {
    id: "lact_7_12m",
    category: "Lactation",
    label: "Lactating mother, 7 to 12 months (+520 kcal, +13.2 g protein)",
    kcal: 2180,
    proteinEar: 46.9,
    proteinRda: 58.9,
    visibleFat: 30,
    calciumEar: 1000,
    calciumRda: 1200,
    ironEar: 16,
    ironRda: 23,
    vitCEar: 95,
    vitCRda: 115,
    folateEar: 280,
    folateRda: 330,
    cu: cuFromKcal(2180),
  },
  infant_0_6m: {
    id: "infant_0_6m",
    category: "Infants and children",
    label: "Infant, 0 to 6 months (breastmilk reference; not a household-pot diet)",
    kcal: 530,
    proteinEar: 6.7,
    proteinRda: 8.1,
    visibleFat: 0,
    calciumEar: 240,
    calciumRda: 300,
    ironEar: 0.2,
    ironRda: 0.4,
    vitCEar: 16,
    vitCRda: 20,
    folateEar: 20,
    folateRda: 25,
    cu: 0.0,
  },
  infant_6_12m: {
    id: "infant_6_12m",
    category: "Infants and children",
    label: "Infant, 6 to 12 months (complementary feeding)",
    kcal: 660,
    proteinEar: 8.8,
    proteinRda: 10.5,
    visibleFat: 25,
    calciumEar: 240,
    calciumRda: 300,
    ironEar: 2,
    ironRda: 3,
    vitCEar: 24,
    vitCRda: 30,
    folateEar: 68,
    folateRda: 85,
    cu: cuFromKcal(660),
  },
  child_1_3y: {
    id: "child_1_3y",
    category: "Infants and children",
    label: "Child, 1 to 3 years",
    kcal: 1110,
    proteinEar: 10.2,
    proteinRda: 12.5,
    visibleFat: 25,
    calciumEar: 400,
    calciumRda: 500,
    ironEar: 6,
    ironRda: 8,
    vitCEar: 24,
    vitCRda: 30,
    folateEar: 97,
    folateRda: 120,
    cu: cuFromKcal(1110),
  },
  child_4_6y: {
    id: "child_4_6y",
    category: "Infants and children",
    label: "Child, 4 to 6 years",
    kcal: 1360,
    proteinEar: 12.8,
    proteinRda: 15.9,
    visibleFat: 25,
    calciumEar: 450,
    calciumRda: 550,
    ironEar: 8,
    ironRda: 11,
    vitCEar: 27,
    vitCRda: 35,
    folateEar: 111,
    folateRda: 135,
    cu: cuFromKcal(1360),
  },
  child_7_9y: {
    id: "child_7_9y",
    category: "Infants and children",
    label: "Child, 7 to 9 years",
    kcal: 1700,
    proteinEar: 19.0,
    proteinRda: 23.3,
    visibleFat: 30,
    calciumEar: 500,
    calciumRda: 650,
    ironEar: 10,
    ironRda: 15,
    vitCEar: 36,
    vitCRda: 45,
    folateEar: 142,
    folateRda: 170,
    cu: cuFromKcal(1700),
  },
  adol_boys_10_12: {
    id: "adol_boys_10_12",
    category: "Adolescents",
    label: "Adolescent boy, 10 to 12 years",
    kcal: 2220,
    proteinEar: 26.2,
    proteinRda: 31.8,
    visibleFat: 35,
    calciumEar: 650,
    calciumRda: 850,
    ironEar: 12,
    ironRda: 16,
    vitCEar: 45,
    vitCRda: 55,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(2220),
  },
  adol_girls_10_12: {
    id: "adol_girls_10_12",
    category: "Adolescents",
    label: "Adolescent girl, 10 to 12 years",
    kcal: 2060,
    proteinEar: 26.6,
    proteinRda: 32.8,
    visibleFat: 35,
    calciumEar: 650,
    calciumRda: 850,
    ironEar: 16,
    ironRda: 28,
    vitCEar: 40,
    vitCRda: 50,
    folateEar: 180,
    folateRda: 225,
    cu: cuFromKcal(2060),
  },
  adol_boys_13_15: {
    id: "adol_boys_13_15",
    category: "Adolescents",
    label: "Adolescent boy, 13 to 15 years",
    kcal: 2860,
    proteinEar: 36.4,
    proteinRda: 44.9,
    visibleFat: 45,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 22,
    vitCEar: 56,
    vitCRda: 70,
    folateEar: 230,
    folateRda: 285,
    cu: cuFromKcal(2860),
  },
  adol_girls_13_15: {
    id: "adol_girls_13_15",
    category: "Adolescents",
    label: "Adolescent girl, 13 to 15 years",
    kcal: 2400,
    proteinEar: 34.7,
    proteinRda: 43.2,
    visibleFat: 40,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 30,
    vitCEar: 52,
    vitCRda: 65,
    folateEar: 196,
    folateRda: 245,
    cu: cuFromKcal(2400),
  },
  adol_boys_16_18: {
    id: "adol_boys_16_18",
    category: "Adolescents",
    label: "Adolescent boy, 16 to 18 years",
    kcal: 3320,
    proteinEar: 45.1,
    proteinRda: 55.4,
    visibleFat: 50,
    calciumEar: 800,
    calciumRda: 1050,
    ironEar: 18,
    ironRda: 26,
    vitCEar: 68,
    vitCRda: 85,
    folateEar: 270,
    folateRda: 340,
    cu: cuFromKcal(3320),
  },
  adol_girls_16_18: {
    id: "adol_girls_16_18",
    category: "Adolescents",
    label: "Adolescent girl, 16 to 18 years",
    kcal: 2500,
    proteinEar: 37.3,
    proteinRda: 46.2,
    visibleFat: 35,
    calciumEar: 800,
    calciumRda: 1050,
    ironEar: 22,
    ironRda: 32,
    vitCEar: 56,
    vitCRda: 70,
    folateEar: 216,
    folateRda: 270,
    cu: cuFromKcal(2500),
  },
  elderly_man: {
    id: "elderly_man",
    category: "Elderly (60 y and above)",
    label: "Elderly male, sedentary (60 y and above)",
    kcal: 1700,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 25,
    calciumEar: 800,
    calciumRda: 1200,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: cuFromKcal(1700),
  },
  elderly_woman: {
    id: "elderly_woman",
    category: "Elderly (60 y and above)",
    label: "Elderly female, sedentary (60 y and above)",
    kcal: 1500,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 20,
    calciumEar: 800,
    calciumRda: 1200,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(1500),
  },
};

export const MEAL_SLOTS = [
  { id: "early_morning", title: "Early morning", icon: "weather-sunset", tip: "Tea calories come from the milk and sugar you log" },
  { id: "breakfast", title: "Breakfast", icon: "egg", tip: "Roti, poha, idli, egg, milk" },
  { id: "mid_morning", title: "Mid-morning", icon: "fruit-cherries", tip: "Fruit, roasted chana, buttermilk" },
  { id: "lunch", title: "Lunch", icon: "food-drumstick", tip: "Cereal, dal, sabzi, curd. Log the cooking oil." },
  { id: "evening_snack", title: "Evening tea and snacks", icon: "coffee", tip: "Tea (milk + sugar), roasted snacks" },
  { id: "dinner", title: "Dinner", icon: "silverware-fork-knife", tip: "Roti, rice, dal, cooked vegetables" },
  { id: "bedtime", title: "Bedtime", icon: "cup", tip: "Milk if taken" },
];

export const CU_COEFFICIENT_OPTIONS = [
  { label: "Adult male, sedentary (1.0 CU)", cu: 1.0 },
  { label: "Adult male, moderate (1.3 CU)", cu: 1.3 },
  { label: "Adult male, heavy (1.6 CU)", cu: 1.6 },
  { label: "Adult female, sedentary (0.8 CU)", cu: 0.8 },
  { label: "Adult female, moderate (1.0 CU)", cu: 1.0 },
  { label: "Adult female, heavy (1.3 CU)", cu: 1.3 },
  { label: "Pregnant, sedentary (1.0 CU)", cu: 1.0 },
  { label: "Pregnant, moderate (1.2 CU)", cu: 1.2 },
  { label: "Lactating, 0 to 6 months (1.1 CU)", cu: 1.1 },
  { label: "Lactating, 7 to 12 months (1.0 CU)", cu: 1.0 },
  { label: "Elderly male, sedentary (0.8 CU)", cu: 0.8 },
  { label: "Elderly female, sedentary (0.7 CU)", cu: 0.7 },
  { label: "Adolescent boy, 16 to 18 y (1.6 CU)", cu: 1.6 },
  { label: "Adolescent girl, 16 to 18 y (1.2 CU)", cu: 1.2 },
  { label: "Adolescent boy, 13 to 15 y (1.4 CU)", cu: 1.4 },
  { label: "Adolescent girl, 13 to 15 y (1.1 CU)", cu: 1.1 },
  { label: "Adolescent boy, 10 to 12 y (1.1 CU)", cu: 1.1 },
  { label: "Adolescent girl, 10 to 12 y (1.0 CU)", cu: 1.0 },
  { label: "Child, 7 to 9 y (0.8 CU)", cu: 0.8 },
  { label: "Child, 4 to 6 y (0.6 CU)", cu: 0.6 },
  { label: "Child, 1 to 3 y (0.5 CU)", cu: 0.5 },
  { label: "Infant, 6 to 12 months (0.3 CU)", cu: 0.3 },
  { label: "Infant, 0 to 6 months, not sharing the pot (0.0 CU)", cu: 0.0 },
];

/** ICMR-NIN suggested amounts per CU for a sedentary adult man. */
export const BALANCED_DIET_PER_CU = [
  { key: "cereals", label: "Cereals and millets", unit: "g", target: 275 },
  { key: "pulses", label: "Pulses", unit: "g", target: 80 },
  { key: "milk", label: "Milk and curd", unit: "ml", target: 300 },
  { key: "glv", label: "Green leafy vegetables", unit: "g", target: 100 },
  { key: "otherVeg", label: "Other vegetables", unit: "g", target: 200 },
  { key: "tubers", label: "Roots and tubers", unit: "g", target: 100 },
  { key: "fruits", label: "Fruits", unit: "g", target: 100 },
  { key: "nuts", label: "Nuts and oilseeds", unit: "g", target: 30 },
  { key: "oil", label: "Visible fat (oil / ghee)", unit: "g", target: 25 },
  { key: "sugar", label: "Sugar", unit: "g", target: 25 },
];

/** Per 100 g (or 100 ml milk). Cereals/pulses are IFCT blends. Oil uses Atwater 9 kcal/g. */
export const FAMILY_STAPLE_YIELDS = {
  cereals: { kcal: 338, protein: 9.26, fat: 1.03 },
  pulses: { kcal: 329, protein: 22.38, fat: 2.74 },
  oil: { kcal: 900, protein: 0, fat: 100 },
  milk: { kcal: 73, protein: 3.26, fat: 4.48 },
  sugar: { kcal: 400, protein: 0, fat: 0 },
  glv: { kcal: 24, protein: 2.14, fat: 0.64 },
  otherVeg: { kcal: 19, protein: 1.12, fat: 0.2 },
  tubers: { kcal: 70, protein: 1.54, fat: 0.23 },
  fruits: { kcal: 58, protein: 1.12, fat: 0.26 },
  nuts: { kcal: 520, protein: 23.65, fat: 39.63 },
};

export const FOOD_CATEGORIES = [
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

export const SAMPLE_RECALL_ITEMS = [
  { id: "sample_1", mealId: "breakfast", foodId: "wheat_atta", portionId: "roti_med", quantity: "2" },
  { id: "sample_2", mealId: "breakfast", foodId: "milk_cow", portionId: "cup", quantity: "1" },
  { id: "sample_3", mealId: "breakfast", foodId: "sugar", portionId: "tsp", quantity: "1" },
  { id: "sample_4", mealId: "lunch", foodId: "rice_raw", portionId: "katori_cooked", quantity: "1" },
  { id: "sample_5", mealId: "lunch", foodId: "dal_toor", portionId: "katori_med", quantity: "1" },
  { id: "sample_6", mealId: "lunch", foodId: "potato", portionId: "katori_sabzi", quantity: "1" },
  { id: "sample_7", mealId: "lunch", foodId: "cooking_oil", portionId: "tsp", quantity: "2" },
  { id: "sample_8", mealId: "dinner", foodId: "wheat_atta", portionId: "roti_med", quantity: "2" },
  { id: "sample_9", mealId: "dinner", foodId: "dal_moong", portionId: "katori_med", quantity: "1" },
  { id: "sample_10", mealId: "dinner", foodId: "spinach", portionId: "half_katori", quantity: "1" },
  { id: "sample_11", mealId: "evening_snack", foodId: "milk_cow", portionId: "cup", quantity: "1" },
  { id: "sample_12", mealId: "evening_snack", foodId: "sugar", portionId: "tsp", quantity: "1" },
];

export const SAMPLE_FAMILY_MEMBERS = [
  { id: "m1", label: "Husband, moderate work", cu: 1.3, cuLabel: "Adult male, moderate (1.3 CU)" },
  { id: "m2", label: "Wife, pregnant 3rd trimester", cu: 1.0, cuLabel: "Pregnant, sedentary (1.0 CU)" },
  { id: "m3", label: "Child, 5 years", cu: 0.6, cuLabel: "Child, 4 to 6 y (0.6 CU)" },
  { id: "m4", label: "Grandmother, 65 years", cu: 0.7, cuLabel: "Elderly female, sedentary (0.7 CU)" },
];

export const SAMPLE_FAMILY_RATIONS = {
  cerealsKg: "30",
  pulsesKg: "4",
  oilKg: "2",
  milkL: "15",
  sugarKg: "2",
  glvKg: "3",
  otherVegKg: "9",
  tubersKg: "6",
  fruitsKg: "4",
  nutsKg: "1",
};

export const calculateAMDR = (carbsG, proteinG, fatG, totalKcal) => {
  const carbKcal = (carbsG || 0) * 4;
  const proteinKcal = (proteinG || 0) * 4;
  const fatKcal = (fatG || 0) * 9;
  const sumKcal = carbKcal + proteinKcal + fatKcal;
  const denom = sumKcal > 0 ? sumKcal : totalKcal;
  if (!denom || denom <= 0) {
    return { carbPct: 0, proteinPct: 0, fatPct: 0, sumsTo: 0 };
  }
  const carbPct = Math.round((carbKcal / denom) * 100);
  const proteinPct = Math.round((proteinKcal / denom) * 100);
  const fatPct = Math.round((fatKcal / denom) * 100);
  return { carbPct, proteinPct, fatPct, sumsTo: carbPct + proteinPct + fatPct };
};

export const calculateCerealPulseRatio = (cerealGrams, pulseGrams, milkGrams = 0) => {
  if (!pulseGrams || pulseGrams <= 0) {
    if (!cerealGrams || cerealGrams <= 0) {
      return {
        ratioNum: 0,
        ratio: "N/A",
        milkRatio: "N/A",
        text: "No cereals or pulses recorded",
        isBalanced: false,
      };
    }
    return {
      ratioNum: 99,
      ratio: ">15:1",
      milkRatio: "N/A",
      text: "No pulse intake (cereal-only protein)",
      isBalanced: false,
    };
  }
  const ratioNum = cerealGrams / pulseGrams;
  const ratioStr = ratioNum.toFixed(1);
  const cerealPulseOk = ratioNum >= 2.5 && ratioNum <= 4.5;
  const milkRatioNum = milkGrams > 0 ? milkGrams / pulseGrams : 0;
  const milkOk = milkRatioNum >= 2.0 && milkRatioNum <= 3.5;
  const isBalanced = cerealPulseOk && (milkGrams <= 0 || milkOk);
  let text;
  if (cerealPulseOk && milkGrams > 0 && milkOk) {
    text = `Near ICMR 2020 cereal:pulse:milk of 3:1:2.5 (here ${ratioStr}:1:${milkRatioNum.toFixed(1)})`;
  } else if (cerealPulseOk) {
    text = milkGrams > 0
      ? `Cereal:pulse is in range; milk:pulse is ${milkRatioNum.toFixed(1)}:1 (target ~2.5:1)`
      : "Cereal:pulse is in the 3:1 to 4:1 band. Add milk for the 3:1:2.5 pattern.";
  } else if (ratioNum > 4.5) {
    text = `High cereal share (${ratioStr}:1 vs 3:1 to 4:1)`;
  } else {
    text = `High pulse share (${ratioStr}:1)`;
  }
  return {
    ratioNum: parseFloat(ratioStr),
    ratio: `${ratioStr} : 1`,
    milkRatio: milkGrams > 0 ? `3 : 1 : ${milkRatioNum.toFixed(1)}` : "no milk logged",
    text,
    isBalanced,
  };
};

export const percentDiff = (got, ref) => {
  if (ref == null || ref === 0) return null;
  return ((got - ref) / ref) * 100;
};

export const formatPct = (pct) => {
  if (pct == null || Number.isNaN(pct)) return "n/a";
  const rounded = pct.toFixed(1);
  return pct > 0 ? `+${rounded}%` : `${rounded}%`;
};

/**
 * Adequacy is judged against EAR (ICMR 2020). Energy has no RDA.
 */
export const intakeStatus = (got, ear, rda, { isEnergy = false, refLabel } = {}) => {
  const ref = ear != null ? ear : rda;
  const name = refLabel || (isEnergy ? "EER" : "EAR");
  if (ref == null || ref === 0) {
    return { key: "na", label: "n/a", color: "#64748B", pct: null };
  }
  const pct = percentDiff(got, ref);
  if (pct < -30) {
    return { key: "severe", label: `${formatPct(pct)} vs ${name}`, color: "#B91C1C", pct };
  }
  if (pct < -10) {
    return { key: "deficit", label: `${formatPct(pct)} vs ${name}`, color: "#D97706", pct };
  }
  if (isEnergy && pct > 20) {
    return { key: "surplus", label: `${formatPct(pct)} vs EER`, color: "#2563EB", pct };
  }
  if (!isEnergy && rda != null && got > rda * 1.1 && pct > 10) {
    return { key: "surplus", label: `${formatPct(pct)} (above RDA)`, color: "#2563EB", pct };
  }
  return { key: "adequate", label: `${formatPct(pct)} (meets ${name})`, color: "#15803D", pct };
};

export const findFood = (foods, id) => foods.find((f) => f.id === id);

export const gramsForItem = (item, food) => {
  const qty = parseFloat(item.quantity);
  if (!food || Number.isNaN(qty) || qty <= 0) return 0;
  const portion = food.portions?.find((p) => p.id === item.portionId) || { grams: 1 };
  return qty * (portion.grams || 0);
};

const factorFromFood = (food, grams) => {
  const factor = grams / 100;
  const cerealFromRecipe = food.countsAsCerealGramsPer100 ? (food.countsAsCerealGramsPer100 * grams) / 100 : 0;
  const pulseFromRecipe = food.countsAsPulseGramsPer100 ? (food.countsAsPulseGramsPer100 * grams) / 100 : 0;
  const visibleFromRecipe = food.countsAsVisibleFatPer100 ? (food.countsAsVisibleFatPer100 * grams) / 100 : 0;
  let cerealGrams = cerealFromRecipe;
  let pulseGrams = pulseFromRecipe;
  if (!cerealFromRecipe && food.category === "Cereals & Millets") cerealGrams = grams;
  if (!pulseFromRecipe && food.category === "Pulses & Legumes") pulseGrams = grams;
  const visibleFatGrams = food.visibleFat ? grams : visibleFromRecipe;
  const milkGrams = food.category === "Milk & Dairy" ? grams : 0;
  return {
    kcal: (food.calories || 0) * factor,
    protein: (food.protein || 0) * factor,
    fat: (food.fat || 0) * factor,
    carbs: (food.carbs || 0) * factor,
    calcium: (food.calcium || 0) * factor,
    iron: (food.iron || 0) * factor,
    vitC: (food.vitC || 0) * factor,
    folate: (food.folate || 0) * factor,
    cerealGrams,
    pulseGrams,
    milkGrams,
    visibleFatGrams,
  };
};

export const calculateIndividualIntake = (recallItems, foods, profile) => {
  const totals = {
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    calcium: 0,
    iron: 0,
    vitC: 0,
    folate: 0,
    cerealGrams: 0,
    pulseGrams: 0,
    milkGrams: 0,
    visibleFatGrams: 0,
  };
  const calculatedMealRows = [];

  for (const item of recallItems) {
    const food = findFood(foods, item.foodId);
    const grams = gramsForItem(item, food);
    if (!food || grams <= 0) continue;
    const n = factorFromFood(food, grams);
    Object.keys(totals).forEach((k) => {
      totals[k] += n[k] || 0;
    });
    const portionObj = food.portions?.find((p) => p.id === item.portionId);
    const mealObj = MEAL_SLOTS.find((m) => m.id === item.mealId);
    calculatedMealRows.push({
      ...item,
      food,
      grams,
      mealLabel: mealObj?.title || item.mealId,
      portionLabel: portionObj?.label || "Portion",
      rawEquivalent: !!portionObj?.rawEquivalent,
      ...n,
    });
  }

  if (totals.kcal <= 0 && totals.protein <= 0) {
    return null;
  }

  const amdr = calculateAMDR(totals.carbs, totals.protein, totals.fat, totals.kcal);
  const cpRatio = calculateCerealPulseRatio(totals.cerealGrams, totals.pulseGrams, totals.milkGrams);
  const lowQualityProtein = cpRatio.ratioNum > 4.5;
  const proteinEar = profile.proteinEar;
  const proteinOneGPerKg = Math.round((profile.proteinRda / 0.83) * 10) / 10;

  const kcalDiff = percentDiff(totals.kcal, profile.kcal);
  const proteinDiff = percentDiff(totals.protein, proteinEar);
  const calciumDiff = percentDiff(totals.calcium, profile.calciumEar);
  const ironDiff = percentDiff(totals.iron, profile.ironEar);
  const vitCDiff = percentDiff(totals.vitC, profile.vitCEar);
  const folateDiff = percentDiff(totals.folate, profile.folateEar);
  const visibleFatDiff = percentDiff(totals.visibleFatGrams, profile.visibleFat);

  return {
    ...totals,
    kcalDiff,
    proteinDiff,
    calciumDiff,
    ironDiff,
    vitCDiff,
    folateDiff,
    visibleFatDiff,
    amdr,
    cpRatio,
    lowQualityProtein,
    proteinEar,
    proteinOneGPerKg,
    calculatedMealRows,
  };
};

const dailyFromPeriod = (value, period) => {
  const n = parseFloat(value) || 0;
  const divisor = period === "monthly" ? 30 : 1;
  return (n * 1000) / divisor;
};

export const calculateFamilySurvey = ({ members, rations, period }) => {
  const totalCU = members.reduce((sum, m) => sum + (parseFloat(m.cu) || 0), 0);
  const numMembers = members.length || 0;
  if (totalCU <= 0) {
    return { error: "Total consumption units are 0. Add at least one member who shares the pot." };
  }

  const daily = {
    cereals: dailyFromPeriod(rations.cerealsKg, period),
    pulses: dailyFromPeriod(rations.pulsesKg, period),
    oil: dailyFromPeriod(rations.oilKg, period),
    milk: dailyFromPeriod(rations.milkL, period),
    sugar: dailyFromPeriod(rations.sugarKg, period),
    glv: dailyFromPeriod(rations.glvKg, period),
    otherVeg: dailyFromPeriod(rations.otherVegKg, period),
    tubers: dailyFromPeriod(rations.tubersKg, period),
    fruits: dailyFromPeriod(rations.fruitsKg, period),
    nuts: dailyFromPeriod(rations.nutsKg, period),
  };

  let dailyKcal = 0;
  let dailyProtein = 0;
  let dailyFat = 0;
  Object.entries(daily).forEach(([key, grams]) => {
    const y = FAMILY_STAPLE_YIELDS[key];
    if (!y) return;
    dailyKcal += (grams / 100) * y.kcal;
    dailyProtein += (grams / 100) * y.protein;
    dailyFat += (grams / 100) * y.fat;
  });

  const perCU = {
    kcal: dailyKcal / totalCU,
    protein: dailyProtein / totalCU,
    fat: dailyFat / totalCU,
  };

  const foodGroups = BALANCED_DIET_PER_CU.map((row) => {
    const got = daily[row.key] / totalCU;
    return {
      ...row,
      got,
      pctOfTarget: row.target ? (got / row.target) * 100 : 0,
    };
  });

  return {
    period,
    daily,
    dailyKcal,
    dailyProtein,
    dailyFat,
    totalCU,
    numMembers,
    perCUKcal: perCU.kcal,
    perCUProtein: perCU.protein,
    perCUFat: perCU.fat,
    perCapitaKcal: numMembers ? dailyKcal / numMembers : 0,
    perCapitaProtein: numMembers ? dailyProtein / numMembers : 0,
    kcalDiff: percentDiff(perCU.kcal, REF_MAN_KCAL),
    proteinDiffEar: percentDiff(perCU.protein, REF_MAN_PROTEIN_EAR),
    proteinDiffRda: percentDiff(perCU.protein, REF_MAN_PROTEIN_RDA),
    foodGroups,
    refManKcal: REF_MAN_KCAL,
    refManProteinEar: REF_MAN_PROTEIN_EAR,
    refManProteinRda: REF_MAN_PROTEIN_RDA,
  };
};

export const generateClinicalImpression = (result, profile) => {
  if (!result || !profile) return "";
  const parts = [];
  const kcalDef = result.kcalDiff;
  const proDef = result.proteinDiff;

  if (kcalDef < -20 && proDef < -20) {
    parts.push(
      `Energy (${Math.abs(kcalDef).toFixed(1)}% below EER) and protein (${Math.abs(proDef).toFixed(1)}% below EAR) are both low`
    );
  } else if (kcalDef < -10 && proDef < -10) {
    parts.push(`Moderate energy and protein gap versus ICMR-NIN 2020 EER / EAR`);
  } else if (kcalDef < -10 && proDef >= -10) {
    parts.push(`Energy is ${Math.abs(kcalDef).toFixed(1)}% below EER; protein meets EAR`);
  } else if (kcalDef >= -10 && proDef < -10) {
    parts.push(`Energy meets EER; protein is ${Math.abs(proDef).toFixed(1)}% below EAR`);
  } else if (kcalDef > 20) {
    parts.push(`Energy is ${kcalDef.toFixed(1)}% above EER`);
  } else {
    parts.push("Energy and protein are broadly adequate versus ICMR-NIN 2020 EER / EAR");
  }

  if (result.lowQualityProtein) {
    parts.push(
      "Cereal-heavy pattern: ICMR 2020 uses 1 g protein/kg when cereal protein quality is poor (shown as the adjusted EAR)"
    );
  }

  const micros = [];
  if (result.ironDiff < -25) micros.push(`iron (${Math.abs(result.ironDiff).toFixed(1)}% below EAR)`);
  if (result.calciumDiff < -25) micros.push(`calcium (${Math.abs(result.calciumDiff).toFixed(1)}% below EAR)`);
  if (result.vitCDiff < -30) micros.push(`vitamin C (${Math.abs(result.vitCDiff).toFixed(1)}% below EAR)`);
  if (result.folateDiff < -25) micros.push(`folate (${Math.abs(result.folateDiff).toFixed(1)}% below EAR)`);
  if (micros.length) parts.push(`Micronutrient gaps versus EAR: ${micros.join(", ")}`);

  if (result.visibleFatDiff != null && profile.visibleFat > 0) {
    if (result.visibleFatDiff < -20) {
      parts.push(`Visible fat (oil/ghee logged) is below the ICMR visible-fat amount of ${profile.visibleFat} g`);
    } else if (result.visibleFatDiff > 20) {
      parts.push(`Visible fat logged is above the ICMR visible-fat amount of ${profile.visibleFat} g`);
    }
  }

  if (result.amdr) {
    if (result.amdr.carbPct > 65) {
      parts.push(`Carbohydrate share is ${result.amdr.carbPct}% of Atwater energy (target about 50-60%)`);
    } else if (result.amdr.fatPct > 35) {
      parts.push(`Total fat share is ${result.amdr.fatPct}% of Atwater energy (target about 20-30%)`);
    }
  }

  if (result.cpRatio && result.cpRatio.ratioNum > 5) {
    parts.push(`Cereal-to-pulse ratio ${result.cpRatio.ratio} (ICMR 2020 pattern is 3:1:2.5 cereal:pulse:milk)`);
  }

  return `${parts.join(". ")}.`;
};

export const generateDietaryCounseling = (result, profile) => {
  if (!result || !profile) return [];
  const tips = [];
  const kcalGap = Math.round(profile.kcal - result.kcal);
  const proGap = profile.proteinEar - result.protein;
  const feGap = profile.ironEar - result.iron;
  const caGap = profile.calciumEar - result.calcium;
  const folGap = profile.folateEar - result.folate;

  if (kcalGap > 150 || proGap > 5) {
    tips.push({
      title: "Energy and protein, low cost",
      icon: "food-apple",
      description: `About ${Math.max(kcalGap, 0)} kcal and ${Math.max(proGap, 0).toFixed(1)} g protein below EER / EAR:`,
      bullets: [
        "30 g roasted Bengal gram / sattu (IFCT whole Bengal gram: about 86 kcal and 5.6 g protein).",
        "30 g ground nut (IFCT: about 156 kcal and 7.1 g protein).",
        "1 boiled egg, about 50 g (IFCT: about 74 kcal and 6.7 g protein).",
        "Keep cereal:pulse near 3:1 to 4:1, and add milk or curd toward 3:1:2.5.",
      ],
    });
  }

  if (feGap > 3) {
    tips.push({
      title: "Iron (EAR, not the IFA tablet)",
      icon: "pill",
      description: `About ${feGap.toFixed(1)} mg below iron EAR. Dietary iron is not the 60 mg IFA tablet.`,
      bullets: [
        "Cook drumstick leaves, methi, or amaranth in an iron kadai.",
        "IFCT rice flakes (poha) provide about 4.5 mg iron per 100 g, not the old 20 mg Gopalan figure.",
        "Do not drink tea or coffee within 1 hour of meals.",
        "Squeeze lemon (IFCT juice, about 48 mg vitamin C per 100 g) over dal.",
      ],
    });
  }

  if (caGap > 150) {
    tips.push({
      title: "Calcium",
      icon: "bottle-tonic-plus",
      description: `About ${Math.round(caGap)} mg below calcium EAR:`,
      bullets: [
        "Ragi (IFCT: 364 mg calcium per 100 g) in roti or porridge.",
        "10 g brown gingelly (til) seeds: about 117 mg calcium.",
        "150-200 ml curd or cow milk (IFCT cow milk: 118 mg calcium per 100 ml).",
      ],
    });
  }

  if (folGap > 80) {
    const pregNote =
      profile.category === "Pregnancy"
        ? " Pregnancy RDA is 570 µg. The IFA tablet still supplies 500 µg folic acid."
        : "";
    tips.push({
      title: "Folate",
      icon: "leaf",
      description: `About ${Math.round(folGap)} µg below folate EAR.${pregNote}`,
      bullets: [
        "Green leafy vegetables and whole pulses (rajma and Bengal gram are folate-dense in IFCT).",
      ],
    });
  }

  tips.push({
    title: "Household processing",
    icon: "sprout",
    description: "No-cost steps that improve the same IFCT foods:",
    bullets: [
      "Germinate whole moong or chana: vitamin C rises and phytate falls.",
      "Ferment (idli, dosa, dhokla) for B-vitamin synthesis.",
      "Keep cereal:pulse:milk near 3:1:2.5.",
    ],
  });

  return tips;
};

const dateStamp = () =>
  new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const generateCaseSheetSummary = (surveyData) => {
  const { profile, result, mealRows, familyData, mode } = surveyData;
  const dateStr = dateStamp();

  if (mode === "family") {
    const { members, rations, period, result: fam } = familyData;
    const periodLabel = period === "monthly" ? "MONTHLY household purchase (tool divides by 30)" : "DAILY household use";
    const groups = (fam.foodGroups || [])
      .map((g) => `  • ${g.label}: ${g.got.toFixed(0)} ${g.unit}/CU (target ${g.target} ${g.unit}, ${g.pctOfTarget.toFixed(0)}%)`)
      .join("\n");
    return `===========================================================
FAMILY DIETARY SURVEY (CU method, ICMR-NIN 2020)
===========================================================
Date: ${dateStr}
${periodLabel}
Members: ${members.length}
Total CU: ${fam.totalCU.toFixed(2)} (1.0 CU = sedentary man 2110 kcal)
-----------------------------------------------------------
RATION ENTRIES (${period}):
• Cereals ${rations.cerealsKg || 0} kg  • Pulses ${rations.pulsesKg || 0} kg
• Oil ${rations.oilKg || 0} kg  • Milk ${rations.milkL || 0} L  • Sugar ${rations.sugarKg || 0} kg
• GLV ${rations.glvKg || 0} kg  • Other veg ${rations.otherVegKg || 0} kg  • Tubers ${rations.tubersKg || 0} kg
• Fruits ${rations.fruitsKg || 0} kg  • Nuts ${rations.nutsKg || 0} kg
-----------------------------------------------------------
FOOD GROUP PER CU vs ICMR sedentary-man plate:
${groups}
-----------------------------------------------------------
NUTRIENTS PER CU:
• Energy: ${fam.perCUKcal.toFixed(0)} kcal  (EER 2110) [${formatPct(fam.kcalDiff)}]
• Protein: ${fam.perCUProtein.toFixed(1)} g  (EAR 42.9 / RDA 54.0)
• Per capita energy: ${fam.perCapitaKcal.toFixed(0)} kcal/person (not the viva metric)
===========================================================`;
  }

  let mealText = "";
  if (mealRows && mealRows.length > 0) {
    mealText = mealRows
      .filter((r) => r.food && r.grams > 0)
      .map(
        (r) =>
          `  • [${r.mealLabel}] ${r.food.name} (${r.portionLabel} x ${r.quantity}): ${r.grams.toFixed(0)} g -> ${r.kcal.toFixed(0)} kcal, ${r.protein.toFixed(1)} g P`
      )
      .join("\n");
  }

  return `===========================================================
24-HOUR DIETARY RECALL (ICMR-NIN 2020, IFCT 2017)
===========================================================
Date: ${dateStr}
Subject: ${profile.label}
Adequacy judged against EAR (energy against EER). RDA is shown for completeness.
-----------------------------------------------------------
INVENTORY:
${mealText || "  No items recorded"}
-----------------------------------------------------------
INTAKE vs EER / EAR / RDA:
• Energy: ${result.kcal.toFixed(0)} kcal / EER ${profile.kcal} [${formatPct(result.kcalDiff)}]
• Protein: ${result.protein.toFixed(1)} g / EAR ${result.proteinEar} / RDA ${profile.proteinRda} [${formatPct(result.proteinDiff)}]
• Visible fat: ${result.visibleFatGrams.toFixed(1)} g / ${profile.visibleFat} g
• Total fat (IFCT): ${result.fat.toFixed(1)} g  (use AMDR, not the visible-fat gram target)
• Calcium: ${result.calcium.toFixed(0)} mg / EAR ${profile.calciumEar} / RDA ${profile.calciumRda}
• Iron: ${result.iron.toFixed(1)} mg / EAR ${profile.ironEar} / RDA ${profile.ironRda}
• Vitamin C: ${result.vitC.toFixed(1)} mg / EAR ${profile.vitCEar} / RDA ${profile.vitCRda}
• Folate: ${result.folate.toFixed(0)} µg / EAR ${profile.folateEar} / RDA ${profile.folateRda}
-----------------------------------------------------------
AMDR (Atwater % of carb+protein+fat energy):
• Carbohydrate ${result.amdr?.carbPct || 0}% (about 50-60%)
• Protein ${result.amdr?.proteinPct || 0}% (about 10-15%)
• Fat ${result.amdr?.fatPct || 0}% (about 20-30%)
• Cereal:pulse ${result.cpRatio?.ratio || "N/A"}  (ICMR 2020 also wants milk, 3:1:2.5)
-----------------------------------------------------------
IMPRESSION:
${generateClinicalImpression(result, profile)}
===========================================================`;
};
