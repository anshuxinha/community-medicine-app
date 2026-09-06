/**
 * ICMR-NIN 2020 EAR / RDA and calculation engines for the Dietary Survey tool.
 * Adequacy is judged against RDA. EAR is shown in tables for information.
 * Energy values are Estimated Energy Requirements (there is no energy RDA).
 * Consumption units are energy ratios vs the sedentary adult man (2110 kcal = 1.0 CU).
 */

const REF_MAN_KCAL = 2110;
const REF_MAN_PROTEIN_EAR = 42.9;
const REF_MAN_PROTEIN_RDA = 54.0;

function cuFromKcal(kcal) {
  return Math.round((kcal / REF_MAN_KCAL) * 10) / 10;
}

export const REFERENCE_PROFILES = {
  man_sedentary: {
    id: "man_sedentary",
    category: "Adult male",
    label: "Adult male, sedentary (65 kg)",
    kcal: 2110,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 25,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: 1.0,
  },
  man_moderate: {
    id: "man_moderate",
    category: "Adult male",
    label: "Adult male, moderate work (65 kg)",
    kcal: 2710,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: cuFromKcal(2710),
  },
  man_heavy: {
    id: "man_heavy",
    category: "Adult male",
    label: "Adult male, heavy work (65 kg)",
    kcal: 3470,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 40,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: cuFromKcal(3470),
  },
  woman_sedentary: {
    id: "woman_sedentary",
    category: "Adult female",
    label: "Adult female, sedentary (55 kg)",
    kcal: 1660,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 20,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 29,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(1660),
  },
  woman_moderate: {
    id: "woman_moderate",
    category: "Adult female",
    label: "Adult female, moderate work (55 kg)",
    kcal: 2130,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 25,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 29,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(2130),
  },
  woman_heavy: {
    id: "woman_heavy",
    category: "Adult female",
    label: "Adult female, heavy work (55 kg)",
    kcal: 2720,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 29,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(2720),
  },
  preg_2nd_sedentary: {
    id: "preg_2nd_sedentary",
    category: "Pregnancy",
    label: "Pregnant woman, 2nd trimester, sedentary (+350 kcal, +9.5 g protein)",
    kcal: 2010,
    proteinEar: 43.9,
    proteinRda: 55.2,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2010),
  },
  preg_2nd_moderate: {
    id: "preg_2nd_moderate",
    category: "Pregnancy",
    label: "Pregnant woman, 2nd trimester, moderate (+350 kcal, +9.5 g protein)",
    kcal: 2480,
    proteinEar: 43.9,
    proteinRda: 55.2,
    visibleFat: 35,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2480),
  },
  preg_3rd_sedentary: {
    id: "preg_3rd_sedentary",
    category: "Pregnancy",
    label: "Pregnant woman, 3rd trimester, sedentary (+350 kcal, +22 g protein)",
    kcal: 2010,
    proteinEar: 53.9,
    proteinRda: 67.7,
    visibleFat: 30,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2010),
  },
  preg_3rd_moderate: {
    id: "preg_3rd_moderate",
    category: "Pregnancy",
    label: "Pregnant woman, 3rd trimester, moderate (+350 kcal, +22 g protein)",
    kcal: 2480,
    proteinEar: 53.9,
    proteinRda: 67.7,
    visibleFat: 35,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 27,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 480,
    folateRda: 570,
    cu: cuFromKcal(2480),
  },
  lact_0_6m: {
    id: "lact_0_6m",
    category: "Lactation",
    label: "Lactating mother, 0 to 6 months (+600 kcal, +16.9 g protein)",
    kcal: 2260,
    proteinEar: 49.9,
    proteinRda: 62.6,
    visibleFat: 30,
    calciumEar: 1000,
    calciumRda: 1200,
    ironEar: 16,
    ironRda: 23,
    vitCEar: 95,
    vitCRda: 115,
    folateEar: 280,
    folateRda: 330,
    cu: cuFromKcal(2260),
  },
  lact_7_12m: {
    id: "lact_7_12m",
    category: "Lactation",
    label: "Lactating mother, 7 to 12 months (+520 kcal, +13.2 g protein)",
    kcal: 2180,
    proteinEar: 46.9,
    proteinRda: 58.9,
    visibleFat: 30,
    calciumEar: 1000,
    calciumRda: 1200,
    ironEar: 16,
    ironRda: 23,
    vitCEar: 95,
    vitCRda: 115,
    folateEar: 280,
    folateRda: 330,
    cu: cuFromKcal(2180),
  },
  infant_0_6m: {
    id: "infant_0_6m",
    category: "Infants and children",
    label: "Infant, 0 to 6 months (breastmilk reference; not a household-pot diet)",
    kcal: 530,
    proteinEar: 6.7,
    proteinRda: 8.1,
    visibleFat: 0,
    calciumEar: 240,
    calciumRda: 300,
    ironEar: 0.2,
    ironRda: 0.4,
    vitCEar: 16,
    vitCRda: 20,
    folateEar: 20,
    folateRda: 25,
    cu: 0.0,
  },
  infant_6_12m: {
    id: "infant_6_12m",
    category: "Infants and children",
    label: "Infant, 6 to 12 months (complementary feeding)",
    kcal: 660,
    proteinEar: 8.8,
    proteinRda: 10.5,
    visibleFat: 25,
    calciumEar: 240,
    calciumRda: 300,
    ironEar: 2,
    ironRda: 3,
    vitCEar: 24,
    vitCRda: 30,
    folateEar: 68,
    folateRda: 85,
    cu: cuFromKcal(660),
  },
  child_1_3y: {
    id: "child_1_3y",
    category: "Infants and children",
    label: "Child, 1 to 3 years",
    kcal: 1110,
    proteinEar: 10.2,
    proteinRda: 12.5,
    visibleFat: 25,
    calciumEar: 400,
    calciumRda: 500,
    ironEar: 6,
    ironRda: 8,
    vitCEar: 24,
    vitCRda: 30,
    folateEar: 97,
    folateRda: 120,
    cu: cuFromKcal(1110),
  },
  child_4_6y: {
    id: "child_4_6y",
    category: "Infants and children",
    label: "Child, 4 to 6 years",
    kcal: 1360,
    proteinEar: 12.8,
    proteinRda: 15.9,
    visibleFat: 25,
    calciumEar: 450,
    calciumRda: 550,
    ironEar: 8,
    ironRda: 11,
    vitCEar: 27,
    vitCRda: 35,
    folateEar: 111,
    folateRda: 135,
    cu: cuFromKcal(1360),
  },
  child_7_9y: {
    id: "child_7_9y",
    category: "Infants and children",
    label: "Child, 7 to 9 years",
    kcal: 1700,
    proteinEar: 19.0,
    proteinRda: 23.3,
    visibleFat: 30,
    calciumEar: 500,
    calciumRda: 650,
    ironEar: 10,
    ironRda: 15,
    vitCEar: 36,
    vitCRda: 45,
    folateEar: 142,
    folateRda: 170,
    cu: cuFromKcal(1700),
  },
  adol_boys_10_12: {
    id: "adol_boys_10_12",
    category: "Adolescents",
    label: "Adolescent boy, 10 to 12 years",
    kcal: 2220,
    proteinEar: 26.2,
    proteinRda: 31.8,
    visibleFat: 35,
    calciumEar: 650,
    calciumRda: 850,
    ironEar: 12,
    ironRda: 16,
    vitCEar: 45,
    vitCRda: 55,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(2220),
  },
  adol_girls_10_12: {
    id: "adol_girls_10_12",
    category: "Adolescents",
    label: "Adolescent girl, 10 to 12 years",
    kcal: 2060,
    proteinEar: 26.6,
    proteinRda: 32.8,
    visibleFat: 35,
    calciumEar: 650,
    calciumRda: 850,
    ironEar: 16,
    ironRda: 28,
    vitCEar: 40,
    vitCRda: 50,
    folateEar: 180,
    folateRda: 225,
    cu: cuFromKcal(2060),
  },
  adol_boys_13_15: {
    id: "adol_boys_13_15",
    category: "Adolescents",
    label: "Adolescent boy, 13 to 15 years",
    kcal: 2860,
    proteinEar: 36.4,
    proteinRda: 44.9,
    visibleFat: 45,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 15,
    ironRda: 22,
    vitCEar: 56,
    vitCRda: 70,
    folateEar: 230,
    folateRda: 285,
    cu: cuFromKcal(2860),
  },
  adol_girls_13_15: {
    id: "adol_girls_13_15",
    category: "Adolescents",
    label: "Adolescent girl, 13 to 15 years",
    kcal: 2400,
    proteinEar: 34.7,
    proteinRda: 43.2,
    visibleFat: 40,
    calciumEar: 800,
    calciumRda: 1000,
    ironEar: 21,
    ironRda: 30,
    vitCEar: 52,
    vitCRda: 65,
    folateEar: 196,
    folateRda: 245,
    cu: cuFromKcal(2400),
  },
  adol_boys_16_18: {
    id: "adol_boys_16_18",
    category: "Adolescents",
    label: "Adolescent boy, 16 to 18 years",
    kcal: 3320,
    proteinEar: 45.1,
    proteinRda: 55.4,
    visibleFat: 50,
    calciumEar: 800,
    calciumRda: 1050,
    ironEar: 18,
    ironRda: 26,
    vitCEar: 68,
    vitCRda: 85,
    folateEar: 270,
    folateRda: 340,
    cu: cuFromKcal(3320),
  },
  adol_girls_16_18: {
    id: "adol_girls_16_18",
    category: "Adolescents",
    label: "Adolescent girl, 16 to 18 years",
    kcal: 2500,
    proteinEar: 37.3,
    proteinRda: 46.2,
    visibleFat: 35,
    calciumEar: 800,
    calciumRda: 1050,
    ironEar: 22,
    ironRda: 32,
    vitCEar: 56,
    vitCRda: 70,
    folateEar: 216,
    folateRda: 270,
    cu: cuFromKcal(2500),
  },
  elderly_man: {
    id: "elderly_man",
    category: "Elderly (60 y and above)",
    label: "Elderly male, sedentary (60 y and above)",
    kcal: 1700,
    proteinEar: 42.9,
    proteinRda: 54.0,
    visibleFat: 25,
    calciumEar: 800,
    calciumRda: 1200,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 65,
    vitCRda: 80,
    folateEar: 250,
    folateRda: 300,
    cu: cuFromKcal(1700),
  },
  elderly_woman: {
    id: "elderly_woman",
    category: "Elderly (60 y and above)",
    label: "Elderly female, sedentary (60 y and above)",
    kcal: 1500,
    proteinEar: 36.3,
    proteinRda: 45.7,
    visibleFat: 20,
    calciumEar: 800,
    calciumRda: 1200,
    ironEar: 11,
    ironRda: 19,
    vitCEar: 55,
    vitCRda: 65,
    folateEar: 180,
    folateRda: 220,
    cu: cuFromKcal(1500),
  },
};

