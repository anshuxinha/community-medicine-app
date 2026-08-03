/**
 * Resident Mode: NMC paper-wise Library / Progress layout.
 * Explicit user.residentMode wins; otherwise default from learnerRole.
 */

export function getDefaultResidentMode(learnerRole) {
  return (
    learnerRole == null ||
    learnerRole === "md_resident" ||
    learnerRole === "other"
  );
}

/**
 * @param {{ residentMode?: boolean|null, learnerRole?: string|null }|null|undefined} user
 */
export function isResidentModeEnabled(user) {
  if (user?.residentMode === true) return true;
  if (user?.residentMode === false) return false;
  return getDefaultResidentMode(user?.learnerRole);
}
