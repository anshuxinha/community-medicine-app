import { analyzeTwoByTwo, chiSquare2x2 } from "../epiTwoByTwo";

describe("2x2 epidemiology", () => {
  it("matches the vaccinated-disease preset without Yates", () => {
    const result = analyzeTwoByTwo(10, 90, 40, 60, { yates: false });
    expect(result.error).toBeUndefined();
    expect(Number(result.chi2)).toBeCloseTo(24.0, 1);
    expect(result.significant).toBe(true);
    expect(result.or).toBeCloseTo((10 * 60) / (90 * 40), 5);
    expect(result.rr).toBeCloseTo(0.25, 5);
    expect(result.sensitivity).toBeCloseTo(10 / 50, 5);
    expect(result.specificity).toBeCloseTo(60 / 150, 5);
    expect(result.yates).toBe(false);
  });

  it("applies Yates only when requested", () => {
    const raw = chiSquare2x2(10, 90, 40, 60, { yates: false });
    const yates = chiSquare2x2(10, 90, 40, 60, { yates: true });
    expect(yates.chi2).toBeLessThan(raw.chi2);
    expect(yates.yates).toBe(true);
  });
});
