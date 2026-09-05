/**
 * dietaryReferenceData.js
 * Reference standards based on ICMR-NIN RDA & EAR (2020) and Park's Textbook of PSM (27th/28th ed.)
 * Includes Adult Consumption Unit (CU / ACU) coefficients and clinical calculation engines.
 */

// ICMR-NIN 2020 Recommended Dietary Allowances (RDA) and Estimated Average Requirements (EAR)
export const REFERENCE_PROFILES = {
  // Adult Males
  man_sedentary: {
    id: "man_sedentary",
    category: "Adult Male",
    label: "Adult Male — Sedentary (Ref Man 65 kg)",
    kcal: 2110,
    protein: 54.0, // 0.83 g/kg
    fat: 25.0,     // visible fat
    carbs: 290,    // ~55% of energy
    calcium: 1000, // mg
    iron: 19.0,    // mg
    vitC: 80.0,    // mg
    cu: 1.0,
  },
  man_moderate: {
    id: "man_moderate",
    category: "Adult Male",
    label: "Adult Male — Moderate Work",
    kcal: 2710,
    protein: 54.0,
    fat: 30.0,
    carbs: 370,
    calcium: 1000,
    iron: 19.0,
    vitC: 80.0,
    cu: 1.2,
  },
  man_heavy: {
    id: "man_heavy",
    category: "Adult Male",
    label: "Adult Male — Heavy Work",
    kcal: 3470,
    protein: 54.0,
    fat: 40.0,
    carbs: 475,
    calcium: 1000,
    iron: 19.0,
    vitC: 80.0,
    cu: 1.6,
  },

  // Adult Females
  woman_sedentary: {
    id: "woman_sedentary",
    category: "Adult Female",
    label: "Adult Female — Sedentary (Ref Woman 55 kg)",
    kcal: 1660,
    protein: 46.0, // 0.83 g/kg
    fat: 20.0,
    carbs: 230,
    calcium: 1000,
    iron: 29.0,
    vitC: 65.0,
    cu: 0.8,
  },
  woman_moderate: {
    id: "woman_moderate",
    category: "Adult Female",
    label: "Adult Female — Moderate Work",
    kcal: 2130,
    protein: 46.0,
    fat: 25.0,
    carbs: 290,
    calcium: 1000,
    iron: 29.0,
    vitC: 65.0,
    cu: 0.9,
  },
  woman_heavy: {
    id: "woman_heavy",
    category: "Adult Female",
    label: "Adult Female — Heavy Work",
    kcal: 2720,
    protein: 46.0,
    fat: 30.0,
    carbs: 370,
    calcium: 1000,
    iron: 29.0,
    vitC: 65.0,
    cu: 1.2,
  },

  // Pregnancy (ICMR 2020: +350 kcal/day in 2nd & 3rd trimester)
  preg_2nd_sedentary: {
    id: "preg_2nd_sedentary",
    category: "Pregnancy",
    label: "Pregnant Woman — 2nd Trimester (Sedentary, +350 kcal, +9.5g Pro)",
    kcal: 2010, // 1660 + 350
    protein: 55.5, // 46 + 9.5
    fat: 30.0,
    carbs: 275,
    calcium: 1000,
    iron: 40.0, // 40 mg/d
    vitC: 80.0,
    cu: 1.0,
  },
  preg_2nd_moderate: {
    id: "preg_2nd_moderate",
    category: "Pregnancy",
    label: "Pregnant Woman — 2nd Trimester (Moderate, +350 kcal, +9.5g Pro)",
    kcal: 2480, // 2130 + 350
    protein: 55.5,
    fat: 35.0,
    carbs: 340,
    calcium: 1000,
    iron: 40.0,
    vitC: 80.0,
    cu: 1.1,
  },
  preg_3rd_sedentary: {
    id: "preg_3rd_sedentary",
    category: "Pregnancy",
    label: "Pregnant Woman — 3rd Trimester (Sedentary, +350 kcal, +22.0g Pro)",
    kcal: 2010,
    protein: 68.0, // 46 + 22.0
    fat: 30.0,
    carbs: 275,
    calcium: 1000,
    iron: 40.0,
    vitC: 80.0,
    cu: 1.0,
  },
  preg_3rd_moderate: {
    id: "preg_3rd_moderate",
    category: "Pregnancy",
    label: "Pregnant Woman — 3rd Trimester (Moderate, +350 kcal, +22.0g Pro)",
    kcal: 2480,
    protein: 68.0,
    fat: 35.0,
    carbs: 340,
    calcium: 1000,
    iron: 40.0,
    vitC: 80.0,
    cu: 1.1,
  },

  // Lactation (ICMR 2020: 0-6m +600 kcal, +17g Pro; 7-12m +520 kcal, +13g Pro)
  lact_0_6m: {
    id: "lact_0_6m",
    category: "Lactation",
    label: "Lactating Mother — 0 to 6 Months (+600 kcal, +17g Pro)",
    kcal: 2260, // 1660 + 600
    protein: 63.0, // 46 + 17
    fat: 30.0,
    carbs: 310,
    calcium: 1200,
    iron: 23.0,
    vitC: 115.0,
    cu: 1.1,
  },
  lact_7_12m: {
    id: "lact_7_12m",
    category: "Lactation",
    label: "Lactating Mother — 7 to 12 Months (+520 kcal, +13g Pro)",
    kcal: 2180, // 1660 + 520
    protein: 59.0, // 46 + 13
    fat: 30.0,
    carbs: 300,
    calcium: 1200,
    iron: 23.0,
    vitC: 115.0,
    cu: 1.0,
  },

  // Infants (0-12 months)
  infant_0_6m: {
    id: "infant_0_6m",
    category: "Infants & Children",
    label: "Infant — 0 to 6 Months (Breastmilk Reference)",
    kcal: 530,
    protein: 8.0,
    fat: 20.0,
    carbs: 65,
    calcium: 300,
    iron: 0.4,
    vitC: 25.0,
    cu: 0.0,
  },
  infant_6_12m: {
    id: "infant_6_12m",
    category: "Infants & Children",
    label: "Infant — 6 to 12 Months (Complementary Feeding)",
    kcal: 660,
    protein: 10.5,
    fat: 22.0,
    carbs: 80,
    calcium: 300,
    iron: 3.0,
    vitC: 30.0,
    cu: 0.2,
  },

  // Children
  child_1_3y: {
    id: "child_1_3y",
    category: "Infants & Children",
    label: "Child — 1 to 3 Years (Toddler)",
    kcal: 1110,
    protein: 12.5,
    fat: 25.0,
    carbs: 155,
    calcium: 500,
    iron: 8.0,
    vitC: 30.0,
    cu: 0.4,
  },
  child_4_6y: {
    id: "child_4_6y",
    category: "Infants & Children",
    label: "Child — 4 to 6 Years (Preschool)",
    kcal: 1360,
    protein: 16.0,
    fat: 25.0,
    carbs: 190,
    calcium: 550,
    iron: 11.0,
    vitC: 35.0,
    cu: 0.6,
  },
  child_7_9y: {
    id: "child_7_9y",
    category: "Infants & Children",
    label: "Child — 7 to 9 Years (School Age)",
    kcal: 1700,
    protein: 23.0,
    fat: 30.0,
    carbs: 235,
    calcium: 650,
    iron: 15.0,
    vitC: 45.0,
    cu: 0.7,
  },

  // Adolescents
  adol_boys_10_12: {
    id: "adol_boys_10_12",
    category: "Adolescents",
    label: "Adolescent Boy — 10 to 12 Years",
    kcal: 2220,
    protein: 32.0,
    fat: 35.0,
    carbs: 300,
    calcium: 850,
    iron: 16.0,
    vitC: 55.0,
    cu: 0.8,
  },
  adol_girls_10_12: {
    id: "adol_girls_10_12",
    category: "Adolescents",
    label: "Adolescent Girl — 10 to 12 Years",
    kcal: 2060,
    protein: 33.0,
    fat: 35.0,
    carbs: 280,
    calcium: 850,
    iron: 28.0,
    vitC: 55.0,
    cu: 0.8,
  },
  adol_boys_13_15: {
    id: "adol_boys_13_15",
    category: "Adolescents",
    label: "Adolescent Boy — 13 to 15 Years",
    kcal: 2860,
    protein: 45.0,
    fat: 45.0,
    carbs: 390,
    calcium: 1000,
    iron: 22.0,
    vitC: 70.0,
    cu: 1.0,
  },
  adol_girls_13_15: {
    id: "adol_girls_13_15",
    category: "Adolescents",
    label: "Adolescent Girl — 13 to 15 Years",
    kcal: 2400,
    protein: 43.0,
    fat: 40.0,
    carbs: 330,
    calcium: 1000,
    iron: 30.0,
    vitC: 70.0,
    cu: 0.8,
  },
  adol_boys_16_18: {
    id: "adol_boys_16_18",
    category: "Adolescents",
    label: "Adolescent Boy — 16 to 18 Years",
    kcal: 3320,
    protein: 55.0,
    fat: 50.0,
    carbs: 450,
    calcium: 1050,
    iron: 26.0,
    vitC: 85.0,
    cu: 1.2,
  },
  adol_girls_16_18: {
    id: "adol_girls_16_18",
    category: "Adolescents",
    label: "Adolescent Girl — 16 to 18 Years",
    kcal: 2500,
    protein: 46.0,
    fat: 35.0,
    carbs: 345,
    calcium: 1050,
    iron: 32.0,
    vitC: 85.0,
    cu: 0.9,
  },

  // Elderly
  elderly_man: {
    id: "elderly_man",
    category: "Elderly (>60 yrs)",
    label: "Elderly Male (>60 Years, Sedentary)",
    kcal: 1700,
    protein: 54.0,
    fat: 25.0,
    carbs: 235,
    calcium: 1000,
    iron: 19.0,
    vitC: 80.0,
    cu: 0.8,
  },
  elderly_woman: {
    id: "elderly_woman",
    category: "Elderly (>60 yrs)",
    label: "Elderly Female (>60 Years, Sedentary)",
    kcal: 1480,
    protein: 46.0,
    fat: 20.0,
    carbs: 205,
    calcium: 1000,
    iron: 29.0,
    vitC: 65.0,
    cu: 0.7,
  },
};

