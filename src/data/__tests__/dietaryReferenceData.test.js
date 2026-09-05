import {
  REFERENCE_PROFILES,
  calculateAMDR,
  calculateCerealPulseRatio,
  generateClinicalImpression,
  generateDietaryCounseling,
  generateCaseSheetSummary,
} from "../dietaryReferenceData";

describe("dietaryReferenceData", () => {
  it("contains all standard ICMR-NIN 2020 physiological profiles", () => {
    expect(REFERENCE_PROFILES.man_sedentary).toBeDefined();
    expect(REFERENCE_PROFILES.man_sedentary.kcal).toBe(2110);
    expect(REFERENCE_PROFILES.man_sedentary.protein).toBe(54.0);

    expect(REFERENCE_PROFILES.woman_sedentary).toBeDefined();
    expect(REFERENCE_PROFILES.woman_sedentary.kcal).toBe(1660);

    expect(REFERENCE_PROFILES.preg_3rd_sedentary).toBeDefined();
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.kcal).toBe(2010);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.protein).toBe(68.0);
    expect(REFERENCE_PROFILES.preg_3rd_sedentary.iron).toBe(40.0);

    expect(REFERENCE_PROFILES.lact_0_6m).toBeDefined();
    expect(REFERENCE_PROFILES.lact_0_6m.kcal).toBe(2260);
    expect(REFERENCE_PROFILES.lact_0_6m.protein).toBe(63.0);
  });

  it("calculates AMDR percentages correctly", () => {
    // 250g carbs = 1000 kcal, 50g protein = 200 kcal, 44.4g fat = 400 kcal -> total 1600 kcal
    // Carbs: 1000/1600 = 62.5% -> 63%
    // Protein: 200/1600 = 12.5% -> 13%
    // Fat: 400/1600 = 25% -> 25%
    const amdr = calculateAMDR(250, 50, 44.44, 1600);
    expect(amdr.carbPct).toBe(63);
    expect(amdr.proteinPct).toBe(13);
    expect(amdr.fatPct).toBe(25);
  });

  it("calculates cereal to pulse ratio accurately", () => {
    const balanced = calculateCerealPulseRatio(150, 40); // 3.8 : 1
    expect(balanced.isBalanced).toBe(true);
    expect(balanced.ratio).toBe("3.8 : 1");

    const skewed = calculateCerealPulseRatio(250, 25); // 10.0 : 1
    expect(skewed.isBalanced).toBe(false);
    expect(skewed.ratio).toBe("10.0 : 1");
  });

  it("generates clinical impression and viva counseling", () => {
    const mockResult = {
      kcal: 1500,
      protein: 40,
      fat: 20,
      calcium: 500,
      iron: 15,
      vitC: 30,
      kcalDiff: "-25.4",
      proteinDiff: "-41.2",
      fatDiff: "-33.3",
      calciumDiff: "-50.0",
      ironDiff: "-62.5",
      vitCDiff: "-62.5",
      amdr: { carbPct: 70, proteinPct: 10, fatPct: 20 },
      cpRatio: { ratioNum: 8.0, ratio: "8.0 : 1", isBalanced: false },
    };

    const impression = generateClinicalImpression(
      mockResult,
      REFERENCE_PROFILES.preg_3rd_sedentary
    );
    expect(impression).toContain("Severe calorie");
    expect(impression).toContain("Iron");

    const tips = generateDietaryCounseling(
      mockResult,
      REFERENCE_PROFILES.preg_3rd_sedentary
    );
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.some((t) => t.title.includes("Protein"))).toBe(true);
  });

  it("generates a formatted case sheet summary", () => {
    const summary = generateCaseSheetSummary({
      mode: "individual",
      profile: REFERENCE_PROFILES.man_sedentary,
      result: {
        kcal: 2000,
        protein: 50,
        fat: 25,
        calcium: 900,
        iron: 18,
        vitC: 75,
        kcalDiff: "-5.2",
        proteinDiff: "-7.4",
        fatDiff: "0.0",
        calciumDiff: "-10.0",
        ironDiff: "-5.3",
        vitCDiff: "-6.3",
        amdr: { carbPct: 58, proteinPct: 12, fatPct: 30 },
        cpRatio: { ratio: "3.5 : 1" },
      },
      mealRows: [
        {
          mealLabel: "Lunch",
          food: { name: "Atta Roti" },
          portionLabel: "Medium Roti",
          quantity: "2",
          grams: 50,
          kcal: 170,
          protein: 6,
        },
      ],
    });

    expect(summary).toContain("24-HOUR DIETARY RECALL SUMMARY");
    expect(summary).toContain("Atta Roti");
    expect(summary).toContain("ICMR-NIN 2020");
  });
});
