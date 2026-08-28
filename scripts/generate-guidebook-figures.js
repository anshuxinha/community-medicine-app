/**
 * White-background Library figures (primary #9333ea).
 * Writes PNGs to reading-illustrations/ for sync-reading-illustrations.js.
 */
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const OUTPUT_DIR = path.join(__dirname, "..", "reading-illustrations");
const W = 1400;
const H = 1400;
const PRIMARY = "#9333ea";
const PRIMARY_SOFT = "#F3E8FF";
const PRIMARY_MID = "#C084FC";
const INK = "#1F2937";
const MUTED = "#6B7280";
const GRID = "#E5E7EB";
const WHITE = "#FFFFFF";
const HOLD = "#7C3AED";
const ORDER = "#A78BFA";
const TOTAL = "#9333ea";

const ensureDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
};

const roundRect = (ctx, x, y, w, h, r, fill, stroke, lineWidth = 2) => {
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
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight, font, color, maxLines = 6) => {
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

const write = (fileName, painter, width = W, height = H) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = WHITE;
  ctx.fillRect(0, 0, width, height);
  painter(ctx, width, height);
  const out = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log("wrote", out);
};

const drawTitle = (ctx, title, subtitle) => {
  ctx.fillStyle = INK;
  ctx.font = "700 40px Sans";
  ctx.fillText(title, 64, 72);
  ctx.fillStyle = MUTED;
  ctx.font = "24px Sans";
  ctx.fillText(subtitle, 64, 110);
  ctx.fillStyle = PRIMARY;
  ctx.fillRect(64, 128, 180, 5);
};

