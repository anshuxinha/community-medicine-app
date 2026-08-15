const STORAGE_BUCKET = "community-med-app.firebasestorage.app";
const BASE_PATH = "pyq-images";

export const PYQ_IMAGE_BASE = `https://storage.googleapis.com/${STORAGE_BUCKET}/${BASE_PATH}`;

const SAFE_NAME = /^image_p\d+_Im\d+\.(jpe?g|png|webp)$/i;

/**
 * Public Storage URL for a PYQ figure filename from pyq_data.json.
 * Returns null for missing or unsafe names (no path segments).
 */
export function pyqImageUrl(fileName) {
  if (!fileName || typeof fileName !== "string") return null;
  const safe = fileName.replace(/\.\.\//g, "").replace(/^[/\\]+/, "");
  if (!SAFE_NAME.test(safe)) return null;
  return `${PYQ_IMAGE_BASE}/${safe}`;
}

export function pyqImageSource(fileName) {
  const url = pyqImageUrl(fileName);
  return url ? { uri: url } : null;
}
