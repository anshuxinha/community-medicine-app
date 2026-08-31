import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  tryRestoreSignIn,
  ensureRestoreKey,
  clearRestoreKey,
  consumeAppDataRestoredFlag,
} from "../restoreCredentials";

const mockCreate = jest.fn();
const mockGet = jest.fn();
const mockClear = jest.fn();
const mockConsumePending = jest.fn();
const mockConsumeRestored = jest.fn();
const mockCallable = jest.fn();
const mockSignInWithCustomToken = jest.fn();
const mockGetDeviceId = jest.fn();

jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  NativeModules: {
    RestoreCredentials: {
      createRestoreKey: (...args) => mockCreate(...args),
      getRestoreKey: (...args) => mockGet(...args),
      clearRestoreKey: (...args) => mockClear(...args),
      consumePendingRestoreAssertion: (...args) => mockConsumePending(...args),
      consumeAppDataRestoredFlag: (...args) => mockConsumeRestored(...args),
    },
  },
}));

jest.mock("expo-constants", () => ({
  appOwnership: "standalone",
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("../../config/firebase", () => ({
  app: {},
  auth: { currentUser: null },
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => mockCallable),
}));

jest.mock("firebase/auth", () => ({
  signInWithCustomToken: (...args) => mockSignInWithCustomToken(...args),
}));

jest.mock("../../utils/deviceUtils", () => ({
  getDeviceId: (...args) => mockGetDeviceId(...args),
}));

describe("restoreCredentials", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetDeviceId.mockResolvedValue("device-1");
    await AsyncStorage.clear();
  });

  test("tryRestoreSignIn uses a pending BackupAgent assertion", async () => {
    mockConsumePending.mockResolvedValue('{"id":"cred1"}');
    mockCallable.mockResolvedValue({
      data: { customToken: "tok", uid: "uid1" },
    });
    mockSignInWithCustomToken.mockResolvedValue({});

    await expect(tryRestoreSignIn()).resolves.toBe(true);
    expect(mockGet).not.toHaveBeenCalled();
    expect(mockSignInWithCustomToken).toHaveBeenCalled();
    expect(mockCallable).toHaveBeenCalledWith({
      assertionJson: '{"id":"cred1"}',
      deviceId: "device-1",
    });
  });

  test("tryRestoreSignIn returns false when no restore key exists", async () => {
    mockConsumePending.mockResolvedValue(null);
    mockCallable.mockResolvedValue({
      data: { requestJson: '{"challenge":"x"}' },
    });
    mockGet.mockResolvedValue(null);

    await expect(tryRestoreSignIn()).resolves.toBe(false);
    expect(mockSignInWithCustomToken).not.toHaveBeenCalled();
  });

  test("ensureRestoreKey creates and registers a restore key once", async () => {
    mockCallable
      .mockResolvedValueOnce({ data: { requestJson: '{"challenge":"c"}' } })
      .mockResolvedValueOnce({ data: { ok: true } });
    mockCreate.mockResolvedValue('{"id":"new"}');

    await expect(ensureRestoreKey({ uid: "uid1" })).resolves.toBe(true);
    expect(mockCreate).toHaveBeenCalledWith('{"challenge":"c"}');
    await expect(ensureRestoreKey({ uid: "uid1" })).resolves.toBe(true);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("clearRestoreKey clears native state", async () => {
    mockClear.mockResolvedValue(true);
    await expect(clearRestoreKey()).resolves.toBe(true);
    expect(mockClear).toHaveBeenCalled();
  });

  test("consumeAppDataRestoredFlag reads the native backup flag", async () => {
    mockConsumeRestored.mockResolvedValue(true);
    await expect(consumeAppDataRestoredFlag()).resolves.toBe(true);
  });
});
