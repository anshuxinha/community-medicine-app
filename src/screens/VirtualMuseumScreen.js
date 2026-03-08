import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Text, Card, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MUSEUM_ITEMS, CATEGORIES } from '../data/museumData';
import { theme } from '../styles/theme';

// Individual card component to manage its own image loading state
const MuseumCard = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    return (
        <Card style={styles.card} onPress={() => setExpanded(!expanded)}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <Text style={styles.cardTitle}>{item.emoji}  {item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.category}</Text>
                </View>
                <MaterialIcons
                    name={expanded ? 'expand-less' : 'expand-more'}
                    size={26}
                    color={theme.colors.secondary}
                />
            </View>

            {/* Expanded content */}
            {expanded && (
                <Card.Content style={styles.expandedContent}>
                    <Divider style={{ marginBottom: 12 }} />

                    {/* Image area */}
                    {item.image && !imageError ? (
                        <View style={styles.imageWrapper}>
                            {imageLoading && (
                                <View style={styles.imageLoadingOverlay}>
                                    <ActivityIndicator size="large" color={theme.colors.secondary} />
                                </View>
                            )}
                            <Image
                                source={{ uri: item.image }}
                                style={[styles.itemImage, imageLoading && { opacity: 0 }]}
                                resizeMode="contain"
                                onLoad={() => setImageLoading(false)}
                                onError={() => { setImageError(true); setImageLoading(false); }}
                            />
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderEmoji}>{item.emoji}</Text>
                            <Text style={styles.placeholderText}>
                                {item.image && imageError ? 'Could not load image' : 'Image coming soon'}
                            </Text>
                        </View>
                    )}

                    <Text style={styles.description}>{item.description}</Text>

                    <View style={styles.keyFactBox}>
                        <MaterialIcons name="lightbulb" size={16} color={theme.colors.accent} />
                        <Text style={styles.keyFactText}> {item.keyFact}</Text>
                    </View>
                </Card.Content>
            )}
        </Card>
    );
};


// ── Main screen ─────────────────────────────────────────────
const VirtualMuseumScreen = () => {
    const [activeCategory, setActiveCategory] = useState('All');

    const filtered = activeCategory === 'All'
        ? MUSEUM_ITEMS
        : MUSEUM_ITEMS.filter(i => i.category === activeCategory);

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerText}>🏛️ Virtual Museum</Text>
                <Text style={styles.subText}>
                    Tap any spotter to see its image and key public-health facts.
                </Text>

                {/* Category filter chips */}
                <View style={styles.chipRow}>
                    {CATEGORIES.map(cat => (
                        <Chip
                            key={cat}
                            selected={activeCategory === cat}
                            selectedColor={theme.colors.primary}
                            onPress={() => setActiveCategory(cat)}
                            style={[styles.chip, activeCategory === cat && styles.chipActive]}
                            textStyle={activeCategory === cat ? styles.chipTextActive : { color: '#374151' }}
                        >
                            {cat}
                        </Chip>
                    ))}
                </View>

                {filtered.map(item => (
                    <MuseumCard key={item.id} item={item} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.backgroundMain },
    container: { padding: 16, paddingBottom: 48 },
    headerText: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textTitle, marginBottom: 4 },
    subText: { color: theme.colors.textTertiary, marginBottom: 16, lineHeight: 20 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { backgroundColor: theme.colors.surfaceSecondary },
    chipActive: { backgroundColor: theme.colors.primaryLight },
    chipTextActive: { color: theme.colors.primary, fontWeight: 'bold' },
    card: { marginBottom: 10, backgroundColor: theme.colors.surfacePrimary, borderRadius: 12, elevation: 2 },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', padding: 14, paddingRight: 12,
    },
    cardHeaderLeft: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: theme.colors.textTitle, marginBottom: 2 },
    cardSubtitle: { color: theme.colors.secondary, fontSize: 11, fontWeight: '600' },
    expandedContent: { paddingTop: 0, paddingBottom: 14 },
    imageWrapper: { width: '100%', height: 200, marginBottom: 14, borderRadius: 10, overflow: 'hidden', backgroundColor: theme.colors.surfaceTertiary },
    imageLoadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceSecondary },
    itemImage: { width: '100%', height: '100%' },
    imagePlaceholder: { width: '100%', height: 140, borderRadius: 10, marginBottom: 14, backgroundColor: theme.colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
    placeholderEmoji: { fontSize: 48, marginBottom: 6 },
    placeholderText: { color: theme.colors.textPlaceholder, fontSize: 13 },
    description: { color: '#374151', lineHeight: 22, marginBottom: 12 },
    keyFactBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: theme.colors.warningBackground, padding: 10, borderRadius: 8 },
    keyFactText: { color: theme.colors.warningText, fontSize: 13, flex: 1, lineHeight: 18 },
});

export default VirtualMuseumScreen;
