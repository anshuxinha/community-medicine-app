# -*- coding: utf-8 -*-
import json
from pathlib import Path

SEED = Path(r"D:\The App\src\data\topicIllustrations.seed.json")

NEW = [
    {
        "contentKey": "theory:26-1",
        "section": "theory",
        "topicId": "26-1",
        "topicTitle": "Introduction to Biostatistics, Types of Data, Variables, and Scales of Measurement",
        "images": [
            {
                "id": "bs-26-1-data-types",
                "fileName": "bs_26_1_data_types.png",
                "alt": "Types of data: qualitative versus quantitative, then discrete versus continuous",
                "caption": "",
                "purpose": "Stops the common mix-up of qualitative with discrete and quantitative with continuous.",
                "anchorText": "DATA AND VARIABLES",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-1-iron-scales",
                "fileName": "bs_26_1_iron_scales.png",
                "alt": "I.R.O.N. scales of measurement: interval, ratio, ordinal, nominal",
                "caption": "",
                "purpose": "Four-tile recall board for which average and which test family fit each scale.",
                "anchorText": "SCALES OF MEASUREMENT (I.R.O.N. SCALE)",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-2",
        "section": "theory",
        "topicId": "26-2",
        "topicTitle": "Presentation of Statistical Data",
        "images": [
            {
                "id": "bs-26-2-bar-vs-histogram",
                "fileName": "bs_26_2_bar_vs_histogram.png",
                "alt": "Bar chart versus histogram: gaps and height versus no gaps and area",
                "caption": "",
                "purpose": "Classic viva contrast so students do not swap bar and histogram.",
                "anchorText": "CHARTS AND DIAGRAMS FOR QUANTITATIVE DATA",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-2-choose-diagram",
                "fileName": "bs_26_2_choose_diagram.png",
                "alt": "Which diagram to draw for each kind of statistical question",
                "caption": "",
                "purpose": "One-screen map from data type to the correct diagram.",
                "anchorText": "HOW TO CHOOSE A DIAGRAM",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-3",
        "section": "theory",
        "topicId": "26-3",
        "topicTitle": "Measures of Central Tendency and Measures of Dispersion",
        "images": [
            {
                "id": "bs-26-3-averages",
                "fileName": "bs_26_3_averages.png",
                "alt": "Mean, median, and mode on one series with an outlier",
                "caption": "",
                "purpose": "Shows why the mean is pulled by extremes while the median stays central.",
                "anchorText": "MEASURES OF CENTRAL TENDENCY (AVERAGES)",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-3-sd-vs-se",
                "fileName": "bs_26_3_sd_vs_se.png",
                "alt": "Standard deviation versus standard error of the mean",
                "caption": "",
                "purpose": "Separates scatter inside one sample from sampling variation of the mean.",
                "anchorText": "MEASURES OF DISPERSION (VARIABILITY)",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-4",
        "section": "theory",
        "topicId": "26-4",
        "topicTitle": "Z-Score, Normal Distribution Curve, and Skewness",
        "images": [
            {
                "id": "bs-26-4-normal-curve",
                "fileName": "bs_26_4_normal_curve.png",
                "alt": "Normal curve with the 68, 95, and 99.7 percent areas",
                "caption": "",
                "purpose": "Maps the 68-95-99.7 rule onto a drawn Gaussian curve.",
                "anchorText": "NORMAL DISTRIBUTION (GAUSSIAN DISTRIBUTION)",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-4-skewness",
                "fileName": "bs_26_4_skewness.png",
                "alt": "Positive and negative skew with mean, median, and mode order",
                "caption": "",
                "purpose": "Shows that the tail names the skew and that the mean is pulled toward the tail.",
                "anchorText": "SKEWNESS (ASYMMETRY)",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-5",
        "section": "theory",
        "topicId": "26-5",
        "topicTitle": "Hypothesis Testing, P-Value, Errors, Power of a Test, and Confidence Intervals",
        "images": [
            {
                "id": "bs-26-5-errors",
                "fileName": "bs_26_5_errors.png",
                "alt": "Type I and Type II error table with power",
                "caption": "",
                "purpose": "One 2 by 2 board for alpha, beta, and power.",
                "anchorText": "STATISTICAL ERRORS",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-5-ci",
                "fileName": "bs_26_5_ci.png",
                "alt": "Confidence interval as mean plus or minus Z times standard error",
                "caption": "",
                "purpose": "Shows 68, 95, and 99 percent intervals on one line.",
                "anchorText": "CONFIDENCE INTERVALS (CI)",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-6",
        "section": "theory",
        "topicId": "26-6",
        "topicTitle": "Tests of Statistical Significance",
        "images": [
            {
                "id": "bs-26-6-which-test",
                "fileName": "bs_26_6_which_test.png",
                "alt": "Which statistical test to use for means, ranks, or categories",
                "caption": "",
                "purpose": "Exam decision board for t, ANOVA, Z, rank tests, and chi-square.",
                "anchorText": "WHICH TEST WHEN",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-6-chi-square",
                "fileName": "bs_26_6_chi_square.png",
                "alt": "Chi-square 2 by 2 vaccine table with the 3.84 rule",
                "caption": "",
                "purpose": "Formula, expected-count idea, and a worked 2 by 2 conclusion.",
                "anchorText": "CHI-SQUARE TEST",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-7",
        "section": "theory",
        "topicId": "26-7",
        "topicTitle": "Probability, Correlation, and Regression",
        "images": [
            {
                "id": "bs-26-7-probability-laws",
                "fileName": "bs_26_7_probability_laws.png",
                "alt": "Multiplication and addition laws of probability",
                "caption": "",
                "purpose": "AND multiplies when independent. OR adds when exclusive.",
                "anchorText": "LAWS OF PROBABILITY",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-7-correlation",
                "fileName": "bs_26_7_correlation.png",
                "alt": "Positive, negative, and no linear correlation on three scatter plots",
                "caption": "",
                "purpose": "Scatter first: direction and tightness, not causation.",
                "anchorText": "CORRELATION",
                "placement": "after",
                "aspectRatio": 1,
            },
            {
                "id": "bs-26-7-regression",
                "fileName": "bs_26_7_regression.png",
                "alt": "Regression line Y equals a plus bX with slope and intercept labelled",
                "caption": "",
                "purpose": "Shows prediction of one variable from another.",
                "anchorText": "REGRESSION",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-8",
        "section": "theory",
        "topicId": "26-8",
        "topicTitle": "Sampling, Census, and Notifiable Diseases",
        "images": [
            {
                "id": "bs-26-8-sampling",
                "fileName": "bs_26_8_sampling.png",
                "alt": "Probability versus non-probability sampling methods",
                "caption": "",
                "purpose": "MSC SMS probability methods versus convenience, quota, snowball, and purposive.",
                "anchorText": "TYPES OF SAMPLING",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
    {
        "contentKey": "theory:26-9",
        "section": "theory",
        "topicId": "26-9",
        "topicTitle": "Designing and Methodology of a Study",
        "images": [
            {
                "id": "bs-26-9-design-steps",
                "fileName": "bs_26_9_design_steps.png",
                "alt": "Eight steps in designing a medical study",
                "caption": "",
                "purpose": "Process board from problem definition through conclusion.",
                "anchorText": "STEPS IN METHODOLOGY AND DESIGNING",
                "placement": "after",
                "aspectRatio": 1,
            },
        ],
    },
]


def main() -> None:
    data = json.loads(SEED.read_text(encoding="utf-8"))
    cleaned = [e for e in data if str(e.get("topicId")) not in {str(i) for i in range(26, 27)} and e.get("contentKey") not in {n["contentKey"] for n in NEW}]
    # Also drop any leftover 26-4 duplicates
    cleaned = [e for e in cleaned if e.get("topicId") != "26-4" and e.get("contentKey") != "theory:26-4"]
    cleaned.extend(NEW)
    SEED.write_text(json.dumps(cleaned, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("seed entries", len(cleaned), "biostats", sum(1 for e in cleaned if str(e.get("topicId", "")).startswith("26")))


if __name__ == "__main__":
    main()
