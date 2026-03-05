import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import foodData from '../data/foodData.json';
import { theme } from '../styles/theme';

// Reference Daily Intakes (ICMR 2020)
const REFERENCE_VALUES = {
    man_sedentary: { label: 'Reference Man (Sedentary)', kcal: 2110, protein: 54, fat: 70 },
    woman_sedentary: { label: 'Reference Woman (Sedentary)', kcal: 1660, protein: 46, fat: 55 },
    man_moderate: { label: 'Reference Man (Moderate)', kcal: 2710, protein: 54, fat: 90 },
    woman_moderate: { label: 'Reference Woman (Moderate)', kcal: 2130, protein: 46, fat: 71 },
    man_heavy: { label: 'Reference Man (Heavy)', kcal: 3470, protein: 54, fat: 116 },
    woman_heavy: { label: 'Reference Woman (Heavy)', kcal: 2720, protein: 46, fat: 91 },
};

const DietarySurveyScreen = () => {
    const [rows, setRows] = useState([{ foodId: foodData[0].id, grams: '' }]);
    const [referenceKey, setReferenceKey] = useState('man_sedentary');
    const [result, setResult] = useState(null);

    const addRow = () => setRows([...rows, { foodId: foodData[0].id, grams: '' }]);

    const removeRow = (index) => {
        if (rows.length === 1) return;
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateRow = (index, field, value) => {
        const updated = [...rows];
        updated[index][field] = value;
        setRows(updated);
    };

    const calculate = () => {
        let totalKcal = 0, totalProtein = 0, totalFat = 0;
        for (const row of rows) {
            const grams = parseFloat(row.grams);
            if (isNaN(grams) || grams <= 0) continue;
            const food = foodData.find(f => f.id === row.foodId);
            if (!food) continue;
            const factor = grams / 100;
            totalKcal += food.calories * factor;
            totalProtein += food.protein * factor;
            totalFat += food.fat * factor;
        }

        const ref = REFERENCE_VALUES[referenceKey];
        setResult({
            kcal: totalKcal, protein: totalProtein, fat: totalFat,
            kcalDiff: ((totalKcal - ref.kcal) / ref.kcal * 100).toFixed(1),
            proteinDiff: ((totalProtein - ref.protein) / ref.protein * 100).toFixed(1),
            fatDiff: ((totalFat - ref.fat) / ref.fat * 100).toFixed(1),
            refLabel: ref.label, ref,
        });
    };

    const diffColor = (val) => parseFloat(val) >= 0 ? '#15803D' : '#B91C1C';
    const diffLabel = (val) => parseFloat(val) >= 0 ? `+${val}% Surplus` : `${val}% Deficit`;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>

                {/* Reference selector */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Reference Standard</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={referenceKey}
                                onValueChange={setReferenceKey}
                                style={{ color: theme.colors.textTitle }}
                                dropdownIconColor={theme.colors.textTitle}
                            >
                                {Object.entries(REFERENCE_VALUES).map(([k, v]) => (
                                    <Picker.Item key={k} label={v.label} value={k} color={theme.colors.textTitle} style={{ fontSize: 14 }} />
                                ))}
                            </Picker>
                        </View>
                    </Card.Content>
                </Card>

                {/* Food rows */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Food Items</Text>
                        {rows.map((row, index) => (
                            <View key={index} style={styles.rowContainer}>
                                <View style={styles.pickerContainerSmall}>
                                    <Picker
                                        selectedValue={row.foodId}
                                        onValueChange={(v) => updateRow(index, 'foodId', v)}
                                        style={{ height: 44, color: theme.colors.textTitle }}
                                        dropdownIconColor={theme.colors.textTitle}
                                    >
                                        {foodData.map(f => (
                                            <Picker.Item key={f.id} label={f.name} value={f.id} style={{ fontSize: 13, color: theme.colors.textTitle, backgroundColor: theme.colors.surfacePrimary }} />
                                        ))}
                                    </Picker>
                                </View>
                                <TextInput
                                    label="g"
                                    value={row.grams}
                                    onChangeText={(v) => updateRow(index, 'grams', v)}
                                    keyboardType="numeric"
                                    mode="outlined" textColor={theme.colors.textTitle}
                                    style={styles.gramInput}
                                    dense
                                />
                                <TouchableOpacity onPress={() => removeRow(index)} style={styles.removeBtn}>
                                    <Text style={{ color: '#B91C1C', fontSize: 20 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                        <Button icon="plus" mode="outlined" textColor={theme.colors.textTitle} onPress={addRow} style={{ marginTop: 8 }}>
                            Add Item
                        </Button>
                    </Card.Content>
                </Card>

                <Button mode="contained" onPress={calculate} style={styles.calcButton}>
                    Calculate Intake
                </Button>

                {/* Results */}
                {result && (
                    <Card style={styles.resultCard}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Results vs {result.refLabel}</Text>
                            <Divider style={{ marginVertical: 8 }} />

                            {[
                                { label: 'Calories', unit: 'kcal', got: result.kcal.toFixed(0), ref: result.ref.kcal, diff: result.kcalDiff },
                                { label: 'Protein', unit: 'g', got: result.protein.toFixed(1), ref: result.ref.protein, diff: result.proteinDiff },
                                { label: 'Fat', unit: 'g', got: result.fat.toFixed(1), ref: result.ref.fat, diff: result.fatDiff },
                            ].map(row => (
                                <View key={row.label} style={styles.resultRow}>
                                    <Text style={styles.resultLabel}>{row.label}</Text>
                                    <Text style={{ color: theme.colors.textTitle, fontWeight: '600', fontSize: 15 }}>{row.got} {row.unit}</Text>
                                    <Text style={{ color: theme.colors.textSecondary }}>Ref: {row.ref} {row.unit}</Text>
                                    <Text style={{ color: diffColor(row.diff), fontWeight: 'bold' }}>
                                        {diffLabel(row.diff)}
                                    </Text>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.backgroundMain },
    container: { padding: 16, paddingBottom: 48 },
    card: { marginBottom: 16, backgroundColor: theme.colors.surfacePrimary },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textTitle, marginBottom: 8 },
    pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, marginTop: 8, backgroundColor: theme.colors.surfacePrimary },
    pickerContainerSmall: {
        flex: 2, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 4, marginRight: 8, backgroundColor: theme.colors.surfacePrimary,
    },
    rowContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    gramInput: { flex: 1, backgroundColor: theme.colors.surfacePrimary },
    removeBtn: { marginLeft: 8, padding: 4, justifyContent: 'center', alignItems: 'center' },
    calcButton: { marginVertical: 16, paddingVertical: 8, backgroundColor: theme.colors.secondary },
    resultCard: { backgroundColor: '#F3E8FF', marginBottom: 32 },
    resultRow: { marginVertical: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.primaryLight },
    resultLabel: { fontWeight: 'bold', fontSize: 16, color: theme.colors.textTitle, marginBottom: 2 },
});

export default DietarySurveyScreen;
