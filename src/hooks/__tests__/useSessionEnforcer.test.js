import React from "react";
import { Text } from "react-native";
import { render, waitFor } from "@testing-library/react-native";
import { AppContext } from "../../context/AppContext";
import { useSessionEnforcer } from "../useSessionEnforcer";

const mockGetDeviceId = jest.fn();
let snapshotHandler = null;

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(() => ({ path: "users/u1" })),
  onSnapshot: jest.fn((_ref, next) => {
    snapshotHandler = next;
    return jest.fn();
  }),
}));

jest.mock("../../config/firebase", () => ({
  db: {},
}));

jest.mock("../../utils/deviceUtils", () => ({
  getDeviceId: (...args) => mockGetDeviceId(...args),
}));

jest.mock("../../context/AppContext", () => {
  const ReactActual = require("react");
  return {
    AppContext: ReactActual.createContext({ user: null, logout: jest.fn() }),
  };
});

jest.spyOn(require("react-native").Alert, "alert").mockImplementation(() => {});

function Harness() {
  useSessionEnforcer();
  return <Text>enforcer</Text>;
}

describe("useSessionEnforcer", () => {
  beforeEach(() => {
    snapshotHandler = null;
    mockGetDeviceId.mockResolvedValue("device-a");
  });

  test("logs out without releasing the other device's claim", async () => {
    const logout = jest.fn().mockResolvedValue();
    render(
      <AppContext.Provider value={{ user: { uid: "u1" }, logout }}>
        <Harness />
      </AppContext.Provider>,
    );

    await waitFor(() => expect(snapshotHandler).toEqual(expect.any(Function)));

    await snapshotHandler({
      exists: () => true,
      data: () => ({ currentDeviceId: "device-b" }),
    });

    expect(logout).toHaveBeenCalledWith({ kickedByOtherDevice: true });
  });

  test("does not log out when this device still owns the session", async () => {
    const logout = jest.fn().mockResolvedValue();
    render(
      <AppContext.Provider value={{ user: { uid: "u1" }, logout }}>
        <Harness />
      </AppContext.Provider>,
    );

    await waitFor(() => expect(snapshotHandler).toEqual(expect.any(Function)));

    await snapshotHandler({
      exists: () => true,
      data: () => ({ currentDeviceId: "device-a" }),
    });

    expect(logout).not.toHaveBeenCalled();
  });
});
