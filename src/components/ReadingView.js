import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  useWindowDimensions,
  Pressable,
  TextInput,
  Platform,
  ToastAndroid,
  Alert,
  Clipboard,
  KeyboardAvoidingView,
  Keyboard,
  LayoutAnimation,
  UIManager,
  InteractionManager,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemedStyles } from '../styles/useThemedStyles';
import { normalizeUpdatedSnippet } from "../utils/contentRegistry";
import {
  makeMarkdownParseCacheKey,
  markdownParseCache,
} from "../utils/markdownParseCache";
import { ALL_ORIENTATIONS } from "../constants/orientations";
import ThemeModePill from "./ThemeModePill";
import {
  extractCopyWord,
  hasSeenWordCopyHint,
  markWordCopyHintSeen,
  splitCopyablePieces,
} from "../utils/copyWord";
import {
  exerciseHeaderTitle,
  hasExerciseMarkup,
  isExerciseMarkupLine,
  splitExerciseSegments,
} from "../utils/libraryExerciseMarkup";
import {
  collectChapterSearchMatches,
  collectOccurrences,
  lineYForCharOffset,
  matchYFromHostLayout,
  normalizeSearchQuery,
} from "../utils/chapterSearch";
import { splitSentences } from "../utils/splitSentences";
import { classifyReadingEnd, SHORT_CONTENT_TOLERANCE } from "../utils/readingEnd";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const stripBold = (text) => text.replace(/\*\*(.+?)\*\*/g, "$1");
const normalizeAnchorText = (text = "") =>
  stripBold(String(text)).replace(/\s+/g, " ").trim().toLowerCase();



// Matches: "Grade A ★★★★★ | Asked 20x | NTRUHS SPM Paper I" style headings
const isNtruHsHeading = (text) =>
  /Grade [A-C].*Asked.*x/i.test(text) || /NTRUHS/i.test(text);

// Matches standalone metadata lines from the PDF extractor (body lines to skip)
const isNtruHsMetaLine = (text) =>
  /NTRUHS/i.test(text) ||
  /^\(?\s*Frequency:\s*\d+\s+Times?\s+Asked/i.test(text) ||
  /^Detailed Model Answers for Q\d/i.test(text) ||
  /GRADE [A-C] Priority/i.test(text) ||
  /^—\s*End of Document/i.test(text) ||
  /^— END OF GOLD MEDAL/i.test(text) ||
  /^Prepared with Gold (Standard|Medal)/i.test(text) ||
  /^COMMUNITY MEDICINE\b.*GOLD MEDAL/i.test(text);

// A "question wrapper" table: 3 cols, all headers empty, only middle col of data rows has text.
const extractQuestionTable = (headers, rows) => {
  if (headers.length !== 3) return null;
  if (headers.some((h) => h.trim() !== "")) return null;
  // Each data row: col[0] and col[2] are empty; col[1] has the text (or all empty = spacer)
  const textParts = [];
  for (const row of rows) {
    const mid = (row[1] || "").trim();
    if (mid) textParts.push(mid);
  }
  if (textParts.length === 0) return null;
  return textParts.join(" ");
};

// Build a set of all non-empty cell values from a table block, for dedup.
const buildTableCellSet = (block) => {
  const set = new Set();
  if (block.type === "table") {
    block.headers.forEach((h) => { if (h.trim()) set.add(h.trim()); });
    block.rows.forEach((row) => row.forEach((c) => { if (c && c.trim()) set.add(c.trim()); }));
  } else if (block.type === "question") {
    // question blocks don't need dedup tracking
  }
  return set;
};

// Full-line exam markup used by library-chapter-review (must never become table cells).
const isExamMarkupLine = (line = "") => {
  const t = String(line).trim();
  if (!t) return false;
  if (/^\[(SN|LAQ|EXAMTIP|REF|EX|ANS)\]/i.test(t)) return true;
  if (/\[\/(SN|LAQ|EXAMTIP|REF|EX|ANS)\]/i.test(t)) return true;
  if (isExerciseMarkupLine(t)) return true;
  return false;
};

const parseTextTable = (lines, startIndex) => {
  const n = lines.length;
  let i = startIndex;
  
  // Collect headers (consecutive non-empty lines, each < 60 chars, not starting with special chars)
  const headers = [];
  while (i < n && lines[i].trim() && lines[i].trim().length < 60) {
    const line = lines[i].trim();
    // Exam tags / REF lines are never table headers (e.g. [SN]Topic[/SN] + TITLE)
    if (isExamMarkupLine(line)) {
      break;
    }
    // Skip lines that are clearly not headers
    if (line.startsWith("Q") || line.startsWith("A)") || line.startsWith("-") || 
        line.startsWith("•") || line.startsWith("◦") || line.startsWith("#") || 
        line.startsWith("##") || line.startsWith("!") || line.startsWith(">") ||
        line.startsWith("|")) {
      break;
    }
    // Numbered list items (1. 2. 25.1.5 etc) are lists, not table headers
    if (/^\d+[\.\)](?:\d+[\.\)])*\d*\s/.test(line)) {
      break;
    }
    // MockData section keywords — structural headings, never table columns
    if (/^(CORE CONCEPTS|FORMULAS AND CALCULATIONS|MNEMONICS|KEY POINTS|NOT APPLICABLE|OVERVIEW|SOLVED EXERCISES)\b/.test(line)) {
      break;
    }
    // ALL-CAPS section titles are headings, not table column headers
    if (line.length < 60 && line === line.toUpperCase() && /[A-Z]/.test(line) && !line.includes("|")) {
      break;
    }
    headers.push(line);
    i++;
  }
  
  // Need 2+ headers to be a table
  if (headers.length < 2) return null;
  // Safety: never promote exam markup into a synthetic table
  if (headers.some((h) => isExamMarkupLine(h))) return null;
  
  // Skip empty lines after headers
  while (i < n && !lines[i].trim()) {
    i++;
  }
  
  // Collect data cells (non-empty lines, empty lines separate cells)
  const dataCells = [];
  while (i < n) {
    const line = lines[i].trim();
    
    // Stop if we hit a section header
    if (!line) {
      i++;
      continue;
    }

    if (isExamMarkupLine(line)) {
      break;
    }
    
    if (line.startsWith("Q") || line.startsWith("A)") || line.startsWith("#") || 
        line.startsWith("##") || line.startsWith("!") || line.startsWith(">") ||
        line.startsWith("|") || line.startsWith("-") || line.startsWith("•") ||
        line.startsWith("◦")) {
      break;
    }
    if (/^(Introduction|Detailed|Critical|Advantages|Limitations|Relevance)/i.test(line)) {
      break;
    }
    // Block numbered list items (1. 2. 3. 25.1.5 etc) which are lists, not table cells
    if (/^\d+[\.\)](?:\d+[\.\)])*\d*\s/.test(line)) {
      break;
    }
    // Block mockData section keywords that should never be table data
    if (/^(CORE CONCEPTS|FORMULAS AND CALCULATIONS|MNEMONICS|NOT APPLICABLE)\b/.test(line)) {
      break;
    }
    // Block ALL-CAPS short lines (section headings that shouldn't become table cells)
    if (line.length < 50 && line === line.toUpperCase() && /[A-Z]/.test(line)) {
      break;
    }
    
    dataCells.push(line);
    i++;
    
    // Skip empty line after cell
    if (i < n && !lines[i].trim()) {
      i++;
    }
  }
  
  // Validate: need enough data cells (at least one row)
  if (dataCells.length < headers.length) return null;
  
  return { headers, dataCells, endIndex: i };
};

const preprocessTextTables = (content) => {
  const lines = content.split("\n");
  const n = lines.length;
  const newLines = [];
  let i = 0;

  while (i < n) {
    const line = lines[i].trim();
    
    // Check if this could be the start of a text table
    // Headers: non-empty, <60 chars, not starting with special chars / exam tags
    let isTableStart = line && line.length < 60 && 
        !isExamMarkupLine(line) &&
        !line.startsWith("Q") && !line.startsWith("A)") && !line.startsWith("-") && 
        !line.startsWith("•") && !line.startsWith("◦") && !line.startsWith("#") && 
        !line.startsWith("##") && !line.startsWith("!") && !line.startsWith(">") &&
        !line.startsWith("|") &&
        !(line === line.toUpperCase() && /[A-Z]/.test(line));
    
    if (isTableStart) {
      // Try to parse a text table starting at i
      const table = parseTextTable(lines, i);
      
      if (table) {
        // We have a table! Convert to markdown
        newLines.push(""); // blank line before table
        // Header row
        newLines.push("| " + table.headers.join(" | ") + " |");
        // Separator row
        newLines.push("| " + table.headers.map(() => "---").join(" | ") + " |");
        // Data rows
        for (let j = 0; j < table.dataCells.length; j += table.headers.length) {
          const row = table.dataCells.slice(j, j + table.headers.length);
          // Pad if necessary
          while (row.length < table.headers.length) row.push("");
          newLines.push("| " + row.join(" | ") + " |");
        }
        newLines.push(""); // blank line after table
        
        // Skip past the table
        i = table.endIndex;
        continue;
      }
      // If we get here, table is null - fall through to add line
    }
    
    // Not a table start or table parsing failed, add the line
    newLines.push(lines[i]);
    i++;
  }

  return newLines.join("\n");
};

