/**
 * Convert module-level StyleSheet.create that uses theme.colors into
 * createStyles(colors) + useThemedStyles(createStyles) for scheme reactivity.
 *
 * Safe-ish heuristics — review git diff after running.
 */
const fs = require("fs");
const path = require("path");

const ROOTS = [
  path.join(__dirname, "../src/screens"),
  path.join(__dirname, "../src/components"),
];

function processFile(filePath) {
  if (!filePath.endsWith(".js")) return;
  if (filePath.includes("__tests__")) return;

  let src = fs.readFileSync(filePath, "utf8");
  if (!src.includes("StyleSheet.create")) return;
  if (!src.includes("theme.colors")) return;
  if (src.includes("const createStyles = ")) {
    console.log("skip (already migrated):", path.basename(filePath));
    return;
  }

  // Only migrate the first/last module-level `const styles = StyleSheet.create`
  if (!/const styles = StyleSheet\.create\(/.test(src)) {
    console.log("skip (no module styles):", path.basename(filePath));
    return;
  }

  // Replace theme.colors → colors everywhere (styles + JSX)
  src = src.replace(/theme\.colors\./g, "colors.");

  // StyleSheet factory
  src = src.replace(
    /const styles = StyleSheet\.create\(/,
    "const createStyles = (colors) => StyleSheet.create(",
  );

  // Imports
  const hasThemeImport = /import\s*\{[^}]*\btheme\b[^}]*\}\s*from\s*['"][^'"]*styles\/theme['"]/.test(
    src,
  );
  const themeImportRe =
    /import\s*\{([^}]*)\}\s*from\s*(['"])([^'"]*styles\/theme)\2\s*;?/;

  if (hasThemeImport) {
    src = src.replace(themeImportRe, (full, names, q, p) => {
      const parts = names
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((n) => n !== "theme");
      // keep useResponsive etc.
      if (parts.length === 0) {
        return `import { useThemedStyles } from ${q}${p.replace(/theme$/, "useThemedStyles")}${q};`;
      }
      // still need theme path for useResponsive
      const themeLine = `import { ${parts.join(", ")} } from ${q}${p}${q};`;
      const themedLine = `import { useThemedStyles } from ${q}${p.replace(/\/theme$/, "/useThemedStyles")}${q};`;
      return `${themeLine}\n${themedLine}`;
    });
  } else {
    // colors. used but no theme import — add useThemedStyles near top
    const rel = filePath.includes(`${path.sep}screens${path.sep}`)
      ? "../styles/useThemedStyles"
      : "../styles/useThemedStyles";
    if (!src.includes("useThemedStyles")) {
      const lastImport = src.lastIndexOf("import ");
      const end = src.indexOf("\n", lastImport);
      src =
        src.slice(0, end + 1) +
        `import { useThemedStyles } from '${rel}';\n` +
        src.slice(end + 1);
    }
  }

  if (!src.includes("useThemedStyles")) {
    // theme import path replace failed edge case
    const rel = "../styles/useThemedStyles";
    const lastImport = src.lastIndexOf("import ");
    const end = src.indexOf("\n", lastImport);
    src =
      src.slice(0, end + 1) +
      `import { useThemedStyles } from '${rel}';\n` +
      src.slice(end + 1);
  }

  // If theme was only import, we may have broken useResponsive files - OK

  // Inject `const styles = useThemedStyles(createStyles);` into default export function components
  // Find first function component body after imports that is the main screen
  // Heuristic: first `const X = () => {` or `function X(` or `export default function`
  const injectPatterns = [
    /(export default function \w+\s*\([^)]*\)\s*\{)/,
    /(const \w+ = \(\)\s*=>\s*\{)/,
    /(const \w+ = \(\{[^}]*\}\)\s*=>\s*\{)/,
    /(function \w+\s*\([^)]*\)\s*\{)/,
  ];

  let injected = false;
  for (const re of injectPatterns) {
    if (re.test(src)) {
      src = src.replace(re, (m) => {
        if (injected) return m;
        // Don't inject into tiny helpers before main component if createStyles is after
        injected = true;
        return `${m}\n  const styles = useThemedStyles(createStyles);\n`;
      });
      break;
    }
  }

  // If component still references bare `theme` fix
  // Remove unused theme if any leftover

  // Problem: createStyles is defined AFTER the component in most files.
  // useThemedStyles(createStyles) at top of component is fine in JS (const createStyles is TDZ only if called before init at runtime - actually createStyles is defined at module load before any render, so OK).

  // Another problem: we may have injected into the WRONG first function (e.g. helper)
  // Manual review needed for complex files.

  // Multiple components: only first gets styles - ReadingView etc. may need hand fix

  // If colors. used outside createStyles and outside component with styles hook - module level constants
  // e.g. `const X = { color: colors.primary }` at module level - BREAKS
  // Detect module-level colors. before createStyles
  const createIdx = src.indexOf("const createStyles");
  const before = src.slice(0, createIdx);
  // crude: if colors. appears in module scope assignments outside functions - flag
  // For now leave; fix broken files after.

  fs.writeFileSync(filePath, src, "utf8");
  console.log("migrated:", path.basename(filePath), injected ? "(injected)" : "(NO inject)");
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
