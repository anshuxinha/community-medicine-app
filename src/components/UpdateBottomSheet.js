import { useEffect } from "react";
import { startStoreUpdateChecks } from "../utils/storeUpdates";

/**
 * Headless: Play flexible in-app update on Android, native Alert on iOS.
 * Runs after splash hide. Renders nothing.
 */
const UpdateBottomSheet = () => {
  useEffect(() => startStoreUpdateChecks(), []);
  return null;
};

export default UpdateBottomSheet;
