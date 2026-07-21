/**
 * BunnyCDN advanced (HMAC-SHA256) URL signing.
 * Based on https://github.com/BunnyWay/BunnyCDN.TokenAuthentication
 */
const crypto = require("crypto");

/**
 * @param {string} url CDN URL (e.g. https://vz-xxx.b-cdn.net/{id}/playlist.m3u8)
 * @param {string} securityKey Token Authentication Key from Pull Zone settings
 * @param {number} expirationTime Token validity in seconds
 * @param {string} userIp Optional IP lock
 * @param {boolean} isDirectory true → path-based /bcdn_token=... (required for HLS)
 * @param {string} pathAllowed Directory path for signature scope (e.g. /{videoId}/)
 * @returns {string} Signed URL
 */
function signUrl(
  url,
  securityKey,
  expirationTime = 14400,
  userIp = "",
  isDirectory = false,
  pathAllowed = "",
  countriesAllowed = "",
  countriesBlocked = "",
  ignoreParams = false,
  expiresAt = null,
  speedLimit = 0,
) {
  if (!securityKey) {
    throw new Error("securityKey must not be empty");
  }
  if (expirationTime < 0) {
    throw new Error("expirationTime must be non-negative");
  }

  const parsed = new URL(url);
  const queryParams = {};
  for (const [key, value] of parsed.searchParams) {
    if (Object.prototype.hasOwnProperty.call(queryParams, key)) {
      throw new Error(`Duplicate query parameter "${key}" is not supported`);
    }
    queryParams[key] = value;
  }

  if (countriesAllowed) {
    queryParams.token_countries = countriesAllowed;
  }
  if (countriesBlocked) {
    queryParams.token_countries_blocked = countriesBlocked;
  }
  if (speedLimit > 0) {
    queryParams.limit = String(speedLimit);
  }

  const expires =
    expiresAt != null
      ? String(expiresAt)
      : String(Math.floor(Date.now() / 1000) + expirationTime);

  let parameters;
  if (ignoreParams) {
    parameters = { token_ignore_params: "true" };
  } else {
    parameters = Object.assign({}, queryParams);
  }
  if (pathAllowed) {
    parameters.token_path = pathAllowed;
  }

  const sortedEntries = Object.entries(parameters).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const signaturePath = pathAllowed || parsed.pathname;
  const signingData = sortedEntries.map(([k, v]) => `${k}=${v}`).join("&");
  const urlData = sortedEntries
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const message = `${signaturePath}${expires}${signingData}${userIp || ""}`;

  const digest = crypto.createHmac("sha256", securityKey).update(message).digest();
  const token =
    "HS256-" +
    digest
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const base = `${parsed.protocol}//${parsed.host}`;
  const tail = urlData ? `&${urlData}` : "";

  if (isDirectory) {
    return `${base}/bcdn_token=${token}${tail}&expires=${expires}${parsed.pathname}`;
  }
  return `${base}${parsed.pathname}?token=${token}${tail}&expires=${expires}`;
}

module.exports = { signUrl };
