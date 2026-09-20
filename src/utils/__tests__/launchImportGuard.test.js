const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function hasStaticFromImport(src, moduleId) {
  const escaped = moduleId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`from ["']${escaped}["']`).test(src);
}

describe("first-open OTA launch graph", () => {
  const launchFiles = [
    "App.js",
    "index.js",
    "src/AppRoot.js",
    "src/context/AppContext.js",
    "src/screens/LoginScreen.js",
    "src/screens/PaywallScreen.js",
    "src/services/restoreCredentials.js",
    "src/navigation/AppNavigator.js",
    "src/screens/DashboardScreen.js",
    "src/screens/LibraryScreen.js",
    "src/screens/ProfileScreen.js",
    "src/screens/SupportScreen.js",
    "src/services/videoLoadErrors.js",
    "src/components/GestureVideoPlayer.js",
    "src/services/notificationService.js",
  ];

  it("does not statically import expo-constants or expo-notifications on the first AppRoot path", () => {
    launchFiles.forEach((rel) => {
      const src = read(rel);
      expect(hasStaticFromImport(src, "expo-constants")).toBe(false);
      expect(hasStaticFromImport(src, "expo-notifications")).toBe(false);
      expect(hasStaticFromImport(src, "expo")).toBe(false);
    });
  });

  it("does not statically import notificationService on eager surfaces", () => {
    [
      "src/navigation/AppNavigator.js",
      "src/screens/DashboardScreen.js",
      "src/screens/LibraryScreen.js",
      "src/AppRoot.js",
    ].forEach((rel) => {
      const src = read(rel);
      expect(hasStaticFromImport(src, "../services/notificationService")).toBe(
        false,
      );
      expect(hasStaticFromImport(src, "./services/notificationService")).toBe(
        false,
      );
    });
  });

  it("does not statically import expo-constants from drawer or feedback helpers", () => {
    [
      "src/components/DrawerMenu.js",
      "src/services/feedbackService.js",
      "src/services/videoLoadErrors.js",
    ].forEach((rel) => {
      const src = read(rel);
      expect(hasStaticFromImport(src, "expo-constants")).toBe(false);
    });
  });

  it("does not statically import expo-store-review on the AppRoot path", () => {
    [
      "src/AppRoot.js",
      "src/components/ReviewRequestModal.js",
      "src/components/ReviewFeedbackModal.js",
      "src/utils/reviewPrompt.js",
    ].forEach((rel) => {
      const src = read(rel);
      expect(hasStaticFromImport(src, "expo-store-review")).toBe(false);
      expect(hasStaticFromImport(src, "expo-constants")).toBe(false);
    });
  });

  it("keeps production index.js off registerRootComponent", () => {
    const src = read("index.js");
    expect(src).toMatch(/AppRegistry\.registerComponent/);
    expect(src).toMatch(/if \(__DEV__\)/);
  });
});
