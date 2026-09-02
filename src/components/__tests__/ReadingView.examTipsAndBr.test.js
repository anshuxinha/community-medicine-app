import React from "react";

// Mock @expo/vector-icons to prevent FontLoader/expo-asset resolution failures in Jest
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MaterialIcons: (props) => React.createElement(View, props),
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import { parseMarkdown } from "../ReadingView";

describe("ReadingView Exam Tips and <br> parsing", () => {
  test("accumulates multi-line EXAM TIP into a single unified exam_tip block", () => {
    const md = `# Chapter Test

> **EXAM TIP:**
> When asked to compare vectors, construct a 10-parameter table.
>
> Calculate Breteau Index as positive containers per 100 houses.

## Next Section
Regular body text.`;

    const blocks = parseMarkdown(md);
    const examTipBlocks = blocks.filter((b) => b.type === "exam_tip");
    expect(examTipBlocks).toHaveLength(1);
    expect(examTipBlocks[0].text).toContain("When asked to compare vectors, construct a 10-parameter table.");
    expect(examTipBlocks[0].text).toContain("Calculate Breteau Index as positive containers per 100 houses.");
    // Prefix "**EXAM TIP:**" should be stripped
    expect(examTipBlocks[0].text.startsWith("**EXAM TIP:**")).toBe(false);
  });

  test("accumulates multi-line EXAM TIP with bullets (Chapter 18 case)", () => {
    const md = `> **EXAM TIP:**
> - **Heat Syndromes Matrix:**
>   - *Heat Syncope:* Normal temperature, peripheral pooling.
>   - *Heat Stroke:* Core temp > 40.5 C, anhydrosis.`;

    const blocks = parseMarkdown(md);
    const examTipBlocks = blocks.filter((b) => b.type === "exam_tip");
    expect(examTipBlocks).toHaveLength(1);
    expect(examTipBlocks[0].text).toContain("- **Heat Syndromes Matrix:**");
    expect(examTipBlocks[0].text).toContain("Heat Syncope");
    expect(examTipBlocks[0].text).toContain("Heat Stroke");
  });

  test("parses regular non-exam-tip blockquote into blockquote block", () => {
    const md = `> "Primum non nocere."
> - Hippocrates`;

    const blocks = parseMarkdown(md);
    const quoteBlocks = blocks.filter((b) => b.type === "blockquote");
    expect(quoteBlocks).toHaveLength(1);
    expect(quoteBlocks[0].text).toContain("Primum non nocere.");
    expect(quoteBlocks[0].text).toContain("- Hippocrates");
  });
});
