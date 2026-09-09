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
    onClose: jest.fn(),
  };

  test("shows a close control and a double-tap zoom hint", () => {
    const { getByLabelText, getByText, queryByLabelText, queryByText } = render(
      <FullscreenImageViewer {...props} />,
    );
    expect(getByLabelText("Close fullscreen image")).toBeTruthy();
    expect(getByText("Double tap to zoom in or out.")).toBeTruthy();
    expect(queryByLabelText("Rotate left")).toBeNull();
    expect(queryByLabelText("Rotate right")).toBeNull();
    expect(queryByText(/Rotate with the buttons below/i)).toBeNull();
    expect(queryByText("%")).toBeNull();
  });
});
