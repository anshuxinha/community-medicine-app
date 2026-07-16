import { registerRootComponent } from "expo";
import * as Updates from "expo-updates";

// If an OTA was downloaded but not applied, kick reload before React mounts.
// Guarded lightly: only when pending (no cooldown storage at this stage).
// App.js has a stronger cooldown + user "Restart now" fallback.
if (!__DEV__ && Updates.isEnabled && Updates.isUpdatePending) {
  Updates.reloadAsync().catch((err) => {
    console.warn("[updates] early reloadAsync failed:", err?.message || err);
  });
}

import App from "./App";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
