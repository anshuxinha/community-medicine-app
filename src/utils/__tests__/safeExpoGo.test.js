import { requireOptionalNativeModule } from "expo-modules-core";
import { getAppOwnership, isExpoGo } from "../safeExpoGo";

jest.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: jest.fn(() => null),
}));

describe("safeExpoGo", () => {
  beforeEach(() => {
    requireOptionalNativeModule.mockReset();
  });

  it("returns false when ExponentConstants is missing", () => {
    requireOptionalNativeModule.mockReturnValue(null);
    expect(getAppOwnership()).toBeNull();
    expect(isExpoGo()).toBe(false);
  });

  it("detects Expo Go from appOwnership without importing expo-constants", () => {
    requireOptionalNativeModule.mockReturnValue({ appOwnership: "expo" });
    expect(isExpoGo()).toBe(true);
    expect(requireOptionalNativeModule).toHaveBeenCalledWith("ExponentConstants");
  });

  it("treats standalone as not Expo Go", () => {
    requireOptionalNativeModule.mockReturnValue({ appOwnership: "standalone" });
    expect(isExpoGo()).toBe(false);
  });

  it("swallows native module errors", () => {
    requireOptionalNativeModule.mockImplementation(() => {
      throw new Error("native missing");
    });
    expect(isExpoGo()).toBe(false);
  });
});
