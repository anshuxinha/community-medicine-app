import {
  learningProfileNeedsCloudBackfill,
  resolveLearningProfile,
} from "../learningProfileStorage";

describe("resolveLearningProfile", () => {
  it("prefers cloud when the field is set", () => {
    expect(
      resolveLearningProfile(
        { learnerRole: "ug", trainingYear: 2, preferredPaperFocus: "1" },
        { learnerRole: "faculty", trainingYear: 1, preferredPaperFocus: "all" },
      ),
    ).toEqual({
      learnerRole: "ug",
      trainingYear: 2,
      preferredPaperFocus: "1",
    });
  });

  it("keeps local role when cloud is sparse", () => {
    expect(
      resolveLearningProfile(
        {},
        { learnerRole: "faculty", trainingYear: 3, preferredPaperFocus: "2" },
      ),
    ).toEqual({
      learnerRole: "faculty",
      trainingYear: 3,
      preferredPaperFocus: "2",
    });
  });

  it("does not treat missing cloud role as Not set when cache has one", () => {
    const resolved = resolveLearningProfile(
      { learnerRole: null, preferredPaperFocus: "all" },
      { learnerRole: "md_resident", trainingYear: 1, preferredPaperFocus: "all" },
    );
    expect(resolved.learnerRole).toBe("md_resident");
    expect(resolved.trainingYear).toBe(1);
  });
});

describe("learningProfileNeedsCloudBackfill", () => {
  it("is true when cloud is missing a saved role", () => {
    expect(
      learningProfileNeedsCloudBackfill(
        {},
        { learnerRole: "ug", trainingYear: null, preferredPaperFocus: "all" },
      ),
    ).toBe(true);
  });

  it("is false when cloud already has the role", () => {
    expect(
      learningProfileNeedsCloudBackfill(
        { learnerRole: "ug" },
        { learnerRole: "ug", trainingYear: null, preferredPaperFocus: "all" },
      ),
    ).toBe(false);
  });
});
