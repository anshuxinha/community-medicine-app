/**
 * NMC MD Community Medicine theory paper map (national PG guideline).
 * Chapters keep Park-style library ids; papers are metadata only.
 * Source: NMC Guidelines for Competency Based PG Training in MD Community Medicine.
 */

export const NMC_PAPERS = [
  {
    id: 1,
    roman: "I",
    shortTitle: "Foundations & Epidemiology",
    title: "Paper I · Foundations & Epidemiology",
    domains:
      "Concepts of PH/CM, CD/NCD, applied epidemiology, health research, biostatistics",
    colorToken: "primary",
  },
  {
    id: 2,
    roman: "II",
    shortTitle: "Programs, Nutrition & Systems",
    title: "Paper II · Programs, Nutrition & Systems",
    domains:
      "Nutrition, environment, PHC, national programmes, RCH, demography, admin & management",
    colorToken: "secondary",
  },
  {
    id: 3,
    roman: "III",
    shortTitle: "Society, Law & Global Health",
    title: "Paper III · Society, Law & Global Health",
    domains:
      "Social & behavioural sciences, scientific writing, PH legislation, international health",
    colorToken: "success",
  },
  {
    id: 4,
    roman: "IV",
    shortTitle: "Policy, Occupation & Advances",
    title: "Paper IV · Policy, Occupation & Advances",
    domains:
      "Health policy, MET, HIS/IT, AYUSH, occupational health, economics, recent advances",
    colorToken: "warning",
  },
];

/**
 * Root theory chapter id (string) → NMC metadata.
 * yearPhase: suggested MD years to prioritise (1–3); not an official NMC split.
 */
export const CHAPTER_NMC_MAP = {
  "1": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1] },
  "2": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1] },
  "3": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1] },
  "4": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1] },
  "5": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1, 2] },
  "6": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1, 2] },
  "7": { primaryPaper: 2, secondaryPapers: [], yearPhase: [2] },
  "8": { primaryPaper: 2, secondaryPapers: [], yearPhase: [1, 2] },
  "9": { primaryPaper: 2, secondaryPapers: [], yearPhase: [2] },
  "10": { primaryPaper: 2, secondaryPapers: [], yearPhase: [2] },
  "11": { primaryPaper: 2, secondaryPapers: [], yearPhase: [1, 2] },
  "12": { primaryPaper: 3, secondaryPapers: [4], yearPhase: [2, 3] },
  "13": { primaryPaper: 3, secondaryPapers: [], yearPhase: [2, 3] },
  "14": { primaryPaper: 3, secondaryPapers: [4], yearPhase: [2, 3] },
  "15": { primaryPaper: 2, secondaryPapers: [], yearPhase: [1, 2] },
  "16": { primaryPaper: 2, secondaryPapers: [], yearPhase: [2] },
  "17": { primaryPaper: 2, secondaryPapers: [3], yearPhase: [2, 3] },
  "18": { primaryPaper: 4, secondaryPapers: [], yearPhase: [2, 3] },
  "19": { primaryPaper: 3, secondaryPapers: [4], yearPhase: [2, 3] },
  "20": { primaryPaper: 3, secondaryPapers: [], yearPhase: [2, 3] },
  "21": { primaryPaper: 4, secondaryPapers: [1], yearPhase: [1, 3] },
  "22": { primaryPaper: 3, secondaryPapers: [], yearPhase: [2, 3] },
  "23": { primaryPaper: 2, secondaryPapers: [4], yearPhase: [2, 3] },
  "24": { primaryPaper: 2, secondaryPapers: [], yearPhase: [2] },
  "25": { primaryPaper: 3, secondaryPapers: [], yearPhase: [3] },
  "26": { primaryPaper: 1, secondaryPapers: [], yearPhase: [1] },
  "27": { primaryPaper: 2, secondaryPapers: [], yearPhase: [2, 3] },
  "28": { primaryPaper: 3, secondaryPapers: [1], yearPhase: [1, 2] },
  "29": { primaryPaper: 3, secondaryPapers: [4], yearPhase: [2, 3] },
};

export const PRACTICAL_SKILL_MAP = {
  "1": { skillTags: ["met"], paperAffinity: 4, label: "Pedagogy / MET" },
  "2": { skillTags: ["family_case"], paperAffinity: null, label: "Family health" },
  "3": {
    skillTags: ["research", "thesis"],
    paperAffinity: 1,
    label: "Project / thesis",
  },
  "4": {
    skillTags: ["clinical_social"],
    paperAffinity: null,
    label: "Clinico-social case",
  },
  "5": {
    skillTags: ["epi_biostats_exercises"],
    paperAffinity: 1,
    label: "Epi & biostats exercises",
  },
};

export const LEARNER_ROLES = [
  { id: "md_resident", label: "MD resident", hint: "Exam + field focused" },
  { id: "faculty", label: "Faculty", hint: "Teaching & curriculum" },
  { id: "ug", label: "UG / Intern", hint: "Core concepts first" },
  { id: "other", label: "Other", hint: "Browse freely" },
];

export const DEFAULT_DAILY_GOAL = 2;

export const getPaperMeta = (paperId) =>
  NMC_PAPERS.find((paper) => paper.id === Number(paperId)) || null;

export const getChapterNmcMeta = (chapterRootId) => {
  if (chapterRootId === undefined || chapterRootId === null) return null;
  return CHAPTER_NMC_MAP[String(chapterRootId)] || null;
};

export const getPrimaryPaperForChapterId = (chapterRootId) => {
  const meta = getChapterNmcMeta(chapterRootId);
  return meta?.primaryPaper ?? null;
};

export const getChaptersForPaper = (paperId) => {
  const target = Number(paperId);
  return Object.entries(CHAPTER_NMC_MAP)
    .filter(([, meta]) => meta.primaryPaper === target)
    .map(([id]) => id);
};

export const getChaptersForYearPhase = (year) => {
  const y = Number(year);
  return Object.entries(CHAPTER_NMC_MAP)
    .filter(([, meta]) => Array.isArray(meta.yearPhase) && meta.yearPhase.includes(y))
    .map(([id]) => id);
};
