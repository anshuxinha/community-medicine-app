export const normalizeSearchQuery = (query) =>
  String(query || "").trim().toLowerCase();

const QUESTION_TRAILING_TAGS = /(\s*\[[^\]]*\])+\s*$/g;

/** Non-overlapping starts in display text (markdown ** stripped), same split as highlights. */
export const collectOccurrences = (text, query) => {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  const source = String(text || "");
  if (!source) return [];

  const starts = [];
  const parts = source.split(/\*\*/);
  let offset = 0;
  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    let idx = 0;
    while (idx <= lower.length - q.length) {
      const found = lower.indexOf(q, idx);
      if (found === -1) break;
      starts.push(offset + found);
      idx = found + q.length;
    }
    offset += part.length;
  }
  return starts;
};

/** Line y inside a Text onTextLayout result for a display-string character offset. */
export const lineYForCharOffset = (lines, charOffset) => {
  if (!Array.isArray(lines) || lines.length === 0) return 0;
  const offset = Math.max(0, Number(charOffset) || 0);
  let consumed = 0;
  let sawText = false;
  for (const line of lines) {
    if (typeof line?.text !== "string") continue;
    sawText = true;
    const len = line.text.length;
    if (offset < consumed + len) {
      return line.y || 0;
    }
    consumed += len;
  }
  if (sawText) {
    return lines[lines.length - 1].y || 0;
  }
  return 0;
};

/** Scroll-content Y of a match from host window coords and a line offset inside that host. */
export const matchYFromHostLayout = ({
  scrollOffsetY,
  hostPageY,
  scrollViewPageY,
  lineY,
}) =>
  (Number(scrollOffsetY) || 0) +
  ((Number(hostPageY) || 0) - (Number(scrollViewPageY) || 0)) +
  (Number(lineY) || 0);

const appendMatches = (matches, blockIndex, text, query) => {
  const count = collectOccurrences(text, query).length;
  for (let i = 0; i < count; i += 1) {
    matches.push({ blockIndex });
  }
};

const collectFromBlock = (block, blockIndex, query, matches) => {
  if (!block || block.type === "exercise" || block.type === "spacing") {
    return;
  }

  if (block.type === "table") {
    const headers = block.headers || [];
    const rows = block.rows || [];
    headers.forEach((header) => {
      appendMatches(matches, blockIndex, header, query);
    });
    rows.forEach((row) => {
      headers.forEach((_, columnIndex) => {
        const cell = Array.isArray(row) ? row[columnIndex] ?? "" : "";
        appendMatches(matches, blockIndex, cell, query);
      });
    });
    return;
  }

  if (block.type === "question") {
    const cleaned = String(block.text || "")
      .replace(QUESTION_TRAILING_TAGS, "")
      .trim();
    appendMatches(matches, blockIndex, cleaned, query);
    return;
  }

  if (block.text) {
    appendMatches(matches, blockIndex, block.text, query);
  }
  if (Array.isArray(block.items)) {
    block.items.forEach((item) => {
      appendMatches(matches, blockIndex, item, query);
    });
  }
  if (block.caption) {
    appendMatches(matches, blockIndex, block.caption, query);
  }
  if (block.purpose) {
    appendMatches(matches, blockIndex, block.purpose, query);
  }
};

export const collectChapterSearchMatches = (blocks, query) => {
  if (!normalizeSearchQuery(query) || !Array.isArray(blocks)) {
    return [];
  }
  const matches = [];
  blocks.forEach((block, blockIndex) => {
    collectFromBlock(block, blockIndex, query, matches);
  });
  return matches;
};
