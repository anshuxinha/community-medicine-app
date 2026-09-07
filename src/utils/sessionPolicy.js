export const LOCAL_AUTH_STORAGE_KEYS = [
  "user",
  "isPremium",
  "readItems",
  "readItemVersions",
  "bookmarks",
  "highlights",
  "currentStreak",
  "lastReadDate",
  "studyScore",
  "dailyReadHistory",
];

export function isForeignDeviceSession(cloudDeviceId, localDeviceId) {
  return (
    Boolean(cloudDeviceId) &&
    Boolean(localDeviceId) &&
    cloudDeviceId !== localDeviceId
  );
}

// Voluntary logout may clear currentDeviceId. A kick from another device
// must leave that device's claim in place.
export function shouldReleaseDeviceClaim({ kickedByOtherDevice } = {}) {
  return kickedByOtherDevice !== true;
}
