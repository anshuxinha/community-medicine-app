/**
 * STROMA-branded Research Methodology teaching boards.
 * Writes PNGs to reading-illustrations/ for sync-reading-illustrations.js.
 */
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const OUTPUT_DIR = path.join(__dirname, "..", "reading-illustrations");
const SIZE = 1400;

const C = {
  paper: "#FBFCFE",
  navy: "#0D1B2A",
  primary: "#6B21A8",
  primaryDark: "#581C87",
  secondary: "#8A2BE2",
  soft: "#F3E8FF",
  muted: "#DDD6FE",
  gold: "#D4A853",
  ink: "#111827",
  body: "#374151",
  white: "#FFFFFF",
  softAlt: "#EDE9FE",
};

const ensureDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
};

const roundRect = (ctx, x, y, w, h, r, fill, stroke, lineWidth = 3) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, font, color, maxLines = 8) => {
  ctx.font = font;
  ctx.fillStyle = color;
  const words = String(text).split(" ");
  let line = "";
  let currentY = y;
  let used = 0;
  for (const word of words) {
    const next = `${line}${word} `;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
      used += 1;
      line = `${word} `;
      if (used >= maxLines) return currentY;
    } else {
      line = next;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
};

const header = (ctx, title, subtitle) => {
  roundRect(ctx, 0, 0, SIZE, 168, 0, C.navy);
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, 168, SIZE, 8);
  ctx.fillStyle = C.white;
  ctx.font = "700 48px Sans";
  ctx.fillText(title, 56, 78);
  ctx.fillStyle = C.muted;
  ctx.font = "28px Sans";
  ctx.fillText(subtitle, 56, 126);
};

const write = (fileName, painter) => {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, SIZE, SIZE);
  painter(ctx);
  const out = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log("wrote", out);
};

const domains = (ctx) => {
  header(ctx, "Domains of Health Research", "Object of analysis by level of analysis");
  const cells = [
    {
      x: 70,
      y: 280,
      title: "Biomedical",
      body: "Health problem at individual or sub-individual level. Body structure, function, pathological mechanisms.",
    },
    {
      x: 720,
      y: 280,
      title: "Clinical",
      body: "Healthcare response in individuals. Natural history, efficacy of diagnosis or therapy.",
    },
    {
      x: 70,
      y: 780,
      title: "Epidemiological",
      body: "Health problem in populations. Frequency, distribution, and causes of disease.",
    },
    {
      x: 720,
      y: 780,
      title: "Health systems",
      body: "Organised response at population level. Policy, operational, and programme research.",
    },
  ];
  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 26px Sans";
  ctx.fillText("HEALTH PROBLEM", 70, 240);
  ctx.fillText("HEALTHCARE RESPONSE", 720, 240);
  ctx.save();
  ctx.translate(36, 560);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("INDIVIDUAL", 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(36, 1080);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("POPULATION", 0, 0);
  ctx.restore();

  cells.forEach((cell, i) => {
    roundRect(ctx, cell.x, cell.y, 610, 430, 24, i % 2 === 0 ? C.soft : C.softAlt, C.primary, 3);
    ctx.fillStyle = C.primary;
    ctx.font = "700 36px Sans";
    ctx.fillText(cell.title, cell.x + 32, cell.y + 64);
    wrapText(ctx, cell.body, cell.x + 32, cell.y + 130, 546, 40, "28px Sans", C.body, 7);
  });
};

const finer = (ctx) => {
  header(ctx, "FINER Criteria", "Choosing a research problem that can be studied");
  const items = [
    ["F", "Feasible", "Subjects, expertise, money, time, and administrative support are adequate."],
    ["I", "Interesting", "The question matters to the researcher, faculty, and health managers."],
    ["N", "Novel", "Fills a knowledge gap. Does not reinvent a settled answer."],
    ["E", "Ethical", "No unjustified harm. Ethics committee review and consent are possible."],
    ["R", "Relevant", "Priority for the area, programme, or country. Can change practice or policy."],
  ];
  let y = 220;
  items.forEach(([letter, title, body]) => {
    roundRect(ctx, 56, y, 1288, 210, 22, C.white, C.muted, 3);
    roundRect(ctx, 80, y + 36, 138, 138, 20, C.primary);
    ctx.fillStyle = C.white;
    ctx.font = "700 72px Sans";
    ctx.fillText(letter, 124, y + 130);
    ctx.fillStyle = C.navy;
    ctx.font = "700 40px Sans";
    ctx.fillText(title, 250, y + 78);
    wrapText(ctx, body, 250, y + 126, 1040, 36, "28px Sans", C.body, 3);
    y += 226;
  });
};

const sampling = (ctx) => {
  header(ctx, "Types of Sampling", "Probability versus non-probability strategies");
  roundRect(ctx, 80, 220, 1240, 110, 20, C.navy);
  ctx.fillStyle = C.white;
  ctx.font = "700 36px Sans";
  ctx.fillText("Sampling from a defined sampling frame", 120, 288);

  roundRect(ctx, 80, 380, 600, 940, 22, C.soft, C.primary, 3);
  roundRect(ctx, 720, 380, 600, 940, 22, C.softAlt, C.secondary, 3);

  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 32px Sans";
  ctx.fillText("Probability (random)", 110, 440);
  ctx.fillText("Non-probability", 750, 440);

  const left = [
    "Simple random",
    "Systematic random",
    "Stratified random",
    "Cluster / multistage",
    "Every unit has a known chance",
    "Supports inference to the population",
  ];
  const right = [
    "Convenience",
    "Purposive / judgment",
    "Quota",
    "Snowball",
    "Chance of selection is unknown",
    "Useful in qualitative work; limited generalisation",
  ];
  left.forEach((line, i) => {
    const y = 480 + i * 130;
    roundRect(ctx, 110, y, 540, 110, 16, C.white, C.muted, 2);
    wrapText(ctx, line, 134, y + 66, 500, 32, "26px Sans", C.ink, 2);
  });
  right.forEach((line, i) => {
    const y = 480 + i * 130;
    roundRect(ctx, 750, y, 540, 110, 16, C.white, C.muted, 2);
    wrapText(ctx, line, 774, y + 66, 500, 32, "26px Sans", C.ink, 2);
  });
};

const qualitative = (ctx) => {
  header(ctx, "Qualitative Methods", "When numbers cannot explain meaning or process");
  const cards = [
    { title: "Focus group discussion", body: "6 to 10 participants, shared experience, moderator-led. Maps norms and group views." },
    { title: "In-depth interview", body: "One person, open guide, probes lived experience. Useful for sensitive topics." },
    { title: "Key informant interview", body: "Informed insider (ASHA, MO, teacher). Explains how a system actually works." },
    { title: "Observation", body: "Watch practice in the field or clinic. Records what people do, not only what they say." },
    { title: "Participatory methods", body: "PRA tools: mapping, ranking, seasonal calendar. Community produces the data." },
    { title: "Document review", body: "Registers, minutes, diaries, media. Triangulates talk with records." },
  ];
  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * 670;
    const y = 220 + row * 380;
    roundRect(ctx, x, y, 640, 350, 22, C.white, C.primary, 3);
    roundRect(ctx, x, y, 16, 350, 0, C.gold);
    ctx.fillStyle = C.primary;
    ctx.font = "700 30px Sans";
    wrapText(ctx, card.title, x + 44, y + 70, 560, 36, "700 30px Sans", C.primary, 2);
    wrapText(ctx, card.body, x + 44, y + 150, 560, 36, "26px Sans", C.body, 5);
  });
};