// Meal time definitions for 24-hour dietary recall
export const MEAL_SLOTS = [
  { id: "early_morning", title: "Early Morning / Bed Tea", icon: "weather-sunset", tip: "Tea, biscuits, soaked nuts, warm water" },
  { id: "breakfast", title: "Breakfast", icon: "egg", tip: "Rotis, paratha, idli, poha, eggs, milk" },
  { id: "mid_morning", title: "Mid-Morning Snack", icon: "fruit-cherries", tip: "Seasonal fruit, roasted chana, buttermilk" },
  { id: "lunch", title: "Lunch", icon: "food-drumstick", tip: "Cereals (rice/roti), dal/pulses, sabzi, curd, salad" },
  { id: "evening_snack", title: "Evening Tea & Snacks", icon: "coffee", tip: "Tea, roasted snacks, samosa, biscuits" },
  { id: "dinner", title: "Dinner", icon: "silverware-fork-knife", tip: "Roti, rice, khichdi, dal, cooked vegetables" },
  { id: "bedtime", title: "Bedtime", icon: "cup", tip: "Milk, turmeric milk, light snack" },
];

// Adult Consumption Unit (CU / ACU) coefficient options for family roster
export const CU_COEFFICIENT_OPTIONS = [
  { label: "Adult Male — Sedentary (1.0 CU)", cu: 1.0 },
  { label: "Adult Male — Moderate (1.2 CU)", cu: 1.2 },
  { label: "Adult Male — Heavy (1.6 CU)", cu: 1.6 },
  { label: "Adult Female — Sedentary (0.8 CU)", cu: 0.8 },
  { label: "Adult Female — Moderate (0.9 CU)", cu: 0.9 },
  { label: "Adult Female — Heavy (1.2 CU)", cu: 1.2 },
  { label: "Adolescent Boy 16-18y (1.2 CU)", cu: 1.2 },
  { label: "Adolescent Girl 16-18y (0.9 CU)", cu: 0.9 },
  { label: "Adolescent Boy 13-15y (1.0 CU)", cu: 1.0 },
  { label: "Adolescent Girl 13-15y (0.8 CU)", cu: 0.8 },
  { label: "Adolescent 10-12y Boy/Girl (0.8 CU)", cu: 0.8 },
  { label: "Child 7-9y (0.7 CU)", cu: 0.7 },
  { label: "Child 4-6y (0.6 CU)", cu: 0.6 },
  { label: "Child 1-3y (0.4 CU)", cu: 0.4 },
  { label: "Infant <1y (0.0 CU - Non-sharing)", cu: 0.0 },
];

