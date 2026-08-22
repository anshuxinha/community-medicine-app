/**
 * Health Economics teaching boards.
 * Writes PNGs to reading-illustrations/ for sync-reading-illustrations.js.
 */
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const OUTPUT_DIR = path.join(__dirname, "..", "reading-illustrations");
const SIZE = 1400;

const C = {
  paper: "#F7F4EC",
  navy: "#14324C",
  teal: "#0F766E",
  tealDark: "#115E59",
  gold: "#B45309",
  goldSoft: "#FEF3C7",
  ink: "#1F2937",
  body: "#374151",
  white: "#FFFFFF",
  muted: "#6B7280",
  green: "#D1FAE5",
  peach: "#FFEDD5",
  rose: "#FFE4E6",
  sky: "#E0F2FE",
  lavender: "#EDE9FE",
  line: "#D6D3C8",
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
  ctx.lineTo(x, y, x + r, y);
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
  ctx.fillStyle = C.teal;
  ctx.fillRect(0, 168, SIZE, 8);
  ctx.fillStyle = C.white;
  ctx.font = "700 42px Sans";
  ctx.fillText(title, 56, 78);
  ctx.fillStyle = "#C7D2C8";
  ctx.font = "26px Sans";
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

const comparative = (ctx) => {
  header(ctx, "Comparative analysis", "A full evaluation always compares alternatives");
  roundRect(ctx, 80, 230, 540, 720, 22, C.white, C.navy, 3);
  roundRect(ctx, 80, 230, 540, 90, 22, C.teal);
  ctx.fillStyle = C.white;
  ctx.font = "700 32px Sans";
  ctx.fillText("Programme A", 120, 288);
  wrapText(ctx, "The programme of interest. Costs A and consequences A.", 120, 360, 460, 40, "26px Sans", C.body, 4);
  roundRect(ctx, 120, 520, 460, 140, 16, C.sky, C.teal, 2);
  wrapText(ctx, "COSTS A", 150, 575, 400, 36, "700 28px Sans", C.navy, 1);
  roundRect(ctx, 120, 690, 460, 180, 16, C.green, C.teal, 2);
  wrapText(ctx, "CONSEQUENCES A", 150, 755, 400, 36, "700 28px Sans", C.navy, 1);

  roundRect(ctx, 780, 230, 540, 720, 22, C.white, C.navy, 3);
  roundRect(ctx, 780, 230, 540, 90, 22, C.gold);
  ctx.fillStyle = C.white;
  ctx.font = "700 32px Sans";
  ctx.fillText("Comparator B", 820, 288);
  wrapText(ctx, "Current practice, a low-cost option, or doing nothing.", 820, 360, 460, 40, "26px Sans", C.body, 4);
  roundRect(ctx, 820, 520, 460, 140, 16, C.peach, C.gold, 2);
  wrapText(ctx, "COSTS B", 850, 575, 400, 36, "700 28px Sans", C.navy, 1);
  roundRect(ctx, 820, 690, 460, 180, 16, C.goldSoft, C.gold, 2);
  wrapText(ctx, "CONSEQUENCES B", 850, 755, 400, 36, "700 28px Sans", C.navy, 1);

  ctx.fillStyle = C.navy;
  ctx.font = "700 28px Sans";
  ctx.fillText("CHOICE", 640, 600);
  ctx.beginPath();
  ctx.moveTo(640, 470);
  ctx.lineTo(760, 590);
  ctx.lineTo(640, 710);
  ctx.closePath();
  ctx.fillStyle = C.teal;
  ctx.fill();

  wrapText(
    ctx,
    "Incremental rule: compare (costs A minus costs B) with (consequences A minus consequences B). Cost-of-illness studies are not full evaluations.",
    80,
    1010,
    1240,
    36,
    "24px Sans",
    C.body,
    3
  );
};

const types = (ctx) => {
  header(ctx, "Types of economic evaluation", "Consequences decide the method");
  const rows = [
    { t: "Cost analysis", d: "Money costs only. No comparison of consequences. Not a full evaluation.", fill: C.rose },
    { t: "CMA", d: "Costs in money. Effects treated as equivalent. Not a design to declare in advance.", fill: C.peach },
    { t: "CEA", d: "Costs in money. One shared effect in natural units (life-years, cases, mmHg).", fill: C.sky },
    { t: "CUA", d: "Costs in money. Generic health, usually QALY. Compares across diseases.", fill: C.green },
    { t: "CBA", d: "Costs and consequences both in money (willingness to pay).", fill: C.goldSoft },
    { t: "CCA", d: "Costs plus several effects left in natural units. Decision-maker supplies weights.", fill: C.lavender },
  ];
  rows.forEach((r, i) => {
    const y = 210 + i * 185;
    roundRect(ctx, 70, y, 1260, 170, 16, r.fill, C.navy, 3);
    ctx.fillStyle = C.navy;
    ctx.font = "700 30px Sans";
    ctx.fillText(r.t, 110, y + 55);
    wrapText(ctx, r.d, 110, y + 95, 1180, 34, "24px Sans", C.body, 2);
  });
};

const costTaxonomy = (ctx) => {
  header(ctx, "Cost taxonomy", "Identify, then measure, then value");
  roundRect(ctx, 70, 210, 610, 520, 20, C.white, C.navy, 3);
  roundRect(ctx, 70, 210, 610, 80, 20, C.teal);
  ctx.fillStyle = C.white;
  ctx.font = "700 30px Sans";
  ctx.fillText("Provider (facility)", 100, 262);
  const left = [
    ["Capital", "Land, building, equipment, vehicle"],
    ["Recurrent", "Staff, electricity, fuel, supplies"],
  ];
  left.forEach((item, i) => {
    const y = 330 + i * 180;
    roundRect(ctx, 110, y, 530, 150, 14, i === 0 ? C.sky : C.green, C.teal, 2);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 26px Sans";
    ctx.fillText(item[0], 140, y + 50);
    wrapText(ctx, item[1], 140, y + 90, 470, 32, "22px Sans", C.body, 2);
  });

  roundRect(ctx, 720, 210, 610, 520, 20, C.white, C.navy, 3);
  roundRect(ctx, 720, 210, 610, 80, 20, C.gold);
  ctx.fillStyle = C.white;
  ctx.font = "700 30px Sans";
  ctx.fillText("Purchaser (patient / payer)", 750, 262);
  const right = [
    ["Direct OOPE", "Medicines, tests, fees, travel"],
    ["Indirect / time", "Lost work time and caregiver time"],
  ];
  right.forEach((item, i) => {
    const y = 330 + i * 180;
    roundRect(ctx, 760, y, 530, 150, 14, i === 0 ? C.peach : C.goldSoft, C.gold, 2);
    ctx.fillStyle = C.gold;
    ctx.font = "700 26px Sans";
    ctx.fillText(item[0], 790, y + 50);
    wrapText(ctx, item[1], 790, y + 90, 470, 32, "22px Sans", C.body, 2);
  });

  wrapText(
    ctx,
    "Also count other public sectors when relevant. Do not double-count OOPE as both a facility receipt and a household cost in the same total. Marginal cost = extra cost of one more unit.",
    70,
    780,
    1260,
    36,
    "24px Sans",
    C.body,
    4
  );
  roundRect(ctx, 70, 980, 1260, 320, 18, C.navy);
  wrapText(
    ctx,
    "Four buckets for a long answer: (1) health sector  (2) patient and family  (3) other sectors  (4) productivity, with a double-counting warning if QALYs already value being able to work.",
    110,
    1060,
    1180,
    40,
    "26px Sans",
    C.white,
    5
  );
};

const discounting = (ctx) => {
  header(ctx, "Discounting", "Future amounts as present values");
  roundRect(ctx, 80, 220, 1240, 280, 20, C.white, C.navy, 3);
  ctx.fillStyle = C.navy;
  ctx.font = "700 36px Sans";
  ctx.fillText("Present value  =  future amount  x  1 / (1 + r)^n", 140, 340);
  wrapText(ctx, "r = annual discount rate     n = years until the cost or effect occurs", 140, 400, 1120, 36, "26px Sans", C.body, 2);

  const cards = [
    { t: "Why", d: "Time preference: resources now can be used in the interim. Delayed programmes must not win only because their bills look later." },
    { t: "Direction", d: "Higher r or larger n lowers present value. Equal rates for costs and health effects unless the question states an exception." },
    { t: "Practice", d: "State the rate (often 3% or 5% in published studies), discount both sides, and test other rates in sensitivity analysis." },
  ];
  cards.forEach((c, i) => {
    const y = 540 + i * 260;
    roundRect(ctx, 80, y, 1240, 240, 18, i % 2 === 0 ? C.sky : C.green, C.navy, 3);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 30px Sans";
    ctx.fillText(c.t, 120, y + 60);
    wrapText(ctx, c.d, 120, y + 110, 1160, 36, "26px Sans", C.body, 3);
  });
};

const qalyArea = (ctx) => {
  header(ctx, "QALYs gained", "Quality (A) plus quantity (B)");
  const ox = 160;
  const oy = 1080;
  const w = 1080;
  const h = 720;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox, oy - h);
  ctx.moveTo(ox, oy);
  ctx.lineTo(ox + w, oy);
  ctx.stroke();
  ctx.fillStyle = C.navy;
  ctx.font = "22px Sans";
  ctx.fillText("Health-related quality of life", ox - 30, oy - h - 20);
  ctx.fillText("Time", ox + w - 40, oy + 40);
  ctx.fillText("1.0 full health", ox + 16, oy - h + 30);
  ctx.fillText("0 dead", ox + 16, oy - 16);

  ctx.beginPath();
  ctx.moveTo(ox, oy - 520);
  ctx.bezierCurveTo(ox + 280, oy - 480, ox + 520, oy - 280, ox + 700, oy);
  ctx.lineTo(ox, oy);
  ctx.closePath();
  ctx.fillStyle = "rgba(180, 83, 9, 0.15)";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(ox, oy - 520);
  ctx.bezierCurveTo(ox + 280, oy - 480, ox + 520, oy - 280, ox + 700, oy);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ox, oy - 620);
  ctx.bezierCurveTo(ox + 360, oy - 600, ox + 720, oy - 420, ox + 980, oy);
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = "rgba(15, 118, 110, 0.25)";
  ctx.beginPath();
  ctx.moveTo(ox, oy - 520);
  ctx.bezierCurveTo(ox + 280, oy - 480, ox + 520, oy - 280, ox + 700, oy);
  ctx.lineTo(ox + 980, oy);
  ctx.bezierCurveTo(ox + 720, oy - 420, ox + 360, oy - 600, ox, oy - 620);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = C.tealDark;
  ctx.font = "700 32px Sans";
  ctx.fillText("A  quality gain", ox + 220, oy - 360);
  ctx.fillText("B  extra years", ox + 720, oy - 220);
  ctx.fillStyle = C.gold;
  ctx.font = "24px Sans";
  ctx.fillText("Without intervention", ox + 420, oy - 80);
  ctx.fillStyle = C.teal;
  ctx.fillText("With intervention", ox + 760, oy - 480);

  wrapText(
    ctx,
    "QALY = time in each state x preference weight (0 dead to 1 full health). Area between the curves is QALYs gained.",
    80,
    1220,
    1240,
    34,
    "24px Sans",
    C.body,
    2
  );
};

