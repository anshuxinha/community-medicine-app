/**
 * Deterministic alphanumeric string from a seed.
 * Same input always yields the same output; not cryptographically secure.
 */
const hashToChars = (input, length, alphabet) => {
  const raw = String(input || "0");
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = h >>> 0;

  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet.charAt(h % alphabet.length);
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
  }
  return out;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHANUM = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates a stable, uppercase referral / coupon code for a user.
 * Same uid always produces the same code (no Math.random).
 * Format: 8 characters (letter + 7 alphanumeric), e.g. "K3H9M2PA".
 *
 * Username is accepted for call-site compatibility but does not affect the
 * code when uid is provided, so restarts and name edits cannot change it.
 *
 * @param {string} [_username] - Unused when uid is set (kept for API compat)
 * @param {string} [uid] - Firebase Auth uid (primary seed)
 */
export const generateReferralCode = (_username, uid) => {
  const seed = uid || _username || "STRM";
  // Always start with a letter so it reads like a shareable code
  const first = hashToChars(`${seed}:L`, 1, LETTERS);
  const rest = hashToChars(`${seed}:R`, 7, ALPHANUM);
  return `${first}${rest}`;
};
