import AsyncStorage from "@react-native-async-storage/async-storage";
import { isUserAdmin, ADMIN_EMAILS } from "../adminUtils";
import {
  syncAdminOtaChannel,
  setOtaChannelOverride,
  getActiveOtaChannel,
  getExpoUpdates,
  OTA_CHANNEL_OVERRIDE_KEY,
  PREVIEW_CHANNEL_NAME,
  PRODUCTION_CHANNEL_NAME,
} from "../otaUpdates";

describe("adminUtils", () => {
  it("recognizes hardcoded admin emails case-insensitively", () => {
    expect(isUserAdmin({ email: "anshuxinha@gmail.com" })).toBe(true);
    expect(isUserAdmin({ email: "ANSHUXINHA@GMAIL.COM" })).toBe(true);
    expect(isUserAdmin({ email: "kaushikeec@gmail.com" })).toBe(true);
  });

  it("recognizes isAdmin flag on user object", () => {
    expect(isUserAdmin({ email: "student@test.com", isAdmin: true })).toBe(true);
  });

  it("returns false for regular users and falsy values", () => {
    expect(isUserAdmin({ email: "regular@test.com" })).toBe(false);
    expect(isUserAdmin(null)).toBe(false);
    expect(isUserAdmin(undefined)).toBe(false);
    expect(isUserAdmin({})).toBe(false);
  });
});

describe("otaUpdates channel management", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it("syncAdminOtaChannel switches to preview for admin", async () => {
    await syncAdminOtaChannel(true);
    const channel = await getActiveOtaChannel();
    expect(channel).toBe(PREVIEW_CHANNEL_NAME);
    const stored = await AsyncStorage.getItem(OTA_CHANNEL_OVERRIDE_KEY);
    expect(stored).toBe(PREVIEW_CHANNEL_NAME);
  });

  it("syncAdminOtaChannel clears override for non-admin", async () => {
    await AsyncStorage.setItem(OTA_CHANNEL_OVERRIDE_KEY, PREVIEW_CHANNEL_NAME);
    await syncAdminOtaChannel(false);
    const stored = await AsyncStorage.getItem(OTA_CHANNEL_OVERRIDE_KEY);
    expect(stored).toBeNull();
    const channel = await getActiveOtaChannel();
    const expectedDefault = getExpoUpdates()?.channel || PRODUCTION_CHANNEL_NAME;
    expect(channel).toBe(expectedDefault);
  });

  it("setOtaChannelOverride allows toggling between preview and production", async () => {
    await setOtaChannelOverride(PREVIEW_CHANNEL_NAME);
    expect(await getActiveOtaChannel()).toBe(PREVIEW_CHANNEL_NAME);

    await setOtaChannelOverride(PRODUCTION_CHANNEL_NAME);
    const expectedDefault = getExpoUpdates()?.channel || PRODUCTION_CHANNEL_NAME;
    expect(await getActiveOtaChannel()).toBe(expectedDefault);
  });
});
