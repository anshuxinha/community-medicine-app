import AsyncStorage from "@react-native-async-storage/async-storage";

const learningProfileKey = (uid) => `learningProfile:${uid}`;

function asRole(value) {
  return typeof value === "string" && value ? value : null;
}

function asYear(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asPaperFocus(value) {
  return typeof value === "string" && value ? value : "all";
}

/**
 * Cloud wins when present; otherwise keep the next source so a sparse
 * Firestore user doc cannot wipe a profile saved on this device.
 */
export function resolveLearningProfile(...sources) {
  let learnerRole = null;
  let trainingYear = null;
  let preferredPaperFocus = "all";
  let residentMode;

  for (const src of sources) {
    if (!src || typeof src !== "object") continue;
    if (!learnerRole) learnerRole = asRole(src.learnerRole);
    if (trainingYear == null) trainingYear = asYear(src.trainingYear);
    if (preferredPaperFocus === "all" && src.preferredPaperFocus) {
      preferredPaperFocus = asPaperFocus(src.preferredPaperFocus);
    }
    if (typeof residentMode !== "boolean" && typeof src.residentMode === "boolean") {
      residentMode = src.residentMode;
    }
  }

  const resolved = {
    learnerRole,
    trainingYear,
    preferredPaperFocus,
  };
  if (typeof residentMode === "boolean") {
    resolved.residentMode = residentMode;
  }
  return resolved;
}

export async function getLocalLearningProfile(uid) {
  if (!uid) return null;
  try {
    const raw = await AsyncStorage.getItem(learningProfileKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
    const storedUser = await AsyncStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed?.uid === uid) {
        return {
          learnerRole: parsed.learnerRole || null,
          trainingYear: asYear(parsed.trainingYear),
          preferredPaperFocus: parsed.preferredPaperFocus || "all",
          residentMode:
            typeof parsed.residentMode === "boolean"
              ? parsed.residentMode
              : undefined,
        };
      }
    }
  } catch (_) {}
  return null;
}

export async function setLocalLearningProfile(uid, profile) {
  if (!uid || !profile) return;
  try {
    await AsyncStorage.setItem(
      learningProfileKey(uid),
      JSON.stringify({
        learnerRole: asRole(profile.learnerRole),
        trainingYear: asYear(profile.trainingYear),
        preferredPaperFocus: asPaperFocus(profile.preferredPaperFocus),
        residentMode:
          typeof profile.residentMode === "boolean"
            ? profile.residentMode
            : undefined,
      }),
    );
  } catch (_) {}
}

/** True when local/device has a field the cloud doc is missing. */
export function learningProfileNeedsCloudBackfill(cloudData, resolved) {
  if (!resolved) return false;
  const cloud = cloudData && typeof cloudData === "object" ? cloudData : {};
  if (resolved.learnerRole && !asRole(cloud.learnerRole)) return true;
  if (asYear(resolved.trainingYear) != null && asYear(cloud.trainingYear) == null) {
    return true;
  }
  if (
    resolved.preferredPaperFocus &&
    resolved.preferredPaperFocus !== "all" &&
    asPaperFocus(cloud.preferredPaperFocus) === "all"
  ) {
    return true;
  }
  if (
    typeof resolved.residentMode === "boolean" &&
    typeof cloud.residentMode !== "boolean"
  ) {
    return true;
  }
  return false;
}