const cePlane = (ctx) => {
  header(ctx, "Cost-effectiveness plane", "Extra cost against extra effect");
  const cx = 700;
  const cy = 820;
  const arm = 480;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - arm, cy);
  ctx.lineTo(cx + arm, cy);
  ctx.moveTo(cx, cy + arm);
  ctx.lineTo(cx, cy - arm);
  ctx.stroke();
  ctx.fillStyle = C.navy;
  ctx.font = "22px Sans";
  ctx.fillText("Extra effect", cx + arm - 80, cy + 40);
  ctx.save();
  ctx.translate(cx - 40, cy - arm + 20);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Extra cost", 0, 0);
  ctx.restore();

  ctx.setLineDash([12, 10]);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 360, cy + 220);
  ctx.lineTo(cx + 360, cy - 220);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.gold;
  ctx.font = "22px Sans";
  ctx.fillText("Threshold k", cx + 280, cy - 250);

  const qs = [
    { x: cx + 80, y: cy - 280, t: "I  more health, more cost", d: "Use k", fill: C.goldSoft },
    { x: cx + 80, y: cy + 80, t: "II  more health, less cost", d: "Accept (dominant)", fill: C.green },
    { x: cx - 430, y: cy + 80, t: "III  less health, less cost", d: "Use k", fill: C.sky },
    { x: cx - 430, y: cy - 280, t: "IV  less health, more cost", d: "Reject (dominated)", fill: C.rose },
  ];
  qs.forEach((q) => {
    roundRect(ctx, q.x, q.y, 350, 160, 14, q.fill, C.navy, 2);
    ctx.fillStyle = C.navy;
    ctx.font = "700 20px Sans";
    wrapText(ctx, q.t, q.x + 18, q.y + 48, 314, 26, "700 20px Sans", C.navy, 2);
    wrapText(ctx, q.d, q.x + 18, q.y + 110, 314, 26, "20px Sans", C.body, 2);
  });
  ctx.fillStyle = C.teal;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.navy;
  ctx.font = "20px Sans";
  ctx.fillText("Comparator", cx + 16, cy - 16);
};

