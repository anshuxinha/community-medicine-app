const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const PAGE_DIR = path.join(__dirname, "..", "tmp_nhps_pages");
const OUTPUT_DIR = path.join(__dirname, "..", "reading-illustrations");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "nhp-logo-staging-manifest.json");
const CONTACT_SHEET_PATH = path.join(OUTPUT_DIR, "nhp-logo-staging-contact-sheet.png");

const CROP_SPECS = [
  {
    fileName: "stage_7-2_laqshya.png",
    sourcePage: 4,
    crop: { x: 980, y: 560, width: 480, height: 400 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "LaQshya branding",
  },
  {
    fileName: "stage_7-2_pmmvy.png",
    sourcePage: 4,
    crop: { x: 1080, y: 980, width: 380, height: 360 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "Pradhan Mantri Matru Vandana Yojana logo",
  },
  {
    fileName: "stage_7-2_pmsma.png",
    sourcePage: 4,
    crop: { x: 1060, y: 1570, width: 420, height: 420 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "Pradhan Mantri Surakshit Matritva Abhiyan logo",
  },
  {
    fileName: "stage_7-2_suman.png",
    sourcePage: 5,
    crop: { x: 1080, y: 500, width: 420, height: 520 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "SUMAN branding poster",
  },
  {
    fileName: "stage_7-2_maa.png",
    sourcePage: 5,
    crop: { x: 1100, y: 1430, width: 300, height: 320 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "MAA programme icon",
  },
  {
    fileName: "stage_7-2_inap.png",
    sourcePage: 12,
    crop: { x: 1180, y: 1240, width: 280, height: 320 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "India Newborn Action Plan logo",
  },
  {
    fileName: "stage_7-2_rksk.png",
    sourcePage: 13,
    crop: { x: 1040, y: 1160, width: 420, height: 370 },
    topicId: "7-2",
    topicTitle: "RMNCAH+N (Reproductive, Maternal, Newborn, Child, Adolescent Health and Nutrition)",
    label: "Rashtriya Kishor Swasthya Karyakram logo",
  },
  {
    fileName: "stage_7-3_nvbdcp.png",
    sourcePage: 39,
    crop: { x: 1030, y: 380, width: 470, height: 500 },
    topicId: "7-3",
    topicTitle: "National Vector Borne Disease Control Programme (NVBDCP)",
    label: "NVBDCP logo",
  },
  {
    fileName: "stage_7-4_nlep.png",
    sourcePage: 54,
    crop: { x: 1010, y: 1670, width: 480, height: 360 },
    topicId: "7-4",
    topicTitle: "National Leprosy Eradication Programme (NLEP)",
    label: "NLEP explanatory logo graphic",
  },
  {
    fileName: "stage_7-5_rntcp_dots.png",
    sourcePage: 25,
    crop: { x: 110, y: 480, width: 470, height: 410 },
    topicId: "7-5",
    topicTitle: "National Tuberculosis Elimination Programme (NTEP)",
    label: "RNTCP DOTS logo",
  },
  {
    fileName: "stage_7-5_ntep.png",
    sourcePage: 25,
    crop: { x: 100, y: 850, width: 500, height: 430 },
    topicId: "7-5",
    topicTitle: "National Tuberculosis Elimination Programme (NTEP)",
    label: "NTEP logo",
  },
  {
    fileName: "stage_7-6_naco.png",
    sourcePage: 17,
    crop: { x: 1080, y: 480, width: 380, height: 260 },
    topicId: "7-6",
    topicTitle: "National AIDS Control Programme (NACP)",
    label: "NACO logo",
  },
  {
    fileName: "stage_7-6_pptct.png",
    sourcePage: 20,
    crop: { x: 1030, y: 980, width: 470, height: 340 },
    topicId: "7-6",
    topicTitle: "National AIDS Control Programme (NACP)",
    label: "PPTCT logo",
  },
  {
    fileName: "stage_7-7_npcbvi.png",
    sourcePage: 68,
    crop: { x: 1040, y: 470, width: 430, height: 390 },
    topicId: "7-7",
    topicTitle: "National Programme for Control of Blindness and Visual Impairment (NPCB&VI)",
    label: "NPCBVI logo",
  },
  {
    fileName: "stage_7-10_npncd.png",
    sourcePage: 64,
    crop: { x: 1030, y: 760, width: 450, height: 390 },
    topicId: "7-10",
    topicTitle: "National Programme for Prevention & Control of Non-Communicable Diseases (NP-NCD)",
    label: "NP-NCD logo",
  },
  {
    fileName: "stage_7-11_nmhp.png",
    sourcePage: 78,
    crop: { x: 1030, y: 380, width: 430, height: 430 },
    topicId: "7-11",
    topicTitle: "National Mental Health Programme (NMHP)",
    label: "NMHP logo",
  },
  {
    fileName: "stage_7-12_idsp.png",
    sourcePage: 73,
    crop: { x: 1010, y: 260, width: 500, height: 460 },
    topicId: "7-12",
    topicTitle: "Integrated Disease Surveillance Programme (IDSP)",
    label: "IDSP logo",
  },
  {
    fileName: "stage_7-13_pmjay.png",
    sourcePage: 74,
    crop: { x: 1030, y: 470, width: 450, height: 430 },
    topicId: "7-13",
    topicTitle: "Ayushman Bharat Programme (AB-PMJAY & Health and Wellness Centres)",
    label: "Ayushman Bharat PM-JAY logo",
  },
];

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getPagePath = (pageNumber) =>
  path.join(PAGE_DIR, `page_${pageNumber}_screenshot.png`);

const clampCrop = (image, crop) => ({
  x: Math.max(0, Math.min(crop.x, image.width - 1)),
  y: Math.max(0, Math.min(crop.y, image.height - 1)),
  width: Math.max(1, Math.min(crop.width, image.width - crop.x)),
  height: Math.max(1, Math.min(crop.height, image.height - crop.y)),
});

const isNearWhite = (r, g, b, a) => a < 10 || (r > 245 && g > 245 && b > 245);

const trimCanvas = (sourceCanvas, padding = 18) => {
  const ctx = sourceCanvas.getContext("2d");
  const { width, height } = sourceCanvas;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      const a = imageData[index + 3];

      if (!isNearWhite(r, g, b, a)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX === -1 || maxY === -1) {
    return sourceCanvas;
  }

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  const trimmedCanvas = createCanvas(trimmedWidth, trimmedHeight);
  const trimmedCtx = trimmedCanvas.getContext("2d");
  trimmedCtx.drawImage(
    sourceCanvas,
    minX,
    minY,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight,
  );

  return trimmedCanvas;
};

const cropRegion = async (spec) => {
  const pagePath = getPagePath(spec.sourcePage);
  if (!fs.existsSync(pagePath)) {
    throw new Error(`Missing page screenshot: ${pagePath}`);
  }

  const image = await loadImage(pagePath);
  const boundedCrop = clampCrop(image, spec.crop);
  const cropCanvas = createCanvas(boundedCrop.width, boundedCrop.height);
  const cropCtx = cropCanvas.getContext("2d");

  cropCtx.drawImage(
    image,
    boundedCrop.x,
    boundedCrop.y,
    boundedCrop.width,
    boundedCrop.height,
    0,
    0,
    boundedCrop.width,
    boundedCrop.height,
  );

  return trimCanvas(cropCanvas);
};

const buildContactSheet = async (manifestEntries) => {
  const thumbWidth = 280;
  const thumbHeight = 220;
  const columns = 3;
  const cardPadding = 20;
  const headerHeight = 70;
  const rows = Math.ceil(manifestEntries.length / columns);
  const width = columns * (thumbWidth + cardPadding * 2) + cardPadding;
  const height = rows * (thumbHeight + 110 + cardPadding * 2) + headerHeight + cardPadding;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 28px Sans";
  ctx.fillText("NHP Logo Staging Contact Sheet", 24, 42);
  ctx.fillStyle = "#475569";
  ctx.font = "20px Sans";
  ctx.fillText("Review these staged crops before Firebase upload and seed wiring.", 24, 66);

  for (let index = 0; index < manifestEntries.length; index += 1) {
    const entry = manifestEntries[index];
    const row = Math.floor(index / columns);
    const column = index % columns;
    const cardX = 24 + column * (thumbWidth + cardPadding * 2);
    const cardY = headerHeight + 18 + row * (thumbHeight + 110 + cardPadding * 2);
    const image = await loadImage(path.join(OUTPUT_DIR, entry.fileName));

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, thumbWidth + cardPadding * 2, thumbHeight + 110, 16);
    ctx.fill();
    ctx.stroke();

    const scale = Math.min(thumbWidth / image.width, thumbHeight / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const imageX = cardX + cardPadding + (thumbWidth - drawWidth) / 2;
    const imageY = cardY + cardPadding + (thumbHeight - drawHeight) / 2;
    ctx.drawImage(image, imageX, imageY, drawWidth, drawHeight);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 18px Sans";
    ctx.fillText(entry.topicId, cardX + 20, cardY + thumbHeight + 48);
    ctx.font = "16px Sans";
    ctx.fillStyle = "#334155";
    ctx.fillText(entry.label.slice(0, 38), cardX + 20, cardY + thumbHeight + 76);
    ctx.fillStyle = "#64748b";
    ctx.fillText(entry.fileName, cardX + 20, cardY + thumbHeight + 100);
  }

  fs.writeFileSync(CONTACT_SHEET_PATH, canvas.toBuffer("image/png"));
};

async function main() {
  ensureDir(OUTPUT_DIR);

  const manifest = [];

  for (const spec of CROP_SPECS) {
    const canvas = await cropRegion(spec);
    const outputPath = path.join(OUTPUT_DIR, spec.fileName);
    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));

    manifest.push({
      fileName: spec.fileName,
      sourcePage: spec.sourcePage,
      topicId: spec.topicId,
      topicTitle: spec.topicTitle,
      label: spec.label,
    });

    console.log(`Staged ${spec.fileName}`);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  await buildContactSheet(manifest);
  console.log(`Wrote manifest to ${MANIFEST_PATH}`);
  console.log(`Wrote contact sheet to ${CONTACT_SHEET_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
