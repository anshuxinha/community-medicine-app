import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Pressable,
  TextInput,
  Platform,
  ToastAndroid,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../styles/theme";
import { normalizeUpdatedSnippet } from "../utils/contentRegistry";
import { auth, db } from "../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

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

const parseTextTable = (lines, startIndex) => {
  const n = lines.length;
  let i = startIndex;
  
  // Collect headers (consecutive non-empty lines, each < 60 chars, not starting with special chars)
  const headers = [];
  while (i < n && lines[i].trim() && lines[i].trim().length < 60) {
    const line = lines[i].trim();
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
    if (/^(CORE CONCEPTS|FORMULAS AND CALCULATIONS|MNEMONICS|KEY POINTS|NOT APPLICABLE|OVERVIEW)\b/.test(line)) {
      break;
    }
    headers.push(line);
    i++;
  }
  
  // Need 2+ headers to be a table
  if (headers.length < 2) return null;
  
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
    // Headers: non-empty, <60 chars, not starting with special chars
    let isTableStart = line && line.length < 60 && 
        !line.startsWith("Q") && !line.startsWith("A)") && !line.startsWith("-") && 
        !line.startsWith("•") && !line.startsWith("◦") && !line.startsWith("#") && 
        !line.startsWith("##") && !line.startsWith("!") && !line.startsWith(">") &&
        !line.startsWith("|");
    
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

const parseMarkdown = (content, { isGem = false } = {}) => {
  const processedContent = isGem ? content : preprocessTextTables(content);
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
    const refMatch = trimmedLine.match(/^\[REF\](.*?)\[\/REF\]$/i);

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
    } else if (line.trim() === "") {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "spacing" });
    } else if (line.startsWith("> ")) {
      flushBullets();
      flushNested();
      rawBlocks.push({ type: "blockquote", text: line.replace(/^>\s*/, "") });
    } else {
      const bodyText = line;
      const strippedBody = stripBold(bodyText).trim();
      // Continuation of a bullet: non-empty, starts with lowercase, currently accumulating bullets
      if (bulletGroup.length > 0 && strippedBody && /^[a-z]/.test(strippedBody)) {
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
  console.log(
    "mergeBlocksWithIllustrations: illustrations count",
    illustrations.length,
  );
  if (!Array.isArray(illustrations) || illustrations.length === 0) {
    console.log(
      "mergeBlocksWithIllustrations: no illustrations, returning blocks",
    );
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
    console.log("mergeBlocksWithIllustrations: processing illustration", {
      normalizedPlacement,
      normalizedAnchor,
      illustrationId: illustration.id,
      fileName: illustration.fileName,
    });

    if (normalizedPlacement === "top") {
      topBlocks.push(illustrationBlock);
      console.log("mergeBlocksWithIllustrations: added to topBlocks");
      return;
    }

    if (normalizedPlacement === "bottom" || !normalizedAnchor) {
      bottomBlocks.push(illustrationBlock);
      console.log(
        "mergeBlocksWithIllustrations: added to bottomBlocks (no anchor or bottom placement)",
      );
      return;
    }

    const targetMap = normalizedPlacement === "before" ? beforeMap : afterMap;
    const bucket = targetMap.get(normalizedAnchor) || [];
    bucket.push(illustrationBlock);
    targetMap.set(normalizedAnchor, bucket);
    console.log("mergeBlocksWithIllustrations: added to map", {
      targetMap: normalizedPlacement === "before" ? "before" : "after",
      key: normalizedAnchor,
      bucketSize: bucket.length,
    });
  });

  const mergedBlocks = [...topBlocks];
  const unmatchedBottomBlocks = [...bottomBlocks];

  // Helper function to check if anchor matches block text (exact or substring)
  const doesAnchorMatchBlock = (anchor, block) => {
    if (!anchor || !block) return false;

    const blockText = getBlockAnchorText(block);
    if (!blockText) return false;

    // Exact match after normalization
    if (blockText === anchor) return true;

    // Substring match: check if anchor is contained within block text
    if (blockText.includes(anchor)) return true;

    // Also check if block text is contained within anchor (for shorter headings)
    if (anchor.includes(blockText)) return true;

    return false;
  };

  blocks.forEach((block) => {
    const blockAnchor = getBlockAnchorText(block);
    console.log("mergeBlocksWithIllustrations: checking block", {
      blockType: block.type,
      blockAnchor,
      blockText:
        block.type === "h1" || block.type === "h2" || block.type === "body"
          ? block.text?.substring(0, 50)
          : "",
    });

    // Check for before placement matches
    let matchedBefore = false;
    for (const [anchor, illustrationBlocks] of beforeMap.entries()) {
      if (doesAnchorMatchBlock(anchor, block)) {
        mergedBlocks.push(...illustrationBlocks);
        beforeMap.delete(anchor);
        console.log(
          "mergeBlocksWithIllustrations: inserted beforeMap blocks for anchor",
          anchor,
        );
        matchedBefore = true;
        break;
      }
    }

    mergedBlocks.push(block);

    // Check for after placement matches
    let matchedAfter = false;
    for (const [anchor, illustrationBlocks] of afterMap.entries()) {
      if (doesAnchorMatchBlock(anchor, block)) {
        mergedBlocks.push(...illustrationBlocks);
        afterMap.delete(anchor);
        console.log(
          "mergeBlocksWithIllustrations: inserted afterMap blocks for anchor",
          anchor,
        );
        matchedAfter = true;
        break;
      }
    }
  });

  // Add any remaining unmatched illustrations to bottom
  beforeMap.forEach((value) => {
    unmatchedBottomBlocks.push(...value);
    console.log(
      "mergeBlocksWithIllustrations: flushing unmatched beforeMap blocks",
      value.length,
    );
  });
  afterMap.forEach((value) => {
    unmatchedBottomBlocks.push(...value);
    console.log(
      "mergeBlocksWithIllustrations: flushing unmatched afterMap blocks",
      value.length,
    );
  });

  console.log(
    "mergeBlocksWithIllustrations: mergedBlocks count",
    mergedBlocks.length,
    "unmatchedBottomBlocks count",
    unmatchedBottomBlocks.length,
  );
  return [...mergedBlocks, ...unmatchedBottomBlocks];
};

