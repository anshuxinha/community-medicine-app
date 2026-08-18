export const normalizeSearchQuery = (query) =>
  String(query || "").trim().toLowerCase();

const QUESTION_TRAILING_TAGS = /(\s*\[[^\]]*\])+\s*$/g;

/** Non-overlapping starts, split on markdown bold the same way highlights paint. */
export const collectOccurrences = (text, query) => {
  const q = normalizeSearchQuery(query);
  if (!q) return [];
  const source = String(text || "");
  if (!source) return [];

  const starts = [];
  const parts = source.split(/\*\*/);
  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    let idx = 0;
    while (idx <= lower.length - q.length) {
      const found = lower.indexOf(q, idx);
      if (found === -1) break;
      starts.push(found);
      idx = found + q.length;
    }
  }
  return starts;
};

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
