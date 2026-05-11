const STORAGE_BASE = "https://storage.googleapis.com/community-med-app.firebasestorage.app/gems";

export const GEM_IMAGE_MAP = {
  "Figure 2.2": `${STORAGE_BASE}/ors.png`,
  "Figure 4.7": `${STORAGE_BASE}/shake_test_1.png`,
  "Figure 4.8": `${STORAGE_BASE}/shake_test_2.png`,
  "Figure 4.9": `${STORAGE_BASE}/shake_test_3.png`,
  "Figure 6.1": `${STORAGE_BASE}/figure_6_1.png`,
  "Figure 6.2": `${STORAGE_BASE}/figure_6_2.png`,
  "Figure 6.3": `${STORAGE_BASE}/figure_6_3.png`,
  "Figure 8.8": `${STORAGE_BASE}/ha.png`,
};

const FIGURE_REGEX = /Figure\s+(\d+\.\d+)/gi;

export const parseFigureNumbers = (text) => {
  const matches = [];
  let match;
  while ((match = FIGURE_REGEX.exec(text)) !== null) {
    matches.push(`Figure ${match[1]}`);
  }
  return matches;
};