/** Extra ICMR-NIN 2020 EAR/RDA (summary tables). Vitamin D stored as µg (400 IU = 10 µg). */
const MICRO_REQ = {
  man_sedentary: {
    magnesiumEar: 370, magnesiumRda: 440, zincEar: 14.1, zincRda: 17,
    thiamineEar: 1.2, thiamineRda: 1.4, riboflavinEar: 1.6, riboflavinRda: 2.0,
    niacinEar: 12, niacinRda: 14, vitB6Ear: 1.6, vitB6Rda: 1.9,
    vitaminAEar: 460, vitaminARda: 1000, vitaminDEar: 10, vitaminDRda: 15,
  },
  man_moderate: {
    magnesiumEar: 370, magnesiumRda: 440, zincEar: 14.1, zincRda: 17,
    thiamineEar: 1.5, thiamineRda: 1.8, riboflavinEar: 2.1, riboflavinRda: 2.5,
    niacinEar: 15, niacinRda: 18, vitB6Ear: 2.1, vitB6Rda: 2.4,
    vitaminAEar: 460, vitaminARda: 1000, vitaminDEar: 10, vitaminDRda: 15,
  },
  man_heavy: {
    magnesiumEar: 370, magnesiumRda: 440, zincEar: 14.1, zincRda: 17,
    thiamineEar: 1.9, thiamineRda: 2.3, riboflavinEar: 2.7, riboflavinRda: 3.2,
    niacinEar: 19, niacinRda: 23, vitB6Ear: 2.6, vitB6Rda: 3.1,
    vitaminAEar: 460, vitaminARda: 1000, vitaminDEar: 10, vitaminDRda: 15,
  },
  woman_sedentary: {
    magnesiumEar: 310, magnesiumRda: 370, zincEar: 11.0, zincRda: 13.2,
    thiamineEar: 1.1, thiamineRda: 1.4, riboflavinEar: 1.6, riboflavinRda: 1.9,
    niacinEar: 9, niacinRda: 11, vitB6Ear: 1.6, vitB6Rda: 1.9,
    vitaminAEar: 390, vitaminARda: 840, vitaminDEar: 10, vitaminDRda: 15,
  },
  woman_moderate: {
    magnesiumEar: 310, magnesiumRda: 370, zincEar: 11.0, zincRda: 13.2,
    thiamineEar: 1.4, thiamineRda: 1.7, riboflavinEar: 2.0, riboflavinRda: 2.4,
    niacinEar: 12, niacinRda: 14, vitB6Ear: 1.6, vitB6Rda: 1.9,
    vitaminAEar: 390, vitaminARda: 840, vitaminDEar: 10, vitaminDRda: 15,
  },
  woman_heavy: {
    magnesiumEar: 310, magnesiumRda: 370, zincEar: 11.0, zincRda: 13.2,
    thiamineEar: 1.8, thiamineRda: 2.2, riboflavinEar: 2.6, riboflavinRda: 3.1,
    niacinEar: 15, niacinRda: 18, vitB6Ear: 2.1, vitB6Rda: 2.4,
    vitaminAEar: 390, vitaminARda: 840, vitaminDEar: 10, vitaminDRda: 15,
  },
  preg_2nd_sedentary: {
    magnesiumEar: 370, magnesiumRda: 440, zincEar: 12.0, zincRda: 14.5,
    thiamineEar: 1.6, thiamineRda: 2.0, riboflavinEar: 2.3, riboflavinRda: 2.7,
    niacinEar: 11, niacinRda: 13, vitB6Ear: 1.9, vitB6Rda: 2.3,
    vitaminAEar: 406, vitaminARda: 900, vitaminDEar: 10, vitaminDRda: 15,
  },
  child_1_3y: {
    magnesiumEar: 73, magnesiumRda: 90, zincEar: 2.8, zincRda: 3.3,
    thiamineEar: 0.6, thiamineRda: 0.7, riboflavinEar: 0.8, riboflavinRda: 1.1,
    niacinEar: 6, niacinRda: 7, vitB6Ear: 0.8, vitB6Rda: 0.9,
    vitaminAEar: 180, vitaminARda: 390, vitaminDEar: 10, vitaminDRda: 15,
  },
  child_4_6y: {
    magnesiumEar: 104, magnesiumRda: 125, zincEar: 3.7, zincRda: 4.5,
    thiamineEar: 0.8, thiamineRda: 0.9, riboflavinEar: 1.1, riboflavinRda: 1.3,
    niacinEar: 8, niacinRda: 9, vitB6Ear: 1.1, vitB6Rda: 1.2,
    vitaminAEar: 240, vitaminARda: 510, vitaminDEar: 10, vitaminDRda: 15,
  },
  child_7_9y: {
    magnesiumEar: 144, magnesiumRda: 175, zincEar: 4.9, zincRda: 5.9,
    thiamineEar: 1.0, thiamineRda: 1.1, riboflavinEar: 1.3, riboflavinRda: 1.6,
    niacinEar: 10, niacinRda: 11, vitB6Ear: 1.3, vitB6Rda: 1.5,
    vitaminAEar: 290, vitaminARda: 630, vitaminDEar: 10, vitaminDRda: 15,
  },
  adol_boys_10_12: {
    magnesiumEar: 199, magnesiumRda: 240, zincEar: 7.0, zincRda: 8.5,
    thiamineEar: 1.3, thiamineRda: 1.5, riboflavinEar: 1.7, riboflavinRda: 2.1,
    niacinEar: 12, niacinRda: 15, vitB6Ear: 1.7, vitB6Rda: 1.9,
    vitaminAEar: 360, vitaminARda: 770, vitaminDEar: 10, vitaminDRda: 15,
  },
  adol_girls_10_12: {
    magnesiumEar: 207, magnesiumRda: 250, zincEar: 7.1, zincRda: 8.5,
    thiamineEar: 1.2, thiamineRda: 1.4, riboflavinEar: 1.6, riboflavinRda: 1.9,
    niacinEar: 12, niacinRda: 14, vitB6Ear: 1.6, vitB6Rda: 1.9,
    vitaminAEar: 370, vitaminARda: 790, vitaminDEar: 10, vitaminDRda: 15,
  },
  adol_boys_13_15: {
    magnesiumEar: 287, magnesiumRda: 345, zincEar: 11.9, zincRda: 14.3,
    thiamineEar: 1.6, thiamineRda: 1.9, riboflavinEar: 2.2, riboflavinRda: 2.7,
    niacinEar: 16, niacinRda: 19, vitB6Ear: 2.2, vitB6Rda: 2.6,
    vitaminAEar: 430, vitaminARda: 930, vitaminDEar: 10, vitaminDRda: 15,
  },
  adol_girls_13_15: {
    magnesiumEar: 282, magnesiumRda: 340, zincEar: 10.7, zincRda: 12.8,
    thiamineEar: 1.3, thiamineRda: 1.6, riboflavinEar: 1.9, riboflavinRda: 2.2,
    niacinEar: 13, niacinRda: 16, vitB6Ear: 1.8, vitB6Rda: 2.2,
    vitaminAEar: 420, vitaminARda: 890, vitaminDEar: 10, vitaminDRda: 15,
  },
  adol_boys_16_18: {
    magnesiumEar: 367, magnesiumRda: 440, zincEar: 14.7, zincRda: 17.6,
    thiamineEar: 1.9, thiamineRda: 2.2, riboflavinEar: 2.5, riboflavinRda: 3.1,
    niacinEar: 19, niacinRda: 22, vitB6Ear: 2.5, vitB6Rda: 3.0,
    vitaminAEar: 480, vitaminARda: 1000, vitaminDEar: 10, vitaminDRda: 15,
  },
  adol_girls_16_18: {
    magnesiumEar: 317, magnesiumRda: 350, zincEar: 11.8, zincRda: 14.2,
    thiamineEar: 1.4, thiamineRda: 1.7, riboflavinEar: 1.9, riboflavinRda: 2.3,
    niacinEar: 14, niacinRda: 17, vitB6Ear: 1.9, vitB6Rda: 2.3,
    vitaminAEar: 400, vitaminARda: 860, vitaminDEar: 10, vitaminDRda: 15,
  },
  infant_0_6m: {
    magnesiumEar: null, magnesiumRda: 30, zincEar: null, zincRda: null,
    thiamineEar: null, thiamineRda: 0.2, riboflavinEar: null, riboflavinRda: 0.4,
    niacinEar: null, niacinRda: 2, vitB6Ear: null, vitB6Rda: 0.1,
    vitaminAEar: null, vitaminARda: 350, vitaminDEar: 10, vitaminDRda: 10,
  },
  infant_6_12m: {
    magnesiumEar: null, magnesiumRda: 75, zincEar: 2.1, zincRda: 2.5,
    thiamineEar: null, thiamineRda: 0.4, riboflavinEar: null, riboflavinRda: 0.6,
    niacinEar: null, niacinRda: 5, vitB6Ear: null, vitB6Rda: 0.6,
    vitaminAEar: 170, vitaminARda: 350, vitaminDEar: 10, vitaminDRda: 10,
  },
  lact_0_6m: {
    magnesiumEar: 335, magnesiumRda: 400, zincEar: 11.8, zincRda: 14.1,
    thiamineEar: 1.7, thiamineRda: 2.1, riboflavinEar: 2.5, riboflavinRda: 3.0,
    niacinEar: 13, niacinRda: 16, vitB6Ear: 1.8, vitB6Rda: 2.2,
    vitaminAEar: 720, vitaminARda: 950, vitaminDEar: 10, vitaminDRda: 15,
  },
  lact_7_12m: {
    magnesiumEar: 335, magnesiumRda: 400, zincEar: 11.8, zincRda: 14.1,
    thiamineEar: 1.7, thiamineRda: 2.1, riboflavinEar: 2.4, riboflavinRda: 2.9,
    niacinEar: 13, niacinRda: 16, vitB6Ear: 1.8, vitB6Rda: 2.1,
    vitaminAEar: 720, vitaminARda: 950, vitaminDEar: 10, vitaminDRda: 15,
  },
};
MICRO_REQ.preg_2nd_moderate = { ...MICRO_REQ.preg_2nd_sedentary };
MICRO_REQ.preg_3rd_sedentary = { ...MICRO_REQ.preg_2nd_sedentary };
MICRO_REQ.preg_3rd_moderate = { ...MICRO_REQ.preg_2nd_sedentary };
MICRO_REQ.elderly_man = { ...MICRO_REQ.man_sedentary, vitaminDRda: 20 };
MICRO_REQ.elderly_woman = { ...MICRO_REQ.woman_sedentary, vitaminDRda: 20 };