const icerBoard = (ctx) => {
  header(ctx, "ICER", "Extra cost per extra unit of effect");
  roundRect(ctx, 80, 230, 1240, 360, 22, C.white, C.navy, 3);
  ctx.fillStyle = C.navy;
  ctx.font = "700 40px Sans";
  ctx.fillText("ICER  =  (C1 - C0)  /  (E1 - E0)", 180, 380);
  wrapText(ctx, "C1, E1 = new option     C0, E0 = comparator     Effect may be life-years, cases, or QALYs", 180, 450, 1080, 36, "26px Sans", C.body, 3);

  const bits = [
    { t: "Always incremental", d: "Do not divide cost of A by effect of A if current practice already costs money and produces health." },
    { t: "NMB = E k - C", d: "Linear rule at threshold k. Choose the option with the highest net monetary benefit." },
    { t: "NHB = E - C/k", d: "The same rule in health units. Useful when extra effect is small or negative." },
    { t: "India", d: "No single statutory rupee-per-QALY law. HTAIn and districts still use extra cost versus extra effect." },
  ];
  bits.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 80 + col * 640;
    const y = 640 + row * 340;
    roundRect(ctx, x, y, 600, 310, 18, C.white, C.teal, 3);
    roundRect(ctx, x, y, 16, 310, 0, C.teal);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 26px Sans";
    ctx.fillText(b.t, x + 44, y + 60);
    wrapText(ctx, b.d, x + 44, y + 110, 520, 34, "24px Sans", C.body, 5);
  });
};

