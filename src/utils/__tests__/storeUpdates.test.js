import {
  PLAY_UPDATE_AVAILABLE,
  isPlayUpdateAvailable,
  isVersionLower,
  needsStoreUpdate,
  parseITunesLookup,
  readNativeVersion,
  shouldShowStorePrompt,
} from "../storeUpdates";

describe("isVersionLower", () => {
  it("is true when the latest marketing version is higher", () => {
    expect(isVersionLower("1.0.11", "1.0.12")).toBe(true);
    expect(isVersionLower("1.0.11", "1.1.0")).toBe(true);
  });

  it("is false when versions match or current is ahead", () => {
    expect(isVersionLower("1.0.11", "1.0.11")).toBe(false);
    expect(isVersionLower("1.0.12", "1.0.11")).toBe(false);
  });

  it("is false when either side is missing", () => {
    expect(isVersionLower("", "1.0.12")).toBe(false);
    expect(isVersionLower("1.0.11", null)).toBe(false);
  });
});

describe("needsStoreUpdate", () => {
  it("is true for a lower marketing version", () => {
    expect(needsStoreUpdate("1.0.10", "1.0.11", 16, 17)).toBe(true);
  });

  it("is true for the same marketing version with a lower build", () => {
    expect(needsStoreUpdate("1.0.11", "1.0.11", 16, 17)).toBe(true);
  });

  it("is false when version and build are current", () => {
    expect(needsStoreUpdate("1.0.11", "1.0.11", 17, 17)).toBe(false);
    expect(needsStoreUpdate("1.0.11", "1.0.11", 18, 17)).toBe(false);
  });
});

describe("shouldShowStorePrompt", () => {
  it("is false when there is no latest version", () => {
    expect(shouldShowStorePrompt(null, null)).toBe(false);
    expect(shouldShowStorePrompt(null, "")).toBe(false);
  });

  it("is false when this version was dismissed", () => {
    expect(shouldShowStorePrompt("1.0.12", "1.0.12")).toBe(false);
  });

  it("is true for a new version after a previous dismiss", () => {
    expect(shouldShowStorePrompt("1.0.11", "1.0.12")).toBe(true);
    expect(shouldShowStorePrompt(null, "1.0.12")).toBe(true);
  });
});

describe("parseITunesLookup", () => {
  it("reads version and store URL from the first result", () => {
    expect(
      parseITunesLookup({
        results: [
          {
            version: "1.0.12",
            trackViewUrl: "https://apps.apple.com/app/id6767763106",
          },
        ],
      }),
    ).toEqual({
      version: "1.0.12",
      trackViewUrl: "https://apps.apple.com/app/id6767763106",
    });
  });

  it("returns null when the payload has no version", () => {
    expect(parseITunesLookup({})).toBeNull();
    expect(parseITunesLookup({ results: [] })).toBeNull();
    expect(parseITunesLookup({ results: [{ trackViewUrl: "https://x" }] })).toBeNull();
  });
});

describe("isPlayUpdateAvailable", () => {
  it("trusts Play availability even when shouldUpdate is false", () => {
    expect(
      isPlayUpdateAvailable({
        shouldUpdate: false,
        other: { updateAvailability: PLAY_UPDATE_AVAILABLE },
      }),
    ).toBe(true);
  });

  it("is false when Play reports no update", () => {
    expect(
      isPlayUpdateAvailable({
        shouldUpdate: false,
        other: { updateAvailability: 1 },
      }),
    ).toBe(false);
    expect(isPlayUpdateAvailable(null)).toBe(false);
  });
});

describe("readNativeVersion", () => {
  it("prefers native binary fields over expoConfig", () => {
    expect(
      readNativeVersion(
        {
          nativeAppVersion: "1.0.11",
          nativeBuildVersion: "17",
          expoConfig: { version: "9.9.9", android: { versionCode: 99 } },
        },
        "android",
      ),
    ).toEqual({ currentVersion: "1.0.11", currentBuild: 17 });
  });

  it("falls back to expoConfig on iOS when native fields are missing", () => {
    expect(
      readNativeVersion(
        {
          expoConfig: { version: "1.0.11", ios: { buildNumber: "17" } },
        },
        "ios",
      ),
    ).toEqual({ currentVersion: "1.0.11", currentBuild: 17 });
  });
});
