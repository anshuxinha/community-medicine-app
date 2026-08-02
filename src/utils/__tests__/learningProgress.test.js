import {
  CHAPTER_NMC_MAP,
  NMC_PAPERS,
  getChaptersForPaper,
  getPrimaryPaperForChapterId,
} from "../../data/nmcCurriculum";
import {
  CONTENT_SECTIONS,
  LEAF_CONTENT_ENTRIES,
  hydrateContentRegistry,
} from "../contentRegistry";
import {
  computeProgressByPaper,
  getNextIncompleteLeaf,
  isLeafRead,
} from "../learningProgress";

describe("nmcCurriculum coverage", () => {
  beforeAll(() => {
    hydrateContentRegistry([]);
  });

  it("maps every theory root chapter to a primary paper", () => {
    const roots = (CONTENT_SECTIONS.theory || []).map((c) => String(c.id));
    expect(roots.length).toBeGreaterThan(0);
    roots.forEach((id) => {
      expect(CHAPTER_NMC_MAP[id]).toBeDefined();
      expect([1, 2, 3, 4]).toContain(CHAPTER_NMC_MAP[id].primaryPaper);
    });
  });

  it("has four NMC papers", () => {
    expect(NMC_PAPERS).toHaveLength(4);
  });

  it("returns chapters for paper I", () => {
    const list = getChaptersForPaper(1);
    expect(list).toContain("1");
    expect(list).toContain("26");
    expect(getPrimaryPaperForChapterId("7")).toBe(2);
  });
});

describe("learningProgress", () => {
  beforeAll(() => {
    hydrateContentRegistry([]);
  });

  it("attaches primaryPaper on theory leaves", () => {
    const theoryLeaves = LEAF_CONTENT_ENTRIES.filter((e) => e.section === "theory");
    expect(theoryLeaves.length).toBeGreaterThan(0);
    theoryLeaves.forEach((entry) => {
      expect(entry.rootChapterId).toBeTruthy();
      expect([1, 2, 3, 4]).toContain(Number(entry.primaryPaper));
    });
  });

  it("computes zero paper progress when nothing is read", () => {
    const byPaper = computeProgressByPaper({});
    expect(byPaper).toHaveLength(4);
    byPaper.forEach((row) => {
      expect(row.read).toBe(0);
      expect(row.percent).toBe(0);
      expect(row.total).toBeGreaterThan(0);
    });
  });

  it("counts a read leaf toward only its primary paper", () => {
    const entry = LEAF_CONTENT_ENTRIES.find(
      (e) => e.section === "theory" && Number(e.primaryPaper) === 1,
    );
    expect(entry).toBeTruthy();
    const versions = { [entry.key]: entry.signature };
    const byPaper = computeProgressByPaper(versions);
    const p1 = byPaper.find((p) => p.paperId === 1);
    const others = byPaper.filter((p) => p.paperId !== 1);
    expect(p1.read).toBe(1);
    others.forEach((p) => expect(p.read).toBe(0));
    expect(isLeafRead(entry, versions)).toBe(true);
  });

  it("returns next incomplete leaf", () => {
    const next = getNextIncompleteLeaf({});
    expect(next).toBeTruthy();
    expect(next.section).toBe("theory");
  });
});
