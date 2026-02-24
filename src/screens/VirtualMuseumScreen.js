import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { Text, Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const MUSEUM_ITEMS = [
    {
        id: '1', category: 'Instruments', icon: 'thermostat',
        title: 'Kata Thermometer',
        emoji: '🌡️',
        description: 'Measures the cooling power of air (thermal comfort index). A dry Kata reading ≥6 and wet Kata reading ≥20 indicate comfort.',
        keyFact: 'Used to determine air velocity and heat index in workplaces.',
    },
    {
        id: '2', category: 'Instruments', icon: 'opacity',
        title: 'Chloroscope (Chlorinometer)',
        emoji: '💧',
        description: 'Measures residual chlorine in water using the Orthotolidine (OT) test. Inner disk turns yellow proportional to chlorine concentration.',
        keyFact: 'OTA (Orthotolidine Arsenite) test differentiates free vs. combined chlorine.',
    },
    {
        id: '3', category: 'Instruments', icon: 'water-drop',
        title: "Horrock's Apparatus",
        emoji: '🧪',
        description: 'Determines the chlorine demand of water before well disinfection. Uses 6 white cups + 1 black cup with starch-iodide indicator.',
        keyFact: 'Each cup = 2g of bleaching powder per 455 litres (100 gallons) of water.',
    },
    {
        id: '4', category: 'Instruments', icon: 'science',
        title: 'Sling Psychrometer',
        emoji: '🌀',
        description: 'Highly accurate portable device to measure relative humidity by whirling dry and wet bulb thermometers in the air simultaneously.',
        keyFact: 'At 100% humidity, both dry and wet bulb readings are identical.',
    },
    {
        id: '5', category: 'Instruments', icon: 'wb-sunny',
        title: 'Globe Thermometer',
        emoji: '🔴',
        description: 'Measures mean radiant heat using a hollow copper globe painted matte black. Simulates heat absorption by the human body.',
        keyFact: 'Used in occupational health to assess radiant heat stress.',
    },
    {
        id: '6', category: 'Specimens', icon: 'bug-report',
        title: 'Anopheles Mosquito',
        emoji: '🦟',
        description: 'Vector of Malaria (Plasmodium spp.). Breeds in clean, stagnant water. Rests at an angle to the surface. Bites at dusk/dawn.',
        keyFact: 'Distinguished from Culex by its resting posture — body at 45° angle.',
    },
    {
        id: '7', category: 'Specimens', icon: 'bug-report',
        title: 'Culex Mosquito',
        emoji: '🦟',
        description: 'Vector of Bancroftian Filariasis and Japanese Encephalitis. Breeds in polluted/stagnant water. Rests parallel to the surface.',
        keyFact: 'Wuchereria bancrofti (lymphatic filariasis) is transmitted by Culex quinquefasciatus.',
    },
    {
        id: '8', category: 'Specimens', icon: 'biotech',
        title: 'M. tuberculosis (ZN Stain)',
        emoji: '🔬',
        description: 'Acid-fast bacilli appear bright red against a blue background on Ziehl-Neelsen staining with carbol fuchsin and sulfuric acid decoloriser.',
        keyFact: '"Acid-fast" because the mycolic acid in the cell wall resists decolorisation by strong acids.',
    },
    {
        id: '9', category: 'Sanitation', icon: 'cleaning-services',
        title: 'Slow Sand Filter (Schmutzdecke)',
        emoji: '🏗️',
        description: 'A biological filter named after the "vital layer" of microorganisms on its surface. Removes 99.9% of bacteria without chemicals.',
        keyFact: 'Cleaned by physically scraping the top 2-3cm of sand. Requires large land area.',
    },
    {
        id: '10', category: 'Sanitation', icon: 'plumbing',
        title: 'Soak Pit',
        emoji: '🕳️',
        description: 'Simple rural method of disposing of sullage (wastewater). A pit filled with graded stones with a trap to prevent suspended solids.',
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
                    Tap any item to learn about key public-health instruments, vectors, and sanitation technologies.
                </Text>

                {/* Category chips */}
                <View style={styles.chipRow}>
                    {CATEGORIES.map(cat => (
                        <Chip
                            key={cat}
                            selected={activeCategory === cat}
                            onPress={() => setActiveCategory(cat)}
                            style={[styles.chip, activeCategory === cat && styles.chipActive]}
                            textStyle={activeCategory === cat ? styles.chipTextActive : {}}
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
                        <Card.Title
                            title={`${item.emoji}  ${item.title}`}
                            titleStyle={styles.cardTitle}
                            subtitle={item.category}
                            subtitleStyle={styles.cardSubtitle}
                            right={() => (
                                <MaterialIcons
                                    name={expandedId === item.id ? 'expand-less' : 'expand-more'}
                                    size={24}
                                    color="#8A2BE2"
                                    style={{ marginRight: 12 }}
                                />
                            )}
                        />
                        {expandedId === item.id && (
                            <Card.Content style={styles.expandedContent}>
                                <Divider style={{ marginBottom: 12 }} />
                                <Paragraph style={styles.description}>{item.description}</Paragraph>
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
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
    cardSubtitle: { color: '#8A2BE2', fontSize: 11 },
    expandedContent: { paddingTop: 0, paddingBottom: 12 },
    description: { color: '#374151', lineHeight: 22, marginBottom: 12 },
    keyFactBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFBEB', padding: 10, borderRadius: 8 },
    keyFactText: { color: '#92400E', fontSize: 13, flex: 1, lineHeight: 18 },
});

export default VirtualMuseumScreen;
