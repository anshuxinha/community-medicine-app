import { theme } from "../styles/theme";

export const BMI_CATEGORIES_ASIAN = [
  { max: 18.5, label: "Underweight", color: theme.colors.chartBlue },
  { max: 23.0, label: "Normal", color: "#15803D" },
  { max: 25.0, label: "Overweight", color: theme.colors.accent },
  { max: Infinity, label: "Obese", color: "#B91C1C" },
];

export function bmiFromCmKg(heightCm, weightKg) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) {
    return { error: "Enter valid height (cm) and weight (kg)." };
  }
  const bmi = w / (h / 100) ** 2;
  const category = BMI_CATEGORIES_ASIAN.find((c) => bmi < c.max);
  return { bmi, category: category.label, color: category.color };
}

export function muacChildStatus(muac) {
  if (muac < 11.5) return { label: "SAM: Severe Acute Malnutrition", color: "#B91C1C", band: "RED" };
  if (muac < 12.5) return { label: "MAM: Moderate Acute Malnutrition", color: theme.colors.accent, band: "YELLOW" };
  return { label: "Normal / Well-Nourished", color: "#15803D", band: "GREEN" };
}

/** Adult CED bands used in Indian field surveys; <23 cm is the usual adult cut-off. */
export function muacAdultStatus(muac) {
  if (muac < 19.0) return { label: "Severe undernutrition", color: "#B91C1C" };
  if (muac < 22.0) return { label: "Moderate undernutrition", color: theme.colors.accent };
  if (muac < 23.0) return { label: "At risk", color: theme.colors.accent };
  return { label: "Normal", color: "#15803D" };
}

/** ICDS / NHM pregnancy cut-off: MUAC <23 cm. */
export function muacPregnantStatus(muac) {
  if (muac < 23.0) {
    return { label: "Undernourished (extra ration / counselling)", color: "#B91C1C" };
  }
  return { label: "Above the 23 cm pregnancy cut-off", color: "#15803D" };
}

export function interpretMuac(muacCm, mode) {
  const m = Number(muacCm);
  if (!Number.isFinite(m) || m <= 0) {
    return { error: "Enter a valid MUAC measurement (cm)." };
  }
  const status =
    mode === "child"
      ? muacChildStatus(m)
      : mode === "pregnant"
        ? muacPregnantStatus(m)
        : muacAdultStatus(m);
  return { muac: m, mode, ...status };
}

export function brocaIbwKg(heightCm, sex) {
  return sex === "male" ? heightCm - 100 : heightCm - 105;
}

export function bmi22IbwKg(heightCm) {
  const h = heightCm / 100;
  return 22 * h * h;
}

export function devineIbwKg(heightCm, sex) {
  const hInch = heightCm / 2.54;
  const base = sex === "male" ? 50 : 45.5;
  return base + 2.3 * (hInch - 60);
}

export function calculateIbw({ heightCm, sex, method, actualKg }) {
  const h = Number(heightCm);
  if (!Number.isFinite(h) || h <= 0) {
    return { error: "Enter a valid height (cm)." };
  }

  let ibw;
  let formula;
  if (method === "bmi22") {
    ibw = bmi22IbwKg(h);
    formula = "22 × height(m)²";
  } else if (method === "devine") {
    ibw = devineIbwKg(h, sex);
    formula = sex === "male"
      ? "Male: 50 kg + 2.3 kg per inch over 5 ft"
      : "Female: 45.5 kg + 2.3 kg per inch over 5 ft";
  } else {
    ibw = brocaIbwKg(h, sex);
    formula = sex === "male" ? "Male: height (cm) - 100" : "Female: height (cm) - 105";
  }

  const actual = Number(actualKg);
  const abwNote =
    method === "devine" && Number.isFinite(actual)
      ? `Adjusted BW (if obese): ${(ibw + 0.4 * (actual - ibw)).toFixed(1)} kg`
      : null;

  return { ibw, formula, method, abwNote };
}
