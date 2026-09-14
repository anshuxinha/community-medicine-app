import { preventAutoHideSplash } from "./appSplash";

// Evaluated before App.js so preventAutoHide runs before the heavy import tree.
preventAutoHideSplash();
