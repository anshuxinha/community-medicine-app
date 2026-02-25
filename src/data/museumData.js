// ============================================================
// Virtual Museum Data
// ============================================================
// HOW TO ADD A NEW SPOTTER:
// 1. Upload your image to Firebase Console → Storage → museum/ folder
// 2. After uploading, go to the file → click "⋮" → "Get download link" (or use makePublic)
//    URL format: https://storage.googleapis.com/community-med-app.firebasestorage.app/museum/filename.png
// 3. Add a new entry below with that URL in the `image` field
// 4. Commit museumData.js → push → new EAS build picks it up automatically
// ============================================================

const BASE = 'https://storage.googleapis.com/community-med-app.firebasestorage.app/museum';

export const MUSEUM_ITEMS = [
    {
        id: '1', category: 'Instruments',
        title: 'Kata Thermometer',
        emoji: '🌡️',
        image: `${BASE}/kata_thermometer.png`,
        description: 'Measures the cooling power of air (thermal comfort index). A dry Kata reading ≥6 and wet Kata reading ≥20 indicate comfort.',
        keyFact: 'Used to determine air velocity and heat index in workplaces and industrial settings.',
    },
    {
        id: '2', category: 'Instruments',
        title: 'Chloroscope (Chlorinometer)',
        emoji: '💧',
        image: `${BASE}/chloroscope.png`,
        description: 'Measures residual chlorine in water using the Orthotolidine (OT) test. Inner disk turns yellow proportional to chlorine concentration.',
        keyFact: 'OTA (Orthotolidine Arsenite) test differentiates free vs. combined chlorine.',
    },
    {
        id: '3', category: 'Instruments',
        title: "Horrock's Apparatus",
        emoji: '🧪',
        image: `${BASE}/horrocks_apparatus.png`,
        description: 'Determines the chlorine demand of water before well disinfection. Uses 6 white cups + 1 black cup with starch-iodide indicator.',
        keyFact: 'Each cup = 2g of bleaching powder per 455 litres (100 gallons) of water.',
    },
    {
        id: '4', category: 'Instruments',
        title: 'Sling Psychrometer',
        emoji: '🌀',
        image: `${BASE}/sling_psychrometer.png`,
        description: 'Highly accurate portable device to measure relative humidity by whirling dry and wet bulb thermometers in the air simultaneously.',
        keyFact: 'At 100% humidity, both dry and wet bulb readings are identical.',
    },
    {
        id: '5', category: 'Instruments',
        title: 'Globe Thermometer',
        emoji: '🔴',
        image: null, // Upload globe_thermometer.png to Firebase Storage → museum/ to enable
        description: 'Measures mean radiant heat using a hollow copper globe painted matte black. Simulates heat absorption by the human body.',
        keyFact: 'Used in occupational health to assess radiant heat stress.',
    },
    {
        id: '6', category: 'Specimens',
        title: 'Anopheles Mosquito',
        emoji: '🦟',
        image: `${BASE}/anopheles.png`,
        description: 'Vector of Malaria (Plasmodium spp.). Breeds in clean, stagnant water. Rests at an angle to the surface. Bites at dusk/dawn.',
        keyFact: 'Distinguished from Culex by its resting posture — body at 45° angle to surface.',
    },
    {
        id: '7', category: 'Specimens',
        title: 'Culex Mosquito',
        emoji: '🦟',
        image: `${BASE}/culex.png`,
        description: 'Vector of Bancroftian Filariasis and Japanese Encephalitis. Breeds in polluted/stagnant water. Rests parallel to the surface.',
        keyFact: 'Wuchereria bancrofti (lymphatic filariasis) is transmitted by Culex quinquefasciatus.',
    },
    {
        id: '8', category: 'Specimens',
        title: 'M. tuberculosis (ZN Stain)',
        emoji: '🔬',
        image: null, // Upload zn_stain.png to Firebase Storage → museum/ to enable
        description: 'Acid-fast bacilli appear bright red against a blue background on Ziehl-Neelsen staining with carbol fuchsin and sulfuric acid decoloriser.',
        keyFact: '"Acid-fast" because mycolic acid in the cell wall resists decolorisation by strong acids.',
    },
    {
        id: '9', category: 'Sanitation',
        title: 'Slow Sand Filter (Schmutzdecke)',
        emoji: '🏗️',
        image: `${BASE}/slow_sand_filter.png`,
        description: 'A biological filter named after the "vital layer" of microorganisms on its surface. Removes 99.9% of bacteria without chemicals.',
        keyFact: 'Cleaned by physically scraping the top 2–3 cm of sand. Requires large land area.',
    },
    {
        id: '10', category: 'Sanitation',
        title: 'Soak Pit',
        emoji: '🕳️',
        image: `${BASE}/soak_pit.png`,
        description: 'Simple rural method of disposing of sullage (wastewater). A pit filled with graded stones with a trap to prevent suspended solids from entering.',
        keyFact: 'Prevents mosquito breeding by maintaining a sealed, subterranean drainage system.',
    },
    // ── Add more spotters below ──────────────────────────────
    // Example:
    // {
    //   id: '11', category: 'Specimens',
    //   title: 'Aedes Mosquito',
    //   emoji: '🦟',
    //   image: `${BASE}/aedes.png`,   ← upload aedes.png to Firebase Storage museum/ folder
    //   description: '...',
    //   keyFact: '...',
    // },
];

export const CATEGORIES = ['All', 'Instruments', 'Specimens', 'Sanitation'];
