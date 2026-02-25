import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Card, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const MUSEUM_ITEMS = [
    {
        id: '1', category: 'Instruments',
        title: 'Kata Thermometer',
        emoji: '🌡️',
        image: require('../../assets/museum/kata_thermometer.png'),
        description: 'Measures the cooling power of air (thermal comfort index). A dry Kata reading ≥6 and wet Kata reading ≥20 indicate comfort.',
        keyFact: 'Used to determine air velocity and heat index in workplaces and industrial settings.',
    },
    {
        id: '2', category: 'Instruments',
        title: 'Chloroscope (Chlorinometer)',
        emoji: '💧',
        image: require('../../assets/museum/chloroscope.png'),
        description: 'Measures residual chlorine in water using the Orthotolidine (OT) test. Inner disk turns yellow proportional to chlorine concentration.',
        keyFact: 'OTA (Orthotolidine Arsenite) test differentiates free vs. combined chlorine.',
    },
    {
        id: '3', category: 'Instruments',
        title: "Horrock's Apparatus",
        emoji: '🧪',
        image: require('../../assets/museum/horrocks_apparatus.png'),
        description: 'Determines the chlorine demand of water before well disinfection. Uses 6 white cups + 1 black cup with starch-iodide indicator.',
        keyFact: 'Each cup = 2g of bleaching powder per 455 litres (100 gallons) of water.',
    },
    {
        id: '4', category: 'Instruments',
        title: 'Sling Psychrometer',
        emoji: '🌀',
        image: require('../../assets/museum/sling_psychrometer.png'),
        description: 'Highly accurate portable device to measure relative humidity by whirling dry and wet bulb thermometers in the air simultaneously.',
        keyFact: 'At 100% humidity, both dry and wet bulb readings are identical.',
    },
    {
        id: '5', category: 'Instruments',
        title: 'Globe Thermometer',
        emoji: '🔴',
        image: null, // not yet available — add globe_thermometer.png to assets/museum to enable
        description: 'Measures mean radiant heat using a hollow copper globe painted matte black. Simulates heat absorption by the human body.',
        keyFact: 'Used in occupational health to assess radiant heat stress.',
    },
    {
        id: '6', category: 'Specimens',
        title: 'Anopheles Mosquito',
        emoji: '🦟',
        image: require('../../assets/museum/anopheles.png'),
        description: 'Vector of Malaria (Plasmodium spp.). Breeds in clean, stagnant water. Rests at an angle to the surface. Bites at dusk/dawn.',
        keyFact: 'Distinguished from Culex by its resting posture — body at 45° angle to surface.',
    },
    {
        id: '7', category: 'Specimens',
        title: 'Culex Mosquito',
        emoji: '🦟',
        image: require('../../assets/museum/culex.png'),
        description: 'Vector of Bancroftian Filariasis and Japanese Encephalitis. Breeds in polluted/stagnant water. Rests parallel to the surface.',
        keyFact: 'Wuchereria bancrofti (lymphatic filariasis) is transmitted by Culex quinquefasciatus.',
    },
    {
        id: '8', category: 'Specimens',
        title: 'M. tuberculosis (ZN Stain)',
        emoji: '🔬',
        image: null, // add zn_stain.png to assets/museum to enable
        description: 'Acid-fast bacilli appear bright red against a blue background on Ziehl-Neelsen staining with carbol fuchsin and sulfuric acid decoloriser.',
        keyFact: '"Acid-fast" because mycolic acid in the cell wall resists decolorisation by strong acids.',
    },
    {
        id: '9', category: 'Sanitation',
        title: 'Slow Sand Filter (Schmutzdecke)',
        emoji: '🏗️',
        image: require('../../assets/museum/slow_sand_filter.png'),
        description: 'A biological filter named after the "vital layer" of microorganisms on its surface. Removes 99.9% of bacteria without chemicals.',
        keyFact: 'Cleaned by physically scraping the top 2–3 cm of sand. Requires large land area.',
    },
    {
        id: '10', category: 'Sanitation',
        title: 'Soak Pit',
        emoji: '🕳️',
        image: require('../../assets/museum/soak_pit.png'),
        description: 'Simple rural method of disposing of sullage (wastewater). A pit filled with graded stones with a trap to prevent suspended solids from entering.',
        keyFact: 'Prevents mosquito breeding by maintaining a sealed, subterranean drainage system.',
    },
];

