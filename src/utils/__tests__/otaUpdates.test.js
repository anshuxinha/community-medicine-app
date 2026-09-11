import { shouldShowAppUpdatedToast } from "../otaUpdates";

describe("shouldShowAppUpdatedToast", () => {
  it("is false on first launch of the store binary", () => {
    expect(shouldShowAppUpdatedToast(null, "update-a", true)).toBe(false);
    expect(shouldShowAppUpdatedToast(undefined, "update-a", true)).toBe(false);
  });

  it("is true when an OTA is running and no id was stored yet", () => {
    expect(shouldShowAppUpdatedToast(null, "update-a", false)).toBe(true);
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