Object.keys(REFERENCE_PROFILES).forEach((id) => {
  if (MICRO_REQ[id]) Object.assign(REFERENCE_PROFILES[id], MICRO_REQ[id]);
});

export const MEAL_SLOTS = [
  { id: "early_morning", title: "Early morning", icon: "weather-sunset", tip: "Tea calories come from the milk and sugar you log" },
  { id: "breakfast", title: "Breakfast", icon: "egg", tip: "Roti, poha, idli, egg, milk" },
  { id: "mid_morning", title: "Mid-morning", icon: "fruit-cherries", tip: "Fruit, roasted chana, buttermilk" },
  { id: "lunch", title: "Lunch", icon: "food-drumstick", tip: "Cereal, dal, sabzi, curd. Log the cooking oil." },
  { id: "evening_snack", title: "Evening tea and snacks", icon: "coffee", tip: "Tea (milk + sugar), roasted snacks" },
  { id: "dinner", title: "Dinner", icon: "silverware-fork-knife", tip: "Roti, rice, dal, cooked vegetables" },
  { id: "bedtime", title: "Bedtime", icon: "cup", tip: "Milk if taken" },
];

export const CU_COEFFICIENT_OPTIONS = [
  { label: "Adult male, sedentary (1.0 CU)", cu: 1.0 },
  { label: "Adult male, moderate (1.3 CU)", cu: 1.3 },
  { label: "Adult male, heavy (1.6 CU)", cu: 1.6 },
  { label: "Adult female, sedentary (0.8 CU)", cu: 0.8 },
  { label: "Adult female, moderate (1.0 CU)", cu: 1.0 },
  { label: "Adult female, heavy (1.3 CU)", cu: 1.3 },
  { label: "Pregnant, sedentary (1.0 CU)", cu: 1.0 },
  { label: "Pregnant, moderate (1.2 CU)", cu: 1.2 },
  { label: "Lactating, 0 to 6 months (1.1 CU)", cu: 1.1 },
  { label: "Lactating, 7 to 12 months (1.0 CU)", cu: 1.0 },
  { label: "Elderly male, sedentary (0.8 CU)", cu: 0.8 },
  { label: "Elderly female, sedentary (0.7 CU)", cu: 0.7 },
  { label: "Adolescent boy, 16 to 18 y (1.6 CU)", cu: 1.6 },
  { label: "Adolescent girl, 16 to 18 y (1.2 CU)", cu: 1.2 },
  { label: "Adolescent boy, 13 to 15 y (1.4 CU)", cu: 1.4 },
  { label: "Adolescent girl, 13 to 15 y (1.1 CU)", cu: 1.1 },
  { label: "Adolescent boy, 10 to 12 y (1.1 CU)", cu: 1.1 },
  { label: "Adolescent girl, 10 to 12 y (1.0 CU)", cu: 1.0 },
  { label: "Child, 7 to 9 y (0.8 CU)", cu: 0.8 },
  { label: "Child, 4 to 6 y (0.6 CU)", cu: 0.6 },
  { label: "Child, 1 to 3 y (0.5 CU)", cu: 0.5 },
  { label: "Infant, 6 to 12 months (0.3 CU)", cu: 0.3 },
  { label: "Infant, 0 to 6 months, not sharing the pot (0.0 CU)", cu: 0.0 },
];