/**
 * Calculates AMDR (Acceptable Macronutrient Distribution Range) percentages:
 * Carbs % = (Carb grams * 4) / Total Kcal * 100
 * Protein % = (Protein grams * 4) / Total Kcal * 100
 * Fat % = (Fat grams * 9) / Total Kcal * 100
 */
export const calculateAMDR = (carbsG, proteinG, fatG, totalKcal) => {
  if (!totalKcal || totalKcal <= 0) {
    return { carbPct: 0, proteinPct: 0, fatPct: 0 };
  }
  const carbKcal = (carbsG || 0) * 4;
  const proteinKcal = (proteinG || 0) * 4;
  const fatKcal = (fatG || 0) * 9;
  const sumKcal = carbKcal + proteinKcal + fatKcal || totalKcal;

  return {
    carbPct: Math.round((carbKcal / sumKcal) * 100),
    proteinPct: Math.round((proteinKcal / sumKcal) * 100),
    fatPct: Math.round((fatKcal / sumKcal) * 100),
  };
};

/**
 * Calculates Cereal to Pulse Ratio (Raw weight ratio)
 * Standard recommendation: 3:1 to 4:1
 */
export const calculateCerealPulseRatio = (cerealGrams, pulseGrams) => {
  if (!pulseGrams || pulseGrams <= 0) {
    if (!cerealGrams || cerealGrams <= 0) return { ratioNum: 0, ratio: "N/A", text: "No cereals/pulses recorded", isBalanced: false };
    return { ratioNum: 99, ratio: ">15:1", text: "Extreme Cereal Dominance (Zero pulse intake)", isBalanced: false };
  }
  const ratioStr = (cerealGrams / pulseGrams).toFixed(1);
  const ratioNum = parseFloat(ratioStr);
  const isBalanced = ratioNum >= 2.5 && ratioNum <= 4.5;
  return {
    ratioNum,
    ratio: `${ratioStr} : 1`,
    text: isBalanced
      ? "Ideal Cereal-to-Pulse Balance (3:1 to 4:1)"
      : ratioNum > 4.5
      ? `High Cereal Dominance (${ratioStr}:1 vs ideal 3-4:1)`
      : `High Pulse Proportion (${ratioStr}:1)`,
    isBalanced,
  };
};

