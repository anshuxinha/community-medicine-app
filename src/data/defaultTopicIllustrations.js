import illustrationSeed from "./topicIllustrations.seed.json";

import icebergPhenomenonOfDisease from "../../reading-illustrations/iceberg_phenomenon_of_disease.png";
import levelsOfPreventionSteps from "../../reading-illustrations/levels_of_prevention_steps.png";
import evidenceBasedMedicinePyramid from "../../reading-illustrations/evidence_based_medicine_pyramid.png";
import vvmStages from "../../reading-illustrations/vvm_stages.png";
import shiftingCutoffsSensitivitySpecificity from "../../reading-illustrations/shifting_cutoffs_sensitivity_specificity.png";
import ruleOfHalvesHypertension from "../../reading-illustrations/rule_of_halves_hypertension.png";
import ntepDiagnosticAlgorithmTb from "../../reading-illustrations/ntep_diagnostic_algorithm_tb.png";
import demographicCycle5Stages from "../../reading-illustrations/demographic_cycle_5_stages.png";
import populationPyramidsThreePatterns from "../../reading-illustrations/population_pyramids_three_patterns.png";
import under5ClinicLogo from "../../reading-illustrations/under5_clinic_logo.png";
import apgarScoreAssessment from "../../reading-illustrations/apgar_score_assessment.png";
import ruralHealthInfrastructureIndia from "../../reading-illustrations/rural_health_infrastructure_india.png";
import kwashiorkorVsMarasmus from "../../reading-illustrations/kwashiorkor_vs_marasmus.png";
import maslowHierarchyNeeds from "../../reading-illustrations/maslow_hierarchy_needs.png";
import sdg3HealthTargets from "../../reading-illustrations/sdg3_health_targets.png";
import slowSandFilter from "../../reading-illustrations/slow_sand_filter.png";
import mosquitoRestingPosturesLarvae from "../../reading-illustrations/mosquito_resting_postures_larvae.png";
import biomedicalWasteColorCoding from "../../reading-illustrations/biomedical_waste_color_coding.png";
import disasterTriageColorTags from "../../reading-illustrations/disaster_triage_color_tags.png";
import silicosisVsAsbestosis from "../../reading-illustrations/silicosis_vs_asbestosis.png";
import normalDistribution6895997Rule from "../../reading-illustrations/normal_distribution_6895997_rule.png";
import skewnessCentralTendency from "../../reading-illustrations/skewness_central_tendency.png";
import abcVedInventoryControl from "../../reading-illustrations/abc_ved_inventory_control.png";

const localImageSourceMap = {
  "iceberg_phenomenon_of_disease.png": icebergPhenomenonOfDisease,
  "levels_of_prevention_steps.png": levelsOfPreventionSteps,
  "evidence_based_medicine_pyramid.png": evidenceBasedMedicinePyramid,
  "vvm_stages.png": vvmStages,
  "shifting_cutoffs_sensitivity_specificity.png":
    shiftingCutoffsSensitivitySpecificity,
  "rule_of_halves_hypertension.png": ruleOfHalvesHypertension,
  "ntep_diagnostic_algorithm_tb.png": ntepDiagnosticAlgorithmTb,
  "demographic_cycle_5_stages.png": demographicCycle5Stages,
  "population_pyramids_three_patterns.png": populationPyramidsThreePatterns,
  "under5_clinic_logo.png": under5ClinicLogo,
  "apgar_score_assessment.png": apgarScoreAssessment,
  "rural_health_infrastructure_india.png": ruralHealthInfrastructureIndia,
  "kwashiorkor_vs_marasmus.png": kwashiorkorVsMarasmus,
  "maslow_hierarchy_needs.png": maslowHierarchyNeeds,
  "sdg3_health_targets.png": sdg3HealthTargets,
  "slow_sand_filter.png": slowSandFilter,
  "mosquito_resting_postures_larvae.png": mosquitoRestingPosturesLarvae,
  "biomedical_waste_color_coding.png": biomedicalWasteColorCoding,
  "disaster_triage_color_tags.png": disasterTriageColorTags,
  "silicosis_vs_asbestosis.png": silicosisVsAsbestosis,
  "normal_distribution_6895997_rule.png": normalDistribution6895997Rule,
  "skewness_central_tendency.png": skewnessCentralTendency,
  "abc_ved_inventory_control.png": abcVedInventoryControl,
};

// Placeholder image source for fallback
const PLACEHOLDER_SOURCE = require("../../assets/icon.png");

export const DEFAULT_TOPIC_ILLUSTRATION_MAP = illustrationSeed.reduce(
  (accumulator, entry) => {
    const images = Array.isArray(entry.images)
      ? entry.images.map((image) => {
          const source = image.fileName
            ? localImageSourceMap[image.fileName]
            : PLACEHOLDER_SOURCE;
          console.log(
            `Default illustration mapping: ${entry.contentKey} -> ${image.fileName} source=${source ? "defined" : "undefined"}`,
          );
          return {
            ...image,
            source,
          };
        })
      : [];

    accumulator.set(entry.contentKey, images);
    return accumulator;
  },
  new Map(),
);

export const TOPIC_ILLUSTRATION_SEED = illustrationSeed;