/** ICMR-NIN My Plate for the Day, 2024 (2000 kcal). Vegetable split follows the 2024 guideline note. */
export const BALANCED_DIET_PER_CU = [
  { key: "cereals", label: "Cereals and millets", unit: "g", target: 250 },
  { key: "pulses", label: "Pulses", unit: "g", target: 85 },
  { key: "milk", label: "Milk and curd", unit: "ml", target: 300 },
  { key: "glv", label: "Green leafy vegetables", unit: "g", target: 100 },
  { key: "otherVeg", label: "Other vegetables", unit: "g", target: 250 },
  { key: "tubers", label: "Roots and tubers", unit: "g", target: 50 },
  { key: "fruits", label: "Fruits", unit: "g", target: 100 },
  { key: "nuts", label: "Nuts and oilseeds", unit: "g", target: 35 },
  { key: "oil", label: "Visible fat (oil / ghee)", unit: "g", target: 27 },
  { key: "sugar", label: "Sugar", unit: "g", target: 25 },
];

/** Per 100 g (or 100 ml milk). Cereals/pulses are IFCT blends. Oil uses Atwater 9 kcal/g. */
export const FAMILY_STAPLE_YIELDS = {
  cereals: { kcal: 338, protein: 9.26, fat: 1.03 },
  pulses: { kcal: 329, protein: 22.38, fat: 2.74 },
  oil: { kcal: 900, protein: 0, fat: 100 },
  milk: { kcal: 73, protein: 3.26, fat: 4.48 },
  sugar: { kcal: 400, protein: 0, fat: 0 },
  glv: { kcal: 24, protein: 2.14, fat: 0.64 },
  otherVeg: { kcal: 19, protein: 1.12, fat: 0.2 },
  tubers: { kcal: 70, protein: 1.54, fat: 0.23 },
  fruits: { kcal: 58, protein: 1.12, fat: 0.26 },
  nuts: { kcal: 520, protein: 23.65, fat: 39.63 },
};

export const FOOD_CATEGORIES = [
  "All",
  "Cereals & Millets",
  "Pulses & Legumes",
  "Green Leafy Vegetables",
  "Roots & Tubers",
  "Other Vegetables",
  "Fruits",
  "Milk & Dairy",
  "Egg & Meat",
  "Nuts & Oilseeds",
  "Fats & Oils",
  "Sugars & Sweets",
  "Cooked Snacks",
];

/** Common field names that should hit the IFCT food, including Hindi household terms. */
export const FOOD_SEARCH_ALIASES = {
  wheat_atta: ["roti", "chapati", "chapatti", "phulka", "paratha", "wheat", "atta", "whole wheat"],
  rice_raw: ["chawal", "bhat", "white rice", "plain rice"],
  rice_parboiled: ["sella", "ukda", "converted rice"],
  poha: ["flattened rice", "beaten rice", "chiwda", "aval"],
  murmura: ["puffed rice", "muri", "murmure"],
  ragi: ["finger millet", "nachni", "mandua"],
  bajra: ["pearl millet"],
  jowar: ["sorghum", "jola", "bhakri"],
  suji: ["rava", "semolina", "upma"],
  maida: ["refined flour", "naan", "bhatura"],
  dal_toor: ["arhar", "tuvar", "toor", "pigeon pea", "dal"],
  dal_moong: ["moong", "yellow dal", "dal"],
  moong_whole: ["green gram", "sabut moong"],
  dal_chana: ["chana dal", "split chickpea", "dal"],
  kala_chana: ["sattu", "chickpea", "bengal gram", "chole", "chana"],
  dal_masoor: ["masoor", "lentil", "red lentil", "dal"],
  dal_urad: ["urad", "black gram", "idli dal", "dal"],
  rajma: ["kidney beans", "red beans"],
  soya_bean: ["soy", "soya", "soya chunks"],
  besan: ["gram flour", "chickpea flour", "besan"],
  spinach: ["palak"],
  methi_leaves: ["fenugreek", "methi"],
  drumstick_leaves: ["moringa", "sahjan", "munagaku"],
  mustard_leaves: ["sarson", "saag"],
  amaranth_leaves: ["chaulai"],
  potato: ["aloo"],
  onion: ["pyaz", "pyaaz"],
  carrot: ["gajar"],
  sweet_potato: ["shakarkand"],
  tomato: ["tamatar"],
  cauliflower: ["gobhi", "phool gobhi", "gobi"],
  cabbage: ["patta gobhi", "patta gobi"],
  bhindi: ["okra", "ladyfinger", "lady finger"],
  lauki: ["bottle gourd", "ghiya", "doodhi"],
  green_peas: ["matar", "peas"],
  brinjal: ["baingan", "eggplant", "aubergine"],
  cucumber: ["kheera", "kakdi"],
  banana: ["kela"],
  guava: ["amrood", "amrud"],
  amla: ["gooseberry", "awla", "nellikai", "usiri"],
  orange: ["santra", "narangi"],
  papaya: ["papita"],
  mango: ["aam"],
  apple: ["seb"],
  lemon_juice: ["nimbu", "lime", "lemon"],
  milk_cow: ["doodh", "cow milk", "milk"],
  milk_buffalo: ["buffalo milk", "doodh"],
  curd_dahi: ["dahi", "yogurt", "yoghurt", "buttermilk", "chhach", "chaas"],
  paneer: ["cottage cheese"],
  cooking_oil: ["mustard oil", "tel", "oil", "refined oil", "sunflower oil"],
  ghee: ["desi ghee", "clarified butter"],
  egg_whole: ["anda", "boiled egg", "egg"],
  egg_white: ["egg white", "anda"],
  chicken_lean: ["murgi", "chicken"],
  fish_rohu: ["machli", "fish", "katla"],
  mutton: ["bakra", "goat", "gosht", "mutton"],
  groundnuts: ["peanut", "moongphali", "groundnut", "moongfali"],
  sesame_seeds: ["til", "gingelly", "sesame"],
  almonds: ["badam"],
  sugar: ["cheeni", "chini"],
  jaggery: ["gur", "gud"],
  snack_idli: ["idli"],
  snack_dosa: ["dosa", "dosai"],
};

const VEGETABLE_CATEGORIES = [
  "Other Vegetables",
  "Green Leafy Vegetables",
  "Roots & Tubers",
];

const CATEGORY_QUERY_ALIASES = {
  sabzi: VEGETABLE_CATEGORIES,
  subzi: VEGETABLE_CATEGORIES,
  sabji: VEGETABLE_CATEGORIES,
  vegetable: VEGETABLE_CATEGORIES,
  vegetables: VEGETABLE_CATEGORIES,
};

export const foodMatchesQuery = (food, query) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;
  const aliases = FOOD_SEARCH_ALIASES[food.id] || food.aliases || [];
  const hay = [
    food.name,
    food.category,
    food.ifctCode,
    ...aliases,
    ...(food.portions || []).map((p) => p.label),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => {
    const cats = CATEGORY_QUERY_ALIASES[t];
    if (cats && cats.includes(food.category)) return true;
    return hay.includes(t);
  });
};

export const SAMPLE_RECALL_ITEMS = [
  { id: "sample_1", mealId: "breakfast", foodId: "wheat_atta", portionId: "roti_med", quantity: "2" },
  { id: "sample_2", mealId: "breakfast", foodId: "milk_cow", portionId: "cup", quantity: "1" },
  { id: "sample_3", mealId: "breakfast", foodId: "sugar", portionId: "tsp", quantity: "1" },
  { id: "sample_4", mealId: "lunch", foodId: "rice_raw", portionId: "katori_cooked", quantity: "1" },
  { id: "sample_5", mealId: "lunch", foodId: "dal_toor", portionId: "katori_med", quantity: "1" },
  { id: "sample_6", mealId: "lunch", foodId: "potato", portionId: "katori_sabzi", quantity: "1" },
  { id: "sample_7", mealId: "lunch", foodId: "cooking_oil", portionId: "tsp", quantity: "2" },
  { id: "sample_8", mealId: "dinner", foodId: "wheat_atta", portionId: "roti_med", quantity: "2" },
  { id: "sample_9", mealId: "dinner", foodId: "dal_moong", portionId: "katori_med", quantity: "1" },
  { id: "sample_10", mealId: "dinner", foodId: "spinach", portionId: "half_katori", quantity: "1" },
  { id: "sample_11", mealId: "evening_snack", foodId: "milk_cow", portionId: "cup", quantity: "1" },
  { id: "sample_12", mealId: "evening_snack", foodId: "sugar", portionId: "tsp", quantity: "1" },
];

