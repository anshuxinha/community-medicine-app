import { registerRootComponent } from "expo";
import App from "./App";

// Do NOT call Updates.reloadAsync() here. An early reload while the root is
// registering can crash OTA activation; expo-updates then blacklists that
// update and permanently falls back to the embedded binary (which still shows
// "Reopen the app to finish updating").

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
