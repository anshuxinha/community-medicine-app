/**
 * End-to-end: sync latest Bunny video → category + notify → attach Notes PDF.
 *
 * Usage:
 *   node scripts/publish-video.js --file="D:\path\to\notes.pdf" --category=theory
 *   node scripts/publish-video.js --file="..." --category=practicals --category-label=Practicals
 *   node scripts/publish-video.js --file="..." --category=theory "Custom push body text"
 *
 * Prerequisites: video already uploaded to Bunny Stream library.
 * Does: Firestore sync, Expo push for un-notified isNew videos, PDF notes on the
 * video that received the category (latest Bunny item).
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const parseArgs = () => {
  const options = { positional: [] };
  process.argv.slice(2).forEach((arg) => {
    if (!arg.startsWith("--")) {
      options.positional.push(arg);
      return;
    }
    const [key, ...valueParts] = arg.slice(2).split("=");
    options[key] = valueParts.length ? valueParts.join("=") : true;
  });
  return options;
};

const titleCaseLabel = (category) =>
  String(category)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const runNode = (scriptRelative, args, label) => {
  const scriptPath = path.join(ROOT, scriptRelative);
  console.log(`\n=== ${label} ===`);
  console.log(`node ${scriptRelative} ${args.join(" ")}`);

  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    throw new Error(
      `${label} failed with exit code ${result.status ?? "unknown"}.`,
    );
  }

  return result.stdout || "";
};

const extractFirstUpsert = (syncOutput) => {
  // Upserting video <guid> (<title>) in category <category>...
  const match = syncOutput.match(
    /Upserting video ([0-9a-fA-F-]{36}) \((.+?)\) in category (\S+)\.\.\./,
  );
  if (!match) return null;
  return {
    videoId: match[1],
    title: match[2],
    category: match[3],
  };
};

const main = () => {
  const options = parseArgs();
  const file = options.file || options.pdf;
  const category = options.category;

  if (!file || typeof file !== "string") {
    throw new Error(
      'Missing PDF. Use --file="D:\\Stroma Files\\Videos\\Theory\\...\\notes.pdf"',
    );
  }
  if (!category || typeof category !== "string") {
    throw new Error(
      "Missing category. Use --category=theory|practicals|webinars (or your slug).",
    );
  }
  if (!fs.existsSync(file)) {
    throw new Error(`PDF not found: ${file}`);
  }

  const categoryLabel =
    options.categoryLabel ||
    options["category-label"] ||
    titleCaseLabel(category);
  const customMessage = options.message || options.positional?.[0] || null;
  const skipNotify =
    options["skip-notify"] === true || options["skip-notify"] === "true";

  console.log("Publish video workflow");
  console.log(`  PDF:             ${file}`);
  console.log(`  Category:        ${category}`);
  console.log(`  Category label:  ${categoryLabel}`);
  console.log(`  Notify:          ${skipNotify ? "no" : "yes (--notify-new)"}`);
  if (customMessage) console.log(`  Push body:       ${customMessage}`);

  const syncArgs = [
    "sync",
    `--category=${category}`,
    `--category-label=${categoryLabel}`,
  ];
  if (!skipNotify) {
    syncArgs.push("--notify-new");
  }
  if (customMessage) {
    syncArgs.push(customMessage);
  }

  const syncOut = runNode("scripts/bunny-videos.js", syncArgs, "Bunny sync + notify");
  const first = extractFirstUpsert(syncOut);

  if (!first) {
    throw new Error(
      "Could not parse latest video id from sync output. Aborting PDF attach.",
    );
  }

  console.log(
    `\nLatest video (category applied): ${first.title} (${first.videoId})`,
  );

  const attachArgs = [`--file=${file}`, `--id=${first.videoId}`];
  const attachOut = runNode(
    "scripts/attach-pdf-to-video.js",
    attachArgs,
    "Attach Notes PDF",
  );

  let attachMeta = null;
  const jsonLine = attachOut
    .split(/\r?\n/)
    .map((line) => line.trim())
    .reverse()
    .find((line) => line.startsWith("{") && line.includes('"ok"'));
  if (jsonLine) {
    try {
      attachMeta = JSON.parse(jsonLine);
    } catch {
      // ignore parse errors; human logs already printed
    }
  }

  console.log("\n=== Publish complete ===");
  console.log(
    JSON.stringify(
      {
        ok: true,
        videoId: first.videoId,
        title: first.title,
        category,
        categoryLabel,
        notified: !skipNotify,
        pdfUrl: attachMeta?.pdfUrl || null,
        pdfName: attachMeta?.pdfName || path.basename(file),
      },
      null,
      2,
    ),
  );
};

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
