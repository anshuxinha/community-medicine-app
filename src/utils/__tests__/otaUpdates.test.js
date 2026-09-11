import { shouldShowAppUpdatedToast } from "../otaUpdates";

describe("shouldShowAppUpdatedToast", () => {
  it("is false on first launch with no stored id", () => {
    expect(shouldShowAppUpdatedToast(null, "update-a")).toBe(false);
    expect(shouldShowAppUpdatedToast(undefined, "update-a")).toBe(false);
  });

  it("is false when the running id did not change", () => {
    expect(shouldShowAppUpdatedToast("update-a", "update-a")).toBe(false);
  });

  it("is false when the running id is missing", () => {
    expect(shouldShowAppUpdatedToast("update-a", null)).toBe(false);
    expect(shouldShowAppUpdatedToast("update-a", "")).toBe(false);
  });

  it("is true when a new OTA id is running", () => {
    expect(shouldShowAppUpdatedToast("update-a", "update-b")).toBe(true);
  });
});
