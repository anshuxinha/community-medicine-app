/**
 * Seed appContent/updatesFeed from local updates.json + updates_archive.json.
 * No push notifications (historical backfill).
 *
 * Run: node scripts/seed-updates-feed.js
 */
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SA = path.join(ROOT, "serviceAccountKey.json");
const UPDATES = path.join(ROOT, "src", "data", "updates.json");
const ARCHIVE = path.join(ROOT, "src", "data", "updates_archive.json");

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function monthKey(dateStr) {
  return typeof dateStr === "string" && dateStr.length >= 7
    ? dateStr.slice(0, 7)
    : null;
}

function dedupeSort(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const link = item && item.link;
    if (link) {
      if (seen.has(link)) continue;
      seen.add(link);
    }
    out.push(item);
  }
  out.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  return out;
}

function main() {
  if (!fs.existsSync(SA)) {
    console.error("Missing serviceAccountKey.json");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(require(SA)),
    projectId: "community-med-app",
  });
  const db = admin.firestore();

  const current = loadJson(UPDATES, []);
  const archive = loadJson(ARCHIVE, {});
  const year = String(new Date().getFullYear());
  const months = {};

  for (const [key, list] of Object.entries(archive)) {
    if (!String(key).startsWith(year)) continue;
    if (!Array.isArray(list)) continue;
    months[key] = dedupeSort(list);
  }

  if (Array.isArray(current)) {
    for (const item of current) {
      const key = monthKey(item.date);
      if (!key || !key.startsWith(year)) continue;
      months[key] = months[key] || [];
      months[key].push(item);
    }
  }

  for (const key of Object.keys(months)) {
    months[key] = dedupeSort(months[key]);
  }

  const total = Object.values(months).reduce((n, list) => n + list.length, 0);
  if (total === 0) {
    console.error("No updates to seed.");
    process.exit(1);
  }

  return db
    .collection("appContent")
    .doc("updatesFeed")
    .set(
      {
        months,
        updatedAt: new Date().toISOString(),
        version: 1,
      },
      { merge: true },
    )
    .then(() => {
      console.log(
        `Seeded appContent/updatesFeed: ${Object.keys(months).length} months, ${total} items (no push).`,
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exit(1);
    });
}

main();
