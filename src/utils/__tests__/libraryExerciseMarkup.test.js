import {
  exerciseHeaderTitle,
  hasExerciseMarkup,
  isExerciseMarkupLine,
  splitExerciseSegments,
} from "../libraryExerciseMarkup";

describe("libraryExerciseMarkup", () => {
  const sample = `SOLVED EXERCISES

[EX]4. The following data give creatinine (mg/100 ml) in a 24-hour urine specimen.
(i) Tabulate using tally marks.
(ii) Present as a histogram and a polygon.[/EX]
[ANS]
**Given:** 72 observations.

**i. Frequency table**
| Class interval | Tally | f |
|---|---|---|
| 1.00-1.19 | || | 3 |
| 1.20-1.39 | |||| | 8 |

**ii. Graphs**
Histogram: class intervals on X, frequency on Y, no gaps.
[/ANS]

Afterword stays as text.
`;

  it("detects exercise markup and exam-style lines", () => {
    expect(hasExerciseMarkup(sample)).toBe(true);
    expect(hasExerciseMarkup("plain leaf")).toBe(false);
    expect(isExerciseMarkupLine("[EX]4. Tabulate the data[/EX]")).toBe(true);
    expect(isExerciseMarkupLine("[ANS]")).toBe(true);
    expect(isExerciseMarkupLine("[/ANS]")).toBe(true);
    expect(isExerciseMarkupLine("Class interval")).toBe(false);
  });

  it("splits a multiline EX/ANS pair and keeps surrounding text", () => {
    const parts = splitExerciseSegments(sample);
    expect(parts.map((p) => p.type)).toEqual(["text", "exercise", "text"]);
    expect(parts[0].text).toContain("SOLVED EXERCISES");
    expect(parts[1].id).toBe("ex-0");
    expect(parts[1].question).toMatch(/^4\./);
    expect(parts[1].question).toContain("histogram");
    expect(parts[1].answer).toContain("| Class interval | Tally | f |");
    expect(parts[1].answer).toContain("no gaps");
    expect(parts[2].text).toContain("Afterword stays as text");
  });

  it("shortens the closed-card header to Qn plus first sentence", () => {
    const title = exerciseHeaderTitle(
      "4. The following data give creatinine (mg/100 ml) in a 24-hour urine specimen. (i) Tabulate using tally marks.",
    );
    expect(title).toBe(
      "Q4. The following data give creatinine (mg/100 ml) in a 24-hour urine specimen.",
    );
  });
});
