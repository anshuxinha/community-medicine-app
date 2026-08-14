/**
 * STROMA-branded Biostatistics teaching boards.
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
  rose: "#FEE2E2",
  green: "#D1FAE5",
  amber: "#FEF3C7",
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
  ctx.quadraticCurveTo(x, y, x, y + r);
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
  ctx.font = "700 44px Sans";
  ctx.fillText(title, 56, 78);
  ctx.fillStyle = C.muted;
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

const dataTypes = (ctx) => {
  header(ctx, "Types of Data", "Two splits. Do not mix them.");
  roundRect(ctx, 56, 220, 620, 540, 24, C.soft, C.primary, 3);
  roundRect(ctx, 724, 220, 620, 540, 24, C.softAlt, C.secondary, 3);
  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 34px Sans";
  ctx.fillText("Qualitative", 88, 280);
  ctx.fillText("Quantitative", 756, 280);
  wrapText(ctx, "Named categories. No metric size. Count how many people share an attribute.", 88, 330, 560, 36, "26px Sans", C.body, 4);
  wrapText(ctx, "Numbers with magnitude. Counted or measured.", 756, 330, 560, 36, "26px Sans", C.body, 3);
  wrapText(ctx, "Examples: sex, ABO group, treated or not, alive or dead.", 88, 500, 560, 34, "24px Sans", C.ink, 4);
  wrapText(ctx, "Examples: height, Hb, BP, number of children, parity.", 756, 480, 560, 34, "24px Sans", C.ink, 4);

  roundRect(ctx, 56, 800, 620, 380, 24, C.white, C.muted, 3);
  roundRect(ctx, 724, 800, 620, 380, 24, C.white, C.muted, 3);
  ctx.fillStyle = C.primary;
  ctx.font = "700 30px Sans";
  ctx.fillText("Discrete (counts)", 88, 860);
  ctx.fillText("Continuous (measured)", 756, 860);
  wrapText(ctx, "Only isolated values. No meaningful in-between. Number of children, deaths in a year, platelet count.", 88, 920, 560, 36, "26px Sans", C.body, 5);
  wrapText(ctx, "Any value in a range. Height, temperature, MUAC, serum cholesterol.", 756, 920, 560, 36, "26px Sans", C.body, 5);
  roundRect(ctx, 56, 1210, 1288, 140, 20, C.navy);
  wrapText(ctx, "A count is quantitative and discrete. It is not qualitative just because it is a whole number.", 80, 1268, 1240, 32, "26px Sans", C.white, 2);
};

const ironScales = (ctx) => {
  header(ctx, "I.R.O.N. Scales", "Interval, Ratio, Ordinal, Nominal");
  const tiles = [
    { t: "I  Interval", b: "Equal gaps. No true zero. Celsius or Fahrenheit. 20 C is not twice 10 C. Mean is allowed if data are symmetric." },
    { t: "R  Ratio", b: "Equal gaps and a true zero. Weight, height, Kelvin, age, MUAC. 80 kg is twice 40 kg." },
    { t: "O  Ordinal", b: "Ordered grades. Anaemia mild / moderate / severe. Likert. Prefer median. Rank tests." },
    { t: "N  Nominal", b: "Named classes, no order. Blood group, sex, HIV status. Prefer mode. Chi-square family." },
  ];
  tiles.forEach((tile, i) => {
    const x = 56 + (i % 2) * 668;
    const y = 230 + Math.floor(i / 2) * 540;
    roundRect(ctx, x, y, 636, 510, 24, i % 2 === 0 ? C.soft : C.softAlt, C.primary, 3);
    ctx.fillStyle = C.primary;
    ctx.font = "700 40px Sans";
    ctx.fillText(tile.t, x + 36, y + 80);
    wrapText(ctx, tile.b, x + 36, y + 160, 564, 40, "28px Sans", C.body, 8);
  });
};

const chooseDiagram = (ctx) => {
  header(ctx, "Which Diagram?", "Match the picture to the data");
  const rows = [
    ["Named categories, counts", "Bar (simple or multiple)"],
    ["Parts of one whole", "Pie / sector, or component bar"],
    ["Continuous frequency table", "Histogram, then polygon"],
    ["Trend over years", "Line diagram"],
    ["Two measured variables", "Scatter"],
    ["Geography", "Spot or shaded map"],
    ["Median, spread, outliers", "Box and whisker"],
  ];
  roundRect(ctx, 56, 220, 1288, 100, 18, C.navy);
  ctx.fillStyle = C.white;
  ctx.font = "700 28px Sans";
  ctx.fillText("Question", 88, 282);
  ctx.fillText("Draw", 780, 282);
  rows.forEach((row, i) => {
    const y = 340 + i * 140;
    roundRect(ctx, 56, y, 1288, 124, 18, i % 2 ? C.softAlt : C.white, C.muted, 2);
    ctx.fillStyle = C.ink;
    ctx.font = "600 28px Sans";
    ctx.fillText(row[0], 88, y + 74);
    ctx.fillStyle = C.primaryDark;
    ctx.fillText(row[1], 780, y + 74);
  });
};

const barVsHistogram = (ctx) => {
  header(ctx, "Bar versus Histogram", "The classic viva swap");
  roundRect(ctx, 56, 220, 620, 920, 24, C.white, C.primary, 3);
  roundRect(ctx, 724, 220, 620, 920, 24, C.white, C.secondary, 3);
  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 32px Sans";
  ctx.fillText("Bar chart", 88, 290);
  ctx.fillText("Histogram", 756, 290);

  const barX = [140, 230, 320, 410, 500];
  const barH = [180, 280, 220, 340, 160];
  barX.forEach((x, i) => {
    ctx.fillStyle = C.primary;
    ctx.fillRect(x, 720 - barH[i], 56, barH[i]);
  });
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, 730);
  ctx.lineTo(590, 730);
  ctx.stroke();

  const hist = [80, 160, 280, 220, 120];
  let hx = 780;
  hist.forEach((h) => {
    ctx.fillStyle = C.secondary;
    ctx.fillRect(hx, 720 - h, 100, h);
    ctx.strokeStyle = C.navy;
    ctx.strokeRect(hx, 720 - h, 100, h);
    hx += 100;
  });
  ctx.beginPath();
  ctx.moveTo(770, 730);
  ctx.lineTo(1290, 730);
  ctx.stroke();

  wrapText(ctx, "Qualitative or discrete counts. Gaps between bars. Height equals frequency.", 88, 800, 560, 36, "26px Sans", C.body, 5);
  wrapText(ctx, "Continuous grouped data. No gaps. Area equals frequency. Unequal class width: adjust height.", 756, 800, 560, 36, "26px Sans", C.body, 6);
  roundRect(ctx, 80, 1180, 1240, 100, 16, C.navy);
  wrapText(ctx, "Never use a pie or a bar for a continuous frequency distribution.", 104, 1240, 1190, 32, "26px Sans", C.white, 2);
};

const averages = (ctx) => {
  header(ctx, "Mean, Median, Mode", "One series, three centres");
  const vals = [4, 6, 8, 10, 12, 14, 32];
  wrapText(ctx, "Series: 4, 6, 8, 10, 12, 14, 32. Mean 12.3 is pulled by 32. Median 10 stays in the middle. Mode is the most frequent value (none here).", 56, 230, 1288, 36, "26px Sans", C.body, 3);

  const x0 = 80;
  const y0 = 520;
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(1320, y0);
  ctx.stroke();
  vals.forEach((v) => {
    const x = 80 + (v / 36) * 1220;
    ctx.fillStyle = C.primary;
    ctx.beginPath();
    ctx.arc(x, y0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = "22px Sans";
    ctx.fillText(String(v), x - 12, y0 + 44);
  });

  const mark = (value, label, color, yOff) => {
    const x = 80 + (value / 36) * 1220;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y0 - 20);
    ctx.lineTo(x, y0 - yOff);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "700 26px Sans";
    ctx.fillText(label, x - 40, y0 - yOff - 12);
  };
  mark(12.3, "Mean 12.3", C.secondary, 160);
  mark(10, "Median 10", C.primaryDark, 90);

  const cards = [
    ["Mean", "Sum / n. Uses every value. Distorted by extremes. Feeds t and Z."],
    ["Median", "Middle of the ordered series. Splits 50 / 50. Prefer if skewed."],
    ["Mode", "Most frequent value. Nominal data. Rarely used alone."],
  ];
  cards.forEach((card, i) => {
    const x = 56 + i * 440;
    roundRect(ctx, x, 860, 416, 460, 22, C.soft, C.primary, 3);
    ctx.fillStyle = C.primary;
    ctx.font = "700 34px Sans";
    ctx.fillText(card[0], x + 28, 930);
    wrapText(ctx, card[1], x + 28, 990, 360, 36, "26px Sans", C.body, 7);
  });
};

const sdVsSe = (ctx) => {
  header(ctx, "SD versus SE", "Scatter inside a sample versus scatter of means");
  roundRect(ctx, 56, 220, 620, 1080, 24, C.soft, C.primary, 3);
  roundRect(ctx, 724, 220, 620, 1080, 24, C.softAlt, C.secondary, 3);
  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 36px Sans";
  ctx.fillText("Standard deviation", 88, 300);
  ctx.fillText("Standard error", 756, 300);
  wrapText(ctx, "How spread out the individual observations are around the mean of this sample.", 88, 360, 560, 38, "28px Sans", C.body, 4);
  wrapText(ctx, "How much the sample mean would bounce if you drew many samples of size n.", 756, 360, 560, 38, "28px Sans", C.body, 4);
  wrapText(ctx, "Formula: root mean square deviation from the mean. Sample: divisor n minus 1.", 88, 620, 560, 36, "26px Sans", C.ink, 5);
  wrapText(ctx, "Formula: SE of mean = SD / square root of n. Shrinks as n rises.", 756, 620, 560, 36, "26px Sans", C.ink, 5);
  wrapText(ctx, "Describes the people in front of you.", 88, 920, 560, 36, "26px Sans", C.body, 3);
  wrapText(ctx, "Describes the precision of the estimate. Used in CI and tests.", 756, 920, 560, 36, "26px Sans", C.body, 4);
  wrapText(ctx, "CV = (SD / mean) x 100 compares relative spread when units differ.", 88, 1160, 1200, 34, "26px Sans", C.primaryDark, 2);
};

const gaussianPdf = (z) => Math.exp(-0.5 * z * z);

const normalCurve = (ctx) => {
  header(ctx, "Normal Curve", "68 / 95 / 99.7 rule");
  const left = 80;
  const right = 1320;
  const base = 980;
  const peak = 280;
  const mid = (left + right) / 2;
  const sdPx = (right - left) / 8;

  const yAt = (z) => {
    const dens = gaussianPdf(z);
    const maxD = gaussianPdf(0);
    return base - (dens / maxD) * (base - peak);
  };

  const band = (z0, z1, color) => {
    ctx.beginPath();
    ctx.moveTo(mid + z0 * sdPx, base);
    for (let z = z0; z <= z1; z += 0.05) {
      ctx.lineTo(mid + z * sdPx, yAt(z));
    }
    ctx.lineTo(mid + z1 * sdPx, base);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  band(-3, 3, C.muted);
  band(-2, 2, "#C4B5FD");
  band(-1, 1, C.primary);

  ctx.beginPath();
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 5;
  for (let z = -4; z <= 4; z += 0.05) {
    const x = mid + z * sdPx;
    const y = yAt(z);
    if (z === -4) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, base);
  ctx.lineTo(right, base);
  ctx.stroke();

  ctx.fillStyle = C.white;
  ctx.font = "700 28px Sans";
  ctx.fillText("68%", mid - 36, 720);
  ctx.fillStyle = C.navy;
  ctx.font = "700 24px Sans";
  ["-3 SD", "-2 SD", "-1 SD", "Mean", "+1 SD", "+2 SD", "+3 SD"].forEach((lab, i) => {
    const z = i - 3;
    ctx.fillText(lab, mid + z * sdPx - 36, 1030);
  });

  const facts = [
    "Mean +/- 1 SD covers 68.27%",
    "Mean +/- 1.96 SD covers 95%",
    "Mean +/- 3 SD covers 99.73%",
    "Mean = median = mode. Tails never touch the baseline.",
    "Mean 0 and SD 1 only after Z = (X - mean) / SD.",
  ];
  facts.forEach((f, i) => {
    wrapText(ctx, f, 80, 1100 + i * 50, 1240, 32, "26px Sans", C.body, 1);
  });
};

const skewness = (ctx) => {
  header(ctx, "Skewness", "The tail names the skew. The mean is pulled toward the tail.");
  const drawSkew = (ox, title, order, flip) => {
    roundRect(ctx, ox, 220, 620, 1080, 24, C.white, C.muted, 3);
    ctx.fillStyle = C.primaryDark;
    ctx.font = "700 30px Sans";
    ctx.fillText(title, ox + 28, 280);
    ctx.beginPath();
    const base = 780;
    ctx.moveTo(ox + 40, base);
    if (!flip) {
      ctx.bezierCurveTo(ox + 80, 360, ox + 180, 340, ox + 260, 520);
      ctx.bezierCurveTo(ox + 360, 760, ox + 520, 760, ox + 580, base);
    } else {
      ctx.bezierCurveTo(ox + 80, 760, ox + 220, 760, ox + 340, 520);
      ctx.bezierCurveTo(ox + 440, 340, ox + 540, 360, ox + 580, base);
    }
    ctx.lineTo(ox + 40, base);
    ctx.closePath();
    ctx.fillStyle = C.soft;
    ctx.fill();
    ctx.strokeStyle = C.primary;
    ctx.lineWidth = 4;
    ctx.stroke();
    wrapText(ctx, order, ox + 28, 860, 560, 36, "26px Sans", C.body, 6);
  };
  drawSkew(56, "Positive (right) skew", "Long tail to the right. Mean > Median > Mode. Income, hospital stay.", false);
  drawSkew(724, "Negative (left) skew", "Long tail to the left. Mean < Median < Mode. Gestation at term is often left-skewed.", true);
};

const errorTable = (ctx) => {
  header(ctx, "Type I and Type II Error", "H0 is the hypothesis of no real difference");
  const cells = [
    ["Decision", "H0 true", "H0 false"],
    ["Reject H0", "Type I (alpha). False positive.", "Correct. Power = 1 - beta."],
    ["Do not reject H0", "Correct.", "Type II (beta). False negative."],
  ];
  cells.forEach((row, r) => {
    row.forEach((text, c) => {
      const x = 56 + c * 430;
      const y = 230 + r * 280;
      const fill = r === 0 || c === 0 ? C.navy : r === 1 && c === 1 ? C.rose : r === 2 && c === 2 ? C.amber : C.green;
      const color = r === 0 || c === 0 ? C.white : C.ink;
      roundRect(ctx, x, y, 414, 260, 18, fill, C.muted, 2);
      wrapText(ctx, text, x + 24, y + 80, 366, 36, r === 0 || c === 0 ? "700 26px Sans" : "26px Sans", color, 5);
    });
  });
  wrapText(ctx, "Alpha is chosen before the test (usually 0.05). Larger n raises power. It does not change alpha.", 56, 1120, 1288, 36, "26px Sans", C.primaryDark, 3);
};

const ciBoard = (ctx) => {
  header(ctx, "Confidence Interval", "A range for the unknown population mean");
  wrapText(ctx, "Large-sample 95% CI for a mean = x-bar +/- 1.96 x SE. SE = SD / square root of n.", 56, 230, 1288, 36, "28px Sans", C.body, 3);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 520);
  ctx.lineTo(1320, 520);
  ctx.stroke();
  ctx.strokeStyle = C.primary;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(360, 520);
  ctx.lineTo(1040, 520);
  ctx.stroke();
  ctx.fillStyle = C.secondary;
  ctx.beginPath();
  ctx.arc(700, 520, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = C.navy;
  ctx.font = "700 26px Sans";
  ctx.fillText("Lower limit", 300, 480);
  ctx.fillText("x-bar", 670, 480);
  ctx.fillText("Upper limit", 980, 480);
  const cards = [
    ["68%", "Mean +/- 1 SE"],
    ["95%", "Mean +/- 1.96 SE (often taught as +/- 2 SE)"],
    ["99%", "Mean +/- 2.58 SE"],
  ];
  cards.forEach((card, i) => {
    const y = 640 + i * 200;
    roundRect(ctx, 56, y, 1288, 180, 20, C.soft, C.primary, 3);
    ctx.fillStyle = C.primary;
    ctx.font = "700 36px Sans";
    ctx.fillText(card[0], 88, y + 70);
    wrapText(ctx, card[1], 88, y + 120, 1200, 34, "28px Sans", C.body, 2);
  });
};

const whichTest = (ctx) => {
  header(ctx, "Which Test When", "Means, ranks, or categories");
  const rows = [
    ["One or two means, ~normal", "t (paired if same subjects)"],
    ["Three or more means", "ANOVA, then post-hoc"],
    ["Large n or known SD", "Z for a mean or proportion"],
    ["Two independent ranks / skewed", "Mann-Whitney"],
    ["Paired ranks / skewed", "Wilcoxon signed-rank"],
    ["Three or more ranks", "Kruskal-Wallis"],
    ["Categories / association", "Chi-square (Fisher if tiny cells)"],
  ];
  rows.forEach((row, i) => {
    const y = 220 + i * 160;
    roundRect(ctx, 56, y, 1288, 144, 18, i % 2 ? C.soft : C.white, C.muted, 2);
    ctx.fillStyle = C.ink;
    ctx.font = "600 28px Sans";
    ctx.fillText(row[0], 88, y + 84);
    ctx.fillStyle = C.primaryDark;
    ctx.fillText(row[1], 740, y + 84);
  });
};

const chiSquare = (ctx) => {
  header(ctx, "Chi-square Test", "Association in a contingency table");
  wrapText(ctx, "chi-square = sum of (O - E) squared / E.  E = (row total x column total) / N.", 56, 230, 1288, 38, "28px Sans", C.body, 3);
  wrapText(ctx, "df = (rows - 1) x (columns - 1). For 2 x 2, df = 1. Critical value at 5% is 3.84.", 56, 360, 1288, 38, "28px Sans", C.body, 3);
  const headers = ["Group", "Attacked", "Not attacked", "Total"];
  const rows = [
    ["Vaccine A", "O 22", "O 68", "90"],
    ["Vaccine B", "O 14", "O 72", "86"],
    ["Total", "36", "140", "176"],
  ];
  headers.forEach((h, i) => {
    roundRect(ctx, 56 + i * 330, 480, 318, 90, 12, C.navy);
    ctx.fillStyle = C.white;
    ctx.font = "700 24px Sans";
    ctx.fillText(h, 76 + i * 330, 536);
  });
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      roundRect(ctx, 56 + c * 330, 580 + r * 140, 318, 128, 12, C.white, C.muted, 2);
      ctx.fillStyle = C.ink;
      ctx.font = "26px Sans";
      ctx.fillText(cell, 76 + c * 330, 656 + r * 140);
    });
  });
  wrapText(ctx, "Calculated chi-square about 1.79 < 3.84. Do not reject H0. Tells presence of association, not strength.", 56, 1040, 1288, 36, "26px Sans", C.primaryDark, 4);
};

const probabilityLaws = (ctx) => {
  header(ctx, "Laws of Probability", "AND multiplies. OR adds.");
  roundRect(ctx, 56, 220, 620, 1080, 24, C.soft, C.primary, 3);
  roundRect(ctx, 724, 220, 620, 1080, 24, C.softAlt, C.secondary, 3);
  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 34px Sans";
  ctx.fillText("Multiplication", 88, 300);
  ctx.fillText("Addition", 756, 300);
  wrapText(ctx, "AND / BOTH. Events must be independent. P(A and B) = P(A) x P(B).", 88, 360, 560, 38, "28px Sans", C.body, 5);
  wrapText(ctx, "EITHER / OR. Events must be mutually exclusive for the simple sum. P(A or B) = P(A) + P(B).", 756, 360, 560, 38, "28px Sans", C.body, 6);
  wrapText(ctx, "If they can occur together: P(A or B) = P(A) + P(B) - P(A and B).", 756, 700, 560, 38, "28px Sans", C.ink, 5);
  wrapText(ctx, "Binomial: n independent yes/no trials. P(X = r) = C(n, r) p^r q^(n-r).", 88, 700, 560, 38, "28px Sans", C.ink, 5);
  wrapText(ctx, "Probability is never below 0 and never above 1.", 88, 1100, 1200, 34, "26px Sans", C.primaryDark, 2);
};

const correlation = (ctx) => {
  header(ctx, "Correlation", "Direction and tightness on a scatter. Not causation.");
  const panels = [
    { title: "Positive", fn: (i) => [i, i * 0.8 + (i % 3) * 8] },
    { title: "Negative", fn: (i) => [i, 220 - i * 0.7 + (i % 3) * 8] },
    { title: "None", fn: (i) => [i, 40 + ((i * 17) % 180)] },
  ];
  panels.forEach((p, idx) => {
    const ox = 56 + idx * 440;
    roundRect(ctx, ox, 220, 416, 720, 22, C.white, C.muted, 3);
    ctx.fillStyle = C.primaryDark;
    ctx.font = "700 30px Sans";
    ctx.fillText(p.title, ox + 28, 280);
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox + 40, 860);
    ctx.lineTo(ox + 380, 860);
    ctx.moveTo(ox + 40, 860);
    ctx.lineTo(ox + 40, 320);
    ctx.stroke();
    ctx.fillStyle = C.secondary;
    for (let i = 20; i <= 300; i += 28) {
      const [px, py] = p.fn(i);
      ctx.beginPath();
      ctx.arc(ox + 50 + px * 0.95, 850 - py, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  wrapText(ctx, "Pearson r is for linear, roughly normal pairs. Range -1 to +1. Spearman uses ranks. r = 0 means no linear relation, not 'no relation at all'.", 56, 1000, 1288, 36, "26px Sans", C.body, 5);
};

const regression = (ctx) => {
  header(ctx, "Regression", "Predict Y from X: Y = a + bX");
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 1100);
  ctx.lineTo(1280, 1100);
  ctx.moveTo(120, 1100);
  ctx.lineTo(120, 260);
  ctx.stroke();
  ctx.strokeStyle = C.primary;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(180, 980);
  ctx.lineTo(1180, 380);
  ctx.stroke();
  ctx.fillStyle = C.secondary;
  const pts = [[220, 920], [360, 840], [520, 760], [680, 640], [860, 540], [1040, 460]];
  pts.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = C.navy;
  ctx.font = "700 28px Sans";
  ctx.fillText("b = slope (change in Y per unit X)", 200, 1220);
  ctx.fillText("a = intercept (Y when X = 0)", 200, 1280);
  ctx.fillText("Y", 70, 300);
  ctx.fillText("X", 1300, 1140);
};

const samplingTypes = (ctx) => {
  header(ctx, "Types of Sampling", "Probability first. Frame is the list you draw from.");
  const left = [
    "Simple random: equal chance, lottery or random numbers.",
    "Systematic: every Kth after a random start. K = N / n.",
    "Stratified: split into similar strata, then sample.",
    "Cluster: draw groups (villages), then people inside.",
    "Multistage / multiphase: nested or cheap-then-detailed.",
  ];
  const right = [
    "Convenience: whoever is easy.",
    "Quota: fill subgroup numbers non-randomly.",
    "Snowball: subjects recruit hidden contacts.",
    "Purposive: investigator picks 'typical' cases.",
    "These do not support the same population inference.",
  ];
  roundRect(ctx, 56, 220, 620, 1080, 24, C.soft, C.primary, 3);
  roundRect(ctx, 724, 220, 620, 1080, 24, C.softAlt, C.secondary, 3);
  ctx.fillStyle = C.primaryDark;
  ctx.font = "700 32px Sans";
  ctx.fillText("Probability (MSC SMS)", 88, 290);
  ctx.fillText("Non-probability", 756, 290);
  left.forEach((line, i) => wrapText(ctx, line, 88, 360 + i * 170, 560, 34, "26px Sans", C.body, 4));
  right.forEach((line, i) => wrapText(ctx, line, 756, 360 + i * 170, 560, 34, "26px Sans", C.body, 4));
};

const designSteps = (ctx) => {
  header(ctx, "Designing a Study", "Statistician from the start, not only at analysis");
  const steps = [
    "1. Define the problem",
    "2. Aims and objectives",
    "3. Review of literature",
    "4. State the hypothesis",
    "5. Plan: population, sample, design, control, blinding, proforma",
    "6. Present the data",
    "7. Unbiased analysis",
    "8. Conclude and recommend",
  ];
  steps.forEach((s, i) => {
    const y = 210 + i * 140;
    roundRect(ctx, 56, y, 1288, 124, 18, i === 4 ? C.soft : C.white, C.primary, 2);
    ctx.fillStyle = C.navy;
    ctx.font = "700 30px Sans";
    ctx.fillText(s, 88, y + 76);
  });
};

ensureDir();
write("bs_26_1_data_types.png", dataTypes);
write("bs_26_1_iron_scales.png", ironScales);
write("bs_26_2_choose_diagram.png", chooseDiagram);
write("bs_26_2_bar_vs_histogram.png", barVsHistogram);
write("bs_26_3_averages.png", averages);
write("bs_26_3_sd_vs_se.png", sdVsSe);
write("bs_26_4_normal_curve.png", normalCurve);
write("bs_26_4_skewness.png", skewness);
write("bs_26_5_errors.png", errorTable);
write("bs_26_5_ci.png", ciBoard);
write("bs_26_6_which_test.png", whichTest);
write("bs_26_6_chi_square.png", chiSquare);
write("bs_26_7_probability_laws.png", probabilityLaws);
write("bs_26_7_correlation.png", correlation);
write("bs_26_7_regression.png", regression);
write("bs_26_8_sampling.png", samplingTypes);
write("bs_26_9_design_steps.png", designSteps);
