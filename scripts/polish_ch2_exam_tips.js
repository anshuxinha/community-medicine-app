const fs = require("fs");
const path = require("path");
const MOCK = path.join(__dirname, "..", "src", "data", "mockData.json");

const data = JSON.parse(fs.readFileSync(MOCK, "utf8"));
const ch = data.find((x) => String(x.id) === "2");
let c = ch.content;

c = c.replace(/SN causation:\s*/g, "For causation also cover: ");
c = c.replace(/SN on triad alone:\s*/gi, "If asked only on the triad: ");
c = c.replace(/\. SN:\s*/g, ". For a short note: ");
c = c.replace(
  /close with "levels are complementary\." definition \+/g,
  'close with "levels are complementary." For a short note: definition +',
);

ch.content = c;
ch.recentlyUpdated = true;
fs.writeFileSync(MOCK, JSON.stringify(data, null, 2) + "\n", "utf8");

const tips = c.split("\n").filter((l) => /EXAM TIP/i.test(l));
const still = tips.filter((l) =>
  /\bSN\s*\(|\bLAQ\s*\(|SN causation|\. SN:|\bLAQ\s*:/i.test(l),
);
console.log(
  JSON.stringify(
    {
      ok: still.length === 0,
      still,
      sample: tips.map((t) => t.replace(/^>\s*/, "").slice(0, 120)),
    },
    null,
    2,
  ),
);