const eoqCost = (ctx) => {
  drawTitle(
    ctx,
    "Economic order quantity",
    "Order size that minimises ordering cost plus holding cost",
  );

  const S = 80;
  const D = 1000;
  const H = 4;
  const eoq = Math.sqrt((2 * S * D) / H); // 200
  const qMin = 50;
  const qMax = 500;
  const cMax = 1800;

  const plotX = 140;
  const plotY = 190;
  const plotW = 1120;
  const plotH = 880;

  roundRect(ctx, plotX - 20, plotY - 20, plotW + 80, plotH + 90, 16, WHITE, GRID, 1);

  const xOf = (q) => plotX + ((q - qMin) / (qMax - qMin)) * plotW;
  const yOf = (c) => plotY + plotH - (c / cMax) * plotH;

  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    const y = plotY + (plotH * i) / 5;
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  const samples = [];
  for (let q = qMin; q <= qMax; q += 4) {
    const order = (S * D) / q;
    const hold = (H * q) / 2;
    samples.push({ q, order, hold, total: order + hold });
  }

  const strokeCurve = (key, color, width) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    samples.forEach((p, i) => {
      const x = xOf(p.q);
      const y = yOf(p[key]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  strokeCurve("order", ORDER, 4);
  strokeCurve("hold", HOLD, 4);
  strokeCurve("total", TOTAL, 6);

  const eoqX = xOf(eoq);
  const eoqY = yOf((S * D) / eoq + (H * eoq) / 2);
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(eoqX, plotY + plotH);
  ctx.lineTo(eoqX, eoqY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = PRIMARY;
  ctx.beginPath();
  ctx.arc(eoqX, eoqY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.beginPath();
  ctx.arc(eoqX, eoqY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = INK;
  ctx.font = "700 22px Sans";
  ctx.fillText("EOQ", eoqX + 14, eoqY - 12);
  ctx.font = "20px Sans";
  ctx.fillStyle = MUTED;
  ctx.fillText("Q = 200", eoqX + 14, eoqY + 16);

  ctx.fillStyle = INK;
  ctx.font = "20px Sans";
  ctx.textAlign = "center";
  ctx.fillText("Order quantity (Q)", plotX + plotW / 2, plotY + plotH + 52);
  ctx.save();
  ctx.translate(52, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Cost", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  const legend = [
    { c: ORDER, t: "Ordering cost  (S × D / Q)" },
    { c: HOLD, t: "Holding cost  (H × Q / 2)" },
    { c: TOTAL, t: "Total cost  (sum; U-shaped)" },
  ];
  legend.forEach((row, i) => {
    const x = 140 + i * 380;
    const y = 1220;
    ctx.strokeStyle = row.c;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 44, y);
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = "22px Sans";
    ctx.fillText(row.t, x + 56, y + 7);
  });

  ctx.fillStyle = MUTED;
  ctx.font = "22px Sans";
  ctx.fillText(
    "Example: S = 80, D = 1000 / year, H = 4.  EOQ = √(2SD / H) = 200.",
    140,
    1290,
  );
  ctx.fillText(
    "Ordering cost falls as Q rises. Holding cost rises as Q rises. EOQ is at the minimum of the sum.",
    140,
    1330,
  );
};

const eoqInventory = (ctx) => {
  drawTitle(
    ctx,
    "Inventory cycle at the economic order quantity",
    "Stock falls with use, a new order arrives after lead time",
  );

  const plotX = 140;
  const plotY = 220;
  const plotW = 1120;
  const plotH = 780;
  const qMax = 200;
  const cycles = 2.2;
  const tMax = cycles * 1.0;

  const xOf = (t) => plotX + (t / tMax) * plotW;
  const yOf = (q) => plotY + plotH - (q / qMax) * plotH;

  roundRect(ctx, plotX - 20, plotY - 20, plotW + 70, plotH + 90, 16, WHITE, GRID, 1);

  ctx.strokeStyle = GRID;
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i += 1) {
    const y = plotY + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(plotX, y);
    ctx.lineTo(plotX + plotW, y);
    ctx.stroke();
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, plotY);
  ctx.lineTo(plotX, plotY + plotH);
  ctx.lineTo(plotX + plotW, plotY + plotH);
  ctx.stroke();

  const lead = 0.22;
  const reorder = 44;
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = PRIMARY_MID;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(plotX, yOf(reorder));
  ctx.lineTo(plotX + plotW, yOf(reorder));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 5;
  for (let c = 0; c < 3; c += 1) {
    const t0 = c;
    const t1 = c + 1;
    if (c === 0) ctx.moveTo(xOf(t0), yOf(qMax));
    else ctx.lineTo(xOf(t0), yOf(qMax));
    ctx.lineTo(xOf(Math.min(t1, tMax)), yOf(Math.max(0, qMax * (1 - (Math.min(t1, tMax) - t0)))));
  }
  ctx.stroke();

  const orderT = 1 - lead;
  ctx.fillStyle = PRIMARY;
  ctx.beginPath();
  ctx.arc(xOf(orderT), yOf(reorder), 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = MUTED;
  ctx.beginPath();
  ctx.moveTo(xOf(orderT), yOf(reorder));
  ctx.lineTo(xOf(1), yOf(0));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = INK;
  ctx.font = "700 22px Sans";
  ctx.fillText("Reorder point", plotX + 24, yOf(reorder) - 16);
  ctx.fillStyle = INK;
  ctx.font = "20px Sans";
  ctx.fillText("Order arrives", xOf(1) + 16, yOf(qMax) - 16);

  const ltX1 = xOf(orderT);
  const ltX2 = xOf(1);
  const ltY = plotY + plotH + 28;
  ctx.strokeStyle = MUTED;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ltX1, yOf(0) + 8);
  ctx.lineTo(ltX1, ltY);
  ctx.lineTo(ltX2, ltY);
  ctx.lineTo(ltX2, yOf(0) + 8);
  ctx.stroke();
  ctx.fillStyle = MUTED;
  ctx.font = "20px Sans";
  ctx.textAlign = "center";
  ctx.fillText("Lead time", (ltX1 + ltX2) / 2, ltY + 24);
  ctx.textAlign = "left";

  ctx.font = "20px Sans";
  ctx.textAlign = "center";
  ctx.fillText("Time", plotX + plotW / 2, plotY + plotH + 52);
  ctx.save();
  ctx.translate(52, plotY + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Inventory on hand", 0, 0);
  ctx.restore();
  ctx.textAlign = "left";

  wrapText(
    ctx,
    "Stock falls with use. When inventory hits the reorder point, an order is placed. After lead time the new order arrives and inventory returns to the order quantity. EOQ is that order quantity.",
    140,
    1180,
    1120,
    36,
    "24px Sans",
    MUTED,
    4,
  );
};

const planningCycle = (ctx) => {
  drawTitle(
    ctx,
    "Health planning cycle",
    "Eight steps from situation analysis back to evaluation",
  );

  const steps = [
    "1. Analyse the\nhealth situation",
    "2. Set objectives\nand goals",
    "3. Assess\nresources",
    "4. Fix\npriorities",
    "5. Write the\nformulated plan",
    "6. Programme and\nimplement",
    "7. Monitor",
    "8. Evaluate and\nreplan",
  ];

  const cx = 700;
  const cy = 760;
  const radius = 400;

  ctx.strokeStyle = PRIMARY_MID;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  steps.forEach((label, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / steps.length;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    const bx = x - 150;
    const by = y - 58;
    roundRect(ctx, bx, by, 300, 116, 18, i === 7 ? PRIMARY_SOFT : WHITE, PRIMARY, 3);
    const lines = label.split("\n");
    lines.forEach((line, li) => {
      ctx.fillStyle = INK;
      ctx.font = li === 0 ? "700 22px Sans" : "22px Sans";
      ctx.textAlign = "center";
      ctx.fillText(line, x, y - 18 + li * 28);
    });
    ctx.textAlign = "left";
  });

  ctx.fillStyle = PRIMARY;
  ctx.beginPath();
  ctx.arc(cx, cy, 92, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = "700 22px Sans";
  ctx.textAlign = "center";
  ctx.fillText("Closed", cx, cy - 8);
  ctx.fillText("loop", cx, cy + 22);
  ctx.textAlign = "left";

  ctx.fillStyle = MUTED;
  ctx.font = "22px Sans";
  wrapText(
    ctx,
    "Monitoring tracks the course of activities. Evaluation judges whether objectives were met, then feeds the next cycle.",
    80,
    1288,
    1240,
    32,
    "22px Sans",
    MUTED,
    3,
  );
};

const gantt = (ctx) => {
  drawTitle(
    ctx,
    "Gantt chart",
    "Project activities drawn as bars against a calendar",
  );

  const months = ["M1", "M2", "M3", "M4", "M5", "M6"];
  const rows = [
    { name: "Civil repair", start: 0, end: 2 },
    { name: "Equipment", start: 1, end: 3.5 },
    { name: "Staffing", start: 1.5, end: 4 },
    { name: "Training", start: 3, end: 5 },
    { name: "IEC", start: 2, end: 5.5 },
    { name: "Inauguration", start: 5.5, end: 6, milestone: true },
  ];

  const left = 320;
  const top = 220;
  const colW = 160;
  const rowH = 92;

  months.forEach((m, i) => {
    const x = left + i * colW;
    ctx.fillStyle = PRIMARY_SOFT;
    ctx.fillRect(x, top - 54, colW, 54);
    ctx.strokeStyle = GRID;
    ctx.strokeRect(x, top - 54, colW, 54);
    ctx.fillStyle = PRIMARY;
    ctx.font = "700 22px Sans";
    ctx.textAlign = "center";
    ctx.fillText(m, x + colW / 2, top - 20);
  });
  ctx.textAlign = "left";

  rows.forEach((row, i) => {
    const y = top + i * rowH;
    ctx.fillStyle = i % 2 === 0 ? "#FAFAFA" : WHITE;
    ctx.fillRect(80, y, left - 80 + months.length * colW, rowH);
    ctx.fillStyle = INK;
    ctx.font = "700 24px Sans";
    ctx.fillText(row.name, 100, y + 56);

    months.forEach((_, mi) => {
      ctx.strokeStyle = GRID;
      ctx.strokeRect(left + mi * colW, y, colW, rowH);
    });

    if (row.milestone) {
      const x = left + row.start * colW;
      ctx.fillStyle = PRIMARY;
      ctx.beginPath();
      ctx.moveTo(x, y + 46);
      ctx.lineTo(x + 16, y + 30);
      ctx.lineTo(x + 32, y + 46);
      ctx.lineTo(x + 16, y + 62);
      ctx.closePath();
      ctx.fill();
    } else {
      const x = left + row.start * colW + 8;
      const w = (row.end - row.start) * colW - 16;
      roundRect(ctx, x, y + 24, w, 44, 10, PRIMARY, null, 0);
    }
  });

  ctx.fillStyle = MUTED;
  ctx.font = "22px Sans";
  wrapText(
    ctx,
    "Each bar is an activity from start date to finish date. Overlapping bars are work that can run in parallel. The diamond is a milestone. A Gantt chart shows schedule and progress. It does not calculate the critical path; that is the job of a PERT or CPM network.",
    80,
    1220,
    1240,
    34,
    "22px Sans",
    MUTED,
    4,
  );
};

const communication = (ctx) => {
  drawTitle(
    ctx,
    "Communication process",
    "Sender, message, channel, receiver, and feedback",
  );

  const boxes = [
    { t: "1. Sender", d: "Source. Knows the objective, the audience, and own limits." },
    { t: "2. Message", d: "Words, pictures, or signs. Clear, timely, based on felt need." },
    { t: "3. Channel", d: "Interpersonal, mass media, or folk media." },
    { t: "4. Receiver", d: "Audience. Frame of mind gives the message its meaning." },
  ];

  const boxW = 280;
  const boxH = 280;
  const gap = 40;
  const startX = 70;
  const y = 220;

  boxes.forEach((b, i) => {
    const x = startX + i * (boxW + gap);
    roundRect(ctx, x, y, boxW, boxH, 20, WHITE, PRIMARY, 3);
    roundRect(ctx, x, y, boxW, 70, 20, PRIMARY, null, 0);
    ctx.fillStyle = PRIMARY;
    ctx.fillRect(x, y + 48, boxW, 22);
    ctx.fillStyle = WHITE;
    ctx.font = "700 26px Sans";
    ctx.fillText(b.t, x + 16, y + 46);
    wrapText(ctx, b.d, x + 16, y + 120, boxW - 32, 32, "22px Sans", INK, 5);
    if (i < boxes.length - 1) {
      const ax = x + boxW;
      const ay = y + boxH / 2;
      ctx.fillStyle = PRIMARY;
      ctx.fillRect(ax, ay - 3, gap - 16, 6);
      ctx.beginPath();
      ctx.moveTo(ax + gap - 2, ay);
      ctx.lineTo(ax + gap - 18, ay - 12);
      ctx.lineTo(ax + gap - 18, ay + 12);
      ctx.closePath();
      ctx.fill();
    }
  });

  roundRect(ctx, 250, 680, 900, 200, 22, PRIMARY_SOFT, PRIMARY, 3);
  ctx.fillStyle = PRIMARY;
  ctx.font = "700 32px Sans";
  ctx.fillText("5. Feedback", 290, 740);
  wrapText(
    ctx,
    "Audience reaction that lets the sender modify the message. Immediate in interpersonal communication. Delayed in mass communication (polls, surveys).",
    290,
    790,
    820,
    34,
    "24px Sans",
    INK,
    4,
  );

  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.moveTo(1280, 500);
  ctx.lineTo(1280, 980);
  ctx.lineTo(120, 980);
  ctx.lineTo(120, 500);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = PRIMARY;
  ctx.beginPath();
  ctx.moveTo(120, 500);
  ctx.lineTo(108, 522);
  ctx.lineTo(132, 522);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.font = "22px Sans";
  wrapText(
    ctx,
    "Feedback converts a monologue into communication. Without it the process stops at a lecture.",
    80,
    1220,
    1240,
    34,
    "22px Sans",
    MUTED,
    3,
  );
};

ensureDir();
write("he_30_3_eoq.png", eoqCost);
write("he_30_3_eoq_inventory.png", eoqInventory);
write("hp_23_planning_cycle.png", planningCycle);
write("hp_23_gantt.png", gantt);
write("he_22_communication_process.png", communication);
