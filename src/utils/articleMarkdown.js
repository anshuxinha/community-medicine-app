import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, Divider } from "react-native-paper";
import { theme } from "../styles/theme";

/**
 * Tokenize a line of text for inline markdown formatting (**bold**, *italic*).
 * @param {string} text 
 * @returns {Array<{ type: "text" | "bold" | "italic", content: string }>}
 */
export function tokenizeInline(text) {
  if (!text) return [];

  const tokens = [];
  // Match bold (**text**) or italic (*text*)
  const regex = /(\*\*[^\*\n]+?\*\*|\*[^\*\n]+?\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      tokens.push({
        type: "bold",
        content: matchedStr.slice(2, -2),
      });
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      tokens.push({
        type: "italic",
        content: matchedStr.slice(1, -1),
      });
    } else {
      tokens.push({
        type: "text",
        content: matchedStr,
      });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return tokens;
}

/**
 * Parses markdown article text into an array of structured blocks.
 * Supports:
 *  - ## H2, ### H3, #### H4
 *  - > Callout / blockquote
 *  - - / * / • Bullet lists (with nested indentation)
 *  - 1. Numbered lists
 *  - --- Horizontal dividers
 *  - Regular paragraphs
 * 
 * @param {string} content 
 * @returns {Array<Object>}
 */
export function parseArticleMarkdown(content) {
  if (!content || typeof content !== "string") return [];

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let currentQuoteLines = [];
  let currentParagraphLines = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(" ").trim();
      if (text) {
        blocks.push({ type: "p", text });
      }
      currentParagraphLines = [];
    }
  };

  const flushQuote = () => {
    if (currentQuoteLines.length > 0) {
      const text = currentQuoteLines.join("\n").trim();
      if (text) {
        blocks.push({ type: "quote", text });
      }
      currentQuoteLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      flushQuote();
      flushParagraph();
      continue;
    }

    // Callout / Blockquote (> ...)
    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quoteText = trimmed.replace(/^>\s?/, "");
      currentQuoteLines.push(quoteText);
      continue;
    } else if (currentQuoteLines.length > 0) {
      flushQuote();
    }

    // Horizontal Rule (--- or ***)
    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "hr" });
      continue;
    }

    // Headings (##, ###, ####, #)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      const type = level === 1 || level === 2 ? "h2" : level === 3 ? "h3" : "h4";
      blocks.push({ type, text: headingText });
      continue;
    }

    // Numbered list item: 1. or 1)
    const numberedMatch = rawLine.match(/^(\s*)(\d+[\.\)])\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      const indent = numberedMatch[1].length;
      const depth = Math.min(2, Math.floor(indent / 2));
      const number = numberedMatch[2];
      const text = numberedMatch[3].trim();
      blocks.push({ type: "numbered", number, text, depth });
      continue;
    }

    // Bullet list item: - or * or • or ◦
    const bulletMatch = rawLine.match(/^(\s*)(?:[-*•◦]|\u2022|\u25E6)\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      const indent = bulletMatch[1].length;
      const depth = Math.min(2, Math.floor(indent / 2));
      const text = bulletMatch[2].trim();
      blocks.push({ type: "bullet", text, depth });
      continue;
    }

    // Regular line - accumulate into current paragraph
    currentParagraphLines.push(trimmed);
  }

  flushQuote();
  flushParagraph();

  return blocks;
}

/**
 * Render inline tokens into Text elements.
 */
export function renderInlineTokens(tokens, { baseStyle, boldStyle, italicStyle }) {
  return tokens.map((token, index) => {
    if (token.type === "bold") {
      return (
        <Text key={`b_${index}`} style={boldStyle}>
          {token.content}
        </Text>
      );
    }
    if (token.type === "italic") {
      return (
        <Text key={`i_${index}`} style={italicStyle}>
          {token.content}
        </Text>
      );
    }
    return (
      <Text key={`t_${index}`} style={baseStyle}>
        {token.content}
      </Text>
    );
  });
}

/**
 * Component to render markdown article with proper visual hierarchy, subheadings, and lists.
 */
