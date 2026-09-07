import {
  isForeignDeviceSession,
  shouldReleaseDeviceClaim,
} from "../sessionPolicy";

describe("isForeignDeviceSession", () => {
  test("kicks when cloud id belongs to another device", () => {
    expect(isForeignDeviceSession("device-b", "device-a")).toBe(true);
  });

  test("keeps the session when ids match", () => {
    expect(isForeignDeviceSession("device-a", "device-a")).toBe(false);
  });

  test("does not kick when the cloud claim is empty", () => {
    expect(isForeignDeviceSession(null, "device-a")).toBe(false);
    expect(isForeignDeviceSession("", "device-a")).toBe(false);
  });
});

describe("shouldReleaseDeviceClaim", () => {
  test("voluntary logout releases the cloud device claim", () => {
    expect(shouldReleaseDeviceClaim()).toBe(true);
    expect(shouldReleaseDeviceClaim({})).toBe(true);
    expect(shouldReleaseDeviceClaim({ kickedByOtherDevice: false })).toBe(true);
  });

  test("a kick from another device leaves their claim in Firestore", () => {
    expect(shouldReleaseDeviceClaim({ kickedByOtherDevice: true })).toBe(false);
  });
});
