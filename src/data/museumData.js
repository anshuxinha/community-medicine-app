// ============================================================
// Virtual Museum Data
// ============================================================
// HOW TO ADD A NEW SPOTTER:
// 1. Go to Firebase Console → Storage → Create folder "museum/"
// 2. Upload your image (JPG/PNG, ideally under 500KB)
// 3. Click the file → "Copy download URL"
// 4. Add a new entry below with that URL in the `image` field
// 5. No app rebuild needed — changes load instantly!
// ============================================================

export const MUSEUM_ITEMS = [
    {
        id: '1', category: 'Instruments',
        title: 'Kata Thermometer',
        emoji: '🌡️',
        // Replace with your Firebase Storage URL:
        image: null, // e.g. 'https://firebasestorage.googleapis.com/v0/b/YOUR_APP/o/museum%2Fkata_thermometer.png?alt=media'
        description: 'Measures the cooling power of air (thermal comfort index). A dry Kata reading ≥6 and wet Kata reading ≥20 indicate comfort.',
        keyFact: 'Used to determine air velocity and heat index in workplaces and industrial settings.',
    },
    {
        id: '2', category: 'Instruments',
        title: 'Chloroscope (Chlorinometer)',
        emoji: '💧',
        image: null,
        description: 'Measures residual chlorine in water using the Orthotolidine (OT) test. Inner disk turns yellow proportional to chlorine concentration.',
        keyFact: 'OTA (Orthotolidine Arsenite) test differentiates free vs. combined chlorine.',
    },
    {
        id: '3', category: 'Instruments',
        title: "Horrock's Apparatus",
        emoji: '🧪',
        image: null,
        description: 'Determines the chlorine demand of water before well disinfection. Uses 6 white cups + 1 black cup with starch-iodide indicator.',
        keyFact: 'Each cup = 2g of bleaching powder per 455 litres (100 gallons) of water.',
    },
    {
        id: '4', category: 'Instruments',
        title: 'Sling Psychrometer',
        emoji: '🌀',
        image: null,
        description: 'Highly accurate portable device to measure relative humidity by whirling dry and wet bulb thermometers in the air simultaneously.',
        keyFact: 'At 100% humidity, both dry and wet bulb readings are identical.',
    },
    {
        id: '5', category: 'Instruments',
        title: 'Globe Thermometer',
        emoji: '🔴',
        image: null,
        description: 'Measures mean radiant heat using a hollow copper globe painted matte black. Simulates heat absorption by the human body.',
        keyFact: 'Used in occupational health to assess radiant heat stress.',
    },
    {
        id: '6', category: 'Specimens',
        title: 'Anopheles Mosquito',
        emoji: '🦟',
        image: null,
        description: 'Vector of Malaria (Plasmodium spp.). Breeds in clean, stagnant water. Rests at an angle to the surface. Bites at dusk/dawn.',
        keyFact: 'Distinguished from Culex by its resting posture — body at 45° angle to surface.',
    },
    {
        id: '7', category: 'Specimens',
        title: 'Culex Mosquito',
        emoji: '🦟',
        image: null,
        description: 'Vector of Bancroftian Filariasis and Japanese Encephalitis. Breeds in polluted/stagnant water. Rests parallel to the surface.',
        keyFact: 'Wuchereria bancrofti (lymphatic filariasis) is transmitted by Culex quinquefasciatus.',
    },
    {
        id: '8', category: 'Specimens',
        title: 'M. tuberculosis (ZN Stain)',
        emoji: '🔬',
        image: null,
        description: 'Acid-fast bacilli appear bright red against a blue background on Ziehl-Neelsen staining with carbol fuchsin and sulfuric acid decoloriser.',
        keyFact: '"Acid-fast" because mycolic acid in the cell wall resists decolorisation by strong acids.',
    },
    {
        id: '9', category: 'Sanitation',
        title: 'Slow Sand Filter (Schmutzdecke)',
        emoji: '🏗️',
        image: null,
        description: 'A biological filter named after the "vital layer" of microorganisms on its surface. Removes 99.9% of bacteria without chemicals.',
        keyFact: 'Cleaned by physically scraping the top 2–3 cm of sand. Requires large land area.',
    },
    {
        id: '10', category: 'Sanitation',
        title: 'Soak Pit',
        emoji: '🕳️',
        image: null,
        description: 'Simple rural method of disposing of sullage (wastewater). A pit filled with graded stones with a trap to prevent suspended solids from entering.',
        keyFact: 'Prevents mosquito breeding by maintaining a sealed, subterranean drainage system.',
    },
    // ── Add more spotters below ──────────────────────────────
    // Example:
    // {
    //   id: '11', category: 'Specimens',
    //   title: 'Aedes Mosquito',
    //   emoji: '🦟',
    //   image: 'https://firebasestorage.googleapis.com/...',
    //   description: '...',
    //   keyFact: '...',
    // },
];

export const CATEGORIES = ['All', 'Instruments', 'Specimens', 'Sanitation'];
