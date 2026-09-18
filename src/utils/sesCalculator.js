/** Modified Kuppuswamy and BG Prasad SES, CPI-IW base 2016 = 100. */

export const DEFAULT_CPI_IW = 153.2;
export const DEFAULT_CPI_IW_PERIOD = "July 2026";
export const DEFAULT_CPI_IW_LABEL = "All-India CPI-IW, July 2026";

/** Original BG Prasad 1961 rupee cut-offs, scaled by Labour Bureau linking factors. */
export const BG_PRASAD_LINKING_FACTOR = 2.88 * 4.63 * 4.93;

/** Monthly family-income floors at CPI-IW 2016 = 100 (score 12 / 10 / 6 / 4 / 3 / 2). */
export const KUPPUSWAMY_BASE_FLOORS = [
  { score: 12, min: 51646 },
  { score: 10, min: 25811 },
  { score: 6, min: 19351 },
  { score: 4, min: 12890 },
  { score: 3, min: 7725 },
  { score: 2, min: 2586 },
  { score: 1, min: 0 },
];

function kuppuswamyClass(totalScore) {
  if (totalScore >= 26) return "Upper (Class I)";
  if (totalScore >= 16) return "Upper Middle (Class II)";
  if (totalScore >= 11) return "Lower Middle (Class III)";
  if (totalScore >= 5) return "Upper Lower (Class IV)";
  return "Lower (Class V)";
}

function bgPrasadClass(income, conversionFactor) {
  if (income >= 100 * conversionFactor) return "Upper (Class I)";
  if (income >= 50 * conversionFactor) return "Upper Middle (Class II)";
  if (income >= 30 * conversionFactor) return "Middle (Class III)";
  if (income >= 15 * conversionFactor) return "Lower Middle (Class IV)";
  return "Lower (Class V)";
}

export function scaledKuppuswamyFloors(cpi) {
  const factor = Number(cpi) / 100;
  return KUPPUSWAMY_BASE_FLOORS.map((row, index) => {
    const min = row.min * factor;
    const nextHigher = index === 0 ? null : KUPPUSWAMY_BASE_FLOORS[index - 1].min * factor;
    return {
      score: row.score,
      min,
      maxExclusive: nextHigher,
    };
  });
}

export function incomeScoreKuppuswamy(familyIncome, cpi) {
  const floors = scaledKuppuswamyFloors(cpi);
  const income = Number(familyIncome);
  const match = floors.find((row) => income >= row.min);
  return match ? match.score : 1;
}

function isMissingNumber(value) {
  if (value === "" || value == null) return true;
  const n = Number(value);
  return !Number.isFinite(n);
}

export function calculateKuppuswamy({ education, occupation, familyIncome, cpi }) {
  const income = Number(familyIncome);
  const currentCpi = Number(cpi);
  if (isMissingNumber(familyIncome) || isMissingNumber(cpi) || currentCpi <= 0) {
    return { error: "Please enter valid numbers for Income and CPI" };
  }

  const incomeScore = incomeScoreKuppuswamy(income, currentCpi);
  const totalScore = Number(education) + Number(occupation) + incomeScore;
  const floors = scaledKuppuswamyFloors(currentCpi);
  const classI = floors[0];

  return {
    score: totalScore,
    incomeScore,
    class: kuppuswamyClass(totalScore),
    slabs: floors,
    classIThreshold: classI.min,
    cpi: currentCpi,
    cpiPeriod: DEFAULT_CPI_IW_PERIOD,
  };
}

export function calculateBGPrasad({ perCapitaIncome, cpi }) {
  const income = Number(perCapitaIncome);
  const currentCpi = Number(cpi);
  if (isMissingNumber(perCapitaIncome) || isMissingNumber(cpi) || currentCpi <= 0) {
    return { error: "Please enter valid numbers for Income and CPI" };
  }

  const conversionFactor = (currentCpi / 100) * BG_PRASAD_LINKING_FACTOR;
  const slabs = [
    { label: "Upper (Class I)", min: 100 * conversionFactor, maxExclusive: null },
    { label: "Upper Middle (Class II)", min: 50 * conversionFactor, maxExclusive: 100 * conversionFactor },
    { label: "Middle (Class III)", min: 30 * conversionFactor, maxExclusive: 50 * conversionFactor },
    { label: "Lower Middle (Class IV)", min: 15 * conversionFactor, maxExclusive: 30 * conversionFactor },
    { label: "Lower (Class V)", min: 0, maxExclusive: 15 * conversionFactor },
  ];

  return {
    class: bgPrasadClass(income, conversionFactor),
    slabs,
    classIThreshold: 100 * conversionFactor,
    cpi: currentCpi,
    cpiPeriod: DEFAULT_CPI_IW_PERIOD,
  };
}

export function formatRupee(value) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export function formatSlabRange(min, maxExclusive) {
  if (maxExclusive == null) return `≥ ${formatRupee(min)}`;
  if (min === 0) return `< ${formatRupee(maxExclusive)}`;
  return `${formatRupee(min)} – ${formatRupee(maxExclusive - 1)}`;
}
