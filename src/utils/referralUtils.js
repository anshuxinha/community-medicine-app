/**
 * Generates a clean, uppercase referral code based on the username.
 * e.g., "Anshuman Sinha" -> "ANSH3A9F"
 */
export const generateReferralCode = (username) => {
  const prefix = (username || "STRM")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  
  // 4-character random alphanumeric suffix
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}${suffix}`;
};
