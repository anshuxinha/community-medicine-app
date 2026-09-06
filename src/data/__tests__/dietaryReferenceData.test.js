import {
  REFERENCE_PROFILES,
  CU_COEFFICIENT_OPTIONS,
  calculateAMDR,
  calculateCerealPulseRatio,
  calculateIndividualIntake,
  calculateFamilySurvey,
  generateDietaryCounseling,
  generateCaseSheetSummary,
  SAMPLE_FAMILY_MEMBERS,
  SAMPLE_FAMILY_RATIONS,
  SAMPLE_RECALL_ITEMS,
  foodMatchesQuery,
  intakeStatus,
  percentDiff,
  carbGramsFromEer,
  carbAmdrStatus,
  MICRONUTRIENT_DEFS,
} from "../dietaryReferenceData";
import foodData from "../foodData.json";

describe("ICMR-NIN 2020 profiles", () => {
  it("uses 2020 energy, protein EAR/RDA, and pregnancy iron 27 mg", () => {
    expect(REFERENCE_PROFILES.man_sedentary.kcal).toBe(2110);
    expect(REFERENCE_PROFILES.man_sedentary.proteinRda).toBe(54.0);
    expect(REFERENCE_PROFILES.man_sedentary.proteinEar).toBe(42.9);
    expect(REFERENCE_PROFILES.woman_sedentary.kcal).toBe(1660);
    expect(REFERENCE_PROFILES.woman_sedentary.proteinRda).toBe(45.7);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.kcal).toBe(2010);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.proteinRda).toBe(67.7);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.ironRda).toBe(27);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.ironEar).toBe(21);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.folateRda).toBe(570);
    expect(REFERENCE_PROFILES.lact_0_6m.kcal).toBe(2260);
    expect(REFERENCE_PROFILES.lact_0_6m.ironRda).toBe(23);
  });

  it("uses elderly iron 19 mg and calcium RDA 1200 mg", () => {
    expect(REFERENCE_PROFILES.elderly_woman.kcal).toBe(1500);
    expect(REFERENCE_PROFILES.elderly_woman.ironRda).toBe(19);
    expect(REFERENCE_PROFILES.elderly_woman.ironEar).toBe(11);
    expect(REFERENCE_PROFILES.elderly_woman.calciumRda).toBe(1200);
    expect(REFERENCE_PROFILES.elderly_woman.folateRda).toBe(220);
    expect(REFERENCE_PROFILES.elderly_man.kcal).toBe(1700);
    expect(REFERENCE_PROFILES.elderly_man.ironRda).toBe(19);
    expect(REFERENCE_PROFILES.elderly_man.calciumRda).toBe(1200);
  });

  it("sets CU from 2020 energy ratios and lists pregnancy and elderly options", () => {
    expect(REFERENCE_PROFILES.man_moderate.cu).toBe(1.3);
    expect(REFERENCE_PROFILES.woman_moderate.cu).toBe(1.0);
    expect(REFERENCE_PROFILES.woman_heavy.cu).toBe(1.3);
    expect(CU_COEFFICIENT_OPTIONS.some((o) => o.label.includes("Pregnant"))).toBe(true);
    expect(CU_COEFFICIENT_OPTIONS.some((o) => o.label.includes("Lactating"))).toBe(true);
    expect(CU_COEFFICIENT_OPTIONS.some((o) => o.label.includes("Elderly female"))).toBe(true);
    expect(CU_COEFFICIENT_OPTIONS.some((o) => o.cu === 0.5)).toBe(true);
  });
});

