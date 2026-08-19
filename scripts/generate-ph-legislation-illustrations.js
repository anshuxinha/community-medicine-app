/**
 * Public Health Legislation teaching boards.
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
  line: "#D6D3C8",
  yellow: "#FDE047",
  red: "#EF4444",
  whiteBin: "#F9FAFB",
  blue: "#3B82F6",
  green: "#D1FAE5",
  peach: "#FFEDD5",
  rose: "#FFE4E6",
  sky: "#E0F2FE",
  lavender: "#EDE9FE",
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

const classification = (ctx) => {
  header(ctx, "Public Health Legislation", "Eight-bucket long-answer map");
  const cells = [
    ["R Reproductive", "MTP 1971/2021\nPCPNDT 1994\nSurrogacy & ART 2021"],
    ["C Child", "POCSO 2012\nJJ Act 2015\nChild labour 2016\nIMS 1992, RTE 2009"],
    ["W Women", "Maternity Benefit 1961\nPWDVA 2005\nDowry 1961\nITPA 1956"],
    ["M Mind & rights", "MHCA 2017\nRPwD 2016\nHIV Act 2017\nTransgender 2019"],
    ["F Food & toxins", "FSS Act 2006\nNFSA 2013\nD&C 1940\nCOTPA 2003, NDPS"],
    ["E Epidemics", "Epidemic Diseases 1897\nDMA 2005\nIHR 2005"],
    ["O Occupational", "Factories 1948 / ESI 1948\nOSH & SS Codes 2020\n(in force 21 Nov 2025)"],
    ["X Env. and professions", "EPA 1986, BMW 2016\nNMC 2019, CEA 2010\nRBD 1969/2023, THOTA"],
  ];
  cells.forEach((cell, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * 660;
    const y = 210 + row * 280;
    roundRect(ctx, x, y, 620, 250, 18, C.white, C.navy, 3);
    roundRect(ctx, x, y, 18, 250, 0, C.teal);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 28px Sans";
    ctx.fillText(cell[0], x + 44, y + 48);
    wrapText(ctx, cell[1].replace(/\n/g, " · "), x + 44, y + 96, 540, 36, "24px Sans", C.body, 6);
  });
};

const mtpFlow = (ctx) => {
  header(ctx, "MTP Amendment Act 2021", "Gestational limits and opinions");
  const boxes = [
    { y: 210, fill: C.green, title: "Up to 20 weeks", body: "Opinion of ONE Registered Medical Practitioner. Grounds: risk to life or grave injury to physical/mental health, foetal handicap, rape, failure of contraception (any woman and her partner), socio-economic circumstances." },
    { y: 500, fill: C.goldSoft, title: "20 to 24 weeks", body: "Opinion of TWO RMPs. Only for prescribed categories (Rule 3B): survivors of sexual assault/rape/incest; minors; change in marital status; specified disabilities; mental illness; foetal malformation risk; humanitarian/disaster settings." },
    { y: 790, fill: C.rose, title: "Beyond 24 weeks", body: "State Medical Board (gynaecologist, paediatrician, radiologist/sonologist) for substantial foetal abnormalities. ANY time: one RMP if immediately necessary to save the woman's life." },
  ];
  boxes.forEach((b, i) => {
    roundRect(ctx, 80, b.y, 1240, 250, 18, b.fill, C.navy, 3);
    ctx.fillStyle = C.navy;
    ctx.font = "700 32px Sans";
    ctx.fillText(`${i + 1}.  ${b.title}`, 120, b.y + 52);
    wrapText(ctx, b.body, 120, b.y + 100, 1160, 34, "24px Sans", C.body, 5);
    if (i < 2) {
      ctx.fillStyle = C.teal;
      ctx.beginPath();
      ctx.moveTo(700, b.y + 250);
      ctx.lineTo(680, b.y + 270);
      ctx.lineTo(720, b.y + 270);
      ctx.closePath();
      ctx.fill();
    }
  });
};

const pcpndtFlow = (ctx) => {
  header(ctx, "PCPNDT Act 1994", "Clinic to Form F to Appropriate Authority");
  const steps = [
    { t: "1. Register", d: "Genetic Counselling Centre, Genetic Laboratory, or Genetic Clinic must be registered under the Act." },
    { t: "2. Counsel & consent", d: "Explain that sex selection is prohibited. Written consent before any prenatal diagnostic procedure on a pregnant woman." },
    { t: "3. Form F", d: "Record every diagnostic procedure on a pregnant woman in Form F. Keep records as prescribed." },
    { t: "4. No disclosure of sex", d: "Section 6: no sex selection before or after conception. No communication of the sex of the foetus." },
    { t: "5. Appropriate Authority", d: "District Appropriate Authority inspects, seizes, suspends registration. Advisory Committee assists. Advertisement of sex selection is an offence." },
  ];
  steps.forEach((s, i) => {
    const y = 210 + i * 220;
    roundRect(ctx, 80, y, 1240, 200, 16, i % 2 === 0 ? C.sky : C.white, C.navy, 3);
    ctx.fillStyle = C.tealDark;
    ctx.font = "700 30px Sans";
    ctx.fillText(s.t, 120, y + 52);
    wrapText(ctx, s.d, 120, y + 100, 1160, 34, "24px Sans", C.body, 3);
  });
};

const mhcaRights = (ctx) => {
  header(ctx, "Mental Healthcare Act 2017", "Rights plus advance directive and nominated representative");
  const rights = [
    "Right to access mental health care (s.18)",
    "Right to community living",
    "Right to protection from cruel, inhuman, or degrading treatment",
    "Right to equality and non-discrimination",
    "Right to information, confidentiality, legal aid",
    "Right to make an advance directive",
    "Right to appoint a nominated representative",
    "Insurance parity with physical illness (s.21)",
    "Attempted suicide: presumed severe stress (s.115)",
    "Least restrictive care; no chaining",
  ];
  rights.forEach((r, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 70 + col * 650;
    const y = 210 + row * 220;
    roundRect(ctx, x, y, 620, 200, 16, C.white, C.teal, 3);
    ctx.fillStyle = C.teal;
    ctx.font = "700 36px Sans";
    ctx.fillText(String(i + 1).padStart(2, "0"), x + 28, y + 56);
    wrapText(ctx, r, x + 28, y + 100, 560, 34, "24px Sans", C.ink, 3);
  });
};

const cotpaPillars = (ctx) => {
  header(ctx, "COTPA 2003", "Four pillars of tobacco-control law");
  const pillars = [
    { n: "s.4", t: "Smoke-free public places", d: "No smoking in public places. Rules in force 2 October 2008. Mandatory smoke-free signage." },
    { n: "s.5", t: "Advertisement ban", d: "No direct or indirect advertisement, promotion, or sponsorship of cigarettes and other tobacco products." },
    { n: "s.6", t: "Sale restrictions", d: "No sale to or by a person below 18 years. No sale within 100 yards of any educational institution." },
    { n: "s.7", t: "Specified warnings", d: "Pictorial and text health warnings on packs. 85% of principal display area on both sides from 1 April 2016." },
  ];
  pillars.forEach((p, i) => {
    const x = 70 + (i % 2) * 650;
    const y = 230 + Math.floor(i / 2) * 520;
    roundRect(ctx, x, y, 620, 480, 20, C.white, C.navy, 3);
    roundRect(ctx, x, y, 620, 90, 20, C.navy);
    ctx.fillStyle = C.goldSoft;
    ctx.font = "700 28px Sans";
    ctx.fillText(p.n, x + 36, y + 56);
    ctx.fillStyle = C.white;
    ctx.font = "700 28px Sans";
    ctx.fillText(p.t, x + 120, y + 56);
    wrapText(ctx, p.d, x + 40, y + 160, 540, 40, "26px Sans", C.body, 7);
  });
};

const esiBenefits = (ctx) => {
  header(ctx, "ESI Act 1948", "Six cash and medical benefits");
  const items = [
    ["Medical", "Full medical care for the insured person and family at ESI hospitals and panel clinics."],
    ["Sickness", "Periodical payments during certified sickness. Classically up to 91 days at about 70% of wages."],
    ["Maternity", "26 weeks at about full wages. Miscarriage 6 weeks. Sickness arising out of confinement extra days as prescribed."],
    ["Disablement", "Temporary disablement about 90% of wages. Permanent: life pension by loss of earning capacity."],
    ["Dependants", "Periodical payments to dependants if death results from employment injury."],
    ["Funeral", "Lump sum towards funeral expenses, not exceeding Rs 15,000."],
  ];
  items.forEach((it, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 50 + col * 440;
    const y = 230 + row * 540;
    roundRect(ctx, x, y, 410, 500, 20, C.white, C.navy, 3);
    roundRect(ctx, x + 30, y + 30, 350, 70, 12, C.teal);
    ctx.fillStyle = C.white;
    ctx.font = "700 28px Sans";
    ctx.textAlign = "center";
    ctx.fillText(it[0], x + 205, y + 76);
    ctx.textAlign = "left";
    wrapText(ctx, it[1], x + 36, y + 160, 340, 36, "24px Sans", C.body, 8);
  });
};

const bmwChart = (ctx) => {
  header(ctx, "BMW Rules 2016", "Four colour categories");
  const bins = [
    { fill: C.yellow, title: "YELLOW", body: "Human and animal anatomical waste, soiled waste, expired medicines, chemical waste, discarded linen, microbiology and biotechnology waste after pre-treatment. Incineration or plasma pyrolysis as prescribed." },
    { fill: C.red, title: "RED", body: "Contaminated recyclable plastics: tubing, bottles, IV sets, catheters, gloves, urine bags. Autoclave or microwave, then shred and recycle. Not incinerated." },
    { fill: "#E5E7EB", title: "WHITE", body: "Punctured-proof, leak-proof, tamper-proof containers for sharps: needles, syringes with fixed needles, blades, scalpels. Autoclave or dry heat, then shred." },
    { fill: C.blue, title: "BLUE", body: "Glassware and metallic implants, including broken or discarded vials and ampoules. Disinfect, then recycle through an authorised recycler." },
  ];
  bins.forEach((b, i) => {
    const y = 210 + i * 280;
    roundRect(ctx, 80, y, 1240, 250, 16, C.white, C.navy, 3);
    roundRect(ctx, 110, y + 40, 220, 170, 12, b.fill, C.navy, 3);
    ctx.fillStyle = C.navy;
    ctx.font = "700 28px Sans";
    ctx.textAlign = "center";
    ctx.fillText(b.title, 220, y + 140);
    ctx.textAlign = "left";
    wrapText(ctx, b.body, 370, y + 70, 900, 36, "24px Sans", C.body, 5);
  });
};

ensureDir();
write("phleg_29_0_classification.png", classification);
write("phleg_29_1_mtp_flow.png", mtpFlow);
write("phleg_29_1_pcpndt_flow.png", pcpndtFlow);
write("phleg_29_4_mhca_rights.png", mhcaRights);
write("phleg_29_5_cotpa_pillars.png", cotpaPillars);
write("phleg_29_7_esi_benefits.png", esiBenefits);
write("phleg_29_8_bmw_colours.png", bmwChart);