const parseMarkdown = (content, { isGem = false, skipExercises = false } = {}) => {
  if (!skipExercises && hasExerciseMarkup(content)) {
    const parts = splitExerciseSegments(content);
    if (parts.some((part) => part.type === "exercise")) {
      const nested = [];
      parts.forEach((part) => {
        if (part.type === "text") {
          if (part.text && part.text.trim()) {
            nested.push(
              ...parseMarkdown(part.text, { isGem, skipExercises: true }),
            );
          }
        } else {
          nested.push({
            type: "exercise",
            id: part.id,
            question: part.question,
            answerBlocks: parseMarkdown(part.answer || "", {
              isGem,
              skipExercises: true,
            }),
          });
        }
      });
      return nested;
    }
  }

  // Library exam markup ([SN]/[LAQ]/[EXAMTIP]/[EX]) must never go through the
  // aggressive text-table heuristic — short tag lines + titles become fake tables.
  const hasExamMarkup = /\[(?:SN|LAQ|EXAMTIP|REF|EX|ANS)\]/i.test(content || "");
  const processedContent =
    isGem || hasExamMarkup ? content : preprocessTextTables(content);
  const lines = processedContent.split("\n");
  const rawBlocks = [];
  let bulletGroup = [];
  let nestedGroup = [];
  let tableLines = [];
  let lastTableCells = [];

  const flushBullets = () => {
    if (bulletGroup.length > 0) {
      rawBlocks.push({ type: "bullets", items: [...bulletGroup] });
      bulletGroup = [];
    }
  };

  const flushNested = () => {
    if (nestedGroup.length > 0) {
      rawBlocks.push({ type: "nested_bullets", items: [...nestedGroup] });
      nestedGroup = [];
    }
  };

  const flushTable = () => {
    if (tableLines.length < 2) {
      tableLines.forEach((l) => rawBlocks.push({ type: "body", text: l }));
      tableLines = [];
      return;
    }
    const parseRow = (row) =>
      row
        .split("|")
        .map((c) => c.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1);  // Remove first/last (from leading/trailing |)
    let headers = parseRow(tableLines[0]);
    let rows = tableLines.slice(2).map(parseRow);

    // Filter out separator artifact rows (rows where every cell is just dashes)
    rows = rows.filter(row => {
      const nonEmptyCells = row.filter(c => c.trim());
      if (nonEmptyCells.length === 0) return false;
      if (nonEmptyCells.every(c => /^-+$/.test(c))) return false;
      return true;
    });

    // Check if it's a question-wrapper table
    const questionText = extractQuestionTable(headers, rows);
    if (questionText !== null) {
      rawBlocks.push({ type: "question", text: questionText });
      tableLines = [];
      return;
    }

    // Strip empty padding columns from PDF-extracted tables
    // First, find which columns have any non-empty content
    const nonEmptyCols = [];
    for (let col = 0; col < headers.length; col++) {
      let allEmpty = true;
      if (headers[col] && headers[col].trim()) allEmpty = false;
      for (const row of rows) {
        if (row[col] && row[col].trim()) allEmpty = false;
      }
      if (!allEmpty) nonEmptyCols.push(col);
    }
    
    if (nonEmptyCols.length > 0) {
      const newHeaders = nonEmptyCols.map((col) => headers[col]);
      const newRows = [];
      for (const row of rows) {
        const newRow = nonEmptyCols.map((col) => row[col] || "");
        newRows.push(newRow);
      }
      
      // Merge continuation rows: if a row has only content in last column(s)
      // and previous row exists, merge into previous row's last cell
      const mergedRows = [];
      for (const row of newRows) {
        const hasContent = row.some((c) => c.trim());
        if (!hasContent) continue;
        
        // Check if this looks like a continuation: only the last column(s) have content
        const firstContentIdx = row.findIndex(c => c.trim());
        const lastContentIdx = row.length - 1 - [...row].reverse().findIndex(c => c.trim());
        const isContinuation = mergedRows.length > 0 && 
          firstContentIdx >= Math.floor(row.length / 2) &&
          row.slice(0, Math.floor(row.length / 2)).every(c => !c.trim());
        
        if (isContinuation) {
          const prev = mergedRows[mergedRows.length - 1];
          const continuationText = row.filter(c => c.trim()).join(" ");
          if (continuationText) {
            prev[prev.length - 1] += " " + continuationText;
          }
        } else {
          mergedRows.push(row);
        }
      }
      
      if (nonEmptyCols.length < headers.length) {
        // Only rebuild if we actually stripped columns
        headers = newHeaders;
        rows = mergedRows;
      } else {
        // Columns unchanged but we still want merged rows
        rows = mergedRows;
      }
    }

    rawBlocks.push({ type: "table", headers, rows });
    // Store flattened cell values for duplicate detection
    lastTableCells = [];
    headers.forEach((h) => { if (h.trim()) lastTableCells.push(h.trim()); });
    rows.forEach((row) => row.forEach((c) => { if (c && c.trim()) lastTableCells.push(c.trim()); }));
    tableLines = [];
  };

  const isTableRow = (line) => line.trim().startsWith("|") && line.trim().endsWith("|");

  for (const line of lines) {
    if (isTableRow(line)) {
      flushBullets();
      flushNested();
      tableLines.push(line);
      continue;
    } else if (tableLines.length > 0) {
      flushTable();
    }

    // Skip lines that duplicate the last table's content
    if (lastTableCells.length > 0) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const cellIndex = lastTableCells.indexOf(trimmedLine);
        if (cellIndex !== -1) {
          lastTableCells.splice(cellIndex, 1);
          continue;
        } else {
          // No match, reset tracker
          lastTableCells = [];
        }
      }
    }

    const trimmedLine = line.trim();
    const tableTitleMatch = trimmedLine.match(/^\*\*Table\s+\d+(?:\.\d+)?\s*(.*?)\*\*$/i);
    const refMatch = trimmedLine.match(/^\[REF\]([\s\S]*?)\[\/REF\]$/i);
    // Fixed exam tags — colours documented in .grok/skills/library-chapter-review/references/tag-format.md
    // Allow optional surrounding whitespace inside markers; tip body may include arrows/quotes.
    const snTagMatch = trimmedLine.match(/^\[SN\]([\s\S]*?)\[\/SN\]$/i);
    const laqTagMatch = trimmedLine.match(/^\[LAQ\]([\s\S]*?)\[\/LAQ\]$/i);
    const examTipMatch = trimmedLine.match(/^\[EXAMTIP\]([\s\S]*?)\[\/EXAMTIP\]$/i);

    if (line.startsWith("# ")) {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "h1", text: line.replace(/^# /, "") });
    } else if (line.startsWith("## ")) {
      flushBullets();
      flushNested();
      const rawH2 = line.replace(/^## /, "");
      const h2Text = stripBold(rawH2);
      // Skip NTRUHS/grade headings entirely
      if (!isNtruHsHeading(h2Text)) {
        rawBlocks.push({ type: "h2", text: rawH2 });
      }
    } else if (/^  - /.test(line)) {
      flushBullets();
      const bText = line.replace(/^  - /, "").trim();
      if (bText) nestedGroup.push(bText);
    } else if (/^[*\u2022-] /.test(line)) {
      flushNested();
      const bText = line.replace(/^[*\u2022-] /, "").trim();
      if (bText) bulletGroup.push(bText);
    } else if (line.match(/^!\[(.*?)\]\((.*?)\)$/)) {
      flushBullets();
      flushNested();
      const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      rawBlocks.push({ type: "image", url: match[2], alt: match[1] });
    } else if (line.trim().match(/^\*\[Image Placeholders?:\s*(.+?)\]\*$/)) {
      flushBullets();
      flushNested();
      continue;
    } else if (tableTitleMatch) {
      flushBullets();
      flushNested();
      const tableTitle = tableTitleMatch[1]?.trim();
      rawBlocks.push({ type: "tableTitle", text: tableTitle ? `Table: ${tableTitle}` : "Table" });
    } else if (refMatch) {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "reference", text: refMatch[1].trim() });
    } else if (snTagMatch) {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "exam_sn", text: snTagMatch[1].trim() });
    } else if (laqTagMatch) {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "exam_laq", text: laqTagMatch[1].trim() });
    } else if (examTipMatch) {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "exam_tip", text: examTipMatch[1].trim() });
    } else if (line.trim() === "") {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "spacing" });
    } else if (line.startsWith("> ")) {
      flushBullets();
      flushNested();
      const quoteText = line.replace(/^>\s*/, "");
      // Prefer dedicated exam-tip box when blockquote is an exam tip
      const tipFromQuote = quoteText.match(/^\*\*EXAM\s*TIP:\*\*\s*(.*)$/i)
        || quoteText.match(/^EXAM\s*TIP:\s*(.*)$/i);
      if (tipFromQuote) {
        rawBlocks.push({ type: "exam_tip", text: (tipFromQuote[1] || "").trim() || quoteText });
      } else {
        rawBlocks.push({ type: "blockquote", text: quoteText });
      }
    } else {
      const bodyText = line;
      const strippedBody = stripBold(bodyText).trim();
      // Fallback: full-line EXAMTIP that failed earlier match (e.g. odd whitespace)
      const looseTip = strippedBody.match(/^\[EXAMTIP\]\s*([\s\S]*?)\s*\[\/EXAMTIP\]$/i);
      if (looseTip) {
        flushBullets();
        flushNested();
        rawBlocks.push({ type: "exam_tip", text: looseTip[1].trim() });
      // Continuation of a bullet: non-empty, starts with lowercase, currently accumulating bullets
      } else if (bulletGroup.length > 0 && strippedBody && /^[a-z]/.test(strippedBody)) {
        bulletGroup[bulletGroup.length - 1] += " " + bodyText.trim();
      } else if (nestedGroup.length > 0 && strippedBody && /^[a-z]/.test(strippedBody)) {
        nestedGroup[nestedGroup.length - 1] += " " + bodyText.trim();
      } else {
        flushBullets();
        flushNested();
        if (!isNtruHsMetaLine(stripBold(bodyText))) {
          rawBlocks.push({ type: "body", text: bodyText });
        }
      }
    }
  }

  if (tableLines.length > 0) flushTable();
  flushBullets();
  flushNested();

  // Post-process: remove body lines that duplicate table cell content
  const dedupBlocks = [];
  let recentCellSet = new Set();
  for (const block of rawBlocks) {
    if (block.type === "table") {
      recentCellSet = buildTableCellSet(block);
      dedupBlocks.push(block);
    } else if (block.type === "spacing") {
      dedupBlocks.push(block);
    } else if (
      block.type === "body" &&
      recentCellSet.size > 0 &&
      recentCellSet.has(block.text.trim())
    ) {
      continue;
    } else {
      recentCellSet = new Set();
      dedupBlocks.push(block);
    }
  }

  // Post-process: merge consecutive body blocks where the second starts with lowercase
  const blocks = [];
  for (const block of dedupBlocks) {
    const prev = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    if (
      block.type === "body" &&
      prev &&
      prev.type === "body" &&
      block.text.trim() &&
      /^[a-z(]/.test(block.text.trim())
    ) {
      prev.text = prev.text.trimEnd() + " " + block.text.trim();
    } else {
      blocks.push(block);
    }
  }

  return blocks;
};

const getBlockAnchorText = (block) => {
  if (!block) return "";
  if (block.type === "h1" || block.type === "h2" || block.type === "body" || block.type === "blockquote") {
    return normalizeAnchorText(block.text);
  }
  if (block.type === "bullets" || block.type === "nested_bullets") {
    return (block.items || []).map(item => normalizeAnchorText(item)).join(" ");
  }
  return "";
};

