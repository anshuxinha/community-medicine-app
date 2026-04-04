const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

const OUTPUT_DIR = path.join(__dirname, "..", "reading-illustrations");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "nhp-logo-staging-manifest.json");
const CONTACT_SHEET_PATH = path.join(OUTPUT_DIR, "nhp-logo-staging-contact-sheet.png");
const SOURCES_PATH = path.join(OUTPUT_DIR, "nhp-logo-web-sources.json");

const DOWNLOAD_SPECS = [
  {
    fileName: "stage_7-2_pmmvy.png",
    topicId: "7-2",
    label: "Pradhan Mantri Matru Vandana Yojana logo",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/67/Pradhan_Mantri_Matru_Vandana_Yojana.jpeg",
    sourceNote: "Wikimedia Commons",
  },
  {
    fileName: "stage_7-2_rksk.png",
    topicId: "7-2",
    label: "Rashtriya Kishor Swasthya Karyakram logo",
    sourceUrl: "https://rksk.in/public/assets/logos/RKSK.png",
    sourceNote: "Official RKSK site",
  },
  {
    fileName: "stage_7-3_nvbdcp.png",
    topicId: "7-3",
    label: "NVBDCP logo",
    sourceUrl: "https://ihiplearning.in/vbd/images/NVBDCP.jpg",
    sourceNote: "IHIP VBD learning portal",
  },
  {
    fileName: "stage_7-4_nlep.png",
    topicId: "7-4",
    label: "NLEP explanatory logo graphic",
    sourceUrl:
      "https://cdnbbsr.s3waas.gov.in/s3c154e8f56c74b3be3008da9bd19d08fc/uploads/2018/07/202504301410915811.png",
    sourceNote: "Government health portal asset",
  },
  {
    fileName: "stage_7-5_ntep.png",
    topicId: "7-5",
    label: "NTEP logo",
    sourceUrl:
      "https://tbcindia.mohfw.gov.in/wp-content/uploads/2024/01/imageedit_10_8067892041-1.png",
    sourceNote: "Official TB India site",
  },
  {
    fileName: "stage_7-7_npcbvi.png",
    topicId: "7-7",
    label: "NPCBVI logo",
    sourceUrl: "https://npcbvi.mohfw.gov.in/Image/logo1.png",
    sourceNote: "Official NPCBVI site",
  },
  {
    fileName: "stage_7-11_nmhp.png",
    topicId: "7-11",
    label: "NMHP logo",
    sourceUrl: "https://idsp.mohfw.gov.in/WriteReadData/p92g8/30359530431458620095.jpg",
    sourceNote: "Government health asset",
  },
];

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

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

const buildPngCanvas = async (imageBuffer) => {
  const image = await loadImage(imageBuffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height);
  return trimCanvas(canvas);
};

const downloadFile = async (spec) => {
  const response = await fetch(spec.sourceUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${spec.sourceUrl}: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const buildContactSheet = async (manifestEntries) => {
  const existingEntries = manifestEntries.filter((entry) =>
    fs.existsSync(path.join(OUTPUT_DIR, entry.fileName)),
  );

  if (existingEntries.length === 0) {
    return;
  }

  const thumbWidth = 280;
  const thumbHeight = 220;
  const columns = 3;
  const cardPadding = 20;
  const headerHeight = 70;
  const rows = Math.ceil(existingEntries.length / columns);
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
  ctx.fillText("Current staged logos for content review.", 24, 66);

  for (let index = 0; index < existingEntries.length; index += 1) {
    const entry = existingEntries[index];
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

  const downloadedEntries = [];

  for (const spec of DOWNLOAD_SPECS) {
    const imageBuffer = await downloadFile(spec);
    const canvas = await buildPngCanvas(imageBuffer);
    const outputPath = path.join(OUTPUT_DIR, spec.fileName);

    fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
    downloadedEntries.push({
      fileName: spec.fileName,
      topicId: spec.topicId,
      label: spec.label,
      sourceUrl: spec.sourceUrl,
      sourceNote: spec.sourceNote,
    });

    console.log(`Downloaded ${spec.fileName}`);
  }

  fs.writeFileSync(SOURCES_PATH, JSON.stringify(downloadedEntries, null, 2));

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Missing staging manifest: ${MANIFEST_PATH}`);
  }

  const manifestEntries = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  await buildContactSheet(manifestEntries);

  console.log(`Wrote source manifest to ${SOURCES_PATH}`);
  console.log(`Wrote contact sheet to ${CONTACT_SHEET_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
