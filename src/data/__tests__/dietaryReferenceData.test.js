import {
  REFERENCE_PROFILES,
  CU_COEFFICIENT_OPTIONS,
  calculateAMDR,
  calculateCerealPulseRatio,
  calculateIndividualIntake,
  calculateFamilySurvey,
  generateClinicalImpression,
  generateDietaryCounseling,
  generateCaseSheetSummary,
  SAMPLE_FAMILY_MEMBERS,
  SAMPLE_FAMILY_RATIONS,
  SAMPLE_RECALL_ITEMS,
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
    expect(byId.onion.category).toBe("Other Vegetables");
  });

  it("treats oil as visible fat at 900 kcal/100 g", () => {
    expect(byId.cooking_oil.visibleFat).toBe(true);
    expect(byId.cooking_oil.calories).toBe(900);
    expect(byId.wheat_atta.visibleFat).toBe(false);
  });
});

describe("engines", () => {
  it("calculates AMDR from Atwater factors", () => {
    const amdr = calculateAMDR(250, 50, 44.44, 1600);
    expect(amdr.carbPct).toBe(63);
    expect(amdr.proteinPct).toBe(13);
    expect(amdr.fatPct).toBe(25);
  });

  it("calculates cereal to pulse ratio", () => {
    const balanced = calculateCerealPulseRatio(150, 40, 100);
    expect(balanced.isBalanced).toBe(true);
    const skewed = calculateCerealPulseRatio(250, 25);
    expect(skewed.isBalanced).toBe(false);
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
    const impression = generateClinicalImpression(
      result,
      REFERENCE_PROFILES.preg_3rd_sedentary
    );
    expect(impression.length).toBeGreaterThan(20);
    const tips = generateDietaryCounseling(result, REFERENCE_PROFILES.preg_3rd_sedentary);
    expect(tips.length).toBeGreaterThan(0);
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
    expect(summary).toContain("ICMR-NIN 2020");
    expect(summary).not.toContain("DAILY household purchase");
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
  });
});