/**
 * Generates an authoritative clinical impression for MD PSM examination viva
 */
export const generateClinicalImpression = (result, profile) => {
  if (!result || !profile) return "";

  const kcalDef = parseFloat(result.kcalDiff);
  const proDef = parseFloat(result.proteinDiff);
  const feDef = parseFloat(result.ironDiff);
  const caDef = parseFloat(result.calciumDiff);

  const parts = [];

  // Energy & Protein assessment
  if (kcalDef < -20 && proDef < -20) {
    parts.push(`Severe calorie (${Math.abs(kcalDef)}% deficit) and protein (${Math.abs(proDef)}% deficit) undernutrition`);
  } else if (kcalDef < -10 && proDef < -10) {
    parts.push(`Moderate calorie-protein deficit (Energy ${kcalDef}%, Protein ${proDef}%)`);
  } else if (kcalDef < -10 && proDef >= -10) {
    parts.push(`Calorie-deficient (${Math.abs(kcalDef)}% deficit) but protein-adequate diet`);
  } else if (kcalDef >= -10 && proDef < -10) {
    parts.push(`Calorie-adequate but protein-deficient (${Math.abs(proDef)}% deficit) diet`);
  } else if (kcalDef > 20) {
    parts.push(`Hyper-caloric diet (${kcalDef}% surplus) with risk of overweight/metabolic derangement`);
  } else {
    parts.push("Calorie and protein intake are broadly adequate relative to ICMR-NIN 2020 recommendations");
  }

  // Micronutrient assessment
  const microDeficits = [];
  if (feDef < -25) microDeficits.push(`Iron (${Math.abs(feDef)}% deficit)`);
  if (caDef < -25) microDeficits.push(`Calcium (${Math.abs(caDef)}% deficit)`);
  if (result.vitCDiff && parseFloat(result.vitCDiff) < -30) microDeficits.push(`Vitamin C (${Math.abs(parseFloat(result.vitCDiff))}% deficit)`);

  if (microDeficits.length > 0) {
    parts.push(`Significant micronutrient shortfalls observed in: ${microDeficits.join(", ")}`);
  }

  // Energy distribution
  if (result.amdr) {
    if (result.amdr.carbPct > 65) {
      parts.push(`Diet is heavily carbohydrate-loaded (${result.amdr.carbPct}% of total energy vs recommended 50–60%)`);
    } else if (result.amdr.fatPct > 35) {
      parts.push(`Excessive dietary fat proportion (${result.amdr.fatPct}% of energy vs recommended 20–30%)`);
    }
  }

  // Cereal to pulse ratio
  if (result.cpRatio && result.cpRatio.ratioNum > 5) {
    parts.push(`Skewed cereal-to-pulse ratio (${result.cpRatio.ratio}), compromising amino acid mutual supplementation (Lysine shortfall)`);
  }

  return parts.join(". ") + ".";
};

