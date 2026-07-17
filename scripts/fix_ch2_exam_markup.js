/**
 * Fix chapter 2 exam markup for max device compatibility:
 * 1) Convert [EXAMTIP]...[/EXAMTIP] → blockquote "> **EXAM TIP:** ..."
 *    (blockquote already renders as a coloured box on older OTAs)
 * 2) Ensure blank line after every SN/LAQ/REF tag line so text-table
 *    heuristic cannot merge consecutive short lines into fake tables.
 */
const fs = require("fs");
const path = require("path");

const MOCK = path.join(__dirname, "..", "src", "data", "mockData.json");

function convertExamTips(content) {
  // Full-line EXAMTIP markers → blockquote
  return content.replace(
    /^\[EXAMTIP\]\s*([\s\S]*?)\s*\[\/EXAMTIP\]\s*$/gim,
    (match, body) => {
      const text = String(body).replace(/\s+/g, " ").trim();
      // Strip a leading "EXAM TIP:" if already present inside
      const cleaned = text.replace(/^EXAM\s*TIP\s*:\s*/i, "");
      return `> **EXAM TIP:** ${cleaned}`;
    },
  );
}

function spaceExamTags(content) {
  const lines = content.split("\n");
  const out = [];
  const isSnLaqRef = (t) => /^\[(SN|LAQ|REF)\][\s\S]*\[\/\1\]$/i.test(t);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    out.push(line);

    if (isSnLaqRef(t)) {
      // Always ensure a blank line after each SN/LAQ/REF tag
      const next = lines[i + 1];
      if (next === undefined) continue;
      if (next.trim() !== "") {
        out.push("");
      }
    }
  }

  // Collapse 3+ blanks to max 2, and trailing tidy
  const collapsed = [];
  let blankRun = 0;
  for (const l of out) {
    if (!l.trim()) {
      blankRun++;
      if (blankRun <= 1) collapsed.push("");
    } else {
      blankRun = 0;
      collapsed.push(l);
    }
  }
  return collapsed.join("\n").replace(/\n+$/, "\n");
}

function main() {
  const data = JSON.parse(fs.readFileSync(MOCK, "utf8"));
  const ch = data.find((x) => String(x.id) === "2");
  if (!ch) throw new Error("chapter 2 missing");

  const before = ch.content;
  let next = convertExamTips(before);
  next = spaceExamTips(next);
  next = spaceExamTags(next);

  ch.content = next;
  ch.recentlyUpdated = true;
  fs.writeFileSync(MOCK, JSON.stringify(data, null, 2) + "\n", "utf8");

  const tips = (next.match(/^> \*\*EXAM TIP:\*\*/gm) || []).length;
  const rawTips = (next.match(/\[EXAMTIP\]/g) || []).length;
  const lines = next.split("\n");
  let consec = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    if (
      /^\[(SN|LAQ)\]/.test(lines[i].trim()) &&
      /^\[(SN|LAQ)\]/.test(lines[i + 1].trim())
    ) {
      consec++;
    }
  }

  // show triad region
  const idx = lines.findIndex((l) => l.includes("[SN]Epidemiological triad"));
  console.log(
    JSON.stringify(
      {
        ok: tips > 0 && rawTips === 0 && consec === 0,
        blockquoteTips: tips,
        remainingExamTipTags: rawTips,
        consecutiveTagPairs: consec,
        lenBefore: before.length,
        lenAfter: next.length,
        triadRegion: lines.slice(idx, idx + 12),
      },
      null,
      2,
    ),
  );
}

function spaceExamTips(content) {
  // ensure blank line before blockquote exam tips
  const lines = content.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^>\s*\*\*EXAM TIP:\*\*/i.test(t) || /^>\s*EXAM TIP:/i.test(t)) {
      if (out.length && out[out.length - 1].trim() !== "") out.push("");
      out.push(lines[i]);
      continue;
    }
    out.push(lines[i]);
  }
  return out.join("\n");
}

main();
