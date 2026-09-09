import React from "react";
import { render } from "@testing-library/react-native";

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MaterialIcons: (props) => React.createElement(View, props),
  };
});

import FullscreenImageViewer from "../FullscreenImageViewer";

describe("FullscreenImageViewer", () => {
  const props = {
    visible: true,
    source: { uri: "https://example.com/figure.png" },
    alt: "Test figure",
    baseSize: { width: 320, height: 320 },
    rotation: 0,
    onClose: jest.fn(),
    onRotateLeft: jest.fn(),
    onRotateRight: jest.fn(),
  };

  test("tells the reader to pinch instead of using plus and minus buttons", () => {
    const { getByText, queryByText } = render(
      <FullscreenImageViewer {...props} />,
    );
    expect(getByText(/Pinch to zoom/i)).toBeTruthy();
    expect(queryByText("%")).toBeNull();
  });

  test("keeps rotate controls in the Library viewer", () => {
    const { getByLabelText } = render(<FullscreenImageViewer {...props} />);
    expect(getByLabelText("Rotate left")).toBeTruthy();
    expect(getByLabelText("Rotate right")).toBeTruthy();
    expect(getByLabelText("Close fullscreen image")).toBeTruthy();
  });

  test("can hide rotate controls for museum viewing", () => {
    const { queryByLabelText } = render(
      <FullscreenImageViewer {...props} showRotate={false} />,
    );
    expect(queryByLabelText("Rotate left")).toBeNull();
  });
});