export const SAMPLE_FAMILY_MEMBERS = [
  { id: "m1", label: "Husband, moderate work", cu: 1.3, cuLabel: "Adult male, moderate (1.3 CU)" },
  { id: "m2", label: "Wife, pregnant 3rd trimester", cu: 1.0, cuLabel: "Pregnant, sedentary (1.0 CU)" },
  { id: "m3", label: "Child, 5 years", cu: 0.6, cuLabel: "Child, 4 to 6 y (0.6 CU)" },
  { id: "m4", label: "Grandmother, 65 years", cu: 0.7, cuLabel: "Elderly female, sedentary (0.7 CU)" },
];

export const SAMPLE_FAMILY_RATIONS = {
  cerealsKg: "30",
  pulsesKg: "4",
  oilKg: "2",
  milkL: "15",
  sugarKg: "2",
  glvKg: "3",
  otherVegKg: "9",
  tubersKg: "6",
  fruitsKg: "4",
  nutsKg: "1",
};

export const calculateAMDR = (carbsG, proteinG, fatG, totalKcal) => {
  const carbKcal = (carbsG || 0) * 4;
  const proteinKcal = (proteinG || 0) * 4;
  const fatKcal = (fatG || 0) * 9;
  const sumKcal = carbKcal + proteinKcal + fatKcal;
  const denom = sumKcal > 0 ? sumKcal : totalKcal;
  if (!denom || denom <= 0) {
    return { carbPct: 0, proteinPct: 0, fatPct: 0, sumsTo: 0 };
  }
  const carbPct = Math.round((carbKcal / denom) * 100);
  const proteinPct = Math.round((proteinKcal / denom) * 100);
  const fatPct = Math.round((fatKcal / denom) * 100);
  return { carbPct, proteinPct, fatPct, sumsTo: carbPct + proteinPct + fatPct };
};

export const calculateCerealPulseRatio = (cerealGrams, pulseGrams, milkGrams = 0) => {
  const milkG = milkGrams || 0;
  if (!pulseGrams || pulseGrams <= 0) {
    if (!cerealGrams || cerealGrams <= 0) {
      return {
        ratioNum: 0,
        ratio: "N/A",
        triple: "N/A",
        milkRatio: "N/A",
        text: "No cereals or pulses recorded",
        isBalanced: false,
      };
    }
    return {
      ratioNum: 99,
      ratio: ">15:1",
      triple: milkG > 0 ? `>15 : 1 : ${(milkG / Math.max(cerealGrams, 1)).toFixed(1)}` : ">15 : 1 : 0",
      milkRatio: "N/A",
      text: "No pulse intake (cereal-only protein)",
      isBalanced: false,
    };
  }
  const ratioNum = cerealGrams / pulseGrams;
  const ratioStr = ratioNum.toFixed(1);
  const milkRatioNum = milkG / pulseGrams;
  const milkStr = milkRatioNum.toFixed(1);
  const triple = `${ratioStr} : 1 : ${milkStr}`;
  const cerealPulseOk = ratioNum >= 2.0 && ratioNum <= 4.0;
  const milkOk = milkG > 0 && milkRatioNum >= 2.0 && milkRatioNum <= 4.0;
  const isBalanced = cerealPulseOk && milkOk;
  let text;
  if (isBalanced) {
    text = `Cereal : pulse : milk is ${triple} (target about 3 : 1 : 2.5)`;
  } else if (cerealPulseOk && milkG <= 0) {
    text = `Cereal : pulse is ${ratioStr} : 1. Add milk or curd to reach about 3 : 1 : 2.5.`;
  } else if (cerealPulseOk) {
    text = `Cereal : pulse is in range. Milk : pulse is ${milkStr} : 1 (target about 2.5 : 1).`;
  } else if (ratioNum > 4.0) {
    text = `High cereal share (${ratioStr} : 1). Target about 3 : 1, with milk.`;
  } else {
    text = `High pulse share (${ratioStr} : 1). Target about 3 : 1, with milk.`;
  }
  return {
    ratioNum: parseFloat(ratioStr),
    ratio: `${ratioStr} : 1`,
    triple,
    milkRatio: milkG > 0 ? milkStr : "0",
    text,
    isBalanced,
  };
};

export const percentDiff = (got, ref) => {
  if (ref == null || ref === 0) return null;
  return ((got - ref) / ref) * 100;
};

export const formatPct = (pct) => {
  if (pct == null || Number.isNaN(pct)) return "n/a";
  const rounded = pct.toFixed(1);
  return pct > 0 ? `+${rounded}%` : `${rounded}%`;
};

/**
 * Adequacy is judged against RDA (ICMR 2020). Energy has no RDA and uses EER.
 * EAR is accepted so callers can still display it; status uses RDA.
 */
export const intakeStatus = (got, ear, rda, { isEnergy = false, refLabel } = {}) => {
  const ref = isEnergy ? ear : rda != null ? rda : ear;
  const name = refLabel || (isEnergy ? "EER" : "RDA");
  if (ref == null || ref === 0) {
    return { key: "na", label: "n/a", color: "#64748B", pct: null };
  }
  const pct = percentDiff(got, ref);
  if (pct < -30) {
    return { key: "severe", label: `${formatPct(pct)} vs ${name}`, color: "#B91C1C", pct };
  }
  if (pct < -10) {
    return { key: "deficit", label: `${formatPct(pct)} vs ${name}`, color: "#D97706", pct };
  }
  if (isEnergy && pct > 20) {
    return { key: "surplus", label: `${formatPct(pct)} vs EER`, color: "#2563EB", pct };
  }
  if (!isEnergy && pct > 10) {
    return { key: "surplus", label: `${formatPct(pct)} (above ${name})`, color: "#2563EB", pct };
  }
  return { key: "adequate", label: `${formatPct(pct)} (meets ${name})`, color: "#15803D", pct };
};

/** Carbohydrate AMDR grams from EER (50-60% of energy at 4 kcal/g). */
export const carbGramsFromEer = (eerKcal) => ({
  at50: Math.round((0.5 * (eerKcal || 0)) / 4),
  at60: Math.round((0.6 * (eerKcal || 0)) / 4),
});

export const carbAmdrStatus = (carbPct) => {
  const pct = carbPct || 0;
  if (pct < 45) {
    return { key: "severe", label: `${pct}% vs AMDR`, color: "#B91C1C", pct };
  }
  if (pct < 50) {
    return { key: "deficit", label: `${pct}% vs AMDR`, color: "#D97706", pct };
  }
  if (pct > 65) {
    return { key: "surplus", label: `${pct}% vs AMDR`, color: "#DC2626", pct };
  }
  if (pct > 60) {
    return { key: "surplus", label: `${pct}% vs AMDR`, color: "#F59E0B", pct };
  }
  return { key: "adequate", label: `${pct}% (meets AMDR)`, color: "#15803D", pct };
};

