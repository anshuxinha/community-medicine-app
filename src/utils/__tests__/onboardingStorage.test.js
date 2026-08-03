import { resolveOnboardingCompleted } from "../onboardingStorage";

describe("resolveOnboardingCompleted", () => {
  it("returns true when cloud or local is true", () => {
    expect(resolveOnboardingCompleted(true, false)).toBe(true);
    expect(resolveOnboardingCompleted(false, true)).toBe(true);
    expect(resolveOnboardingCompleted(true, true)).toBe(true);
  });

  it("returns false only when both incomplete", () => {
    expect(resolveOnboardingCompleted(false, false)).toBe(false);
    expect(resolveOnboardingCompleted(undefined, false)).toBe(false);
  });
});