const decisionTree = (ctx) => {
  header(ctx, "Decision tree", "Squares choose. Circles chance. Terminals score.");
  const node = (x, y, r, fill, label) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = C.navy;
    ctx.font = "700 18px Sans";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y + 6);
    ctx.textAlign = "left";
  };
  const box = (x, y, w, h, fill, label) => {
    roundRect(ctx, x, y, w, h, 10, fill, C.navy, 3);
    ctx.fillStyle = C.navy;
    ctx.font = "700 20px Sans";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + 32);
    ctx.textAlign = "left";
  };
  const line = (x1, y1, x2, y2) => {
    ctx.strokeStyle = C.navy;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  box(60, 560, 180, 50, C.goldSoft, "Decision");
  line(240, 585, 340, 400);
  line(240, 585, 340, 780);
  box(340, 370, 220, 60, C.green, "Chemo");
  box(340, 750, 220, 60, C.peach, "No chemo");
  line(560, 400, 660, 280);
  line(560, 400, 660, 500);
  node(700, 280, 28, C.sky, "p1");
  node(700, 500, 28, C.sky, "1-p1");
  wrapText(ctx, "Fever / neutropenia", 750, 270, 280, 28, "20px Sans", C.body, 2);
  wrapText(ctx, "No fever", 750, 500, 280, 28, "20px Sans", C.body, 1);
  line(560, 780, 660, 700);
  line(560, 780, 660, 880);
  node(700, 700, 28, C.lavender, "p2");
  node(700, 880, 28, C.lavender, "1-p2");
  wrapText(ctx, "Disease fever", 750, 690, 280, 28, "20px Sans", C.body, 1);
  wrapText(ctx, "No fever", 750, 880, 280, 28, "20px Sans", C.body, 1);

  const terminals = ["Hospital", "Outpatient", "No extra Rx"];
  terminals.forEach((t, i) => {
    const y = 210 + i * 90;
    line(728, 280, 1000, y + 20);
    roundRect(ctx, 1000, y, 300, 50, 8, C.white, C.teal, 2);
    ctx.fillStyle = C.body;
    ctx.font = "20px Sans";
    ctx.fillText(t, 1020, y + 32);
  });

  wrapText(
    ctx,
    "Expected cost = sum (path probability x path cost). Same for effect. Then compare incrementally. Use a Markov model when events repeat over many cycles.",
    60,
    1040,
    1280,
    36,
    "24px Sans",
    C.body,
    4
  );
};