/**
 * Generates low-cost, practical, culturally acceptable dietary counseling
 * for viva examination questions.
 */
export const generateDietaryCounseling = (result, profile) => {
  if (!result || !profile) return [];

  const tips = [];
  const kcalGap = Math.round(profile.kcal - result.kcal);
  const proGap = (profile.protein - result.protein).toFixed(1);
  const feGap = (profile.iron - result.iron).toFixed(1);
  const caGap = (profile.calcium - result.calcium).toFixed(1);

  if (kcalGap > 150 || parseFloat(proGap) > 5) {
    tips.push({
      title: "Cost-Effective Calorie & Protein Boosting",
      icon: "food-apple",
      description: `Bridging the ${Math.max(kcalGap, 0)} kcal & ${Math.max(parseFloat(proGap), 0)}g protein deficit on a modest budget:`,
      bullets: [
        "Add 30g Roasted Bengal Gram / Sattu (+110 kcal, +6.8g protein; approx. ₹3–5/day).",
        "Add 30g Roasted Groundnuts (+170 kcal, +7.5g protein; approx. ₹4–6/day).",
        "Include 1 whole boiled egg daily (+85 kcal, +6.5g HBV protein; approx. ₹6–7/day).",
        "Substitute plain rice with mixed grain / pulse khichdi or add 25g defatted soya chunks (+13g protein).",
      ],
    });
  }

  if (parseFloat(feGap) > 5) {
    tips.push({
      title: "Iron Deficit Correction & Bioavailability",
      icon: "pill",
      description: `Targeting the ${parseFloat(feGap)} mg iron shortfall:`,
      bullets: [
        "Promote local Green Leafy Veg (GLVs): Drumstick leaves (Moringa), Methi, or Amaranth cooked in iron kadai.",
        "Add 15-20g Jaggery (Gur) instead of white refined sugar.",
        "Crucial timing: Avoid drinking tea or coffee within 1 hour of meals to prevent polyphenol/tannin chelation of non-heme iron.",
        "Combine plant iron with Vitamin C: Squeeze fresh lemon over dal or consume seasonal amla / guava to enhance ferric-to-ferrous conversion.",
      ],
    });
  }

  if (parseFloat(caGap) > 150) {
    tips.push({
      title: "Calcium Gap Management",
      icon: "bottle-tonic-plus",
      description: `Addressing the ${Math.round(parseFloat(caGap))} mg calcium deficit:`,
      bullets: [
        "Incorporate Ragi (Finger Millet) in rotis or porridge (Ragi provides ~344 mg Ca/100g, 7x higher than wheat).",
        "Add 10g Sesame seeds (Til) to rotis or laddoos (145 mg Ca per 10g).",
        "Ensure at least 150-200 ml curd / buttermilk (chach) daily (provides ~200 mg bioavailable calcium).",
      ],
    });
  }

  tips.push({
    title: "Food Processing & Household Enhancements",
    icon: "sprout",
    description: "Traditional no-cost nutritional enhancement techniques:",
    bullets: [
      "Germination / Sprouting of whole moong/chana: Increases Vitamin C 5-10 fold and halves phytate content to unlock iron/zinc absorption.",
      "Fermentation (Idli/Dosa/Dhokla): Enhances B-complex synthesis and improves digestive protein bioavailability.",
      "Cereal-Pulse Mutual Supplementation: Maintain a 3:1 to 4:1 cereal-to-pulse ratio to balance lysine and methionine essential amino acids.",
    ],
  });

  return tips;
};

