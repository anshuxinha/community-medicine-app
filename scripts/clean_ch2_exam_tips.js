/**
 * Strip mark-count / question-type artifacts from chapter 2 EXAM TIP lines.
 * e.g. "SN (5):", "LAQ (10):", "LAQ (10–15):", "SN HDI (5):", "SN Ottawa (5):"
 */
const fs = require("fs");
const path = require("path");

const MOCK = path.join(__dirname, "..", "src", "data", "mockData.json");

function cleanTipBody(body) {
  let t = String(body).replace(/\s+/g, " ").trim();

  // Repeatedly strip leading type/marks prefixes
  // Examples: "SN (5):", "LAQ (10–15):", "SN HDI (5):", "SN Ottawa (5):",
  // "LAQ/SN on WHO health:", "SN determinants (5):", "LAQ (statement-type ...):"
  const prefixPatterns = [
    /^(?:LAQ\/SN|SN\/LAQ)\s+on\s+[^:]+:\s*/i,
    /^LAQ\s*\([^)]*\)\s*:\s*/i,
    /^SN\s+[A-Za-z][A-Za-z0-9/ &-]{0,40}\s*\(\s*[\d–—-]+(?:\s*[-–—]\s*[\d–—-]+)?\s*\)\s*:\s*/i,
    /^SN\s*\(\s*[\d–—-]+(?:\s*[-–—]\s*[\d–—-]+)?\s*\)\s*:\s*/i,
    /^SN\s+determinants\s*\(\s*[\d–—-]+\s*\)\s*:\s*/i,
    /^For\s+(?:short\s+notes?|long\s+answers?)\s*\(\s*~?\d+\s*marks?\)\s*:\s*/i,
  ];

  let changed = true;
  while (changed) {
    changed = false;
    for (const re of prefixPatterns) {
      const next = t.replace(re, "");
      if (next !== t) {
        t = next.trim();
        changed = true;
      }
    }
  }

  // Mid-sentence mark crumbs: " SN (5): " / " LAQ (10): "
  t = t.replace(/\s+(?:SN|LAQ)\s*\(\s*[\d–—-]+(?:\s*[-–—]\s*[\d–—-]+)?\s*\)\s*:/gi, " ");
  // Trailing "SN: definition..." ok; but " SN (5)." not needed
  t = t.replace(/\s{2,}/g, " ").trim();

  // Capitalize first letter if stripped left lowercase
  if (t && /^[a-z]/.test(t)) {
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t;
}

function cleanContent(content) {
  return content
    .split("\n")
    .map((line) => {
      const m = line.match(/^(\s*>\s*)\*\*EXAM\s*TIP:\*\*\s*(.*)$/i);
      if (!m) return line;
      const cleaned = cleanTipBody(m[2]);
      return `${m[1]}**EXAM TIP:** ${cleaned}`;
    })
    .join("\n");
}

function main() {
  const data = JSON.parse(fs.readFileSync(MOCK, "utf8"));
  const ch = data.find((x) => String(x.id) === "2");
  if (!ch) throw new Error("chapter 2 missing");

  const before = ch.content;
  const after = cleanContent(before);
  ch.content = after;
  ch.recentlyUpdated = true;
  fs.writeFileSync(MOCK, JSON.stringify(data, null, 2) + "\n", "utf8");

  const tips = after.split("\n").filter((l) => /\*\*EXAM\s*TIP:\*\*/i.test(l));
  const bad = tips.filter((l) =>
    /\b(?:SN|LAQ)\s*\(\s*[\d–—-]/i.test(l) || /\b(?:SN|LAQ)\s*\(\s*\d/i.test(l),
  );
  console.log(
    JSON.stringify(
      {
        ok: bad.length === 0,
        tipCount: tips.length,
        badCount: bad.length,
        tips: tips.map((t) => t.replace(/^>\s*/, "").slice(0, 140)),
        bad,
      },
      null,
      2,
    ),
  );
}

main();