export const MICRONUTRIENT_DEFS = [
  {
    key: "iron",
    label: "Iron",
    unit: "mg",
    gotKey: "iron",
    earKey: "ironEar",
    rdaKey: "ironRda",
    diffKey: "ironDiff",
    group: "Minerals",
    defaultVisible: true,
    gapThreshold: 3,
    decimals: 1,
    counseling: {
      title: "Iron (RDA)",
      icon: "pill",
      description: (gap) => `About ${gap.toFixed(1)} mg below iron RDA.`,
      bullets: [
        "Cook drumstick leaves, methi, or amaranth in an iron kadai.",
        "IFCT rice flakes (poha) provide about 4.5 mg iron per 100 g.",
        "Do not drink tea or coffee within 1 hour of meals.",
        "Squeeze lemon (IFCT juice, about 48 mg vitamin C per 100 g) over dal.",
      ],
    },
  },
  {
    key: "calcium",
    label: "Calcium",
    unit: "mg",
    gotKey: "calcium",
    earKey: "calciumEar",
    rdaKey: "calciumRda",
    diffKey: "calciumDiff",
    group: "Minerals",
    defaultVisible: true,
    gapThreshold: 150,
    decimals: 0,
    counseling: {
      title: "Calcium",
      icon: "bottle-tonic-plus",
      description: (gap) => `About ${Math.round(gap)} mg below calcium RDA:`,
      bullets: [
        "Ragi (IFCT: 364 mg calcium per 100 g) in roti or porridge.",
        "10 g brown gingelly (til) seeds: about 117 mg calcium.",
        "150-200 ml curd or cow milk (IFCT cow milk: 118 mg calcium per 100 ml).",
      ],
    },
  },
  {
    key: "folate",
    label: "Folate",
    unit: "µg",
    gotKey: "folate",
    earKey: "folateEar",
    rdaKey: "folateRda",
    diffKey: "folateDiff",
    group: "Vitamins",
    defaultVisible: true,
    gapThreshold: 80,
    decimals: 0,
    counseling: {
      title: "Folate",
      icon: "leaf",
      description: (gap, profile) => {
        const pregNote =
          profile.category === "Pregnancy" ? " The IFA tablet still supplies 500 µg folic acid." : "";
        return `About ${Math.round(gap)} µg below folate RDA.${pregNote}`;
      },
      bullets: [
        "Green leafy vegetables and whole pulses (rajma and Bengal gram are folate-dense in IFCT).",
      ],
    },
  },
  {
    key: "vitC",
    label: "Vitamin C",
    unit: "mg",
    gotKey: "vitC",
    earKey: "vitCEar",
    rdaKey: "vitCRda",
    diffKey: "vitCDiff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 10,
    decimals: 1,
    counseling: {
      title: "Vitamin C (RDA)",
      icon: "fruit-citrus",
      description: (gap) => `About ${gap.toFixed(1)} mg below vitamin C RDA.`,
      bullets: [
        "Amla (IFCT: 252 mg vitamin C per 100 g).",
        "Lemon or guava with meals.",
        "Squeeze lemon (IFCT juice, about 48 mg vitamin C per 100 g) over dal.",
      ],
    },
  },
  {
    key: "zinc",
    label: "Zinc",
    unit: "mg",
    gotKey: "zinc",
    earKey: "zincEar",
    rdaKey: "zincRda",
    diffKey: "zincDiff",
    group: "Minerals",
    defaultVisible: false,
    gapThreshold: 2,
    decimals: 1,
    counseling: {
      title: "Zinc (RDA)",
      icon: "circle-outline",
      description: (gap) => `About ${gap.toFixed(1)} mg below zinc RDA.`,
      bullets: [
        "Whole pulses and ground nut (IFCT ground nut: about 3.2 mg zinc per 100 g).",
        "Whole wheat atta and millets rather than polished rice only.",
      ],
    },
  },
  {
    key: "magnesium",
    label: "Magnesium",
    unit: "mg",
    gotKey: "magnesium",
    earKey: "magnesiumEar",
    rdaKey: "magnesiumRda",
    diffKey: "magnesiumDiff",
    group: "Minerals",
    defaultVisible: false,
    gapThreshold: 50,
    decimals: 0,
    counseling: {
      title: "Magnesium (RDA)",
      icon: "leaf",
      description: (gap) => `About ${Math.round(gap)} mg below magnesium RDA.`,
      bullets: [
        "Ragi and whole pulses.",
        "Green leafy vegetables and gingelly (til) seeds.",
      ],
    },
  },
  {
    key: "vitaminA",
    label: "Vitamin A",
    unit: "µg",
    gotKey: "vitaminA",
    earKey: "vitaminAEar",
    rdaKey: "vitaminARda",
    diffKey: "vitaminADiff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 150,
    decimals: 0,
    counseling: {
      title: "Vitamin A (RDA)",
      icon: "eye",
      description: (gap) => `About ${Math.round(gap)} µg below vitamin A RDA.`,
      bullets: [
        "Drumstick leaves, amaranth, or ripe mango (IFCT vitamin A as retinol equivalent).",
        "One egg or a piece of fish if the household eats animal food.",
      ],
    },
  },
  {
    key: "thiamine",
    label: "Thiamine (B1)",
    unit: "mg",
    gotKey: "thiamine",
    earKey: "thiamineEar",
    rdaKey: "thiamineRda",
    diffKey: "thiamineDiff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 0.3,
    decimals: 2,
    counseling: {
      title: "Thiamine (RDA)",
      icon: "barley",
      description: (gap) => `About ${gap.toFixed(2)} mg below thiamine RDA.`,
      bullets: [
        "Whole wheat atta and millets (IFCT atta: about 0.42 mg thiamine per 100 g).",
        "Whole pulses and ground nut.",
      ],
    },
  },
  {
    key: "riboflavin",
    label: "Riboflavin (B2)",
    unit: "mg",
    gotKey: "riboflavin",
    earKey: "riboflavinEar",
    rdaKey: "riboflavinRda",
    diffKey: "riboflavinDiff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 0.3,
    decimals: 2,
    counseling: {
      title: "Riboflavin (RDA)",
      icon: "bottle-tonic",
      description: (gap) => `About ${gap.toFixed(2)} mg below riboflavin RDA.`,
      bullets: [
        "Cow milk or curd (IFCT cow milk: about 0.11 mg riboflavin per 100 ml).",
        "Egg and green leafy vegetables.",
      ],
    },
  },
  {
    key: "niacin",
    label: "Niacin (B3)",
    unit: "mg",
    gotKey: "niacin",
    earKey: "niacinEar",
    rdaKey: "niacinRda",
    diffKey: "niacinDiff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 2,
    decimals: 1,
    counseling: {
      title: "Niacin (RDA)",
      icon: "peanut",
      description: (gap) => `About ${gap.toFixed(1)} mg below niacin RDA.`,
      bullets: [
        "Ground nut (IFCT: about 11.4 mg niacin per 100 g).",
        "Whole cereals and pulses.",
      ],
    },
  },
  {
    key: "vitB6",
    label: "Vitamin B6",
    unit: "mg",
    gotKey: "vitB6",
    earKey: "vitB6Ear",
    rdaKey: "vitB6Rda",
    diffKey: "vitB6Diff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 0.3,
    decimals: 2,
    counseling: {
      title: "Vitamin B6 (RDA)",
      icon: "food-apple",
      description: (gap) => `About ${gap.toFixed(2)} mg below vitamin B6 RDA.`,
      bullets: [
        "Banana, potato, and whole pulses.",
        "Chicken or fish if the household eats animal food.",
      ],
    },
  },
  {
    key: "vitaminD",
    label: "Vitamin D",
    unit: "µg",
    gotKey: "vitaminD",
    earKey: "vitaminDEar",
    rdaKey: "vitaminDRda",
    diffKey: "vitaminDDiff",
    group: "Vitamins",
    defaultVisible: false,
    gapThreshold: 3,
    decimals: 1,
    counseling: {
      title: "Vitamin D (RDA)",
      icon: "white-balance-sunny",
      description: (gap) => `About ${gap.toFixed(1)} µg below vitamin D RDA (15 µg is 600 IU).`,
      bullets: [
        "Egg yolk or rohu if the household eats animal food.",
        "Outdoor daylight; IFCT plant foods are a weak vitamin D source.",
      ],
    },
  },
];

export const DEFAULT_MICRO_KEYS = MICRONUTRIENT_DEFS.filter((d) => d.defaultVisible).map((d) => d.key);

export const findFood = (foods, id) => foods.find((f) => f.id === id);

export const gramsForItem = (item, food) => {
  const qty = parseFloat(item.quantity);
  if (!food || Number.isNaN(qty) || qty <= 0) return 0;
  const portion = food.portions?.find((p) => p.id === item.portionId) || { grams: 1 };
  return qty * (portion.grams || 0);
};