const ethics = (ctx) => {
  header(ctx, "Informed Consent", "ICMR 2017 process: information, comprehension, voluntariness");
  const blocks = [
    { title: "1. Information", body: "Purpose, methods, duration, risks, benefits, alternatives, confidentiality, compensation for research-related harm, right to withdraw." },
    { title: "2. Comprehension", body: "Language the participant understands. Time to ask questions. Test of understanding when risk is high." },
    { title: "3. Voluntariness", body: "No coercion or undue inducement. Consent can be refused or withdrawn without loss of entitled care." },
    { title: "4. Documentation", body: "Written consent (or witnessed thumb impression). Assent plus parent/LAR consent for children. Electronic consent allowed when approved." },
  ];
  blocks.forEach((b, i) => {
    const y = 210 + i * 230;
    roundRect(ctx, 56, y, 1288, 210, 20, i % 2 === 0 ? C.soft : C.white, C.primary, 3);
    ctx.fillStyle = C.navy;
    ctx.font = "700 34px Sans";
    ctx.fillText(b.title, 90, y + 58);
    wrapText(ctx, b.body, 90, y + 108, 1220, 36, "26px Sans", C.body, 3);
  });
  roundRect(ctx, 56, 1140, 1288, 200, 20, C.navy);
  wrapText(
    ctx,
    "Ethics Committee reviews scientific and ethical merit before enrolment. Chairperson is from outside the host institution. Clinical trials also follow New Drugs and Clinical Trials Rules, 2019, and register on the Clinical Trials Registry - India.",
    90,
    1200,
    1220,
    36,
    "26px Sans",
    C.white,
    4,
  );
};

const imrad = (ctx) => {
  header(ctx, "IMRAD Format", "How a research report is built");
  const steps = [
    { t: "I  Introduction", d: "Why this problem. What is known. What gap remains. Ends with objectives." },
    { t: "M  Methods", d: "Design, setting, population, sample, tools, analysis, ethics. Enough to repeat the study." },
    { t: "R  Results", d: "What was found. Text, tables, figures. No interpretation in this section." },
    { t: "D  Discussion", d: "What the findings mean. Compare literature. Strengths, limits, conclusion aligned to objectives." },
  ];
  steps.forEach((s, i) => {
    const y = 220 + i * 240;
    roundRect(ctx, 80, y, 1240, 210, 22, C.white, C.primary, 3);
    roundRect(ctx, 80, y, 90, 210, 0, C.primary);
    ctx.fillStyle = C.white;
    ctx.font = "700 48px Sans";
    ctx.fillText(String(i + 1), 108, y + 124);
    ctx.fillStyle = C.navy;
    ctx.font = "700 36px Sans";
    ctx.fillText(s.t, 210, y + 70);
    wrapText(ctx, s.d, 210, y + 122, 1060, 36, "28px Sans", C.body, 3);
  });
};

ensureDir();
write("rm_health_research_domains.png", domains);
write("rm_finer_criteria.png", finer);
write("rm_sampling_methods.png", sampling);
write("rm_qualitative_methods.png", qualitative);
write("rm_ethics_consent.png", ethics);
write("rm_imrad_thesis.png", imrad);
