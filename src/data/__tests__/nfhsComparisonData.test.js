import {
  NFHS_COMPARISON_INDICATORS,
  getAreaValue,
} from "../nfhsComparisonData";

describe("NFHS 5 vs 6 pairing", () => {
  const byId = Object.fromEntries(NFHS_COMPARISON_INDICATORS.map((row) => [row.id, row]));

  it("pairs rural NFHS-5 with rural NFHS-6 for institutional births", () => {
    const row = byId.institutionalBirths;
    expect(getAreaValue(row.nfhs5, "rural")).toBe(86.7);
    expect(getAreaValue(row.nfhs6, "rural")).toBe(89.0);
    expect(getAreaValue(row.nfhs5, "rural")).not.toBe(getAreaValue(row.nfhs5, "total"));
  });

  it("does not invent NFHS-5 rural for 180-day IFA", () => {
    expect(getAreaValue(byId.ifa180.nfhs5, "rural")).toBeNull();
    expect(getAreaValue(byId.ifa180.nfhs5, "total")).toBe(26.0);
  });

  it("keeps fact-sheet totals as numbers inside the area object", () => {
    expect(getAreaValue(byId.under15.nfhs5, "total")).toBe(26.5);
    expect(getAreaValue(byId.womenAnaemia.nfhs6, "total")).toBeNull();
  });
});
