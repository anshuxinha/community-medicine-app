import React from "react";

// Mock @expo/vector-icons to prevent FontLoader/expo-asset resolution failures in Jest
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MaterialIcons: (props) => React.createElement(View, props),
  };
});

// Mock safe area insets
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

import { parseMarkdown } from "../ReadingView";

describe("ReadingView list indentation under parent points", () => {
  test("indents bullet lists immediately under a numbered parent point", () => {
    const md = `1. Disease Control Phase (1880-1920)
- **Primary Focus:** Sanitary legislation and hygiene.
- **Key Interventions:** Municipal garbage and sewage disposal.`;

    const blocks = parseMarkdown(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      type: "body",
      text: "1. Disease Control Phase (1880-1920)",
    });
    expect(blocks[1].type).toBe("bullets");
    expect(blocks[1].indented).toBe(true);
    expect(blocks[1].items).toHaveLength(2);
    expect(blocks[1].items[0]).toContain("Primary Focus");
  });

  test("indents bullet lists under numbered parent point separated by a blank line", () => {
    const md = `1. Disease Control Phase (1880-1920)

- **Primary Focus:** Sanitary legislation.
- **Key Interventions:** Municipal disposal.`;

    const blocks = parseMarkdown(md);
    const bulletBlock = blocks.find((b) => b.type === "bullets");
    expect(bulletBlock).toBeDefined();
    expect(bulletBlock.indented).toBe(true);
    expect(bulletBlock.items).toHaveLength(2);
  });

  test("maintains indentation across multiple numbered parent points", () => {
    const md = `1. Disease Control Phase
- Focus: Sanitation
2. Health Promotional Phase
- Focus: Personal health`;

    const blocks = parseMarkdown(md);
    const bullets = blocks.filter((b) => b.type === "bullets");
    expect(bullets).toHaveLength(2);
    expect(bullets[0].indented).toBe(true);
    expect(bullets[1].indented).toBe(true);
  });

  test("does NOT indent root-level bullets under a normal paragraph", () => {
    const md = `Public health operates at the population level.

- **Primary Focus:** Environmental sanitation.
- **Key Interventions:** Safe drinking water.`;

    const blocks = parseMarkdown(md);
    const bulletBlock = blocks.find((b) => b.type === "bullets");
    expect(bulletBlock).toBeDefined();
    expect(bulletBlock.indented).toBe(false);
  });

  test("does NOT indent sibling numbered points without sublists", () => {
    const md = `1. Sanitation of the environment
2. Control of community infections
3. Personal hygiene education`;

    const blocks = parseMarkdown(md);
    expect(blocks).toHaveLength(3);
    blocks.forEach((b) => {
      expect(b.type).toBe("body");
      expect(b.indented).toBeFalsy();
    });
  });

  test("indents sub-numbered / lettered items under a parent point", () => {
    const md = `1. Primary Prevention:
a. Health Promotion
b. Specific Protection`;

    const blocks = parseMarkdown(md);
    expect(blocks[0]).toEqual({
      type: "body",
      text: "1. Primary Prevention:",
    });
    expect(blocks[1]).toEqual({
      type: "body",
      text: "a. Health Promotion",
      indented: true,
    });
    expect(blocks[2]).toEqual({
      type: "body",
      text: "b. Specific Protection",
      indented: true,
    });
  });

  test("handles explicitly indented bullets (2+ spaces) as nested_bullets", () => {
    const md = `- Top-level bullet
  - Indented sub-bullet 1
  - Indented sub-bullet 2`;

    const blocks = parseMarkdown(md);
    const nestedBlock = blocks.find((b) => b.type === "nested_bullets");
    expect(nestedBlock).toBeDefined();
    expect(nestedBlock.items).toHaveLength(2);
  });

  test("indents numbered list items under a parent bullet point (Winslow definition case)", () => {
    const md = `- **Public health definition for:**
  1. Sanitation of the environment,
  2. Control of community infections,
  3. Education of the individual in principles of personal hygiene,
  4. Organisation of medical and nursing services, and
  5. Development of the social machinery`;

    const blocks = parseMarkdown(md);
    expect(blocks[0].type).toBe("bullets");
    for (let i = 1; i <= 5; i++) {
      expect(blocks[i].type).toBe("body");
      expect(blocks[i].indented).toBe(true);
      expect(blocks[i].text).toMatch(new RegExp(`^${i}\\.`));
    }
  });

  test("indents numbered list starting with 1. immediately following a bullet without spaces", () => {
    const md = `- **Four Cardinal Principles of Primary Health Care:**
1. Equitable Distribution
2. Community Participation
3. Intersectoral Coordination
4. Appropriate Technology`;

    const blocks = parseMarkdown(md);
    expect(blocks[0].type).toBe("bullets");
    for (let i = 1; i <= 4; i++) {
      expect(blocks[i].type).toBe("body");
      expect(blocks[i].indented).toBe(true);
      expect(blocks[i].text).toMatch(new RegExp(`^${i}\\.`));
    }
  });
});