const buildIllustrationBlock = (illustration) => ({
  type: "illustration",
  ...illustration,
});

const mergeBlocksWithIllustrations = (blocks, illustrations = []) => {
  if (!Array.isArray(illustrations) || illustrations.length === 0) {
    return blocks;
  }

  const topBlocks = [];
  const bottomBlocks = [];
  const beforeMap = new Map();
  const afterMap = new Map();

  illustrations.forEach((illustration) => {
    const normalizedPlacement = illustration.placement || "after";
    const normalizedAnchor = normalizeAnchorText(illustration.anchorText || "");
    const illustrationBlock = buildIllustrationBlock(illustration);

    if (normalizedPlacement === "top") {
      topBlocks.push(illustrationBlock);
      return;
    }

    if (normalizedPlacement === "bottom" || !normalizedAnchor) {
      bottomBlocks.push(illustrationBlock);
      return;
    }

    const targetMap = normalizedPlacement === "before" ? beforeMap : afterMap;
    const bucket = targetMap.get(normalizedAnchor) || [];
    bucket.push(illustrationBlock);
    targetMap.set(normalizedAnchor, bucket);
  });

  const mergedBlocks = [...topBlocks];
  const unmatchedBottomBlocks = [...bottomBlocks];

  // Match section headings, not long overview paragraphs that happen to name the topic.
  // Short anchors such as "DECISION TREES" appear in the overview of 30-6; those
  // paragraphs must not steal the figure from the heading they belong next to.
  const HEADING_LIKE_MAX = 90;
  const doesAnchorMatchBlock = (anchor, block) => {
    if (!anchor || !block) return false;

    const blockText = getBlockAnchorText(block);
    if (!blockText) return false;

    if (blockText === anchor) return true;

    const headingLike = blockText.length <= HEADING_LIKE_MAX;
    const longAnchor = anchor.length >= 40;
    if (!headingLike && !longAnchor) return false;

    if (blockText.includes(anchor)) return true;
    if (headingLike && anchor.includes(blockText) && blockText.length >= 8) return true;

    return false;
  };

  blocks.forEach((block) => {
    for (const [anchor, illustrationBlocks] of beforeMap.entries()) {
      if (doesAnchorMatchBlock(anchor, block)) {
        mergedBlocks.push(...illustrationBlocks);
        beforeMap.delete(anchor);
        break;
      }
    }

    mergedBlocks.push(block);

    for (const [anchor, illustrationBlocks] of afterMap.entries()) {
      if (doesAnchorMatchBlock(anchor, block)) {
        mergedBlocks.push(...illustrationBlocks);
        afterMap.delete(anchor);
        break;
      }
    }
  });

  beforeMap.forEach((value) => {
    unmatchedBottomBlocks.push(...value);
  });
  afterMap.forEach((value) => {
    unmatchedBottomBlocks.push(...value);
  });

  return [...mergedBlocks, ...unmatchedBottomBlocks];
};

const FIT_CONFIRM_MS = 450;
const SCROLL_BOTTOM_PADDING = 80;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveAspectRatio = (source, fallback = 1) => {
  const resolved = source ? Image.resolveAssetSource(source) : null;
  if (resolved?.width && resolved?.height) {
    return clamp(resolved.width / resolved.height, 0.6, 2.4);
  }

  if (typeof fallback === "number" && fallback > 0) {
    return clamp(fallback, 0.6, 2.4);
  }

  return 1;
};

