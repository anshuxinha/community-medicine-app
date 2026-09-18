/** 2x2 epidemiology and screening arithmetic. Cells: a (D+ E+/T+), b (D- E+/T+), c (D+ E-/T-), d (D- E-/T-). */

function nOf(a, b, c, d) {
  return a + b + c + d;
}

export function chiSquare2x2(a, b, c, d, { yates = false } = {}) {
  const n = nOf(a, b, c, d);
  const row1 = a + b;
  const row2 = c + d;
  const col1 = a + c;
  const col2 = b + d;
  const denom = row1 * row2 * col1 * col2;
  if (n <= 0 || denom <= 0) {
    return { error: "Enter numbers in all four cells. Row and column totals must be above zero." };
  }

  const adbc = a * d - b * c;
  const correction = yates ? n / 2 : 0;
  const adjusted = Math.abs(adbc) - correction;
  const chi2 = adjusted <= 0 ? 0 : (n * adjusted * adjusted) / denom;
  const significant = chi2 > 3.84;

  const expected = {
    a: (row1 * col1) / n,
    b: (row1 * col2) / n,
    c: (row2 * col1) / n,
    d: (row2 * col2) / n,
  };
  const minExpected = Math.min(expected.a, expected.b, expected.c, expected.d);
  const fisherSuggested = minExpected < 5;

  return {
    chi2,
    chi2Text: chi2.toFixed(3),
    significant,
    yates,
    minExpected,
    fisherSuggested,
    result: significant
      ? `χ²=${chi2.toFixed(2)} > 3.84 → Significant (p < 0.05)`
      : `χ²=${chi2.toFixed(2)} < 3.84 → Not Significant (p ≥ 0.05)`,
  };
}

function ratioOrNull(num, den) {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  return num / den;
}

export function associationFrom2x2(a, b, c, d) {
  const exposedRisk = ratioOrNull(a, a + b);
  const unexposedRisk = ratioOrNull(c, c + d);
  const or = b * c === 0 ? null : (a * d) / (b * c);
  const rr =
    exposedRisk == null || unexposedRisk == null || unexposedRisk === 0
      ? null
      : exposedRisk / unexposedRisk;
  const ar =
    exposedRisk == null || unexposedRisk == null ? null : exposedRisk - unexposedRisk;
  return { or, rr, ar, exposedRisk, unexposedRisk };
}

export function screeningFrom2x2(a, b, c, d) {
  return {
    sensitivity: ratioOrNull(a, a + c),
    specificity: ratioOrNull(d, b + d),
    ppv: ratioOrNull(a, a + b),
    npv: ratioOrNull(d, c + d),
  };
}

export function analyzeTwoByTwo(a, b, c, d, { yates = false } = {}) {
  const chi = chiSquare2x2(a, b, c, d, { yates });
  if (chi.error) return chi;
  return {
    ...chi,
    ...associationFrom2x2(a, b, c, d),
    ...screeningFrom2x2(a, b, c, d),
  };
}

export function formatRatio(value, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "NA";
  return value.toFixed(digits);
}

export function formatPercent(value, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "NA";
  return `${(value * 100).toFixed(digits)}%`;
}
