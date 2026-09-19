import AsyncStorage from "@react-native-async-storage/async-storage";
import { requireOptionalNativeModule } from "expo-modules-core";
import {
  LAST_SEEN_OTA_ID_KEY,
  MIN_OTA_CHECK_INTERVAL_MS,
  canRunSilentOtaCheck,
  markAppUpdatedToastShown,
  peekAppliedOtaToast,
  shouldAllowExpoHostModules,
  shouldShowAppUpdatedToast,
} from "../otaUpdates";

jest.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: jest.fn(() => null),
}));

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

describe("peekAppliedOtaToast / markAppUpdatedToastShown", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    requireOptionalNativeModule.mockReset();
  });

  it("returns false when the native module is missing", async () => {
    requireOptionalNativeModule.mockReturnValue(null);
    expect(await peekAppliedOtaToast()).toBe(false);
  });

  it("does not persist the running id until the toast is marked shown", async () => {
    requireOptionalNativeModule.mockReturnValue({
      isEnabled: true,
      isEmbeddedLaunch: false,
      updateId: "UPDATE-B",
    });

    expect(await peekAppliedOtaToast()).toBe(true);
    expect(await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY)).toBeNull();

    await markAppUpdatedToastShown();
    expect(await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY)).toBe("update-b");
    expect(await peekAppliedOtaToast()).toBe(false);
  });

  it("still announces after a crash that peeked but never marked", async () => {
    requireOptionalNativeModule.mockReturnValue({
      isEnabled: true,
      isEmbeddedLaunch: false,
      updateId: "update-b",
    });
    await AsyncStorage.setItem(LAST_SEEN_OTA_ID_KEY, "update-a");

    expect(await peekAppliedOtaToast()).toBe(true);
    expect(await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY)).toBe("update-a");
  });

  it("stays quiet on the embedded store binary with no stored id", async () => {
    requireOptionalNativeModule.mockReturnValue({
      isEnabled: true,
      isEmbeddedLaunch: true,
      updateId: "update-a",
    });

    expect(await peekAppliedOtaToast()).toBe(false);
    expect(await AsyncStorage.getItem(LAST_SEEN_OTA_ID_KEY)).toBeNull();
  });
});

describe("shouldAllowExpoHostModules", () => {
  it("allows the embedded store binary", () => {
    expect(
      shouldAllowExpoHostModules({
        updateId: "update-a",
        isEmbeddedLaunch: true,
        lastOkId: null,
      }),
    ).toBe(true);
  });

  it("allows when there is no running update id", () => {
    expect(
      shouldAllowExpoHostModules({
        updateId: null,
        isEmbeddedLaunch: false,
        lastOkId: null,
      }),
    ).toBe(true);
  });

  it("blocks the first process of a new OTA", () => {
    expect(
      shouldAllowExpoHostModules({
        updateId: "update-b",
        isEmbeddedLaunch: false,
        lastOkId: null,
      }),
    ).toBe(false);
    expect(
      shouldAllowExpoHostModules({
        updateId: "update-b",
        isEmbeddedLaunch: false,
        lastOkId: "update-a",
      }),
    ).toBe(false);
  });

  it("allows a later launch after the updateId survived", () => {
    expect(
      shouldAllowExpoHostModules({
        updateId: "update-b",
        isEmbeddedLaunch: false,
        lastOkId: "update-b",
      }),
    ).toBe(true);
  });
});

describe("canRunSilentOtaCheck", () => {
  it("blocks AppState resume until the first delayed check is allowed", () => {
    expect(canRunSilentOtaCheck(false, 0, 1_000)).toBe(false);
  });

  it("allows the first check once resume checks are enabled", () => {
    expect(canRunSilentOtaCheck(true, 0, 60_000)).toBe(true);
  });

  it("throttles checks inside the minimum interval", () => {
    const last = 100_000;
    expect(
      canRunSilentOtaCheck(true, last, last + MIN_OTA_CHECK_INTERVAL_MS - 1),
    ).toBe(false);
    expect(
      canRunSilentOtaCheck(true, last, last + MIN_OTA_CHECK_INTERVAL_MS),
    ).toBe(true);
  });
});