const getContainSize = (aspectRatio, maxWidth, maxHeight) => {
  if (!aspectRatio || maxWidth <= 0 || maxHeight <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const viewportRatio = maxWidth / maxHeight;
  if (aspectRatio >= viewportRatio) {
    return {
      width: maxWidth,
      height: maxWidth / aspectRatio,
    };
  }

  return {
    width: maxHeight * aspectRatio,
    height: maxHeight,
  };
};

const getRotationKey = (source, fallback = "") => {
  if (typeof source === "number") {
    return `asset:${source}`;
  }

  if (source?.uri) {
    return `uri:${source.uri}`;
  }

  return fallback;
};

const getRotatedAspectRatio = (aspectRatio, rotation = 0) => {
  const normalizedTurns = Math.abs(Math.round(rotation / 90)) % 2;
  return normalizedTurns === 1 ? 1 / aspectRatio : aspectRatio;
};

const INITIAL_BLOCK_COUNT = 40;
const BLOCK_CHUNK = 40;

const ReadingView = ({
  content,
  title,
  headerTitle,
  topicId,
  isBookmarked,
  onToggleBookmark,
  highlightedSegments = [],
  showUpdateHighlights = false,
  isGem = false,
  illustrations = [],
  onReachEnd,
  isScreenCapturePrevented = false,
  navigation,
  section,
  annotations = [],
  onSaveAnnotation,
  onDeleteAnnotation,
  userHighlights = {},
  onToggleHighlight,
  searchTerms = "",
  contentKey,
  contentSignature,
}) => {
  const { styles, colors } = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const parseCacheKey = useMemo(
    () =>
      makeMarkdownParseCacheKey({
        contentKey,
        contentSignature,
        isGem,
      }),
    [contentKey, contentSignature, isGem],
  );
  const [blocks, setBlocks] = useState(() => {
    if (!parseCacheKey) return null;
    return markdownParseCache.get(parseCacheKey) || null;
  });
  const parseReady = Array.isArray(blocks);
  const mergedBlocks = useMemo(
    () =>
      mergeBlocksWithIllustrations(parseReady ? blocks : [], illustrations),
    [blocks, illustrations, parseReady],
  );
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);
  const toggleExercise = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedExerciseId((prev) => (prev === id ? null : id));
  }, []);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imageRotationMap, setImageRotationMap] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [viewerZoomScale, setViewerZoomScale] = useState(MIN_ZOOM);
  const [fullscreenRotation, setFullscreenRotation] = useState(0);
  const [fullscreenViewport, setFullscreenViewport] = useState({
    width: windowWidth - 32,
    height: windowHeight * 0.78,
  });
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [annotationText, setAnnotationText] = useState("");
  const [showHighlightsLocal, setShowHighlightsLocal] = useState(showUpdateHighlights);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [wordCopyHintVisible, setWordCopyHintVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BLOCK_COUNT);
  const hasReachedEndRef = useRef(false);
  const isMountedRef = useRef(true);
  const fitTimerRef = useRef(null);
  const onReachEndRef = useRef(onReachEnd);
  const allBlocksVisibleRef = useRef(false);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const blockYMapRef = useRef({});
  const matchYMapRef = useRef({});
  const scrollOffsetYRef = useRef(0);
  const pendingExactScrollRef = useRef(null);
  const scrollViewRef = useRef(null);
  const didScrollToSearchRef = useRef(false);
  const lastProgressEmitRef = useRef(0);
  const lastProgressPctRef = useRef(-1);
  const findInputRef = useRef(null);
  const [findOpen, setFindOpen] = useState(() =>
    Boolean(String(searchTerms || "").trim()),
  );
  const [findQuery, setFindQuery] = useState(() => String(searchTerms || ""));
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const highlightSet = useMemo(
    () =>
      new Set(
        (highlightedSegments || [])
          .map((segment) => normalizeUpdatedSnippet(segment))
          .filter(Boolean),
      ),
    [highlightedSegments],
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (fitTimerRef.current) {
        clearTimeout(fitTimerRef.current);
        fitTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const cached = parseCacheKey
      ? markdownParseCache.get(parseCacheKey)
      : undefined;
    if (cached) {
      setBlocks(cached);
      return undefined;
    }

    setBlocks(null);
    const parseNow = () => {
      const parsed = parseMarkdown(content || "", { isGem });
      if (parseCacheKey) {
        markdownParseCache.set(parseCacheKey, parsed);
      }
      if (isMountedRef.current) {
        setBlocks(parsed);
      }
    };

    if (String(searchTerms || "").trim()) {
      parseNow();
      return undefined;
    }

    const handle = InteractionManager.runAfterInteractions(parseNow);
    return () => handle.cancel();
  }, [content, isGem, parseCacheKey, searchTerms]);

  useEffect(() => {
    hasReachedEndRef.current = false;
    if (fitTimerRef.current) {
      clearTimeout(fitTimerRef.current);
      fitTimerRef.current = null;
    }
    setScrollProgress(0);
    viewportHeightRef.current = 0;
    contentHeightRef.current = 0;
    blockYMapRef.current = {};
    matchYMapRef.current = {};
    scrollOffsetYRef.current = 0;
    pendingExactScrollRef.current = null;
    didScrollToSearchRef.current = false;
    lastProgressEmitRef.current = 0;
    lastProgressPctRef.current = -1;
    const incoming = String(searchTerms || "");
    setFindQuery(incoming);
    setFindOpen(Boolean(incoming.trim()));
    setActiveMatchIndex(0);
    setVisibleCount(incoming.trim() ? Number.MAX_SAFE_INTEGER : INITIAL_BLOCK_COUNT);
  }, [content, title, searchTerms]);

  useEffect(() => {
    if (findQuery.trim()) {
      setVisibleCount(Number.MAX_SAFE_INTEGER);
    }
  }, [findQuery]);

  useEffect(() => {
    if (findQuery.trim()) return undefined;
    if (visibleCount >= mergedBlocks.length) return undefined;
    const handle = InteractionManager.runAfterInteractions(() => {
      setVisibleCount((current) =>
        Math.min(current + BLOCK_CHUNK, mergedBlocks.length),
      );
    });
    return () => handle.cancel();
  }, [visibleCount, mergedBlocks.length, findQuery]);

  const visibleBlocks = useMemo(
    () => mergedBlocks.slice(0, visibleCount),
    [mergedBlocks, visibleCount],
  );
  const allBlocksVisible =
    parseReady && visibleCount >= mergedBlocks.length;
  const scrollBottomPadding = SCROLL_BOTTOM_PADDING + insets.bottom;
  onReachEndRef.current = onReachEnd;
  allBlocksVisibleRef.current = allBlocksVisible;

  const rotateImage = (rotationKey, delta) => {
    if (!rotationKey) {
      return;
    }

    setImageRotationMap((current) => {
      const nextRotation =
        ((((current[rotationKey] || 0) + delta) % 360) + 360) % 360;
      return {
        ...current,
        [rotationKey]: nextRotation,
      };
    });
  };

  const openFullscreenImage = ({ source, alt, aspectRatio, rotationKey }) => {
    const currentRotation = imageRotationMap[rotationKey] || 0;
    setViewerZoomScale(MIN_ZOOM);
    setFullscreenRotation(currentRotation);
    setFullscreenImage({
      source,
      alt,
      aspectRatio,
      rotationKey,
    });
  };

  useEffect(() => {
    if (!fullscreenImage) {
      setViewerZoomScale(MIN_ZOOM);
      setFullscreenRotation(0);
    }
  }, [fullscreenImage]);

  const fullscreenBaseSize = useMemo(() => {
    const originalAspectRatio = resolveAspectRatio(
      fullscreenImage?.source,
      fullscreenImage?.aspectRatio || 1,
    );
    const rotatedAspectRatio = getRotatedAspectRatio(
      originalAspectRatio,
      fullscreenRotation,
    );
    return getContainSize(
      rotatedAspectRatio,
      fullscreenViewport.width,
      fullscreenViewport.height,
    );
  }, [
    fullscreenImage,
    fullscreenRotation,
    fullscreenViewport.height,
    fullscreenViewport.width,
  ]);

  const fullscreenZoomedSize = useMemo(
    () => ({
      width: fullscreenBaseSize.width * viewerZoomScale,
      height: fullscreenBaseSize.height * viewerZoomScale,
    }),
    [fullscreenBaseSize.height, fullscreenBaseSize.width, viewerZoomScale],
  );

  const shouldHighlightText = (text) =>
    showHighlightsLocal &&
    highlightSet.has(normalizeUpdatedSnippet(text || ""));

  const showToast = useCallback((message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  }, []);

  const handleCopyWord = useCallback((rawToken) => {
    const word = extractCopyWord(rawToken);
    if (!word) return;
    try {
      Clipboard.setString(word);
    } catch (error) {
      console.warn("ReadingView: copy word failed", error?.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const seen = await hasSeenWordCopyHint();
      if (!cancelled && !seen) {
        setWordCopyHintVisible(true);
      }
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const dismissWordCopyHint = useCallback(() => {
    setWordCopyHintVisible(false);
    markWordCopyHintSeen();
  }, []);

  const toggleHighlightMode = useCallback(() => {
    setIsHighlightMode((prev) => {
      const next = !prev;
      if (next) {
        setIsAnnotationMode(false);
        showToast("Click on any sentence to highlight it");
      }
      return next;
    });
  }, [showToast]);



  const handleBlockPress = useCallback(
    (blockIndex) => {
      if (!isAnnotationMode) return;
      setEditingAnnotation({ blockIndex, id: null });
      setAnnotationText("");
      setNoteModalVisible(true);
    },
    [isAnnotationMode],
  );

  const handleSaveAnnotation = useCallback(() => {
    if (!annotationText.trim() || !editingAnnotation) return;
    const annotation = {
      id: editingAnnotation.id || `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      blockIndex: editingAnnotation.blockIndex,
      text: annotationText.trim(),
      createdAt: new Date().toISOString(),
    };
    onSaveAnnotation?.(annotation);
    setEditingAnnotation(null);
    setAnnotationText("");
    setNoteModalVisible(false);
    setIsAnnotationMode(false);
  }, [annotationText, editingAnnotation, onSaveAnnotation]);

  const handleDeleteAnnotation = useCallback(
    (annotationId) => {
      onDeleteAnnotation?.(annotationId);
    },
    [onDeleteAnnotation],
  );

  const annotationsByBlock = useMemo(() => {
    const map = {};
    (annotations || []).forEach((a) => {
      if (!map[a.blockIndex]) map[a.blockIndex] = [];
      map[a.blockIndex].push(a);
    });
    return map;
  }, [annotations]);

  const fireReachedEnd = () => {
    if (hasReachedEndRef.current || !isMountedRef.current) {
      return;
    }
    hasReachedEndRef.current = true;
    onReachEndRef.current?.();
  };

  const clearFitTimer = () => {
    if (fitTimerRef.current) {
      clearTimeout(fitTimerRef.current);
      fitTimerRef.current = null;
    }
  };

  const maybeMarkAsReachedEnd = (contentOffsetY, viewportHeight, contentHeight) => {
    if (hasReachedEndRef.current || !isMountedRef.current) {
      return;
    }

    const kind = classifyReadingEnd({
      contentOffsetY,
      viewportHeight,
      contentHeight,
      allBlocksVisible: allBlocksVisibleRef.current,
      bottomPadding: scrollBottomPadding,
    });

    if (kind === "reached") {
      clearFitTimer();
      fireReachedEnd();
      return;
    }

    if (kind !== "pending-fit") {
      clearFitTimer();
      return;
    }

    clearFitTimer();
    const heightAtStart = contentHeight;
    fitTimerRef.current = setTimeout(() => {
      fitTimerRef.current = null;
      if (hasReachedEndRef.current || !isMountedRef.current) {
        return;
      }
      if (contentHeightRef.current > heightAtStart + SHORT_CONTENT_TOLERANCE) {
        return;
      }
      const kindLater = classifyReadingEnd({
        contentOffsetY: scrollOffsetYRef.current,
        viewportHeight: viewportHeightRef.current,
        contentHeight: contentHeightRef.current,
        allBlocksVisible: allBlocksVisibleRef.current,
        bottomPadding: scrollBottomPadding,
      });
      if (kindLater === "reached") {
        fireReachedEnd();
        return;
      }
      if (kindLater !== "pending-fit") {
        return;
      }
      const readableOverflow =
        contentHeightRef.current -
        scrollBottomPadding -
        viewportHeightRef.current;
      if (readableOverflow <= SHORT_CONTENT_TOLERANCE) {
        fireReachedEnd();
      }
    }, FIT_CONFIRM_MS);
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    scrollOffsetYRef.current = contentOffset.y;
    const viewportHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;
    const totalContentHeight = contentHeight - viewportHeight;
    const progress =
      totalContentHeight > 0
        ? Math.min(Math.max(contentOffset.y / totalContentHeight, 0), 1)
        : allBlocksVisibleRef.current
          ? 1
          : 0;

    viewportHeightRef.current = viewportHeight;
    contentHeightRef.current = contentHeight;
    const pct = Math.round(progress * 100);
    const now = Date.now();
    if (
      pct !== lastProgressPctRef.current &&
      (now - lastProgressEmitRef.current >= 80 || pct === 0 || pct === 100)
    ) {
      lastProgressEmitRef.current = now;
      lastProgressPctRef.current = pct;
      setScrollProgress(progress);
    }
    maybeMarkAsReachedEnd(contentOffset.y, viewportHeight, contentHeight);
  };

  const handleLayout = (event) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    maybeMarkAsReachedEnd(
      scrollOffsetYRef.current,
      viewportHeightRef.current,
      contentHeightRef.current,
    );
  };

  const handleContentSizeChange = (_, height) => {
    contentHeightRef.current = height;
    maybeMarkAsReachedEnd(
      scrollOffsetYRef.current,
      viewportHeightRef.current,
      contentHeightRef.current,
    );
    tryScrollToSearchMatch();
  };

  // -- Search term helpers ------------------------------------------------
  const normalizedSearchTerm = normalizeSearchQuery(findQuery);

  const blockContainsSearch = (text) => {
    if (!normalizedSearchTerm || !text) return false;
    return text.toLowerCase().includes(normalizedSearchTerm);
  };

  const searchMatches = useMemo(
    () => collectChapterSearchMatches(mergedBlocks, findQuery),
    [mergedBlocks, findQuery],
  );
  const activeMatchBlockIndex =
    searchMatches[activeMatchIndex]?.blockIndex ?? -1;

  const scrollToMatch = useCallback(
    (matchIndex, { delayed = false } = {}) => {
      const match = searchMatches[matchIndex];
      if (!match || !scrollViewRef.current) return false;
      const matchY = matchYMapRef.current[matchIndex];
      const blockY = blockYMapRef.current[match.blockIndex];
      const y = typeof matchY === "number" ? matchY : blockY;
      if (typeof y !== "number") return false;
      const targetY = Math.max(0, y - 24);
      const run = () => {
        scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      };
      if (delayed) {
        setTimeout(run, 60);
      } else {
        run();
      }
      return typeof matchY === "number";
    },
    [searchMatches],
  );

  const tryScrollToSearchMatch = useCallback(() => {
    if (didScrollToSearchRef.current) return;
    if (searchMatches.length === 0) return;
    if (typeof matchYMapRef.current[activeMatchIndex] !== "number") return;
    if (!scrollToMatch(activeMatchIndex, { delayed: true })) return;
    didScrollToSearchRef.current = true;
  }, [searchMatches, activeMatchIndex, scrollToMatch]);

  const handleFindQueryChange = useCallback((text) => {
    setFindQuery(text);
    setActiveMatchIndex(0);
    matchYMapRef.current = {};
    pendingExactScrollRef.current = null;
    didScrollToSearchRef.current = false;
  }, []);

  const closeFind = useCallback(() => {
    Keyboard.dismiss();
    setFindOpen(false);
    setFindQuery("");
    setActiveMatchIndex(0);
    matchYMapRef.current = {};
    pendingExactScrollRef.current = null;
    didScrollToSearchRef.current = false;
  }, []);

  const toggleFind = useCallback(() => {
    if (findOpen) {
      closeFind();
      return;
    }
    setFindOpen(true);
    setTimeout(() => findInputRef.current?.focus(), 50);
  }, [findOpen, closeFind]);

  const goToMatch = useCallback(
    (direction) => {
      if (searchMatches.length === 0) return;
      Keyboard.dismiss();
      const next =
        (activeMatchIndex + direction + searchMatches.length) %
        searchMatches.length;
      setActiveMatchIndex(next);
      const exact = typeof matchYMapRef.current[next] === "number";
      scrollToMatch(next);
      pendingExactScrollRef.current = exact ? null : next;
    },
    [searchMatches, activeMatchIndex, scrollToMatch],
  );

  useEffect(() => {
    if (!normalizedSearchTerm || searchMatches.length === 0) return undefined;
    didScrollToSearchRef.current = false;
    const timer = setTimeout(() => {
      tryScrollToSearchMatch();
    }, 60);
    const fallback = setTimeout(() => {
      if (didScrollToSearchRef.current) return;
      if (pendingExactScrollRef.current != null) return;
      scrollToMatch(0);
    }, 280);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
    // Re-run when the search set changes, not on next/prev.
  }, [normalizedSearchTerm, searchMatches.length]);

  const renderCopyableSegment = (text, extraStyle, keyPrefix) => {
    // Highlight and Note own the tap. Word-level responders steal those presses.
    if (isHighlightMode || isAnnotationMode) {
      if (extraStyle) {
        return (
          <Text style={extraStyle} selectable={false} contextMenuHidden>
            {text}
          </Text>
        );
      }
      return text;
    }

    const pieces = splitCopyablePieces(text);
    if (pieces.length === 0) return null;
    return pieces.map((piece, i) => {
      if (!piece.copyable) {
        return piece.text;
      }
      return (
        <Text
          key={`${keyPrefix}-${i}`}
          style={extraStyle}
          selectable={false}
          suppressHighlighting
          contextMenuHidden
          onLongPress={() => handleCopyWord(piece.text)}
          delayLongPress={400}
        >
          {piece.text}
        </Text>
      );
    });
  };

  const searchPaint = { index: 0 };

  const renderFormattedText = (text, baseStyle = null, highlightSearch = true) => {
    if (!text) return null;
    const parts = String(text).split(/\*\*/);
    const elements = [];

    const activeSearchTerm = highlightSearch ? normalizedSearchTerm : "";
    const firstMatchIndex = searchPaint.index;
    const hostRef = { current: null };
    const trackMatchY =
      Boolean(activeSearchTerm) &&
      String(text).toLowerCase().includes(activeSearchTerm);

    const commitMatchYs = (lines) => {
      const host = hostRef.current;
      if (!host || typeof host.measureInWindow !== "function") return;
      const starts = collectOccurrences(text, activeSearchTerm);
      if (starts.length === 0) return;
      host.measureInWindow((x, hostY) => {
        const apply = (scrollViewPageY) => {
          starts.forEach((charStart, i) => {
            matchYMapRef.current[firstMatchIndex + i] = matchYFromHostLayout({
              scrollOffsetY: scrollOffsetYRef.current,
              hostPageY: hostY,
              scrollViewPageY,
              lineY: lineYForCharOffset(lines, charStart),
            });
          });
          if (
            activeMatchIndex < firstMatchIndex ||
            activeMatchIndex >= firstMatchIndex + starts.length
          ) {
            return;
          }
          if (!didScrollToSearchRef.current) {
            tryScrollToSearchMatch();
            return;
          }
          if (pendingExactScrollRef.current === activeMatchIndex) {
            pendingExactScrollRef.current = null;
            scrollToMatch(activeMatchIndex);
          }
        };
        const sv = scrollViewRef.current;
        if (sv && typeof sv.measureInWindow === "function") {
          sv.measureInWindow((sx, sy) => apply(sy));
        } else {
          apply(0);
        }
      });
    };

    // Optimization: if no bolding and no search term, wrap words for copy
    if (parts.length === 1 && !activeSearchTerm) {
      const words = renderCopyableSegment(text, undefined, "t");
      if (baseStyle) {
        return (
          <Text style={baseStyle} selectable={false} contextMenuHidden>
            {words}
          </Text>
        );
      }
      return words;
    }

    parts.forEach((part, idx) => {
      if (!part) return;
      const isBold = idx % 2 === 1;
      const boldStyle = isBold ? { fontWeight: "bold" } : undefined;

      if (activeSearchTerm) {
        const lowerPart = part.toLowerCase();
        let lastIdx = 0;
        let sTermIdx = lowerPart.indexOf(activeSearchTerm);
        let subIndex = 0;

        while (sTermIdx !== -1) {
          if (sTermIdx > lastIdx) {
            const subText = part.slice(lastIdx, sTermIdx);
            elements.push(
              <Text key={`${idx}-${subIndex++}`} style={boldStyle} contextMenuHidden>
                {renderCopyableSegment(subText, undefined, `${idx}-p${subIndex}`)}
              </Text>
            );
          }
          const matchText = part.slice(sTermIdx, sTermIdx + activeSearchTerm.length);
          const matchIndex = searchPaint.index;
          searchPaint.index += 1;
          elements.push(
            <Text
              key={`${idx}-${subIndex++}`}
              style={[
                styles.searchTermMatch,
                matchIndex === activeMatchIndex && styles.searchTermMatchCurrent,
                isBold && { fontWeight: "bold" }
              ]}
              contextMenuHidden
            >
              {renderCopyableSegment(matchText, undefined, `${idx}-m${subIndex}`)}
            </Text>
          );
          lastIdx = sTermIdx + activeSearchTerm.length;
          sTermIdx = lowerPart.indexOf(activeSearchTerm, lastIdx);
        }

        if (lastIdx < part.length) {
          const subText = part.slice(lastIdx);
          elements.push(
            <Text key={`${idx}-${subIndex++}`} style={boldStyle} contextMenuHidden>
              {renderCopyableSegment(subText, undefined, `${idx}-t${subIndex}`)}
            </Text>
          );
        }
      } else {
        elements.push(
          <Text key={idx} style={boldStyle} contextMenuHidden>
            {renderCopyableSegment(part, undefined, `b${idx}`)}
          </Text>
        );
      }
    });

    if (baseStyle || trackMatchY) {
      return (
        <Text
          ref={(el) => {
            hostRef.current = el;
          }}
          style={baseStyle}
          selectable={false}
          contextMenuHidden
          onTextLayout={
            trackMatchY
              ? (event) => commitMatchYs(event.nativeEvent.lines)
              : undefined
          }
        >
          {elements}
        </Text>
      );
    }
    return elements;
  };

  const renderBlock = (block, index) => {
    switch (block.type) {
      case "h1": {
        const highlighted = shouldHighlightText(block.text);
        const hlKey = `${index}`;
        const userHighlighted = userHighlights[hlKey];
        const inner = (
          <View
            key={index}
            style={[highlighted ? styles.highlightBlock : null, userHighlighted ? styles.userHighlightBlock : null]}
            
          >
            {renderFormattedText(block.text, styles.h1)}
          </View>
        );
        return (
          <Pressable key={index} disabled={!isHighlightMode} onPress={() => onToggleHighlight(hlKey)}>
            {inner}
          </Pressable>
        );
      }
      case "h2": {
        const highlighted = shouldHighlightText(block.text);
        const hlKey = `${index}`;
        const userHighlighted = userHighlights[hlKey];
        const inner = (
          <View
            key={index}
            style={[highlighted ? styles.highlightBlock : null, userHighlighted ? styles.userHighlightBlock : null]}
            
          >
            {renderFormattedText(block.text, styles.h2)}
          </View>
        );
        return (
          <Pressable key={index} disabled={!isHighlightMode} onPress={() => onToggleHighlight(hlKey)}>
            {inner}
          </Pressable>
        );
      }
      case "tableTitle":
        return (
          <View
            key={index}
            style={styles.tableTitleBlock}
            
          >
            {renderFormattedText(block.text, styles.tableTitleText)}
          </View>
        );
      case "reference":
        return (
          <View
            key={index}
            style={styles.referenceBlock}
            
          >
            {renderFormattedText(block.text, styles.referenceText)}
          </View>
        );
      case "exam_sn":
        return (
          <View
            key={index}
            style={styles.examSnBlock}
            
          >
            <Text style={styles.examSnBadge} selectable={false}>
              SN
            </Text>
            {renderFormattedText(block.text, styles.examSnText)}
          </View>
        );
      case "exam_laq":
        return (
          <View
            key={index}
            style={styles.examLaqBlock}
            
          >
            <Text style={styles.examLaqBadge} selectable={false}>
              LAQ
            </Text>
            {renderFormattedText(block.text, styles.examLaqText)}
          </View>
        );
      case "exam_tip":
        return (
          <View
            key={index}
            style={styles.examTipBlock}
            
          >
            <Text style={styles.examTipBadge} selectable={false}>
              EXAM TIP
            </Text>
            {renderFormattedText(block.text, styles.examTipText)}
          </View>
        );
      case "blockquote": {
        const highlighted = shouldHighlightText(block.text);
        const sentences = splitSentences(block.text);
        const blockHighlightSig = sentences.map((_, sIdx) => userHighlights[`${index}:${sIdx}`] ? "1" : "0").join("");
        const hasSearchMatch = blockContainsSearch(block.text);
        // Nested sentence Text on Android clips the last wrapped line. Use it
        // for per-sentence press targets, and whenever a saved highlight must
        // stay visible after the Highlight tool is dismissed.
        const useSentenceNodes =
          (isHighlightMode || blockHighlightSig.includes("1")) && !hasSearchMatch;

        return (
          <View
            key={index}
            style={[styles.blockquoteContainer, highlighted ? styles.highlightBlock : null, { marginVertical: 4 }]}
            
          >
            {hasSearchMatch && !isHighlightMode ? (
              renderFormattedText(block.text, styles.blockquoteText, true)
            ) : useSentenceNodes ? (
              <Text key={blockHighlightSig} style={styles.blockquoteText} selectable={false} contextMenuHidden>
                {sentences.map((sentence, sIdx) => {
                  const hlKey = `${index}:${sIdx}`;
                  const isHl = userHighlights[hlKey];
                  return (
                    <Text
                      key={sIdx}
                      style={isHl ? styles.userHighlightSentence : null}
                      selectable={false}
                      contextMenuHidden
                      onPress={isHighlightMode ? () => onToggleHighlight(hlKey) : undefined}
                      suppressHighlighting={true}
                    >
                      {sIdx > 0 ? " " : ""}{renderFormattedText(sentence, null, false)}
                    </Text>
                  );
                })}
              </Text>
            ) : (
              renderFormattedText(block.text, styles.blockquoteText, false)
            )}
          </View>
        );
      }
      case "body": {
        const highlighted = shouldHighlightText(block.text);
        const sentences = splitSentences(block.text);
        const blockHighlightSig = sentences.map((_, sIdx) => userHighlights[`${index}:${sIdx}`] ? "1" : "0").join("");
        const hasSearchMatch = blockContainsSearch(block.text);
        const isAllCapsTitle = block.text.length > 3 && block.text === block.text.toUpperCase() && /[A-Z]/.test(block.text);
        const baseStyle = isAllCapsTitle ? styles.allCapsTitle : styles.body;
        const useSentenceNodes =
          (isHighlightMode || blockHighlightSig.includes("1")) && !hasSearchMatch;

        return (
          <View
            key={index}
            style={[highlighted ? styles.highlightBlock : null, { marginVertical: 4 }]}
            
          >
            {hasSearchMatch && !isHighlightMode ? (
              renderFormattedText(block.text, baseStyle, true)
            ) : useSentenceNodes ? (
              <Text key={blockHighlightSig} style={baseStyle} selectable={false} contextMenuHidden>
                {sentences.map((sentence, sIdx) => {
                  const hlKey = `${index}:${sIdx}`;
                  const isHl = userHighlights[hlKey];
                  return (
                    <Text
                      key={sIdx}
                      style={isHl ? styles.userHighlightSentence : null}
                      selectable={false}
                      contextMenuHidden
                      onPress={isHighlightMode ? () => onToggleHighlight(hlKey) : undefined}
                      suppressHighlighting={true}
                    >
                      {sIdx > 0 ? " " : ""}{renderFormattedText(sentence, null, false)}
                    </Text>
                  );
                })}
              </Text>
            ) : (
              renderFormattedText(block.text, baseStyle, false)
            )}
          </View>
        );
      }
      case "bullets":
        return (
          <View key={index} style={styles.bulletGroup} >
            {block.items.map((item, itemIndex) => {
              const highlighted = shouldHighlightText(item);
              const hlKey = `${index}:b${itemIndex}`;
              const isHl = userHighlights[hlKey];
              const hasSearchMatch = blockContainsSearch(item);
              const row = (
                <View
                  key={itemIndex}
                  style={[
                    styles.bulletRow,
                    highlighted ? styles.highlightBulletRow : null,
                    isHl ? styles.userHighlightSentence : null,
                  ]}
                >
                  <Text style={styles.bulletDot} selectable={false}>{"\u2022"}</Text>
                  {renderFormattedText(
                    item,
                    styles.bulletText,
                    hasSearchMatch && !isHighlightMode,
                  )}
                </View>
              );
              return (
                <Pressable
                  key={itemIndex}
                  disabled={!isHighlightMode}
                  onPress={() => onToggleHighlight(hlKey)}
                >
                  {row}
                </Pressable>
              );
            })}
          </View>
        );
      case "nested_bullets":
        return (
          <View key={index} style={styles.nestedBulletGroup} >
            {block.items.map((item, itemIndex) => {
              const highlighted = shouldHighlightText(item);
              const hlKey = `${index}:b${itemIndex}`;
              const isHl = userHighlights[hlKey];
              const hasSearchMatch = blockContainsSearch(item);
              const row = (
                <View
                  key={itemIndex}
                  style={[
                    styles.nestedBulletRow,
                    highlighted ? styles.highlightBulletRow : null,
                    isHl ? styles.userHighlightSentence : null,
                  ]}
                >
                  <Text style={styles.nestedBulletDot} selectable={false}>{"\u2013"}</Text>
                  {renderFormattedText(
                    item,
                    styles.nestedBulletText,
                    hasSearchMatch && !isHighlightMode,
                  )}
                </View>
              );
              return (
                <Pressable
                  key={itemIndex}
                  disabled={!isHighlightMode}
                  onPress={() => onToggleHighlight(hlKey)}
                >
                  {row}
                </Pressable>
              );
            })}
          </View>
        );
      case "image": {
        const source = { uri: block.url };
        const aspectRatio = resolveAspectRatio(source, 1);
        const rotationKey = getRotationKey(source, `content:${index}`);
        const rotation = imageRotationMap[rotationKey] || 0;
        const displayAspectRatio = getRotatedAspectRatio(aspectRatio, rotation);

        return (
          <View key={index} style={styles.inlineImageShell}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                openFullscreenImage({
                  source,
                  alt: block.alt || "Content image",
                  aspectRatio,
                  rotationKey,
                })
              }
            >
              <View
                style={[
                  styles.contentImageFrame,
                  { aspectRatio: displayAspectRatio },
                ]}
              >
                <Image
                  source={source}
                  style={[
                    styles.contentImage,
                    { transform: [{ rotate: `${rotation}deg` }] },
                  ]}
                  resizeMode="contain"
                  accessible
                  accessibilityLabel={block.alt || "Content image"}
                />
              </View>
            </TouchableOpacity>
            <Pressable
              style={styles.inlineImageControl}
              onPress={() =>
                openFullscreenImage({
                  source,
                  alt: block.alt || "Content image",
                  aspectRatio,
                  rotationKey,
                })
              }
            >
              <MaterialIcons name="fullscreen" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        );
      }
      case "illustration": {
        const source = block.source || (block.url ? { uri: block.url } : null);
        if (!source) return null;

        const aspectRatio = resolveAspectRatio(source, block.aspectRatio || 1);
        const rotationKey = getRotationKey(
          source,
          block.id || `${index}:${block.alt || "illustration"}`,
        );
        const rotation = imageRotationMap[rotationKey] || 0;
        const displayAspectRatio = getRotatedAspectRatio(aspectRatio, rotation);

        return (
          <View key={index} style={styles.illustrationCard}>
            <View style={styles.inlineImageShell}>
              <TouchableOpacity
                activeOpacity={0.955}
                onPress={() =>
                  openFullscreenImage({
                    source,
                    alt: block.alt || "Topic illustration",
                    aspectRatio,
                    rotationKey,
                  })
                }
              >
                <View
                  style={[
                    styles.illustrationImageFrame,
                    { aspectRatio: displayAspectRatio },
                  ]}
                >
                  <Image
                    source={source}
                    style={[
                      styles.illustrationImage,
                      { transform: [{ rotate: `${rotation}deg` }] },
                    ]}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel={block.alt || "Topic illustration"}
                  />
                </View>
              </TouchableOpacity>
              <Pressable
                style={styles.inlineImageControl}
                onPress={() =>
                  openFullscreenImage({
                    source,
                    alt: block.alt || "Topic illustration",
                    aspectRatio,
                    rotationKey,
                  })
                }
              >
                <MaterialIcons name="fullscreen" size={18} color="#FFFFFF" />
              </Pressable>
            </View>
            {block.caption || block.purpose ? (
              <View style={styles.illustrationTextBlock}>
                {block.caption
                  ? renderFormattedText(block.caption, styles.illustrationCaption)
                  : null}
                {block.purpose
                  ? renderFormattedText(block.purpose, styles.illustrationPurpose)
                  : null}
              </View>
            ) : null}
          </View>
        );
      }
      case "question": {
        // Strip [year] / [date] tags from question text
        const cleanedQuestion = block.text.replace(/(\s*\[[^\]]*\])+\s*$/g, "").trim();
        return (
          <View
            key={index}
            style={styles.questionBlock}
            
          >
            {renderFormattedText(cleanedQuestion, styles.questionText)}
          </View>
        );
      }
      case "table": {
        const { headers, rows } = block;
        const minColumnWidth = 120;
        // Match scrollContent paddingHorizontal: 20 on each side
        const contentPad = 40;
        const availableWidth = windowWidth - contentPad;
        const colCount = Math.max(headers.length, 1);
        const naturalWidth = colCount * minColumnWidth;
        // Stretch to full content width when columns would leave empty space;
        // keep min width + horizontal scroll when the table is wider than the screen.
        const tableWidth = Math.max(naturalWidth, availableWidth);
        const columnWidth = tableWidth / colCount;
        return (
          <View
            key={index}
            style={styles.tableScrollContainer}
            
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={tableWidth > availableWidth}
              contentContainerStyle={{ width: tableWidth }}
            >
              <View style={[styles.tableContainer, { width: tableWidth }]}>
                {/* Header row */}
                <View style={styles.tableHeaderRow}>
                  {headers.map((h, hi) => (
                    <View key={hi} style={[styles.tableCell, styles.tableHeaderCell, { width: columnWidth }, hi < headers.length - 1 && styles.tableCellBorderRight]}>
                      {renderFormattedText(h, styles.tableHeaderText)}
                    </View>
                  ))}
                </View>
                {/* Data rows */}
                {rows.map((row, ri) => (
                  <View
                    key={ri}
                    style={[styles.tableRow, ri % 2 === 1 && styles.tableRowAlt]}
                  >
                    {headers.map((_, ci) => (
                      <View key={ci} style={[styles.tableCell, { width: columnWidth }, ci < headers.length - 1 && styles.tableCellBorderRight]}>
                        {renderFormattedText(row[ci] ?? "", styles.tableCellText)}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        );
      }
      case "spacing":
        return <View key={index} style={styles.spacing} />;
      case "exercise": {
        const expanded = expandedExerciseId === block.id;
        const header = exerciseHeaderTitle(block.question);
        const compactQuestion = String(block.question || "").replace(/\s+/g, " ").trim();
        const showFullStem = header.replace(/\s+/g, " ").trim() !== compactQuestion;
        return (
          <View
            key={index}
            style={[
              styles.exerciseCard,
              expanded && styles.exerciseCardExpanded,
            ]}
          >
            <TouchableOpacity
              style={styles.exerciseHeader}
              onPress={() => toggleExercise(block.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityLabel={header}
            >
              <View
                style={[
                  styles.exerciseIconBox,
                  expanded && styles.exerciseIconBoxActive,
                ]}
              >
                <MaterialIcons
                  name="quiz"
                  size={20}
                  color={expanded ? colors.onPrimary : colors.secondary}
                />
              </View>
              <Text
                style={[
                  styles.exerciseTitle,
                  expanded && styles.exerciseTitleActive,
                ]}
              >
                {header}
              </Text>
              <MaterialIcons
                name={expanded ? "expand-less" : "expand-more"}
                size={24}
                color={expanded ? colors.secondary : colors.textPlaceholder}
              />
            </TouchableOpacity>
            {expanded ? (
              <View style={styles.exerciseBody}>
                {showFullStem
                  ? renderFormattedText(block.question, styles.exerciseStem)
                  : null}
                <Text style={styles.exerciseSolutionLabel}>Solution</Text>
                {(block.answerBlocks || []).map((ansBlock, ansIdx) =>
                  renderBlock(ansBlock, `${index}-ans-${ansIdx}`),
                )}
              </View>
            ) : null}
          </View>
        );
      }
      default:
        return null;
    }
  };

  const renderAnnotationCard = (annotation) => (
    <TouchableOpacity
      key={annotation.id}
      style={styles.annotationCard}
      activeOpacity={0.7}
      onPress={() => {
        setEditingAnnotation({ blockIndex: annotation.blockIndex, id: annotation.id });
        setAnnotationText(annotation.text);
        setNoteModalVisible(true);
      }}
    >
      <View style={styles.annotationCardHeader}>
        <MaterialIcons name="sticky-note-2" size={14} color="#D4A853" />
        <Text style={styles.annotationCardLabel} selectable={false}>
          Note
        </Text>
        <TouchableOpacity
          onPress={() => handleDeleteAnnotation(annotation.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.annotationCardText} selectable={false}>
        {annotation.text}
      </Text>
    </TouchableOpacity>
  );

  const needsBlockLayout = Boolean(normalizedSearchTerm) || isAnnotationMode;

  const renderBlockWithAnnotations = (block, index) => {
    const blockAnnotations = annotationsByBlock[index] || [];
    const tappable = isAnnotationMode && block.type !== "spacing";

    return (
      <View
        key={`block-wrapper-${index}`}
        onLayout={
          needsBlockLayout
            ? (e) => {
                blockYMapRef.current[index] = e.nativeEvent.layout.y;
                if (index === activeMatchBlockIndex) {
                  tryScrollToSearchMatch();
                }
              }
            : undefined
        }
      >
        <Pressable
          disabled={!tappable}
          onPress={() => handleBlockPress(index)}
          style={({ pressed }) => [
            { borderWidth: 1, borderColor: "transparent", borderRadius: 6, borderStyle: "dashed" },
            tappable && pressed && styles.annotationModePressedBlock,
          ]}
        >
          {renderBlock(block, index)}
        </Pressable>
        {blockAnnotations.map(renderAnnotationCard)}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isScreenCapturePrevented && (
        <View style={styles.captureProtectedOverlay} pointerEvents="none">
          <Text style={styles.captureProtectedText}>
            Screen recording is not allowed
          </Text>
        </View>
      )}

      {/* ── Header ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation?.goBack()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.headerSectionTitle} numberOfLines={1} selectable={false}>
          {headerTitle}
        </Text>
        <View style={styles.headerActions}>
          <ThemeModePill />
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={onToggleBookmark}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isBookmarked ? "bookmark" : "bookmark-border"}
              size={22}
              color={colors.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={toggleFind}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={findOpen ? "Close search" : "Search chapter"}
          >
            <MaterialIcons
              name="search"
              size={22}
              color={findOpen ? colors.primary : colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {findOpen ? (
        <View style={styles.findBar}>
          <TextInput
            ref={findInputRef}
            value={findQuery}
            onChangeText={handleFindQueryChange}
            placeholder="Find in chapter"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.findInput}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Find in chapter"
          />
          <Text
            style={styles.findCount}
            selectable={false}
            accessibilityLabel={
              searchMatches.length
                ? `Match ${activeMatchIndex + 1} of ${searchMatches.length}`
                : "No matches"
            }
          >
            {normalizedSearchTerm
              ? searchMatches.length
                ? `${activeMatchIndex + 1} of ${searchMatches.length}`
                : "No matches"
              : "0"}
          </Text>
          <TouchableOpacity
            style={styles.findNavBtn}
            onPress={() => goToMatch(-1)}
            disabled={searchMatches.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Previous match"
          >
            <MaterialIcons
              name="keyboard-arrow-up"
              size={22}
              color={
                searchMatches.length
                  ? colors.textPrimary
                  : colors.textPlaceholder
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.findNavBtn}
            onPress={() => goToMatch(1)}
            disabled={searchMatches.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Next match"
          >
            <MaterialIcons
              name="keyboard-arrow-down"
              size={22}
              color={
                searchMatches.length
                  ? colors.textPrimary
                  : colors.textPlaceholder
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.findNavBtn}
            onPress={closeFind}
            accessibilityRole="button"
            accessibilityLabel="Close search"
          >
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ── Progress Bar ── */}
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${scrollProgress * 100}%` },
          ]}
        />
      </View>

      {/* ── Content ── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        onLayout={handleLayout}
        onContentSizeChange={handleContentSizeChange}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Chapter intro block */}
        <View style={styles.chapterIntro}>
          <Text style={styles.chapterLabel} selectable={false}>
            {section ? section.toUpperCase() : ""}
          </Text>
          {renderFormattedText(title || "", styles.chapterTitle, false)}
          <View style={styles.chapterDivider} />
        </View>



        {showUpdateHighlights && highlightSet.size > 0 ? (
          <View style={styles.updateBanner}>
            <MaterialIcons
              name="auto-awesome"
              size={18}
              color={colors.warningText}
            />
            <Text style={styles.updateBannerText}>
              Updated lines are highlighted in this topic until you review them.
            </Text>
          </View>
        ) : null}
        {!parseReady ? (
          <Text style={styles.parsePending} selectable={false}>
            Loading topic…
          </Text>
        ) : (
          visibleBlocks.map(renderBlockWithAnnotations)
        )}
      </ScrollView>

      {/* ── Bottom Toolbar ── */}
      <View style={[styles.bottomToolbar, { paddingBottom: insets.bottom || 8 }]}>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => navigation?.navigate("MainTabs", { screen: "Library" })}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu-book" size={22} color={colors.textTertiary} />
          <Text style={styles.toolbarLabel} selectable={false}>LIBRARY</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={toggleHighlightMode}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="border-color"
            size={22}
            color={isHighlightMode ? colors.secondary : colors.textTertiary}
          />
          <Text
            style={[
              styles.toolbarLabel,
              isHighlightMode && styles.toolbarLabelActive,
            ]}
            selectable={false}
          >
            HIGHLIGHT
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => {
            setIsAnnotationMode((prev) => {
              const next = !prev;
              if (next) {
                setIsHighlightMode(false);
                showToast("Tap on any paragraph to add a note");
              }
              return next;
            });
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="edit-note"
            size={24}
            color={isAnnotationMode ? colors.secondary : colors.textTertiary}
          />
          <Text
            style={[
              styles.toolbarLabel,
              isAnnotationMode && styles.toolbarLabelActive,
            ]}
            selectable={false}
          >
            NOTE
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Note Modal ── */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="none"
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => {
          setNoteModalVisible(false);
          setEditingAnnotation(null);
          setAnnotationText("");
        }}
      >
        <Pressable
          style={styles.noteModalBackdrop}
          onPress={() => {
            setNoteModalVisible(false);
            setEditingAnnotation(null);
            setAnnotationText("");
          }}
        >
          <Pressable style={styles.noteModalContent} onPress={() => {}}>
            <Text style={styles.noteModalTitle} selectable={false}>
              {editingAnnotation?.id ? "Edit Note" : "Add Note"}
            </Text>
            <TextInput
              style={styles.noteModalInput}
              placeholder="Write your note..."
              placeholderTextColor="#9CA3AF"
              value={annotationText}
              onChangeText={setAnnotationText}
              multiline
              selectable
            />
            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.annotationCancelBtn}
                onPress={() => {
                  setNoteModalVisible(false);
                  setEditingAnnotation(null);
                  setAnnotationText("");
                }}
              >
                <Text style={styles.annotationCancelText} selectable={false}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.annotationSaveBtn,
                  !annotationText.trim() && styles.annotationSaveBtnDisabled,
                ]}
                onPress={handleSaveAnnotation}
                disabled={!annotationText.trim()}
              >
                <Text style={styles.annotationSaveText} selectable={false}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Fullscreen Image Modal ── */}
      <Modal
        visible={Boolean(fullscreenImage)}
        transparent
        animationType="fade"
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => setFullscreenImage(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <Pressable
            style={styles.fullscreenClose}
            onPress={() => setFullscreenImage(null)}
          >
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          <View
            style={styles.fullscreenViewport}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setFullscreenViewport({ width, height });
            }}
          >
            <ScrollView
              horizontal
              bounces={false}
              contentContainerStyle={styles.viewerOuterScrollContent}
            >
              <ScrollView
                bounces={false}
                contentContainerStyle={styles.viewerInnerScrollContent}
              >
                {fullscreenImage ? (
                  <Image
                    source={fullscreenImage.source}
                    style={[
                      styles.fullscreenImage,
                      fullscreenZoomedSize,
                      { transform: [{ rotate: `${fullscreenRotation}deg` }] },
                    ]}
                    resizeMode="contain"
                    accessible
                    accessibilityLabel={fullscreenImage.alt}
                  />
                ) : null}
              </ScrollView>
            </ScrollView>
          </View>

          <View style={styles.viewerControls}>
            <Pressable
              accessibilityRole="button"
              disabled={viewerZoomScale <= MIN_ZOOM}
              onPress={() =>
                setViewerZoomScale((current) =>
                  Math.max(MIN_ZOOM, current - ZOOM_STEP),
                )
              }
              style={[
                styles.viewerControlButton,
                viewerZoomScale <= MIN_ZOOM &&
                  styles.viewerControlButtonDisabled,
              ]}
            >
              <MaterialIcons name="remove" size={22} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.viewerZoomLabel}>
              {Math.round(viewerZoomScale * 100)}%
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={viewerZoomScale >= MAX_ZOOM}
              onPress={() =>
                setViewerZoomScale((current) =>
                  Math.min(MAX_ZOOM, current + ZOOM_STEP),
                )
              }
              style={[
                styles.viewerControlButton,
                viewerZoomScale >= MAX_ZOOM &&
                  styles.viewerControlButtonDisabled,
              ]}
            >
              <MaterialIcons name="add" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (fullscreenImage?.rotationKey) {
                  rotateImage(fullscreenImage.rotationKey, -90);
                }
                setFullscreenRotation(
                  (current) => (((current - 90) % 360) + 360) % 360,
                );
              }}
              style={styles.viewerControlButton}
            >
              <MaterialIcons name="rotate-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (fullscreenImage?.rotationKey) {
                  rotateImage(fullscreenImage.rotationKey, 90);
                }
                setFullscreenRotation((current) => (current + 90) % 360);
              }}
              style={styles.viewerControlButton}
            >
              <MaterialIcons name="rotate-right" size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.fullscreenHint}>
            Use + / - to zoom. Rotate buttons work in both reading and
            fullscreen views.
          </Text>
        </View>
      </Modal>

      <Modal
        visible={wordCopyHintVisible}
        transparent
        animationType="fade"
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={dismissWordCopyHint}
      >
        <Pressable style={styles.noteModalBackdrop} onPress={dismissWordCopyHint}>
          <Pressable style={styles.noteModalContent} onPress={() => {}}>
            <View style={styles.wordCopyHintIconWrap}>
              <MaterialIcons name="content-copy" size={26} color={colors.secondary} />
            </View>
            <Text style={styles.noteModalTitle} selectable={false}>
              Copy a word
            </Text>
            <Text style={styles.wordCopyHintBody} selectable={false}>
              Long press any word on this page to copy it.
            </Text>
            <View style={styles.noteModalActions}>
              <TouchableOpacity
                style={styles.wordCopyHintButton}
                onPress={dismissWordCopyHint}
                activeOpacity={0.8}
              >
                <Text style={styles.wordCopyHintButtonText} selectable={false}>
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
  },
  captureProtectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  captureProtectedText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surfacePrimary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.secondary,
    marginLeft: 4,
    marginRight: "auto",
  },
  headerActions: {
    flexDirection: "row",
    gap: 4,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  findBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  findInput: {
    flex: 1,
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 0,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.inputBorder,
    color: colors.inputText,
    fontSize: 14,
  },
  findCount: {
    minWidth: 78,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  findNavBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Progress ──
  progressBarBackground: {
    height: 2.5,
    backgroundColor: colors.surfaceSecondary,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },

  // ── Chapter Intro ──
  chapterIntro: {
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  chapterLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.5,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textTitle,
    lineHeight: 32,
    marginBottom: 16,
  },
  chapterDivider: {
    height: 1,
    backgroundColor: colors.border,
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  parsePending: {
    paddingTop: 20,
    paddingBottom: 32,
    fontSize: 14,
    color: colors.textTertiary,
  },

  // ── Banners ──
  updateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: colors.warningBackground,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  updateBannerText: {
    flex: 1,
    color: colors.warningText,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  annotationModeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: "#F3F0FF",
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  annotationModeBannerText: {
    flex: 1,
    color: colors.secondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  // ── Typography (body size unchanged) ──
  h1: {
    color: colors.secondary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    color: colors.textTitle,
    fontSize: 15.5,
    lineHeight: 24,
    marginVertical: 4,
    ...(Platform.OS === "android" ? { paddingBottom: 4 } : null),
  },
  allCapsTitle: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 24,
    marginVertical: 4,
    ...(Platform.OS === "android" ? { paddingBottom: 4 } : null),
  },
  tableTitleBlock: {
    marginTop: 14,
    marginBottom: 6,
  },
  tableTitleText: {
    color: colors.textTitle,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  referenceBlock: {
    marginTop: 14,
    marginBottom: 4,
  },
  referenceText: {
    color: colors.textTertiary,
    fontSize: 12.5,
    fontStyle: "italic",
    lineHeight: 18,
  },
  // Fixed SN / LAQ exam tags (library-chapter-review skill) — do not change colours casually
  examSnBlock: {
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#0F766E",
    backgroundColor: "#CCFBF1",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  examSnBadge: {
    color: "#115E59",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    backgroundColor: "#99F6E4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  examSnText: {
    color: "#115E59",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    flexShrink: 1,
  },
  examLaqBlock: {
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    // Fixed light-mode amber palette (same as SN tags) so dark theme
    // warningText (#FDE68A) never paints yellow-on-yellow on these chips.
    borderLeftColor: "#B45309",
    backgroundColor: "#FEF3C7",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  examLaqBadge: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    backgroundColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  examLaqText: {
    color: "#92400E",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
    flexShrink: 1,
  },
  // Fixed EXAMTIP box (library-chapter-review skill). Light palette is the
  // documented indigo chip; dark palette is the same family, slightly muted.
  examTipBlock: {
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.examTipBorder,
    backgroundColor: colors.examTipBg,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
  },
  examTipBadge: {
    color: colors.examTipText,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    backgroundColor: colors.examTipBadgeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  examTipText: {
    color: colors.examTipText,
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 20,
    flexShrink: 1,
  },
  bulletGroup: {
    marginVertical: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  bulletDot: {
    color: colors.secondary,
    fontSize: 16,
    lineHeight: 24,
    width: 20,
  },
  bulletText: {
    flex: 1,
    color: colors.textTitle,
    fontSize: 15.5,
    lineHeight: 24,
    ...(Platform.OS === "android" ? { paddingBottom: 4 } : null),
  },
  nestedBulletGroup: {
    marginVertical: 2,
    marginLeft: 20,
  },
  nestedBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  nestedBulletDot: {
    color: colors.secondary,
    fontSize: 14,
    lineHeight: 22,
    width: 20,
  },
  nestedBulletText: {
    flex: 1,
    color: colors.textTitle,
    fontSize: 14.5,
    lineHeight: 22,
    ...(Platform.OS === "android" ? { paddingBottom: 4 } : null),
  },

  // ── Highlights (gold left-border style) ──
  highlightBlock: {
    marginVertical: 2,
    paddingLeft: 14,
    paddingVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.highlightBorder,
    backgroundColor: colors.highlightBg,
    borderRadius: 0,
  },
  highlightBulletRow: {
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.highlightBorder,
    backgroundColor: colors.highlightBg,
    borderRadius: 0,
  },

  // ── User Highlights (yellow background) ──
  userHighlightBlock: {
    backgroundColor: colors.userHighlightBg,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginVertical: 1,
  },
  highlightModeBlock: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    borderStyle: "dashed",
  },
  userHighlightSentence: {
    backgroundColor: colors.userHighlightSentence,
    borderRadius: 2,
  },
  sentenceWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 4,
  },
  sentenceInline: {
    marginVertical: 0,
    marginRight: 4,
  },

  // ── Blockquote ──
  blockquoteContainer: {
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight || colors.primarySoft,
    borderRadius: 4,
  },
  blockquoteText: {
    color: colors.textTitle || colors.textPrimary,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    fontWeight: "600",
    ...(Platform.OS === "android" ? { paddingBottom: 4 } : null),
  },

  // ── Spacing ──
  spacing: {
    height: 14,
  },

  // ── Question blocks (extracted from question-wrapper tables) ──
  questionBlock: {
    marginVertical: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary || "#7C3AED",
    backgroundColor: "#F5F3FF",
    borderRadius: 4,
  },
  questionText: {
    color: colors.textTitle || colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },

  // ── Tables ──
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceSecondary || colors.border,
  },
  tableScrollContainer: {
    marginVertical: 12,
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: colors.surfacePrimary || colors.surfacePrimary,
  },
  tableRowAlt: {
    backgroundColor: colors.surfaceSecondary || colors.surfaceTertiary,
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    // width set inline per table (full content width when it fits; min 120 when scrolling)
  },
  tableHeaderCell: {
    paddingVertical: 10,
  },
  tableCellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)",
  },
  tableHeaderText: {
    color: colors.surfacePrimary,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  tableCellText: {
    color: colors.textTitle || colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Images ──
  inlineImageShell: {
    position: "relative",
    marginVertical: 12,
  },
  contentImageFrame: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  contentImage: {
    width: "100%",
    height: "100%",
  },
  inlineImageControl: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(17, 24, 39, 0.72)",
  },
  illustrationCard: {
    marginVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.surfacePrimary,
    borderWidth: 1,
    borderColor: colors.surfaceSecondary,
    elevation: 2,
    shadowColor: colors.textTitle,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  illustrationImageFrame: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
  },
  illustrationImage: {
    width: "100%",
    height: "100%",
  },
  illustrationTextBlock: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  illustrationCaption: {
    color: colors.textTitle,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: "700",
  },
  illustrationPurpose: {
    color: colors.textPrimary,
    fontSize: 13.5,
    lineHeight: 20,
  },

  // ── Bottom Toolbar ──
  bottomToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    backgroundColor: colors.surfacePrimary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  toolbarItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minWidth: 64,
  },
  toolbarLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: colors.textTertiary,
    marginTop: 3,
  },
  toolbarLabelActive: {
    color: colors.secondary,
  },

  // ── Annotation Mode ──
  annotationModeBlock: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "transparent",
    borderStyle: "dashed",
  },
  annotationModePressedBlock: {
    backgroundColor: "#F3F0FF",
    borderRadius: 6,
    borderColor: colors.secondary,
    borderWidth: 1,
    borderStyle: "dashed",
  },

  // ── Annotation Cards ──
  annotationCard: {
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.highlightBorder,
    // Theme-aware amber surface so note text stays readable in dark mode
    // (hardcoded light yellow + light textPrimary was near-invisible on dark theme).
    backgroundColor: colors.warningBackground,
    borderRadius: 8,
  },
  annotationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  annotationCardLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: colors.warningText,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  annotationCardText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },

  // ── Annotation Input ──
  annotationInputCard: {
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  annotationInput: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textTitle,
    minHeight: 48,
    textAlignVertical: "top",
    padding: 0,
  },
  annotationInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  annotationCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  annotationCancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  annotationSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  annotationSaveBtnDisabled: {
    opacity: 0.4,
  },
  annotationSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.surfacePrimary,
  },

  // ── Note Modal ──
  noteModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  noteModalContent: {
    width: "100%",
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textTitle,
    marginBottom: 16,
  },
  noteModalInput: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textTitle,
    minHeight: 80,
    textAlignVertical: "top",
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surfaceTertiary,
  },
  noteModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  wordCopyHintIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft || colors.surfaceTertiary,
    marginBottom: 12,
  },
  wordCopyHintBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
  },
  wordCopyHintButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  wordCopyHintButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.onPrimary || colors.surfacePrimary,
  },

  // ── Fullscreen Image Viewer ──
  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 20, 28, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  fullscreenClose: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenContent: {
    width: "100%",
    alignItems: "center",
  },
  fullscreenViewport: {
    width: "100%",
    height: "78%",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerOuterScrollContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  viewerInnerScrollContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImage: {
    width: "100%",
    maxWidth: "100%",
    height: "60%",
  },
  viewerControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  viewerControlButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  viewerControlButtonDisabled: {
    opacity: 0.45,
  },
  viewerZoomLabel: {
    minWidth: 58,
    textAlign: "center",
    color: colors.surfacePrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  fullscreenHint: {
    marginTop: 12,
    color: colors.surfaceSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  // ── Search Term Highlight ──
  searchTermMatch: {
    color: colors.secondary,
    fontWeight: "700",
    backgroundColor: colors.highlightBg,
  },
  searchTermMatchCurrent: {
    color: colors.textTitle,
    backgroundColor: colors.highlightBorder,
    fontWeight: "700",
  },

  // ── Solved exercise accordion (Support-screen pattern) ──
  exerciseCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseCardExpanded: {
    borderColor: colors.primaryMuted || colors.secondary,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 64,
  },
  exerciseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  exerciseIconBoxActive: {
    backgroundColor: colors.secondary,
  },
  exerciseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textTitle,
    lineHeight: 21,
    paddingRight: 8,
  },
  exerciseTitleActive: {
    color: colors.primaryDark || colors.primary,
  },
  exerciseBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  exerciseStem: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textTitle,
  },
  exerciseSolutionLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.secondary,
  },
});

export default ReadingView;