describe("IFCT 2017 food table", () => {
  const byId = Object.fromEntries(foodData.map((f) => [f.id, f]));

  it("matches IFCT atta, rice, milk, poha iron, and amla vitamin C", () => {
    expect(byId.wheat_atta.ifctCode).toBe("A019");
    expect(byId.wheat_atta.calories).toBe(320);
    expect(byId.wheat_atta.protein).toBe(10.57);
    expect(byId.wheat_atta.iron).toBe(4.1);
    expect(byId.rice_raw.ifctCode).toBe("A015");
    expect(byId.rice_raw.calories).toBe(356);
    expect(byId.rice_raw.protein).toBe(7.94);
    expect(byId.milk_cow.calories).toBe(73);
    expect(byId.poha.iron).toBe(4.46);
    expect(byId.amla.vitC).toBe(252);
    expect(byId.wheat_atta.zinc).toBe(2.85);
    expect(byId.wheat_atta.thiamine).toBe(0.42);
    expect(byId.onion.category).toBe("Other Vegetables");
  });

  it("treats oil as visible fat at 900 kcal/100 g", () => {
    expect(byId.cooking_oil.visibleFat).toBe(true);
    expect(byId.cooking_oil.calories).toBe(900);
    expect(byId.wheat_atta.visibleFat).toBe(false);
  });

  it("matches household synonyms such as roti, palak, and doodh", () => {
    expect(foodMatchesQuery(byId.wheat_atta, "roti")).toBe(true);
    expect(foodMatchesQuery(byId.wheat_atta, "chapati")).toBe(true);
    expect(foodMatchesQuery(byId.spinach, "palak")).toBe(true);
    expect(foodMatchesQuery(byId.milk_cow, "doodh")).toBe(true);
    expect(foodMatchesQuery(byId.rice_raw, "roti")).toBe(false);
    const rotiHits = foodData.filter((f) => foodMatchesQuery(f, "roti"));
    expect(rotiHits.some((f) => f.id === "wheat_atta")).toBe(true);
  });

  it("treats sabzi as other vegetables, leafy vegetables, and roots", () => {
    const otherVeg = foodData.filter((f) => f.category === "Other Vegetables");
    expect(otherVeg.length).toBeGreaterThan(7);
    otherVeg.forEach((f) => expect(foodMatchesQuery(f, "sabzi")).toBe(true));
    expect(foodMatchesQuery(byId.spinach, "sabzi")).toBe(true);
    expect(foodMatchesQuery(byId.potato, "sabzi")).toBe(true);
    expect(foodMatchesQuery(byId.wheat_atta, "sabzi")).toBe(false);
  });
});