const financing = (ctx) => {
  header(ctx, "Health financing in India", "NHA 2022-23: who pays");
  const streams = [
    { t: "1. Government", d: "Union and States. Tax-funded services, NHM, programmes. NHP-2017 goal: GHE toward 2.5% of GDP by 2025. NHA 2022-23: GHE 1.48% of GDP, 43.7% of THE.", fill: C.green },
    { t: "2. Households (OOPE)", d: "Direct payment at the point of care, not pooled. NHA 2022-23: 43.4% of THE (from 64.2% in 2013-14).", fill: C.rose },
    { t: "3. Insurance / social security", d: "AB-PMJAY, ESI, CGHS, state schemes, private insurance. Pooling is the point: many pay, the sick draw.", fill: C.sky },
    { t: "4. Partners", d: "External agencies, NGOs, CSR. Useful at the margin. Not the backbone of universal cover.", fill: C.goldSoft },
  ];
  streams.forEach((s, i) => {
    const y = 210 + i * 230;
    roundRect(ctx, 70, y, 1260, 210, 16, s.fill, C.navy, 3);
    ctx.fillStyle = C.navy;
    ctx.font = "700 28px Sans";
    ctx.fillText(s.t, 110, y + 50);
    wrapText(ctx, s.d, 110, y + 90, 1180, 34, "24px Sans", C.body, 3);
  });
};

const uhcCube = (ctx) => {
  header(ctx, "UHC cube", "Population, services, cost share");
  const drawCube = (x, y, s, fill, stroke) => {
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(x, y, s, s);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + s * 0.4, y - s * 0.28);
    ctx.lineTo(x + s + s * 0.4, y - s * 0.28);
    ctx.lineTo(x + s, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s, y);
    ctx.lineTo(x + s + s * 0.4, y - s * 0.28);
    ctx.lineTo(x + s + s * 0.4, y + s - s * 0.28);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
  };
  drawCube(180, 520, 420, C.sky, C.navy);
  drawCube(280, 640, 220, C.teal, C.navy);
  ctx.fillStyle = C.navy;
  ctx.font = "700 24px Sans";
  ctx.fillText("Desired system", 180, 980);
  ctx.fillStyle = C.white;
  ctx.font = "700 22px Sans";
  ctx.fillText("Today", 330, 760);

  const axes = [
    { t: "Population covered", d: "Who is entitled. Move from selected groups toward everyone." },
    { t: "Services covered", d: "Which package. Move from a narrow list toward comprehensive PHC plus needed hospital care." },
    { t: "Cost covered", d: "What share is prepaid. Move away from OOPE toward pooling (NHA 2022-23: OOPE still 43.4% of THE)." },
  ];
  axes.forEach((a, i) => {
    const y = 220 + i * 360;
    roundRect(ctx, 760, y, 560, 330, 18, C.white, C.teal, 3);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 26px Sans";
    ctx.fillText(a.t, 790, y + 60);
    wrapText(ctx, a.d, 790, y + 110, 500, 34, "24px Sans", C.body, 5);
  });
};

const buildingBlocks = (ctx) => {
  header(ctx, "WHO building blocks", "Six blocks plus community");
  const blocks = [
    "Service delivery",
    "Health workforce",
    "Health information",
    "Essential medicines",
    "Financing",
    "Leadership / governance",
  ];
  blocks.forEach((b, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 70 + col * 640;
    const y = 210 + row * 230;
    roundRect(ctx, x, y, 610, 210, 16, C.white, C.navy, 3);
    roundRect(ctx, x, y, 18, 210, 0, C.teal);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 28px Sans";
    ctx.fillText(`${i + 1}.  ${b}`, x + 50, y + 120);
  });
  roundRect(ctx, 70, 920, 1260, 380, 18, C.navy);
  ctx.fillStyle = C.goldSoft;
  ctx.font = "700 30px Sans";
  ctx.fillText("Community participation (taught seventh)", 110, 990);
  wrapText(
    ctx,
    "Holds the blocks to people: VHSNC, Jan Arogya Samiti, patient groups. Financing without evaluation buys volume. Evaluation without financing cannot purchase. PHC 4As: Affordable, Acceptable, Available, Accessible.",
    110,
    1050,
    1180,
    40,
    "26px Sans",
    C.white,
    5
  );
};

ensureDir();
write("he_30_1_comparative.png", comparative);
write("he_30_2_types.png", types);
write("he_30_3_cost_taxonomy.png", costTaxonomy);
write("he_30_3_discounting.png", discounting);
write("he_30_4_qaly_area.png", qalyArea);
write("he_30_5_ce_plane.png", cePlane);
write("he_30_5_icer.png", icerBoard);
write("he_30_6_decision_tree.png", decisionTree);
write("he_30_7_financing.png", financing);
write("he_30_8_uhc_cube.png", uhcCube);
write("he_30_8_building_blocks.png", buildingBlocks);