/** Split text into sentences for granular highlighting. */
const splitSentences = (text) => {
  if (!text) return [text || ""];
  // Match runs of text ending with sentence punctuation
  const matches = text.match(/[^.!?]*[.!?]+/g);
  if (!matches) return [text];
  const joined = matches.join("");
  const remaining = text.slice(joined.length).trim();
  if (remaining) matches.push(remaining);
  return matches.map((s) => s.trim()).filter(Boolean);
};

const REACH_END_THRESHOLD = 0.98;
const SHORT_CONTENT_TOLERANCE = 24;
const SCREEN = Dimensions.get("window");
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

const ReadingView = ({
  content,
  title,
  headerTitle,
  topicId,
  isBookmarked,
  onToggleBookmark,
  isSpeaking,
  onToggleSpeak,
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
}) => {
  console.log("ReadingView: illustrations prop", illustrations);
  if (title === "Fats and Essential Fatty Acids" || contentKey === "theory:11-3") {
    console.log("ReadingView DEBUG for 11-3:");
    console.log("contentKey:", contentKey);
    console.log("content snippet:", content ? content.slice(0, 500) : "empty");
  }
  const insets = useSafeAreaInsets();
  const blocks = useMemo(() => {
    const res = parseMarkdown(content || "", { isGem });
    if (title === "Fats and Essential Fatty Acids" || contentKey === "theory:11-3") {
      console.log("parsed blocks for 11-3:", JSON.stringify(res.slice(0, 5), null, 2));
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userDocRef, {
          debug_11_3_blocks: JSON.stringify(res.slice(0, 5)),
          debug_11_3_timestamp_blocks: new Date().toISOString(),
        }).catch(err => console.warn("Failed to update debug blocks:", err));
      }
    }
    return res;
  }, [content, isGem]);
  const mergedBlocks = useMemo(
    () => mergeBlocksWithIllustrations(blocks, illustrations),
    [blocks, illustrations],
  );
  const [scrollProgress, setScrollProgress] = useState(0);
  const [imageRotationMap, setImageRotationMap] = useState({});
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [viewerZoomScale, setViewerZoomScale] = useState(MIN_ZOOM);
  const [fullscreenRotation, setFullscreenRotation] = useState(0);
  const [fullscreenViewport, setFullscreenViewport] = useState({
    width: SCREEN.width - 32,
    height: SCREEN.height * 0.78,
  });
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState(null);
  const [annotationText, setAnnotationText] = useState("");
  const [showHighlightsLocal, setShowHighlightsLocal] = useState(showUpdateHighlights);
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const hasReachedEndRef = useRef(false);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const blockYMapRef = useRef({});

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
    hasReachedEndRef.current = false;
    setScrollProgress(0);
    viewportHeightRef.current = 0;
    contentHeightRef.current = 0;
  }, [content, title]);

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

  const maybeMarkAsReachedEnd = (progress, viewportHeight, contentHeight) => {
    if (hasReachedEndRef.current) {
      return;
    }

    const contentFitsScreen =
      contentHeight > 0 &&
      viewportHeight > 0 &&
      contentHeight <= viewportHeight + SHORT_CONTENT_TOLERANCE;
    const scrolledToBottom = progress >= REACH_END_THRESHOLD;

    if (contentFitsScreen || scrolledToBottom) {
      hasReachedEndRef.current = true;
      onReachEnd?.();
    }
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const viewportHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;
    const totalContentHeight = contentHeight - viewportHeight;
    const progress =
      totalContentHeight > 0
        ? Math.min(Math.max(contentOffset.y / totalContentHeight, 0), 1)
        : 1;

    viewportHeightRef.current = viewportHeight;
    contentHeightRef.current = contentHeight;
    setScrollProgress(progress);
    maybeMarkAsReachedEnd(progress, viewportHeight, contentHeight);
  };

  const handleLayout = (event) => {
    viewportHeightRef.current = event.nativeEvent.layout.height;
    maybeMarkAsReachedEnd(
      scrollProgress,
      viewportHeightRef.current,
      contentHeightRef.current,
    );
  };

  const handleContentSizeChange = (_, height) => {
    contentHeightRef.current = height;
    maybeMarkAsReachedEnd(
      scrollProgress,
      viewportHeightRef.current,
      contentHeightRef.current,
    );
  };

  // -- Search term helpers ------------------------------------------------
  const normalizedSearchTerm = searchTerms ? searchTerms.trim().toLowerCase() : "";

  const blockContainsSearch = (text) => {
    if (!normalizedSearchTerm || !text) return false;
    return text.toLowerCase().includes(normalizedSearchTerm);
  };

  const renderFormattedText = (text, baseStyle = null, highlightSearch = true) => {
    if (!text) return null;
    const parts = String(text).split(/\*\*/);
    const elements = [];

    const activeSearchTerm = highlightSearch ? normalizedSearchTerm : "";

    // Optimization: if no bolding and no search term, return plain text or simple wrapper
    if (parts.length === 1 && !activeSearchTerm) {
      if (baseStyle) {
        return (
          <Text style={baseStyle} selectable={false}>
            {text}
          </Text>
        );
      }
      return text;
    }

    parts.forEach((part, idx) => {
      if (!part) return;
      const isBold = idx % 2 === 1;

      if (activeSearchTerm) {
        const lowerPart = part.toLowerCase();
        let lastIdx = 0;
        let sTermIdx = lowerPart.indexOf(activeSearchTerm);
        let subIndex = 0;

        while (sTermIdx !== -1) {
          if (sTermIdx > lastIdx) {
            const subText = part.slice(lastIdx, sTermIdx);
            elements.push(
              <Text key={`${idx}-${subIndex++}`} style={isBold ? { fontWeight: "bold" } : undefined}>
                {subText}
              </Text>
            );
          }
          const matchText = part.slice(sTermIdx, sTermIdx + activeSearchTerm.length);
          elements.push(
            <Text
              key={`${idx}-${subIndex++}`}
              style={[
                styles.searchTermMatch,
                isBold && { fontWeight: "bold" }
              ]}
            >
              {matchText}
            </Text>
          );
          lastIdx = sTermIdx + activeSearchTerm.length;
          sTermIdx = lowerPart.indexOf(activeSearchTerm, lastIdx);
        }

        if (lastIdx < part.length) {
          const subText = part.slice(lastIdx);
          elements.push(
            <Text key={`${idx}-${subIndex++}`} style={isBold ? { fontWeight: "bold" } : undefined}>
              {subText}
            </Text>
          );
        }
      } else {
        if (isBold) {
          elements.push(
            <Text key={idx} style={{ fontWeight: "bold" }}>
              {part}
            </Text>
          );
        } else {
          elements.push(
            <Text key={idx}>
              {part}
            </Text>
          );
        }
      }
    });

    if (baseStyle) {
      return (
        <Text style={baseStyle} selectable={false}>
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
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
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
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
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
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
          >
            {renderFormattedText(block.text, styles.tableTitleText)}
          </View>
        );
      case "reference":
        return (
          <View
            key={index}
            style={styles.referenceBlock}
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
          >
            {renderFormattedText(block.text, styles.referenceText)}
          </View>
        );
      case "blockquote": {
        const highlighted = shouldHighlightText(block.text);
        const sentences = splitSentences(block.text);
        const blockHighlightSig = sentences.map((_, sIdx) => userHighlights[`${index}:${sIdx}`] ? "1" : "0").join("");
        const hasSearchMatch = blockContainsSearch(block.text);

        return (
          <View
            key={index}
            style={[styles.blockquoteContainer, highlighted ? styles.highlightBlock : null, { marginVertical: 4 }]}
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
          >
            {hasSearchMatch && !isHighlightMode ? (
              renderFormattedText(block.text, styles.blockquoteText, true)
            ) : (
              <Text key={blockHighlightSig} style={styles.blockquoteText} selectable={false}>
                {sentences.map((sentence, sIdx) => {
                  const hlKey = `${index}:${sIdx}`;
                  const isHl = userHighlights[hlKey];
                  return (
                    <Text
                      key={sIdx}
                      style={isHl ? styles.userHighlightSentence : null}
                      selectable={false}
                      onPress={isHighlightMode ? () => onToggleHighlight(hlKey) : undefined}
                      suppressHighlighting={true}
                    >
                      {sIdx > 0 ? " " : ""}{renderFormattedText(sentence, null, false)}
                    </Text>
                  );
                })}
              </Text>
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

        return (
          <View
            key={index}
            style={[highlighted ? styles.highlightBlock : null, { marginVertical: 4 }]}
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
          >
            {hasSearchMatch && !isHighlightMode ? (
              renderFormattedText(block.text, baseStyle, true)
            ) : (
              <Text key={blockHighlightSig} style={baseStyle} selectable={false}>
                {sentences.map((sentence, sIdx) => {
                  const hlKey = `${index}:${sIdx}`;
                  const isHl = userHighlights[hlKey];
                  return (
                    <Text
                      key={sIdx}
                      style={isHl ? styles.userHighlightSentence : null}
                      selectable={false}
                      onPress={isHighlightMode ? () => onToggleHighlight(hlKey) : undefined}
                      suppressHighlighting={true}
                    >
                      {sIdx > 0 ? " " : ""}{renderFormattedText(sentence, null, false)}
                    </Text>
                  );
                })}
              </Text>
            )}
          </View>
        );
      }
      case "bullets":
        return (
          <View key={index} style={styles.bulletGroup} onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}>
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
                  <Text style={styles.bulletText} selectable={false}>
                    <Text style={styles.bulletDot} selectable={false}>
                      {"\u2022   "}
                    </Text>
                    {renderFormattedText(item, null, hasSearchMatch && !isHighlightMode)}
                  </Text>
                </View>
              );
              return (
                <Pressable
                  key={itemIndex}
                  disabled={!isHighlightMode}
                  onPress={() => onToggleHighlight(hlKey)}
                  style={{ width: "100%" }}
                >
                  {row}
                </Pressable>
              );
            })}
          </View>
        );
      case "nested_bullets":
        return (
          <View key={index} style={styles.nestedBulletGroup} onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}>
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
                  <Text style={styles.nestedBulletText} selectable={false}>
                    <Text style={styles.nestedBulletDot} selectable={false}>
                      {"-   "}
                    </Text>
                    {renderFormattedText(item, null, hasSearchMatch && !isHighlightMode)}
                  </Text>
                </View>
              );
              return (
                <Pressable
                  key={itemIndex}
                  disabled={!isHighlightMode}
                  onPress={() => onToggleHighlight(hlKey)}
                  style={{ width: "100%" }}
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
                {block.caption ? (
                  <Text style={styles.illustrationCaption} selectable={false}>
                    {block.caption}
                  </Text>
                ) : null}
                {block.purpose ? (
                  <Text style={styles.illustrationPurpose} selectable={false}>
                    {block.purpose}
                  </Text>
                ) : null}
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
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
          >
            {renderFormattedText(cleanedQuestion, styles.questionText)}
          </View>
        );
      }
      case "table": {
        const { headers, rows } = block;
        const minColumnWidth = 120;
        const totalTableWidth = headers.length * minColumnWidth;
        return (
          <View
            key={index}
            style={styles.tableScrollContainer}
            onLayout={(e) => { blockYMapRef.current[index] = e.nativeEvent.layout.y; }}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ width: totalTableWidth }}
            >
              <View style={[styles.tableContainer, { width: totalTableWidth }]}>
                {/* Header row */}
                <View style={styles.tableHeaderRow}>
                  {headers.map((h, hi) => (
                    <View key={hi} style={[styles.tableCell, styles.tableHeaderCell, hi < headers.length - 1 && styles.tableCellBorderRight]}>
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
                      <View key={ci} style={[styles.tableCell, ci < headers.length - 1 && styles.tableCellBorderRight]}>
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

  const renderBlockWithAnnotations = (block, index) => {
    const blockAnnotations = annotationsByBlock[index] || [];
    const tappable = isAnnotationMode && block.type !== "spacing";

    return (
      <View key={`block-wrapper-${index}`}>
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
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textTitle} />
        </TouchableOpacity>
        <Text style={styles.headerSectionTitle} numberOfLines={1} selectable={false}>
          {headerTitle}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={onToggleBookmark}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isBookmarked ? "bookmark" : "bookmark-border"}
              size={22}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={onToggleSpeak}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={isSpeaking ? "stop" : "volume-up"}
              size={22}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

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
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + insets.bottom },
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
          <Text style={styles.chapterTitle} selectable={false}>
            {(title || "") + " [V3]"}
          </Text>
          <View style={styles.chapterDivider} />
        </View>



        {showUpdateHighlights && highlightSet.size > 0 ? (
          <View style={styles.updateBanner}>
            <MaterialIcons
              name="auto-awesome"
              size={18}
              color={theme.colors.warningText}
            />
            <Text style={styles.updateBannerText}>
              Updated lines are highlighted in this topic until you review them.
            </Text>
          </View>
        ) : null}
        {mergedBlocks.map(renderBlockWithAnnotations)}
      </ScrollView>

      {/* ── Bottom Toolbar ── */}
      <View style={[styles.bottomToolbar, { paddingBottom: insets.bottom || 8 }]}>
        <TouchableOpacity
          style={styles.toolbarItem}
          onPress={() => navigation?.navigate("MainTabs", { screen: "Library" })}
          activeOpacity={0.7}
        >
          <MaterialIcons name="menu-book" size={22} color={theme.colors.textTertiary} />
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
            color={isHighlightMode ? theme.colors.secondary : theme.colors.textTertiary}
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
            color={isAnnotationMode ? theme.colors.secondary : theme.colors.textTertiary}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surfacePrimary,
  },
  captureProtectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.surfacePrimary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  captureProtectedText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },

  // ── Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfacePrimary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
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
    color: theme.colors.secondary,
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

  // ── Progress ──
  progressBarBackground: {
    height: 2.5,
    backgroundColor: theme.colors.surfaceSecondary,
    width: "100%",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.textTertiary,
    marginBottom: 8,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.textTitle,
    lineHeight: 32,
    marginBottom: 16,
  },
  chapterDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
    backgroundColor: theme.colors.warningBackground,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  updateBannerText: {
    flex: 1,
    color: theme.colors.warningText,
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
    borderColor: "#DDD6FE",
  },
  annotationModeBannerText: {
    flex: 1,
    color: theme.colors.secondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },

  // ── Typography (body size unchanged) ──
  h1: {
    color: theme.colors.secondary,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  h2: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    color: theme.colors.textTitle,
    fontSize: 15.5,
    lineHeight: 24,
    marginVertical: 4,
  },
  allCapsTitle: {
    color: "#9333ea",
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 24,
    marginVertical: 4,
  },
  tableTitleBlock: {
    marginTop: 14,
    marginBottom: 6,
  },
  tableTitleText: {
    color: theme.colors.textTitle,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  referenceBlock: {
    marginTop: 14,
    marginBottom: 4,
  },
  referenceText: {
    color: theme.colors.textTertiary,
    fontSize: 12.5,
    fontStyle: "italic",
    lineHeight: 18,
  },
  bulletGroup: {
    marginVertical: 4,
  },
  bulletRow: {
    marginBottom: 4,
    width: "100%",
  },
  bulletDot: {
    color: theme.colors.secondary,
    fontSize: 16,
    lineHeight: 24,
  },
  bulletText: {
    color: theme.colors.textTitle,
    fontSize: 15.5,
    lineHeight: 24,
    paddingBottom: 4,
  },
  nestedBulletGroup: {
    marginVertical: 2,
    marginLeft: 20,
  },
  nestedBulletRow: {
    marginBottom: 4,
    width: "100%",
  },
  nestedBulletDot: {
    color: theme.colors.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
  nestedBulletText: {
    color: theme.colors.textTitle,
    fontSize: 14.5,
    lineHeight: 22,
    paddingBottom: 4,
  },

  // ── Highlights (gold left-border style) ──
  highlightBlock: {
    marginVertical: 2,
    paddingLeft: 14,
    paddingVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#D4A853",
    backgroundColor: "#FDFAF3",
    borderRadius: 0,
  },
  highlightBulletRow: {
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#D4A853",
    backgroundColor: "#FDFAF3",
    borderRadius: 0,
  },

  // ── User Highlights (yellow background) ──
  userHighlightBlock: {
    backgroundColor: "#FEF9C3",
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
    backgroundColor: "#FEF08A",
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
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight || "#F3E8FF",
    borderRadius: 4,
  },
  blockquoteText: {
    color: theme.colors.textTitle || "#1F2937",
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 24,
    fontWeight: "600",
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
    borderLeftColor: theme.colors.secondary || "#7C3AED",
    backgroundColor: "#F5F3FF",
    borderRadius: 4,
  },
  questionText: {
    color: theme.colors.textTitle || "#1F2937",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },

  // ── Tables ──
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.surfaceSecondary || "#E5E7EB",
  },
  tableScrollContainer: {
    marginVertical: 12,
  },

  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#9333ea",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.surfacePrimary || "#FFFFFF",
  },
  tableRowAlt: {
    backgroundColor: theme.colors.surfaceSecondary || "#F9FAFB",
  },
  tableCell: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 120,
  },
  tableHeaderCell: {
    paddingVertical: 10,
  },
  tableCellBorderRight: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)",
  },
  tableHeaderText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  tableCellText: {
    color: theme.colors.textTitle || "#1F2937",
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
    backgroundColor: theme.colors.surfaceTertiary,
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
    backgroundColor: theme.colors.surfacePrimary,
    borderWidth: 1,
    borderColor: theme.colors.surfaceSecondary,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  illustrationImageFrame: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surfaceTertiary,
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
    color: theme.colors.textTitle,
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: "700",
  },
  illustrationPurpose: {
    color: theme.colors.textPrimary,
    fontSize: 13.5,
    lineHeight: 20,
  },

  // ── Bottom Toolbar ──
  bottomToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    backgroundColor: theme.colors.surfacePrimary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    elevation: 8,
    shadowColor: "#000",
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
    color: theme.colors.textTertiary,
    marginTop: 3,
  },
  toolbarLabelActive: {
    color: theme.colors.secondary,
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
    borderColor: theme.colors.secondary,
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
    borderLeftColor: "#D4A853",
    backgroundColor: "#FEFCE8",
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
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  annotationCardText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textPrimary,
  },

  // ── Annotation Input ──
  annotationInputCard: {
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },
  annotationInput: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textTitle,
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
    color: theme.colors.textTertiary,
  },
  annotationSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.secondary,
  },
  annotationSaveBtnDisabled: {
    opacity: 0.4,
  },
  annotationSaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
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
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  noteModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textTitle,
    marginBottom: 16,
  },
  noteModalInput: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.textTitle,
    minHeight: 80,
    textAlignVertical: "top",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
  },
  noteModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
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
    height: SCREEN.height * 0.78,
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
    width: SCREEN.width - 32,
    height: SCREEN.height * 0.6,
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
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  fullscreenHint: {
    marginTop: 12,
    color: "#F3F4F6",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },

  // ── Search Term Highlight ──
  searchTermMatch: {
    color: "#9333ea",
    fontWeight: "700",
  },
});

export default ReadingView;
