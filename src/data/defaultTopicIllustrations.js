import illustrationSeed from './topicIllustrations.seed.json';

import medicineEvolutionTimeline from '../../assets/reading-illustrations/medicine_evolution_timeline.png';
import healthConceptFramework from '../../assets/reading-illustrations/health_concept_framework.png';
import studyDesignComparison from '../../assets/reading-illustrations/study_design_comparison.png';
import chainOfInfection from '../../assets/reading-illustrations/chain_of_infection.png';
import coldChainLadder from '../../assets/reading-illustrations/cold_chain_ladder.png';
import waterPurificationFlow from '../../assets/reading-illustrations/water_purification_flow.png';
import biomedicalWasteSegregation from '../../assets/reading-illustrations/biomedical_waste_segregation.png';
import disasterManagementCycle from '../../assets/reading-illustrations/disaster_management_cycle.png';

const localImageSourceMap = {
    'medicine_evolution_timeline.png': medicineEvolutionTimeline,
    'health_concept_framework.png': healthConceptFramework,
    'study_design_comparison.png': studyDesignComparison,
    'chain_of_infection.png': chainOfInfection,
    'cold_chain_ladder.png': coldChainLadder,
    'water_purification_flow.png': waterPurificationFlow,
    'biomedical_waste_segregation.png': biomedicalWasteSegregation,
    'disaster_management_cycle.png': disasterManagementCycle,
};

export const DEFAULT_TOPIC_ILLUSTRATION_MAP = illustrationSeed.reduce((accumulator, entry) => {
    const images = Array.isArray(entry.images)
        ? entry.images.map((image) => ({
            ...image,
            source: image.fileName ? localImageSourceMap[image.fileName] : undefined,
        }))
        : [];

    accumulator.set(entry.contentKey, images);
    return accumulator;
}, new Map());

export const TOPIC_ILLUSTRATION_SEED = illustrationSeed;