export function ArticleMarkdownView({ content, colors, baseFontSize = 15.5 }) {
  const blocks = React.useMemo(() => parseArticleMarkdown(content), [content]);

  if (!blocks || blocks.length === 0) {
    return null;
  }

  const pStyle = {
    fontSize: baseFontSize,
    lineHeight: baseFontSize * 1.55,
    color: colors?.textBody || "#334155",
  };
  const boldStyle = {
    fontWeight: "700",
    color: colors?.textTitle || "#0F172A",
  };
  const italicStyle = {
    fontStyle: "italic",
    color: colors?.textBody || "#334155",
  };

  return (
    <View style={markdownStyles.container}>
      {blocks.map((block, idx) => {
        if (block.type === "h2") {
          const tokens = tokenizeInline(block.text);
          return (
            <View key={`h2_${idx}`} style={markdownStyles.h2Container}>
              <View
                style={[
                  markdownStyles.h2AccentBar,
                  { backgroundColor: theme.colors.secondary },
                ]}
              />
              <Text
                style={[
                  markdownStyles.h2Text,
                  { color: colors?.textTitle || "#0F172A" },
                ]}
              >
                {renderInlineTokens(tokens, {
                  baseStyle: markdownStyles.h2Text,
                  boldStyle: { fontWeight: "800" },
                  italicStyle,
                })}
              </Text>
            </View>
          );
        }

        if (block.type === "h3") {
          const tokens = tokenizeInline(block.text);
          return (
            <View key={`h3_${idx}`} style={markdownStyles.h3Container}>
              <Text
                style={[
                  markdownStyles.h3Text,
                  { color: colors?.textTitle || "#0F172A" },
                ]}
              >
                {renderInlineTokens(tokens, {
                  baseStyle: markdownStyles.h3Text,
                  boldStyle: { fontWeight: "800" },
                  italicStyle,
                })}
              </Text>
            </View>
          );
        }

        if (block.type === "h4") {
          const tokens = tokenizeInline(block.text);
          return (
            <View key={`h4_${idx}`} style={markdownStyles.h4Container}>
              <Text
                style={[
                  markdownStyles.h4Text,
                  { color: colors?.textSecondary || "#475569" },
                ]}
              >
                {renderInlineTokens(tokens, {
                  baseStyle: markdownStyles.h4Text,
                  boldStyle: { fontWeight: "700" },
                  italicStyle,
                })}
              </Text>
            </View>
          );
        }

        if (block.type === "quote") {
          const tokens = tokenizeInline(block.text);
          return (
            <View
              key={`q_${idx}`}
              style={[
                markdownStyles.quoteContainer,
                {
                  backgroundColor: colors?.surfaceElevated || "#F8FAFC",
                  borderLeftColor: theme.colors.secondary,
                },
              ]}
            >
              <Text style={markdownStyles.quoteText}>
                {renderInlineTokens(tokens, {
                  baseStyle: [
                    pStyle,
                    { fontStyle: "italic", color: colors?.textBody || "#334155" },
                  ],
                  boldStyle: [boldStyle, { fontStyle: "normal" }],
                  italicStyle,
                })}
              </Text>
            </View>
          );
        }

        if (block.type === "bullet") {
          const tokens = tokenizeInline(block.text);
          return (
            <View
              key={`b_${idx}`}
              style={[
                markdownStyles.listRow,
                { paddingLeft: (block.depth || 0) * 16 },
              ]}
            >
              <View
                style={[
                  markdownStyles.bulletDot,
                  { backgroundColor: theme.colors.secondary },
                  block.depth > 0 && {
                    width: 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: colors?.textTertiary || "#94A3B8",
                  },
                ]}
              />
              <Text style={[markdownStyles.listText, pStyle]}>
                {renderInlineTokens(tokens, {
                  baseStyle: pStyle,
                  boldStyle,
                  italicStyle,
                })}
              </Text>
            </View>
          );
        }

        if (block.type === "numbered") {
          const tokens = tokenizeInline(block.text);
          return (
            <View
              key={`n_${idx}`}
              style={[
                markdownStyles.listRow,
                { paddingLeft: (block.depth || 0) * 16 },
              ]}
            >
              <Text
                style={[
                  markdownStyles.numberPrefix,
                  { color: theme.colors.secondary },
                ]}
              >
                {block.number}
              </Text>
              <Text style={[markdownStyles.listText, pStyle]}>
                {renderInlineTokens(tokens, {
                  baseStyle: pStyle,
                  boldStyle,
                  italicStyle,
                })}
              </Text>
            </View>
          );
        }

        if (block.type === "hr") {
          return (
            <Divider
              key={`hr_${idx}`}
              style={[
                markdownStyles.hr,
                { backgroundColor: colors?.border || "#E2E8F0" },
              ]}
            />
          );
        }

        // Paragraph (type === "p")
        const tokens = tokenizeInline(block.text);
        return (
          <Text key={`p_${idx}`} style={[markdownStyles.paragraph, pStyle]}>
            {renderInlineTokens(tokens, {
              baseStyle: pStyle,
              boldStyle,
              italicStyle,
            })}
          </Text>
        );
      })}
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  container: {
    width: "100%",
  },
  h2Container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 10,
  },
  h2AccentBar: {
    width: 4,
    height: "85%",
    borderRadius: 2,
    marginRight: 8,
  },
  h2Text: {
    flex: 1,
    fontSize: 18.5,
    lineHeight: 25,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  h3Container: {
    marginTop: 18,
    marginBottom: 6,
  },
  h3Text: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  h4Container: {
    marginTop: 12,
    marginBottom: 4,
  },
  h4Text: {
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: "600",
  },
  paragraph: {
    marginBottom: 12,
  },
  quoteContainer: {
    borderLeftWidth: 3.5,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 12,
  },
  quoteText: {
    fontSize: 15,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  numberPrefix: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: "700",
    minWidth: 22,
    marginRight: 6,
  },
  listText: {
    flex: 1,
  },
  hr: {
    height: 1,
    marginVertical: 18,
  },
});
