import {
  bmiFromCmKg,
  interpretMuac,
  calculateIbw,
  brocaIbwKg,
  bmi22IbwKg,
} from "../anthropometry";

describe("anthropometry", () => {
  it("uses Asian-Indian BMI cut-offs", () => {
    const result = bmiFromCmKg(160, 61.4);
    expect(result.error).toBeUndefined();
    expect(result.bmi).toBeCloseTo(24.0, 1);
    expect(result.category).toBe("Overweight");
  });

  it("keeps child SMART bands and adult 23 cm CED", () => {
    expect(interpretMuac(11.2, "child").band).toBe("RED");
    expect(interpretMuac(19.5, "adult").label).toMatch(/Moderate/);
    expect(interpretMuac(22.5, "pregnant").label).toMatch(/Undernourished/);
    expect(interpretMuac(24, "pregnant").label).toMatch(/Above/);
  });

  it("defaults Broca independently of BMI weight", () => {
    expect(brocaIbwKg(170, "male")).toBe(70);
    expect(brocaIbwKg(160, "female")).toBe(55);
    const broca = calculateIbw({ heightCm: 170, sex: "male", method: "broca" });
    expect(broca.ibw).toBe(70);
    const bmi22 = calculateIbw({ heightCm: 170, sex: "male", method: "bmi22" });
    expect(bmi22.ibw).toBeCloseTo(bmi22IbwKg(170), 5);
    const devine = calculateIbw({
      heightCm: 170,
      sex: "male",
      method: "devine",
      actualKg: 90,
    });
    expect(devine.abwNote).toMatch(/Adjusted BW/);
    const noShare = calculateIbw({ heightCm: 170, sex: "male", method: "broca", actualKg: 90 });
    expect(noShare.abwNote).toBeNull();
  });
});
