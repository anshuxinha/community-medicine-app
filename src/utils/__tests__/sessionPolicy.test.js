import {
  buildSessionReleaseUpdate,
  isForeignDeviceSession,
  shouldReleaseDeviceClaim,
} from "../sessionPolicy";

describe("isForeignDeviceSession", () => {
  test("kicks when cloud id belongs to another device", () => {
    expect(isForeignDeviceSession("device-b", "device-a")).toBe(true);
  });

  test("keeps the session when ids match", () => {
    expect(isForeignDeviceSession("device-a", "device-a")).toBe(false);
  });

  test("does not kick when the cloud claim is empty", () => {
    expect(isForeignDeviceSession(null, "device-a")).toBe(false);
    expect(isForeignDeviceSession("", "device-a")).toBe(false);
  });
});

describe("shouldReleaseDeviceClaim", () => {
  test("voluntary logout releases the cloud device claim", () => {
    expect(shouldReleaseDeviceClaim()).toBe(true);
    expect(shouldReleaseDeviceClaim({})).toBe(true);
    expect(shouldReleaseDeviceClaim({ kickedByOtherDevice: false })).toBe(true);
  });

  test("a kick from another device leaves their claim in Firestore", () => {
    expect(shouldReleaseDeviceClaim({ kickedByOtherDevice: true })).toBe(false);
  });
});

describe("buildSessionReleaseUpdate", () => {
  test("clears the device claim and this phone's push token", () => {
    expect(buildSessionReleaseUpdate()).toEqual({
      currentDeviceId: null,
      pushToken: null,
    });
  });
});

describe("LOCAL_AUTH_STORAGE_KEYS", () => {
  test("includes completedVideoIds to prevent cross-account progress leakage", () => {
    const { LOCAL_AUTH_STORAGE_KEYS } = require("../sessionPolicy");
    expect(LOCAL_AUTH_STORAGE_KEYS).toContain("completedVideoIds");
    expect(LOCAL_AUTH_STORAGE_KEYS).toContain("readItems");
    expect(LOCAL_AUTH_STORAGE_KEYS).toContain("bookmarks");
    expect(LOCAL_AUTH_STORAGE_KEYS).toContain("user");
  });
});