/**
 * Formats a clean text summary ready to be copied into an MD PSM practical case sheet
 */
export const generateCaseSheetSummary = (surveyData) => {
  const { profile, result, mealRows, familyData, mode } = surveyData;

  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (mode === "family") {
    const { members, rations, totalCU, perCU } = familyData;
    return `===========================================================
      FAMILY DIETARY SURVEY SUMMARY (FHAS / CLINICO-SOCIAL)
===========================================================
Date: ${dateStr}
Reference Standard: ICMR-NIN 2020 Adult Consumption Unit (CU)
Total Family Members: ${members.length}
Total Family Consumption Units (ACU/CU): ${totalCU.toFixed(2)} CU
-----------------------------------------------------------
DAILY FAMILY RATION CONSUMPTION:
• Cereals (Wheat/Rice) : ${rations.cerealsKg ? rations.cerealsKg + " kg" : "0 kg"}
• Pulses & Legumes     : ${rations.pulsesKg ? rations.pulsesKg + " kg" : "0 kg"}
• Cooking Oil / Ghee   : ${rations.oilKg ? rations.oilKg + " kg/L" : "0 kg"}
• Milk & Dairy         : ${rations.milkL ? rations.milkL + " L" : "0 L"}
• Sugar / Jaggery      : ${rations.sugarKg ? rations.sugarKg + " kg" : "0 kg"}
• Vegetables           : ${rations.vegKg ? rations.vegKg + " kg" : "0 kg"}
-----------------------------------------------------------
INTAKE PER CONSUMPTION UNIT (CU) vs REFERENCE ADULT MALE:
• Daily Calories / CU  : ${perCU.kcal.toFixed(0)} kcal (Ref: 2,110 kcal) [Diff: ${perCU.kcalDiff > 0 ? "+" : ""}${perCU.kcalDiff}%]
• Daily Protein / CU   : ${perCU.protein.toFixed(1)} g (Ref: 54.0 g) [Diff: ${perCU.proteinDiff > 0 ? "+" : ""}${perCU.proteinDiff}%]
• Per Capita Calories  : ${perCU.perCapitaKcal.toFixed(0)} kcal/person/day
• Per Capita Protein   : ${perCU.perCapitaProtein.toFixed(1)} g/person/day
-----------------------------------------------------------
DIETARY IMPRESSION:
${perCU.kcalDiff < -10 ? "Family ration exhibits a calorie deficit per adult consumption unit." : "Family ration meets daily reference energy allowances per consumption unit."}
===========================================================`;
  }

  // Individual 24-Hr Recall Summary
  let mealText = "";
  if (mealRows && mealRows.length > 0) {
    mealText = mealRows
      .filter((r) => r.food && r.grams > 0)
      .map((r) => `  • [${r.mealLabel}] ${r.food.name} (${r.portionLabel} x ${r.quantity}): ${r.grams}g raw -> ${r.kcal.toFixed(0)} kcal, ${r.protein.toFixed(1)}g P`)
      .join("\n");
  }

  return `===========================================================
      24-HOUR DIETARY RECALL SUMMARY (MD PSM CLINICAL CASE)
===========================================================
Date: ${dateStr}
Subject Profile: ${profile.label}
Reference Standard: ICMR-NIN 2020 RDA / EAR
-----------------------------------------------------------
24-HOUR RECALL INVENTORY:
${mealText || "  No items recorded"}
-----------------------------------------------------------
NUTRIENT INTAKE vs ICMR-NIN 2020 REFERENCE:
• Energy (kcal)     : ${result.kcal.toFixed(0)} / ${profile.kcal} kcal (${result.kcalDiff > 0 ? "+" : ""}${result.kcalDiff}%) [${result.kcalDiff >= 0 ? "Surplus" : "Deficit"}]
• Protein (g)       : ${result.protein.toFixed(1)} / ${profile.protein} g (${result.proteinDiff > 0 ? "+" : ""}${result.proteinDiff}%) [${result.proteinDiff >= 0 ? "Adequate" : "Deficit"}]
• Fat (g)           : ${result.fat.toFixed(1)} / ${profile.fat} g (${result.fatDiff > 0 ? "+" : ""}${result.fatDiff}%)
• Calcium (mg)      : ${result.calcium.toFixed(0)} / ${profile.calcium} mg (${result.calciumDiff > 0 ? "+" : ""}${result.calciumDiff}%)
• Iron (mg)         : ${result.iron.toFixed(1)} / ${profile.iron} mg (${result.ironDiff > 0 ? "+" : ""}${result.ironDiff}%)
• Vitamin C (mg)    : ${result.vitC.toFixed(1)} / ${profile.vitC} mg (${result.vitCDiff > 0 ? "+" : ""}${result.vitCDiff}%)
-----------------------------------------------------------
MACRONUTRIENT ENERGY DISTRIBUTION (AMDR):
• Carbohydrates     : ${result.amdr?.carbPct || 0}% of kcal (Target: 50–60%)
• Proteins          : ${result.amdr?.proteinPct || 0}% of kcal (Target: 10–15%)
• Total Fats        : ${result.amdr?.fatPct || 0}% of kcal (Target: 20–30%)
• Cereal-to-Pulse   : ${result.cpRatio?.ratio || "N/A"} (Ideal: 3:1 to 4:1)
-----------------------------------------------------------
CLINICAL IMPRESSION:
${generateClinicalImpression(result, profile)}
===========================================================`;
};
