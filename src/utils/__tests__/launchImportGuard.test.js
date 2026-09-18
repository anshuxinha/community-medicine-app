const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
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
  ];

  it("does not statically import expo-constants or expo-notifications on the first AppRoot path", () => {
    launchFiles.forEach((rel) => {
      const src = read(rel);
      expect(src).not.toMatch(/from ["']expo-constants["']/);
      expect(src).not.toMatch(/from ["']expo-notifications["']/);
      expect(src).not.toMatch(/from ["']expo["']/);
    });
  });

  it("keeps production index.js off registerRootComponent", () => {
    const src = read("index.js");
    expect(src).toMatch(/AppRegistry\.registerComponent/);
    expect(src).toMatch(/if \(__DEV__\)/);
  });
});
