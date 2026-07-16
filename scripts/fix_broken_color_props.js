const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const HEX_MAP = {
  "#FFFFFF": "surfacePrimary",
  "#ffffff": "surfacePrimary",
  "#fff": "surfacePrimary",
  "#FFF": "surfacePrimary",
  "#D1D5DB": "borderStrong",
  "#D4A853": "highlightBorder",
  "#9CA3AF": "textPlaceholder",
  "#4CAF50": "success",
  "#A855F7": "secondary",
  "#F59E0B": "warning",
  "#6B7280": "textTertiary",
};

function walk(dir, files = []) {
  for (const i of fs.readdirSync(dir)) {
    const f = path.join(dir, i);
    if (fs.statSync(f).isDirectory()) walk(f, files);
    else if (f.endsWith(".js")) files.push(f);
  }
  return files;
}

function tokenFor(hex) {
  return (
    HEX_MAP[hex] ||
    HEX_MAP[hex.toUpperCase()] ||
    HEX_MAP[hex.toLowerCase()] ||
    "surfacePrimary"
  );
}

const files = walk("src").filter((f) =>
  fs.readFileSync(f, "utf8").includes("={colors.}"),
);
console.log("files to fix", files.length);

for (const file of files) {
  const gitPath = file.replace(/\\/g, "/");
  let original;
  try {
    original = execSync(`git show HEAD:${gitPath}`, { encoding: "utf8" });
  } catch (e) {
    console.log("no git for", file);
    continue;
  }
  const origLines = original.split(/\n/);
  const curLines = fs.readFileSync(file, "utf8").split(/\n/);

  for (let i = 0; i < curLines.length; i++) {
    if (!curLines[i].includes("={colors.}")) continue;
    const cur = curLines[i];
    const iconMatch = cur.match(/name="([^"]+)"/);
    let fixed = null;

    const tryLine = (o) => {
      const m = o.match(/(\w+)=["'](#[0-9A-Fa-f]{3,8})["']/);
      if (!m) return null;
      return cur.replace(
        "={colors.}",
        `${m[1]}={colors.${tokenFor(m[2])}}`,
      );
    };

    const searchStart = Math.max(0, i - 8);
    const searchEnd = Math.min(origLines.length, i + 20);
    for (let j = searchStart; j < searchEnd; j++) {
      const o = origLines[j];
      if (iconMatch && !o.includes(iconMatch[1])) continue;
      fixed = tryLine(o);
      if (fixed) break;
    }

    if (!fixed && iconMatch) {
      for (const o of origLines) {
        if (o.includes(iconMatch[1]) && /#[0-9A-Fa-f]{3,8}/.test(o)) {
          fixed = tryLine(o);
          if (fixed) break;
        }
      }
    }

    // Dashboard ProgressBar / Dietary textColor without icon name
    if (!fixed) {
      for (let j = searchStart; j < searchEnd; j++) {
        fixed = tryLine(origLines[j]);
        if (fixed) break;
      }
    }

    if (fixed) {
      curLines[i] = fixed;
      console.log("fixed", path.basename(file), i + 1);
    } else {
      console.log("FAILED", path.basename(file), i + 1, cur.trim().slice(0, 90));
    }
  }
  fs.writeFileSync(file, curLines.join("\n"));
}
console.log("done");