const factorFromFood = (food, grams) => {
  const factor = grams / 100;
  const cerealFromRecipe = food.countsAsCerealGramsPer100 ? (food.countsAsCerealGramsPer100 * grams) / 100 : 0;
  const pulseFromRecipe = food.countsAsPulseGramsPer100 ? (food.countsAsPulseGramsPer100 * grams) / 100 : 0;
  const visibleFromRecipe = food.countsAsVisibleFatPer100 ? (food.countsAsVisibleFatPer100 * grams) / 100 : 0;
  let cerealGrams = cerealFromRecipe;
  let pulseGrams = pulseFromRecipe;
  if (!cerealFromRecipe && food.category === "Cereals & Millets") cerealGrams = grams;
  if (!pulseFromRecipe && food.category === "Pulses & Legumes") pulseGrams = grams;
  const visibleFatGrams = food.visibleFat ? grams : visibleFromRecipe;
  const milkGrams = food.category === "Milk & Dairy" ? grams : 0;
  const micros = {};
  MICRONUTRIENT_DEFS.forEach((d) => {
    micros[d.gotKey] = (food[d.gotKey] || 0) * factor;
  });
  return {
    kcal: (food.calories || 0) * factor,
    protein: (food.protein || 0) * factor,
    fat: (food.fat || 0) * factor,
    carbs: (food.carbs || 0) * factor,
    ...micros,
    cerealGrams,
    pulseGrams,
    milkGrams,
    visibleFatGrams,
  };
};

export const calculateIndividualIntake = (recallItems, foods, profile) => {
  const totals = {
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    cerealGrams: 0,
    pulseGrams: 0,
    milkGrams: 0,
    visibleFatGrams: 0,
  };
  MICRONUTRIENT_DEFS.forEach((d) => {
    totals[d.gotKey] = 0;
  });
  const calculatedMealRows = [];

  for (const item of recallItems) {
    const food = findFood(foods, item.foodId);
    const grams = gramsForItem(item, food);
    if (!food || grams <= 0) continue;
    const n = factorFromFood(food, grams);
    Object.keys(totals).forEach((k) => {
      totals[k] += n[k] || 0;
    });
    const portionObj = food.portions?.find((p) => p.id === item.portionId);
    const mealObj = MEAL_SLOTS.find((m) => m.id === item.mealId);
    calculatedMealRows.push({
      ...item,
      food,
      grams,
      mealLabel: mealObj?.title || item.mealId,
      portionLabel: portionObj?.label || "Portion",
      rawEquivalent: !!portionObj?.rawEquivalent,
      ...n,
    });
  }

  if (totals.kcal <= 0 && totals.protein <= 0) {
    return null;
  }

  const amdr = calculateAMDR(totals.carbs, totals.protein, totals.fat, totals.kcal);
  const cpRatio = calculateCerealPulseRatio(totals.cerealGrams, totals.pulseGrams, totals.milkGrams);
  const lowQualityProtein = cpRatio.ratioNum > 4.5;
  const proteinEar = profile.proteinEar;
  const proteinOneGPerKg = Math.round((profile.proteinRda / 0.83) * 10) / 10;

  const kcalDiff = percentDiff(totals.kcal, profile.kcal);
  const proteinDiff = percentDiff(totals.protein, profile.proteinRda);
  const visibleFatDiff = percentDiff(totals.visibleFatGrams, profile.visibleFat);
  const microDiffs = {};
  MICRONUTRIENT_DEFS.forEach((d) => {
    microDiffs[d.diffKey] = percentDiff(totals[d.gotKey], profile[d.rdaKey]);
  });

  return {
    ...totals,
    kcalDiff,
    proteinDiff,
    ...microDiffs,
    visibleFatDiff,
    amdr,
    cpRatio,
    lowQualityProtein,
    proteinEar,
    proteinOneGPerKg,
    calculatedMealRows,
  };
};

const dailyFromPeriod = (value, period) => {
  const n = parseFloat(value) || 0;
  const divisor = period === "monthly" ? 30 : 1;
  return (n * 1000) / divisor;
};

export const calculateFamilySurvey = ({ members, rations, period }) => {
  const totalCU = members.reduce((sum, m) => sum + (parseFloat(m.cu) || 0), 0);
  const numMembers = members.length || 0;
  if (totalCU <= 0) {
    return { error: "Total consumption units are 0. Add at least one member who shares the pot." };
  }

  const daily = {
    cereals: dailyFromPeriod(rations.cerealsKg, period),
    pulses: dailyFromPeriod(rations.pulsesKg, period),
    oil: dailyFromPeriod(rations.oilKg, period),
    milk: dailyFromPeriod(rations.milkL, period),
    sugar: dailyFromPeriod(rations.sugarKg, period),
    glv: dailyFromPeriod(rations.glvKg, period),
    otherVeg: dailyFromPeriod(rations.otherVegKg, period),
    tubers: dailyFromPeriod(rations.tubersKg, period),
    fruits: dailyFromPeriod(rations.fruitsKg, period),
    nuts: dailyFromPeriod(rations.nutsKg, period),
  };

  let dailyKcal = 0;
  let dailyProtein = 0;
  let dailyFat = 0;
  Object.entries(daily).forEach(([key, grams]) => {
    const y = FAMILY_STAPLE_YIELDS[key];
    if (!y) return;
    dailyKcal += (grams / 100) * y.kcal;
    dailyProtein += (grams / 100) * y.protein;
    dailyFat += (grams / 100) * y.fat;
  });

  const perCU = {
    kcal: dailyKcal / totalCU,
    protein: dailyProtein / totalCU,
    fat: dailyFat / totalCU,
  };

  const foodGroups = BALANCED_DIET_PER_CU.map((row) => {
    const got = daily[row.key] / totalCU;
    return {
      ...row,
      got,
      pctOfTarget: row.target ? (got / row.target) * 100 : 0,
    };
  });

  return {
    period,
    daily,
    dailyKcal,
    dailyProtein,
    dailyFat,
    totalCU,
    numMembers,
    perCUKcal: perCU.kcal,
    perCUProtein: perCU.protein,
    perCUFat: perCU.fat,
    perCapitaKcal: numMembers ? dailyKcal / numMembers : 0,
    perCapitaProtein: numMembers ? dailyProtein / numMembers : 0,
    kcalDiff: percentDiff(perCU.kcal, REF_MAN_KCAL),
    proteinDiffEar: percentDiff(perCU.protein, REF_MAN_PROTEIN_EAR),
    proteinDiffRda: percentDiff(perCU.protein, REF_MAN_PROTEIN_RDA),
    foodGroups,
    refManKcal: REF_MAN_KCAL,
    refManProteinEar: REF_MAN_PROTEIN_EAR,
    refManProteinRda: REF_MAN_PROTEIN_RDA,
  };
};

export const generateClinicalImpression = (result, profile) => {
  if (!result || !profile) return "";
  const parts = [];
  const kcalDef = result.kcalDiff;
  const proDef = result.proteinDiff;

  if (kcalDef < -20 && proDef < -20) {
    parts.push(
      `Energy (${Math.abs(kcalDef).toFixed(1)}% below EER) and protein (${Math.abs(proDef).toFixed(1)}% below RDA) are both low`
    );
  } else if (kcalDef < -10 && proDef < -10) {
    parts.push(`Moderate energy and protein gap versus ICMR-NIN 2020 EER / RDA`);
  } else if (kcalDef < -10 && proDef >= -10) {
    parts.push(`Energy is ${Math.abs(kcalDef).toFixed(1)}% below EER; protein meets RDA`);
  } else if (kcalDef >= -10 && proDef < -10) {
    parts.push(`Energy meets EER; protein is ${Math.abs(proDef).toFixed(1)}% below RDA`);
  } else if (kcalDef > 20) {
    parts.push(`Energy is ${kcalDef.toFixed(1)}% above EER`);
  } else {
    parts.push("Energy and protein are broadly adequate versus ICMR-NIN 2020 EER / RDA");
  }

  if (result.lowQualityProtein) {
    parts.push(
      "Cereal-heavy pattern: ICMR 2020 uses 1 g protein/kg when cereal protein quality is poor. Status uses official RDA."
    );
  }

  const micros = [];
  MICRONUTRIENT_DEFS.forEach((d) => {
    const diff = result[d.diffKey];
    if (diff != null && diff < -25) {
      micros.push(`${d.label.toLowerCase()} (${Math.abs(diff).toFixed(1)}% below RDA)`);
    }
  });
  if (micros.length) parts.push(`Micronutrient gaps versus RDA: ${micros.join(", ")}`);

  if (result.visibleFatDiff != null && profile.visibleFat > 0) {
    if (result.visibleFatDiff < -20) {
      parts.push(`Visible fat (oil/ghee logged) is below the ICMR visible-fat amount of ${profile.visibleFat} g`);
    } else if (result.visibleFatDiff > 20) {
      parts.push(`Visible fat logged is above the ICMR visible-fat amount of ${profile.visibleFat} g`);
    }
  }

  if (result.amdr) {
    if (result.amdr.carbPct > 65) {
      parts.push(`Carbohydrate share is ${result.amdr.carbPct}% of Atwater energy (target about 50-60%)`);
    } else if (result.amdr.fatPct > 35) {
      parts.push(`Total fat share is ${result.amdr.fatPct}% of Atwater energy (target about 20-30%)`);
    }
  }

  if (result.cpRatio && result.cpRatio.ratioNum > 5) {
    parts.push(
      `Cereal : pulse : milk is ${result.cpRatio.triple || result.cpRatio.ratio} (target about 3 : 1 : 2.5)`
    );
  }

  return `${parts.join(". ")}.`;
};

