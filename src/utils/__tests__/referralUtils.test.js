import { generateReferralCode } from "../referralUtils";

describe("generateReferralCode", () => {
  test("same uid always yields the same code", () => {
    const uid = "abcXYZ123firebaseUid";
    const a = generateReferralCode("Anshuman", uid);
    const b = generateReferralCode("Anshuman", uid);
    const c = generateReferralCode("Different Name", uid);
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  test("different uids yield different codes", () => {
    const a = generateReferralCode("User", "uid-one-aaaaaaaa");
    const b = generateReferralCode("User", "uid-two-bbbbbbbb");
    expect(a).not.toBe(b);
  });

  test("code is 8 uppercase alphanumeric chars starting with a letter", () => {
    const code = generateReferralCode("Test User", "some-stable-uid-99");
    expect(code).toMatch(/^[A-Z][A-Z0-9]{7}$/);
  });

  test("username-only fallback is still deterministic", () => {
    const a = generateReferralCode("OnlyName");
    const b = generateReferralCode("OnlyName");
    expect(a).toBe(b);
    expect(a).toMatch(/^[A-Z][A-Z0-9]{7}$/);
  });
});
