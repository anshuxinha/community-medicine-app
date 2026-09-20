const {
  isValidExpoPushToken,
  hasActiveDeviceSession,
  hasActiveAdminPushSession,
} = require("../adminPush");

describe("isValidExpoPushToken", () => {
  test("accepts Expo token prefixes", () => {
    expect(isValidExpoPushToken("ExponentPushToken[abc]")).toBe(true);
    expect(isValidExpoPushToken("ExpoPushToken[abc]")).toBe(true);
  });

  test("rejects missing or malformed tokens", () => {
    expect(isValidExpoPushToken(null)).toBe(false);
    expect(isValidExpoPushToken("")).toBe(false);
    expect(isValidExpoPushToken("not-a-token")).toBe(false);
  });
});

describe("hasActiveAdminPushSession", () => {
  const token = "ExponentPushToken[device-a]";

  test("sends when the admin still holds a device session", () => {
    expect(
      hasActiveAdminPushSession({
        pushToken: token,
        currentDeviceId: "device-a",
      }),
    ).toBe(true);
  });

  test("does not send after logout (token leftover, session released)", () => {
    expect(
      hasActiveAdminPushSession({
        pushToken: token,
        currentDeviceId: null,
      }),
    ).toBe(false);
  });

  test("does not send when the session id is blank", () => {
    expect(
      hasActiveAdminPushSession({
        pushToken: token,
        currentDeviceId: "  ",
      }),
    ).toBe(false);
  });

  test("does not send without a valid token", () => {
    expect(
      hasActiveAdminPushSession({
        pushToken: null,
        currentDeviceId: "device-a",
      }),
    ).toBe(false);
  });
});

describe("hasActiveDeviceSession", () => {
  test("treats a non-empty currentDeviceId as logged in", () => {
    expect(hasActiveDeviceSession({ currentDeviceId: "phone-1" })).toBe(true);
  });

  test("treats a cleared currentDeviceId as logged out", () => {
    expect(hasActiveDeviceSession({ currentDeviceId: null })).toBe(false);
    expect(hasActiveDeviceSession({})).toBe(false);
  });
});