const CATEGORIES = ['All', 'Instruments', 'Specimens', 'Sanitation'];

const VirtualMuseumScreen = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedId, setExpandedId] = useState(null);

    const filtered = activeCategory === 'All'
        ? MUSEUM_ITEMS
        : MUSEUM_ITEMS.filter(i => i.category === activeCategory);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerText}>🏛️ Virtual Museum</Text>
                <Text style={styles.subText}>
                    Tap any item to view its image and learn key public-health facts.
                </Text>

                {/* Category chips */}
                <View style={styles.chipRow}>
                    {CATEGORIES.map(cat => (
                        <Chip
                            key={cat}
                            selected={activeCategory === cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[styles.chip, activeCategory === cat && styles.chipActive]}
                            textStyle={activeCategory === cat ? styles.chipTextActive : { color: '#374151' }}
                        >
                            {cat}
                        </Chip>
                    ))}
                </View>

                {filtered.map(item => (
                    <Card
                        key={item.id}
                        style={styles.card}
                        onPress={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                        {/* Header row */}
                        <View style={styles.cardHeader}>
                            <View style={styles.cardHeaderLeft}>
                                <Text style={styles.cardTitle}>{item.emoji}  {item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.category}</Text>
                            </View>
                            <MaterialIcons
                                name={expandedId === item.id ? 'expand-less' : 'expand-more'}
                                size={26}
                                color="#8A2BE2"
                            />
                        </View>

                        {/* Expanded content with image */}
                        {expandedId === item.id && (
                            <Card.Content style={styles.expandedContent}>
                                <Divider style={{ marginBottom: 12 }} />

                                {/* Image */}
                                {item.image ? (
                                    <Image
                                        source={item.image}
                                        style={styles.itemImage}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Text style={styles.imagePlaceholderEmoji}>{item.emoji}</Text>
                                        <Text style={styles.imagePlaceholderText}>Image coming soon</Text>
                                    </View>
                                )}

                                {/* Description */}
                                <Text style={styles.description}>{item.description}</Text>

                                {/* Key fact */}
                                <View style={styles.keyFactBox}>
                                    <MaterialIcons name="lightbulb" size={16} color="#D97706" />
                                    <Text style={styles.keyFactText}> {item.keyFact}</Text>
                                </View>
                            </Card.Content>
                        )}
                    </Card>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FBFCFE' },
    container: { padding: 16, paddingBottom: 48 },
    headerText: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    subText: { color: '#6B7280', marginBottom: 16, lineHeight: 20 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { backgroundColor: '#F3F4F6' },
    chipActive: { backgroundColor: '#EDE9FE' },
    chipTextActive: { color: '#6B21A8', fontWeight: 'bold' },
    card: { marginBottom: 10, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        paddingRight: 12,
    },
    cardHeaderLeft: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 2 },
    cardSubtitle: { color: '#8A2BE2', fontSize: 11, fontWeight: '600' },
    expandedContent: { paddingTop: 0, paddingBottom: 14 },
    itemImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 14,
        backgroundColor: '#F9FAFB',
    },
    imagePlaceholder: {
        width: '100%',
        height: 140,
        borderRadius: 10,
        marginBottom: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderEmoji: { fontSize: 48, marginBottom: 6 },
    imagePlaceholderText: { color: '#9CA3AF', fontSize: 13 },
    description: { color: '#374151', lineHeight: 22, marginBottom: 12 },
    keyFactBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 10,
        borderRadius: 8,
    },
    keyFactText: { color: '#92400E', fontSize: 13, flex: 1, lineHeight: 18 },
});

export default VirtualMuseumScreen;
