import {
  DEFAULT_CPI_IW,
  calculateKuppuswamy,
  calculateBGPrasad,
  incomeScoreKuppuswamy,
} from "../sesCalculator";

describe("SES calculator", () => {
  it("defaults CPI-IW to July 2026 All-India 153.2", () => {
    expect(DEFAULT_CPI_IW).toBe(153.2);
  });

  it("scores Kuppuswamy Class I at the scaled floor", () => {
    const floor = 51646 * (153.2 / 100);
    const result = calculateKuppuswamy({
      education: 7,
      occupation: 10,
      familyIncome: floor,
      cpi: 153.2,
    });
    expect(result.error).toBeUndefined();
    expect(result.incomeScore).toBe(12);
    expect(result.score).toBe(29);
    expect(result.class).toBe("Upper (Class I)");
    expect(result.slabs).toHaveLength(7);
  });

  it("uses a lower income score below the Class I floor", () => {
    expect(incomeScoreKuppuswamy(1000, 153.2)).toBe(1);
  });

  it("rejects a blank income field", () => {
    expect(calculateKuppuswamy({ education: 7, occupation: 10, familyIncome: "", cpi: 153.2 }).error).toBeTruthy();
  });

  it("classifies BG Prasad using the 1961 linking factor", () => {
    const high = calculateBGPrasad({ perCapitaIncome: 50000, cpi: 153.2 });
    expect(high.class).toBe("Upper (Class I)");
    const low = calculateBGPrasad({ perCapitaIncome: 1, cpi: 153.2 });
    expect(low.class).toBe("Lower (Class V)");
    expect(low.slabs).toHaveLength(5);
  });
});
