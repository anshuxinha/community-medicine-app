/**
 * Diagnosable error catalog for the Videos list subscription.
 *
 * Codes are stable for support — when a user reports a code, map it here.
 * Firebase / client errors are normalized via mapVideoLoadError().
 */

export const VIDEO_SUPPORT_EMAIL = "anshuxinha@gmail.com";

/** @typedef {{ code: string, title: string, message: string, fix: string, contactSupport: boolean }} VideoLoadErrorInfo */

/**
 * Master list of Videos-screen load error codes (keep in sync with mapVideoLoadError).
 * @type {Record<string, Omit<VideoLoadErrorInfo, 'code'>>}
 */
export const VIDEO_LOAD_ERROR_CATALOG = {
  VIDEOS_AUTH_REQUIRED: {
    title: "Sign-in required",
    message: "We could not load videos because you are not signed in.",
    fix: "Sign out and sign back in, then open Videos again.",
    contactSupport: true,
  },
  VIDEOS_PERMISSION: {
    title: "Access blocked",
    message: "Your account does not have permission to read the video list.",
    fix: "Try signing out and back in. If it continues, contact support with the error code.",
    contactSupport: true,
  },
  VIDEOS_UNAVAILABLE: {
    title: "Service temporarily unavailable",
    message: "The video catalog service did not respond in time.",
    fix: "Check your connection, wait a moment, then tap Retry. Switching Wi‑Fi / mobile data often helps.",
    contactSupport: true,
  },
  VIDEOS_NETWORK: {
    title: "Cannot reach video servers",
    message:
      "Your device has connectivity issues with our video database (this can happen even when other apps work).",
    fix: "Turn airplane mode off, try another network, disable VPN if any, then tap Retry.",
    contactSupport: true,
  },
  VIDEOS_TIMEOUT: {
    title: "Request timed out",
    message: "Loading the video list took too long.",
    fix: "Move to a stronger network and tap Retry.",
    contactSupport: true,
  },
  VIDEOS_QUOTA: {
    title: "Too many requests",
    message: "The app hit a temporary rate limit while loading videos.",
    fix: "Wait about a minute, then tap Retry.",
    contactSupport: true,
  },
  VIDEOS_INTERNAL: {
    title: "Server error",
    message: "Something went wrong on our side while loading videos.",
    fix: "Tap Retry. If it keeps failing, contact support with the error code.",
    contactSupport: true,
  },
  VIDEOS_UNKNOWN: {
    title: "Could not load videos",
    message: "An unexpected error stopped the video list from loading.",
    fix: "Force-close the app, reopen it, and open Videos again. If it continues, contact support with the error code.",
    contactSupport: true,
  },
};

/**
 * @param {string} code
 * @param {Partial<VideoLoadErrorInfo>} [overrides]
 * @returns {VideoLoadErrorInfo}
 */
export const getVideoLoadErrorInfo = (code, overrides = {}) => {
  const resolved = VIDEO_LOAD_ERROR_CATALOG[code] ? code : "VIDEOS_UNKNOWN";
  const base = VIDEO_LOAD_ERROR_CATALOG[resolved];
  return {
    code: resolved,
    ...base,
    ...overrides,
    code: resolved,
  };
};

/**
 * Normalize Firebase / network errors into a catalog entry + diagnostic detail.
 * @param {unknown} error
 * @param {{ hasAuth?: boolean }} [context]
 * @returns {VideoLoadErrorInfo & { detail?: string }}
 */
export const mapVideoLoadError = (error, context = {}) => {
  const rawCode = String(
    error?.code || error?.name || "",
  ).toLowerCase();
  const message = String(error?.message || error || "Unknown error");
  const detail = [error?.code, message].filter(Boolean).join(" — ").slice(0, 240);

  // Firebase Auth / Firestore permission family
  if (
    rawCode.includes("unauthenticated") ||
    /auth\/(user-token-expired|invalid-user-token|network-request-failed)/i.test(
      rawCode + message,
    ) ||
    (!context.hasAuth && rawCode.includes("permission-denied"))
  ) {
    return { ...getVideoLoadErrorInfo("VIDEOS_AUTH_REQUIRED"), detail };
  }

  if (rawCode.includes("permission-denied")) {
    return { ...getVideoLoadErrorInfo("VIDEOS_PERMISSION"), detail };
  }

  if (
    rawCode.includes("unavailable") ||
    rawCode.includes("aborted") ||
    /firestore\/unavailable/i.test(rawCode)
  ) {
    return { ...getVideoLoadErrorInfo("VIDEOS_UNAVAILABLE"), detail };
  }

  if (
    rawCode.includes("deadline-exceeded") ||
    /timeout|timed out/i.test(message)
  ) {
    return { ...getVideoLoadErrorInfo("VIDEOS_TIMEOUT"), detail };
  }

  if (
    rawCode.includes("resource-exhausted") ||
    /quota|rate limit/i.test(message)
  ) {
    return { ...getVideoLoadErrorInfo("VIDEOS_QUOTA"), detail };
  }

  if (
    rawCode.includes("network") ||
    rawCode.includes("failed-precondition") ||
    /network request failed|offline|could not reach|err_internet|socket/i.test(
      message,
    )
  ) {
    return { ...getVideoLoadErrorInfo("VIDEOS_NETWORK"), detail };
  }

  if (rawCode.includes("internal") || rawCode.includes("data-loss")) {
    return { ...getVideoLoadErrorInfo("VIDEOS_INTERNAL"), detail };
  }

  return { ...getVideoLoadErrorInfo("VIDEOS_UNKNOWN"), detail };
};

export const buildVideoSupportMailto = (errorInfo) => {
  const subject = encodeURIComponent(
    `STROMA Videos error ${errorInfo?.code || "VIDEOS_UNKNOWN"}`,
  );
  const body = encodeURIComponent(
    [
      "Hi Stroma support,",
      "",
      "I could not load the Videos list.",
      `Error code: ${errorInfo?.code || "unknown"}`,
      errorInfo?.detail ? `Detail: ${errorInfo.detail}` : null,
      "",
      "Device / steps:",
      "- ",
      "",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  );
  return `mailto:${VIDEO_SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
};
