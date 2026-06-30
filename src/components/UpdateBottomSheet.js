import { useEffect } from "react";
import { Platform } from "react-native";
import SpInAppUpdates, {
  IAUUpdateKind,
} from "sp-react-native-in-app-updates";

const UpdateBottomSheet = () => {
  useEffect(() => {
    // Only run update check in production builds
    if (__DEV__) return;

    const inAppUpdates = new SpInAppUpdates(
      false // debug mode
    );

    inAppUpdates
      .checkNeedsUpdate()
      .then((result) => {
        if (result.shouldUpdate) {
          inAppUpdates.startUpdate({
            updateType: IAUUpdateKind.IMMEDIATE,
          });
        }
      })
      .catch((err) => {
        console.warn("Native in-app update check failed:", err);
      });
  }, []);

  return null;
};

export default UpdateBottomSheet;
