import {
  getDefaultResidentMode,
  isResidentModeEnabled,
} from "../residentMode";

describe("residentMode", () => {
  it("defaults on for resident, other, and missing role", () => {
    expect(getDefaultResidentMode("md_resident")).toBe(true);
    expect(getDefaultResidentMode("other")).toBe(true);
    expect(getDefaultResidentMode(null)).toBe(true);
    expect(getDefaultResidentMode(undefined)).toBe(true);
  });

  it("defaults off for faculty and ug", () => {
    expect(getDefaultResidentMode("faculty")).toBe(false);
    expect(getDefaultResidentMode("ug")).toBe(false);
  });

  it("explicit toggle overrides role default", () => {
    expect(
      isResidentModeEnabled({ learnerRole: "faculty", residentMode: true }),
    ).toBe(true);
    expect(
      isResidentModeEnabled({ learnerRole: "md_resident", residentMode: false }),
    ).toBe(false);
  });

  it("falls back to role when residentMode unset", () => {
    expect(isResidentModeEnabled({ learnerRole: "ug" })).toBe(false);
    expect(isResidentModeEnabled({ learnerRole: "md_resident" })).toBe(true);
    expect(isResidentModeEnabled({})).toBe(true);
  });
});
