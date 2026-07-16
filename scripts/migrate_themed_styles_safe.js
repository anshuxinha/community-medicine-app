/**
 * Safe StyleSheet → createStyles(colors) migration.
 * - Rewrites only the StyleSheet.create block
 * - Injects useThemedStyles once into the primary component
 * - Leaves theme.colors in JSX (still valid; static light) — StyleSheet tokens go dark
 */
const fs = require("fs");
const path = require("path");

const ROOTS = [
  path.join(__dirname, "../src/screens"),
  path.join(__dirname, "../src/components"),
];

const SKIP = new Set(["ErrorBoundary.js"]);

function findMatchingBrace(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function processFile(filePath) {
  const base = path.basename(filePath);
  if (!filePath.endsWith(".js") || filePath.includes("__tests__")) return;
  if (SKIP.has(base)) return;

  let src = fs.readFileSync(filePath, "utf8");
  if (src.includes("const createStyles = ")) return;
  if (!src.includes("StyleSheet.create")) return;
  if (!src.includes("theme.colors")) return;

  const marker = "const styles = StyleSheet.create(";
  const mIdx = src.indexOf(marker);
  if (mIdx === -1) return;

  const openBrace = src.indexOf("{", mIdx + marker.length - 1);
  const closeBrace = findMatchingBrace(src, openBrace);
  if (closeBrace === -1) {
    console.log("skip brace", base);
    return;
  }
  let end = closeBrace + 1;
  while (end < src.length && /\s/.test(src[end])) end++;
  if (src[end] === ")") end++;
  if (src[end] === ";") end++;

  const block = src.slice(mIdx, end);
  const inner = block
    .replace(
      "const styles = StyleSheet.create(",
      "const createStyles = (colors) => StyleSheet.create(",
    )
    .replace(/theme\.colors\./g, "colors.");

  src = src.slice(0, mIdx) + inner + src.slice(end);

  // Imports
  if (!src.includes("useThemedStyles")) {
    const themeImport = src.match(
      /import\s*\{([^}]*)\}\s*from\s*['"]([^'"]*styles\/theme)['"]\s*;?/,
    );
    if (themeImport) {
      const names = themeImport[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const p = themeImport[2];
      const themedPath = p.replace(/\/theme$/, "/useThemedStyles");
      const keep = names.filter((n) => n !== "theme");
      // Always keep theme for residual JSX
      const themeNames = ["theme", ...keep.filter((n) => n !== "theme")];
      const unique = [...new Set(themeNames)];
      const replacement = `import { ${unique.join(", ")} } from '${p}';\nimport { useThemedStyles } from '${themedPath}';`;
      src = src.replace(themeImport[0], replacement);
    } else {
      const lastImport = src.lastIndexOf("import ");
      const nl = src.indexOf("\n", lastImport);
      src =
        src.slice(0, nl + 1) +
        `import { useThemedStyles } from '../styles/useThemedStyles';\n` +
        src.slice(nl + 1);
    }
  }

  // Inject once into best primary component
  const patterns = [
    /(export default function [A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*\{)/,
    /(const [A-Z][A-Za-z0-9_]*Screen\s*=\s*\([^)]*\)\s*=>\s*\{)/,
    /(const [A-Z][A-Za-z0-9_]*\s*=\s*\(\s*\{[^}]*\}\s*\)\s*=>\s*\{)/,
    /(const [A-Z][A-Za-z0-9_]*\s*=\s*\(\)\s*=>\s*\{)/,
    /(function [A-Z][A-Za-z0-9_]*\s*\([^)]*\)\s*\{)/,
  ];

  let didInject = false;
  for (const re of patterns) {
    if (re.test(src) && !src.includes("useThemedStyles(createStyles)")) {
      src = src.replace(re, (m) => {
        if (didInject) return m;
        didInject = true;
        return `${m}\n  const { styles, colors } = useThemedStyles(createStyles);\n`;
      });
      break;
    }
  }

  // Child components that use styles/ — give them their own hook
  if (didInject) {
    const childRe =
      /const (EmptyState|FreeLabel|StatusMark|FeatureItem|MuseumCard|DescriptionBlock|UpdateDownloadIndicator)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g;
    src = src.replace(childRe, (m) => {
      if (m.includes("useThemedStyles")) return m;
      return `${m}\n  const { styles, colors } = useThemedStyles(createStyles);\n`;
    });
  }

  fs.writeFileSync(filePath, src);
  console.log(didInject ? "ok" : "ok-no-inject", base);
}

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) walk(full);
    else processFile(full);
  }
}

for (const r of ROOTS) walk(r);
console.log("done");