describe("engines", () => {
  it("calculates AMDR from Atwater factors", () => {
    const amdr = calculateAMDR(250, 50, 44.44, 1600);
    expect(amdr.carbPct).toBe(63);
    expect(amdr.proteinPct).toBe(13);
    expect(amdr.fatPct).toBe(25);
  });

  it("calculates cereal to pulse to milk ratio", () => {
    const balanced = calculateCerealPulseRatio(150, 40, 100);
    expect(balanced.isBalanced).toBe(true);
    expect(balanced.triple).toBe("3.8 : 1 : 2.5");
    const skewed = calculateCerealPulseRatio(250, 25);
    expect(skewed.isBalanced).toBe(false);
    expect(skewed.triple).toBe("10.0 : 1 : 0.0");
  });

  it("computes individual intake live and separates visible fat from total fat", () => {
    const result = calculateIndividualIntake(
      SAMPLE_RECALL_ITEMS,
      foodData,
      REFERENCE_PROFILES.preg_3rd_sedentary
    );
    expect(result).not.toBeNull();
    expect(result.visibleFatGrams).toBe(10);
    expect(result.fat).toBeGreaterThan(result.visibleFatGrams);
    expect(result.kcal).toBeGreaterThan(900);
    expect(result.proteinEar).toBe(REFERENCE_PROFILES.preg_3rd_sedentary.proteinEar);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.ironRda).toBe(27);
    expect(result.proteinDiff).toBeCloseTo(
      percentDiff(result.protein, REFERENCE_PROFILES.preg_3rd_sedentary.proteinRda),
      5
    );
    expect(result.ironDiff).toBeCloseTo(
      percentDiff(result.iron, REFERENCE_PROFILES.preg_3rd_sedentary.ironRda),
      5
    );
    const tips = generateDietaryCounseling(result, REFERENCE_PROFILES.preg_3rd_sedentary);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips[0].bullets.length).toBeGreaterThan(0);
    const blob = JSON.stringify(tips);
    expect(blob).not.toMatch(/Gopalan/i);
    expect(blob).not.toMatch(/not the /i);
    expect(blob).toMatch(/RDA/);
    expect(blob).not.toMatch(/below iron EAR/);
    expect(blob).not.toMatch(/\bIFCT\b/);
    expect(blob).not.toMatch(/IFA tablet/i);
    expect(tips[0].bullets[0].text).toMatch(/Energy intake/);
    expect(tips[0].bullets[0].foods).toEqual([]);
    const proteinPoint = tips[0].bullets.find((b) => b.text.startsWith("Protein intake"));
    expect(proteinPoint.foods.some((f) => f.startsWith("Chicken ("))).toBe(true);
    const ironPoint = tips[0].bullets.find((b) => /below iron RDA/i.test(b.text));
    expect(ironPoint.foods.some((f) => f.startsWith("Palak ("))).toBe(true);
    expect(blob).toMatch(/kcal, .* g protein, .* g fat, .* g carb/);
  });

  it("judges nutrient status against RDA and energy against EER", () => {
    const proteinAboveEar = intakeStatus(43, 42.9, 54.0);
    expect(proteinAboveEar.key).toBe("deficit");
    expect(proteinAboveEar.label).toMatch(/RDA/);
    const proteinAtRda = intakeStatus(54, 42.9, 54.0);
    expect(proteinAtRda.key).toBe("adequate");
    const energy = intakeStatus(2110, 2110, null, { isEnergy: true });
    expect(energy.key).toBe("adequate");
    expect(energy.label).toMatch(/EER/);
  });

  it("divides monthly family rations by 30 and errors on zero CU", () => {
    const monthly = calculateFamilySurvey({
      members: SAMPLE_FAMILY_MEMBERS,
      rations: SAMPLE_FAMILY_RATIONS,
      period: "monthly",
    });
    const daily = calculateFamilySurvey({
      members: SAMPLE_FAMILY_MEMBERS,
      rations: SAMPLE_FAMILY_RATIONS,
      period: "daily",
    });
    expect(monthly.error).toBeUndefined();
    expect(monthly.totalCU).toBeCloseTo(3.6, 5);
    expect(daily.dailyKcal / monthly.dailyKcal).toBeCloseTo(30, 5);
    expect(monthly.foodGroups.find((g) => g.key === "cereals").got).toBeCloseTo(
      1000 / 3.6,
      0
    );

    const zero = calculateFamilySurvey({
      members: [{ id: "i", label: "infant", cu: 0 }],
      rations: SAMPLE_FAMILY_RATIONS,
      period: "monthly",
    });
    expect(zero.error).toMatch(/0/);
  });

  it("labels monthly rations as monthly in the case sheet", () => {
    const fam = calculateFamilySurvey({
      members: SAMPLE_FAMILY_MEMBERS,
      rations: SAMPLE_FAMILY_RATIONS,
      period: "monthly",
    });
    const summary = generateCaseSheetSummary({
      mode: "family",
      familyData: {
        members: SAMPLE_FAMILY_MEMBERS,
        rations: SAMPLE_FAMILY_RATIONS,
        period: "monthly",
        result: fam,
      },
    });
    expect(summary).toContain("MONTHLY");
    expect(summary).toContain("My Plate 2024");
    expect(summary).not.toContain("DAILY household purchase");
    expect(summary).not.toMatch(/not the /i);
    expect(summary).toMatch(/vs RDA/);
  });

  it("writes an individual case sheet from IFCT names", () => {
    const result = calculateIndividualIntake(
      [
        {
          id: "1",
          mealId: "lunch",
          foodId: "wheat_atta",
          portionId: "roti_med",
          quantity: "2",
        },
      ],
      foodData,
      REFERENCE_PROFILES.man_sedentary
    );
    const summary = generateCaseSheetSummary({
      mode: "individual",
      profile: REFERENCE_PROFILES.man_sedentary,
      result,
      mealRows: result.calculatedMealRows,
    });
    expect(summary).toContain("IFCT 2017");
    expect(summary).toContain("Wheat flour, atta");
    expect(summary).toContain("Visible fat");
    expect(summary).not.toContain("Total fat (IFCT)");
    expect(summary).not.toMatch(/not the /i);
    expect(summary).toContain("judged against RDA");
    expect(summary).toMatch(/vs RDA/);
    expect(summary).toContain("Carbohydrate");
    expect(summary).toMatch(
      /LUNCH \(\d+ kcal, [\d.]+ g protein, [\d.]+ g carbohydrate, [\d.]+ g fat\)/
    );
    expect(result.mealTotals.lunch.kcal).toBeGreaterThan(0);
    expect(result.mealTotals.lunch.protein).toBeGreaterThan(0);
    expect(result.mealTotals.lunch.carbs).toBeGreaterThan(0);
    expect(summary).not.toContain("IMPRESSION");
    const amdrBlock = summary.split("ACCEPTABLE MACRONUTRIENT DISTRIBUTION RANGE")[1];
    expect(amdrBlock).not.toContain("Cereal : pulse : milk");
  });

  it("totals calories, protein, carbohydrate, and fat for each meal", () => {
    const result = calculateIndividualIntake(
      SAMPLE_RECALL_ITEMS,
      foodData,
      REFERENCE_PROFILES.man_sedentary
    );
    expect(result.mealTotals.breakfast.kcal).toBeGreaterThan(0);
    expect(result.mealTotals.lunch.kcal).toBeGreaterThan(result.mealTotals.breakfast.kcal);
    const breakfastRows = result.calculatedMealRows.filter((r) => r.mealId === "breakfast");
    const kcalSum = breakfastRows.reduce((s, r) => s + r.kcal, 0);
    const proteinSum = breakfastRows.reduce((s, r) => s + r.protein, 0);
    const carbSum = breakfastRows.reduce((s, r) => s + r.carbs, 0);
    const fatSum = breakfastRows.reduce((s, r) => s + r.fat, 0);
    expect(result.mealTotals.breakfast.kcal).toBeCloseTo(kcalSum, 5);
    expect(result.mealTotals.breakfast.protein).toBeCloseTo(proteinSum, 5);
    expect(result.mealTotals.breakfast.carbs).toBeCloseTo(carbSum, 5);
    expect(result.mealTotals.breakfast.fat).toBeCloseTo(fatSum, 5);
    expect(result.mealTotals.bedtime).toBeUndefined();
  });

  it("computes carbohydrate AMDR grams from EER", () => {
    expect(carbGramsFromEer(2110)).toEqual({ at50: 264, at60: 317 });
    expect(carbAmdrStatus(55).key).toBe("adequate");
    expect(carbAmdrStatus(40).key).toBe("severe");
  });

  it("adds vitamin C counseling only when that row is in the table", () => {
    const result = calculateIndividualIntake(
      [
        {
          id: "1",
          mealId: "lunch",
          foodId: "rice_raw",
          portionId: "katori_cooked",
          quantity: "1",
        },
      ],
      foodData,
      REFERENCE_PROFILES.man_sedentary
    );
    const pointText = (tips) => (tips[0]?.bullets || []).map((b) => b.text).join(" ");
    const withoutVitC = generateDietaryCounseling(result, REFERENCE_PROFILES.man_sedentary);
    expect(pointText(withoutVitC)).not.toMatch(/below vitamin C RDA/i);
    const withVitC = generateDietaryCounseling(result, REFERENCE_PROFILES.man_sedentary, {
      extraMicroKeys: ["vitC"],
    });
    expect(pointText(withVitC)).toMatch(/below vitamin C RDA/i);
    const withZinc = generateDietaryCounseling(result, REFERENCE_PROFILES.man_sedentary, {
      selectedMicroKeys: ["iron", "calcium", "folate", "zinc"],
    });
    expect(pointText(withZinc)).toMatch(/below zinc RDA/i);
    expect(MICRONUTRIENT_DEFS.filter((d) => d.defaultVisible).map((d) => d.key)).toEqual([
      "iron",
      "calcium",
      "folate",
    ]);
    expect(MICRONUTRIENT_DEFS.map((d) => d.key)).toEqual([
      "iron",
      "calcium",
      "folate",
      "vitC",
      "zinc",
      "magnesium",
      "vitaminA",
      "thiamine",
      "riboflavin",
      "niacin",
      "vitB6",
      "vitaminD",
    ]);
    expect(REFERENCE_PROFILES.man_sedentary.zincRda).toBe(17);
    expect(REFERENCE_PROFILES.woman_sedentary.vitaminARda).toBe(840);
    expect(REFERENCE_PROFILES.elderly_man.vitaminDRda).toBe(20);
  });

  it("lists food items with portion macros and skips foods on the energy line", () => {
    const profile = REFERENCE_PROFILES.preg_3rd_sedentary;
    const result = calculateIndividualIntake(SAMPLE_RECALL_ITEMS, foodData, profile);
    const tips = generateDietaryCounseling(result, profile);
    const energy = tips[0].bullets[0];
    expect(energy.text).toMatch(/Energy intake is 992 kcal/);
    expect(energy.foods).toEqual([]);
    const protein = tips[0].bullets.find((b) => b.text.startsWith("Protein intake"));
    expect(protein.foods).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Boiled egg \(1 egg: 74 kcal, 6\.7 g protein, 5\.3 g fat, 0\.0 g carb\)$/),
        expect.stringMatching(/^Chicken \(1 piece: 134 kcal, 17\.4 g protein, 7\.2 g fat, 0\.0 g carb\)$/),
      ])
    );
    const iron = tips[0].bullets.find((b) => /below iron RDA/i.test(b.text));
    expect(iron.foods).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Palak \(1 katori: 24 kcal, 2\.1 g protein, 0\.6 g fat, 2\.1 g carb\)$/),
      ])
    );
    const folate = tips[0].bullets.find((b) => /below folate RDA/i.test(b.text));
    expect(folate.text).not.toMatch(/IFA/);
    expect(JSON.stringify(tips)).not.toMatch(/\bIFCT\b/);
  });
});
