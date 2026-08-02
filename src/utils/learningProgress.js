import {
  NMC_PAPERS,
  getChapterNmcMeta,
  getPrimaryPaperForChapterId,
  DEFAULT_DAILY_GOAL,
} from "../data/nmcCurriculum";
import {
  LEAF_CONTENT_ENTRIES,
  CONTENT_SECTIONS,
} from "./contentRegistry";

export const isLeafRead = (entry, readItemVersions = {}) =>
  !!entry && readItemVersions?.[entry.key] === entry.signature;

export const getTheoryLeaves = () =>
  LEAF_CONTENT_ENTRIES.filter((entry) => entry.section === "theory");

export const getPracticalLeaves = () =>
  LEAF_CONTENT_ENTRIES.filter((entry) => entry.section === "practical");

/**
 * @returns {{ paperId: number, total: number, read: number, fraction: number, percent: number }[]}
 */
export const computeProgressByPaper = (readItemVersions = {}) => {
  const theoryLeaves = getTheoryLeaves();

  return NMC_PAPERS.map((paper) => {
    const leaves = theoryLeaves.filter(
      (entry) => Number(entry.primaryPaper) === paper.id,
    );
    const read = leaves.reduce(
      (count, entry) => (isLeafRead(entry, readItemVersions) ? count + 1 : count),
      0,
    );
    const total = leaves.length;
    const fraction = total === 0 ? 0 : Math.min(read / total, 1);
    return {
      paperId: paper.id,
      roman: paper.roman,
      shortTitle: paper.shortTitle,
      title: paper.title,
      domains: paper.domains,
      colorToken: paper.colorToken,
      total,
      read,
      fraction,
      percent: Math.round(fraction * 100),
    };
  });
};

export const computePracticalProgress = (readItemVersions = {}) => {
  const leaves = getPracticalLeaves();
  const read = leaves.reduce(
    (count, entry) => (isLeafRead(entry, readItemVersions) ? count + 1 : count),
    0,
  );
  const total = leaves.length;
  const fraction = total === 0 ? 0 : Math.min(read / total, 1);
  return {
    total,
    read,
    fraction,
    percent: Math.round(fraction * 100),
  };
};

export const getDailyReadCount = (dailyReadHistory = {}, date = new Date()) => {
  const key = date.toISOString().split("T")[0];
  return Number(dailyReadHistory?.[key]) || 0;
};

export const getActivitySeries = (dailyReadHistory = {}, days = 14) => {
  const series = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];
    series.push({
      dateKey: key,
      count: Number(dailyReadHistory?.[key]) || 0,
      label: `${d.getDate()}`,
    });
  }
  return series;
};

/**
 * First incomplete theory leaf in library order, optionally constrained to a paper.
 */
export const getNextIncompleteLeaf = (
  readItemVersions = {},
  { paperId = null, preferredContentKey = null } = {},
) => {
  const theoryLeaves = getTheoryLeaves().filter((entry) => {
    if (paperId == null) return true;
    return Number(entry.primaryPaper) === Number(paperId);
  });

  if (preferredContentKey) {
    const preferred = theoryLeaves.find(
      (entry) => entry.key === preferredContentKey,
    );
    if (preferred && !isLeafRead(preferred, readItemVersions)) {
      return preferred;
    }
  }

  return (
    theoryLeaves.find((entry) => !isLeafRead(entry, readItemVersions)) || null
  );
};

/**
 * Root theory chapters grouped by primary paper (stable mockData order).
 */
export const getTheoryChaptersByPaper = () => {
  const theory = CONTENT_SECTIONS.theory || [];
  const byPaper = { 1: [], 2: [], 3: [], 4: [] };

  theory.forEach((chapter) => {
    const id = String(chapter.id);
    const paper = getPrimaryPaperForChapterId(id);
    if (paper && byPaper[paper]) {
      byPaper[paper].push(chapter);
    }
  });

  return byPaper;
};

export const getChapterCompletion = (chapterRootId, readItemVersions = {}) => {
  const leaves = getTheoryLeaves().filter(
    (entry) => String(entry.rootChapterId) === String(chapterRootId),
  );
  const total = leaves.length;
  const read = leaves.reduce(
    (count, entry) => (isLeafRead(entry, readItemVersions) ? count + 1 : count),
    0,
  );
  const fraction = total === 0 ? 0 : Math.min(read / total, 1);
  return { total, read, fraction, percent: Math.round(fraction * 100) };
};

export const getRecommendedChaptersForYear = (
  year,
  readItemVersions = {},
  limit = 8,
) => {
  const y = Number(year);
  if (!y) return [];

  const theory = CONTENT_SECTIONS.theory || [];
  const results = [];

  for (const chapter of theory) {
    const meta = getChapterNmcMeta(chapter.id);
    if (!meta?.yearPhase?.includes(y)) continue;
    const completion = getChapterCompletion(chapter.id, readItemVersions);
    if (completion.fraction >= 1) continue;
    results.push({
      chapter,
      paper: meta.primaryPaper,
      completion,
    });
    if (results.length >= limit) break;
  }

  return results;
};

export const getPaperStatusLabel = (fraction) => {
  if (fraction <= 0) return "Not started";
  if (fraction >= 1) return "Complete";
  if (fraction >= 0.6) return "Strong";
  return "In progress";
};

export const getDailyGoalProgress = (
  dailyReadHistory = {},
  goal = DEFAULT_DAILY_GOAL,
) => {
  const count = getDailyReadCount(dailyReadHistory);
  const safeGoal = Math.max(1, Number(goal) || DEFAULT_DAILY_GOAL);
  return {
    count,
    goal: safeGoal,
    fraction: Math.min(count / safeGoal, 1),
    met: count >= safeGoal,
  };
};

export const MILESTONE_PERCENTS = [25, 50, 75, 100];

export const getReachedMilestones = (percent) =>
  MILESTONE_PERCENTS.filter((m) => percent >= m);