export const generateDietaryCounseling = (result, profile, options = {}) => {
  if (!result || !profile) return [];
  const selectedMicroKeys =
    options.selectedMicroKeys ||
    MICRONUTRIENT_DEFS.filter(
      (d) => d.defaultVisible || (options.extraMicroKeys || []).includes(d.key)
    ).map((d) => d.key);
  const bullets = [];
  const kcalGap = Math.round(profile.kcal - result.kcal);
  const proGap = profile.proteinRda - result.protein;

  if (kcalGap > 150) {
    bullets.push(
      `Energy intake is ${result.kcal.toFixed(0)} kcal, ${kcalGap} kcal below the EER of ${profile.kcal} kcal. Add 30 g roasted Bengal gram / sattu (IFCT whole Bengal gram: about 86 kcal and 5.6 g protein) and 30 g ground nut (IFCT: about 156 kcal and 7.1 g protein) to raise energy without a large extra cereal load.`
    );
  }

  if (proGap > 5) {
    bullets.push(
      `Protein intake is ${result.protein.toFixed(1)} g, ${proGap.toFixed(1)} g below the RDA of ${profile.proteinRda} g (EAR ${profile.proteinEar} g). One boiled egg, about 50 g (IFCT: about 74 kcal and 6.7 g protein), plus 30 g roasted Bengal gram (IFCT: about 5.6 g protein) closes part of the gap and improves pulse-quality protein.`
    );
  }

  if (result.cpRatio && result.cpRatio.ratioNum > 5) {
    bullets.push(
      `Cereal : pulse : milk is ${result.cpRatio.triple || result.cpRatio.ratio} (target about 3 : 1 : 2.5). ICMR 2020 uses 1 g protein/kg (about ${result.proteinOneGPerKg} g) when pulse is very low. Add one katori of dal or 30 g roasted chana at lunch and dinner, and keep milk or curd in the day.`
    );
  }

  MICRONUTRIENT_DEFS.filter((d) => selectedMicroKeys.includes(d.key)).forEach((d) => {
    if (profile[d.rdaKey] == null || result[d.gotKey] == null) return;
    const gap = profile[d.rdaKey] - result[d.gotKey];
    if (gap > d.gapThreshold) {
      const lead = d.counseling.description(gap, profile).replace(/:\s*$/, ".");
      bullets.push(`${lead} ${d.counseling.bullets.join(" ")}`);
    }
  });

  if (!bullets.length) {
    bullets.push(
      `Energy, protein, and the micronutrients on the table sit close to ICMR-NIN 2020 EER and RDA for this recall. Keep cereal : pulse : milk near 3 : 1 : 2.5.`
    );
  }

  return [
    {
      title: "Specific dietary recommendations",
      icon: "food-apple",
      description:
        "Each point is one shortfall from this recall versus ICMR-NIN 2020 EER or RDA.",
      bullets,
    },
  ];
};

const dateStamp = () =>
  new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const generateCaseSheetSummary = (surveyData) => {
  const { profile, result, mealRows, familyData, mode } = surveyData;
  const dateStr = dateStamp();

  if (mode === "family") {
    const { members, rations, period, result: fam } = familyData;
    const periodLabel = period === "monthly" ? "MONTHLY household purchase (tool divides by 30)" : "DAILY household use";
    const groups = (fam.foodGroups || [])
      .map((g) => `  • ${g.label}: ${g.got.toFixed(0)} ${g.unit}/CU (target ${g.target} ${g.unit}, ${g.pctOfTarget.toFixed(0)}%)`)
      .join("\n");
    return `===========================================================
FAMILY DIETARY SURVEY (CU method, ICMR-NIN 2020)
===========================================================
Date: ${dateStr}
${periodLabel}
Members: ${members.length}
Total CU: ${fam.totalCU.toFixed(2)} (1.0 CU = sedentary man 2110 kcal)
-----------------------------------------------------------
RATION ENTRIES (${period}):
• Cereals ${rations.cerealsKg || 0} kg  • Pulses ${rations.pulsesKg || 0} kg
• Oil ${rations.oilKg || 0} kg  • Milk ${rations.milkL || 0} L  • Sugar ${rations.sugarKg || 0} kg
• GLV ${rations.glvKg || 0} kg  • Other veg ${rations.otherVegKg || 0} kg  • Tubers ${rations.tubersKg || 0} kg
• Fruits ${rations.fruitsKg || 0} kg  • Nuts ${rations.nutsKg || 0} kg
-----------------------------------------------------------
FOOD PER ADULT UNIT vs My Plate 2024:
${groups}
-----------------------------------------------------------
NUTRIENTS PER CU:
• Energy: ${fam.perCUKcal.toFixed(0)} kcal  (EER 2110) [${formatPct(fam.kcalDiff)}]
• Protein: ${fam.perCUProtein.toFixed(1)} g  (EAR 42.9 / RDA 54.0) [${formatPct(fam.proteinDiffRda)} vs RDA]
• Per capita energy: ${fam.perCapitaKcal.toFixed(0)} kcal/person
===========================================================`;
  }

  let mealText = "";
  if (mealRows && mealRows.length > 0) {
    mealText = mealRows
      .filter((r) => r.food && r.grams > 0)
      .map(
        (r) =>
          `  • [${r.mealLabel}] ${r.food.name} (${r.portionLabel} x ${r.quantity}): ${r.grams.toFixed(0)} g -> ${r.kcal.toFixed(0)} kcal, ${r.protein.toFixed(1)} g P`
      )
      .join("\n");
  }

  const carbAmdrG = carbGramsFromEer(profile.kcal);

  return `===========================================================
24-HOUR DIETARY RECALL (ICMR-NIN 2020, IFCT 2017)
===========================================================
Date: ${dateStr}
Subject: ${profile.label}
Adequacy judged against RDA (energy against EER). EAR is shown for information.
-----------------------------------------------------------
INVENTORY:
${mealText || "  No items recorded"}
-----------------------------------------------------------
INTAKE vs EER / EAR / RDA:
• Energy: ${result.kcal.toFixed(0)} kcal / EER ${profile.kcal} [${formatPct(result.kcalDiff)}]
• Carbohydrate: ${result.carbs.toFixed(0)} g / AMDR ${carbAmdrG.at50}-${carbAmdrG.at60} g from EER (${result.amdr?.carbPct || 0}% energy)
• Protein: ${result.protein.toFixed(1)} g / EAR ${result.proteinEar} / RDA ${profile.proteinRda} [${formatPct(result.proteinDiff)} vs RDA]
• Visible fat: ${result.visibleFatGrams.toFixed(1)} g / ${profile.visibleFat} g
${MICRONUTRIENT_DEFS.map((d) => {
    const ear = profile[d.earKey];
    const rda = profile[d.rdaKey];
    const got = result[d.gotKey];
    const earTxt = ear == null ? "—" : ear;
    const rdaTxt = rda == null ? "—" : rda;
    return `• ${d.label}: ${got.toFixed(d.decimals)} ${d.unit} / EAR ${earTxt} / RDA ${rdaTxt} [${formatPct(result[d.diffKey])} vs RDA]`;
  }).join("\n")}
-----------------------------------------------------------
ACCEPTABLE MACRONUTRIENT DISTRIBUTION RANGE (AMDR):
• Carbohydrate ${result.amdr?.carbPct || 0}% (about 50-60%)
• Protein ${result.amdr?.proteinPct || 0}% (about 10-15%)
• Fat ${result.amdr?.fatPct || 0}% (about 20-30%)
-----------------------------------------------------------
IMPRESSION:
${generateClinicalImpression(result, profile)}
===========================================================`;
};
