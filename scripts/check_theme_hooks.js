const fs = require("fs");
const path = require("path");

function walk(dir, files = []) {
  for (const i of fs.readdirSync(dir)) {
    const f = path.join(dir, i);
    if (fs.statSync(f).isDirectory()) walk(f, files);
    else if (f.endsWith(".js") && !f.includes("__tests__")) files.push(f);
  }
  return files;
}

// Flag remaining ={colors.} breakage
for (const f of walk("src")) {
  const s = fs.readFileSync(f, "utf8");
  if (s.includes("={colors.}")) console.log("BROKEN PROP", f);
  if (s.includes("createStyles") && !s.includes("useThemedStyles(createStyles)") && !f.includes("ErrorBoundary")) {
    // ErrorBoundary uses static styles
    if (s.includes("useThemedStyles")) {
      // has import but maybe missing call - already checked
    }
  }
  // hooks inside non-components (common bad injection)
  if (/flush\w*\s*=\s*\(\)\s*=>\s*\{\s*\n\s*const \{ styles/.test(s)) {
    console.log("HOOK IN FLUSH", f);
  }
  if (/parseMarkdown[\s\S]{0,200}useThemedStyles/.test(s)) {
    console.log("HOOK NEAR parseMarkdown", f);
  }
}
console.log("check complete");
