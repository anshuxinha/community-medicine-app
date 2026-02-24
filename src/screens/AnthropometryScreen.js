import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Title, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

const BMI_CATEGORIES_ASIAN = [
    { max: 18.5, label: 'Underweight', color: '#3B82F6' },
    { max: 23.0, label: 'Normal', color: '#15803D' },
    { max: 25.0, label: 'Overweight', color: '#D97706' },
    { max: Infinity, label: 'Obese', color: '#B91C1C' },
];

const AnthropometryScreen = () => {
    // BMI
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bmiResult, setBmiResult] = useState(null);

    // EDD
    const [lmpDate, setLmpDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [eddResult, setEddResult] = useState(null);

    const calculateBMI = () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
            setBmiResult({ error: 'Please enter valid height (cm) and weight (kg).' });
            return;
        }
        const hM = h / 100;
        const bmi = w / (hM * hM);
        const category = BMI_CATEGORIES_ASIAN.find(c => bmi < c.max);
        setBmiResult({ bmi: bmi.toFixed(1), category: category.label, color: category.color });
    };

    const formatDate = (d) =>
        d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const calculateEDD = () => {
        // Naegele's Rule: +9 months +7 days (or equivalently: +280 days) from LMP
        const edd = new Date(lmpDate);
        edd.setMonth(edd.getMonth() + 9);
        edd.setDate(edd.getDate() + 7);

        // Gestational age today
        const today = new Date();
        const diffMs = today - lmpDate;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(diffDays / 7);
        const days = diffDays % 7;

        // AOG string
        let aog = '';
        if (diffDays < 0) {
            aog = 'LMP is in the future';
        } else if (weeks > 42) {
            aog = `Post-term (${weeks}w ${days}d)`;
        } else {
            aog = `${weeks} weeks, ${days} days`;
        }

        setEddResult({ edd: formatDate(edd), lmp: formatDate(lmpDate), aog });
    };

    const onDateChange = (_, selectedDate) => {
        setShowPicker(Platform.OS === 'ios'); // keep open on iOS
        if (selectedDate) setLmpDate(selectedDate);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>

                {/* ── BMI ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>BMI Calculator</Title>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            Uses Asian Indian cut-offs (WHO 2004)
                        </Text>
                        <TextInput
                            label="Height (cm)"
                            value={height}
                            onChangeText={setHeight}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                        />
                        <TextInput
                            label="Weight (kg)"
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                        />
                        <Button mode="contained" onPress={calculateBMI} style={styles.calcButton}>
                            Calculate BMI
                        </Button>

                        {bmiResult && (
                            bmiResult.error ? (
                                <Text style={{ color: 'red', marginTop: 8 }}>{bmiResult.error}</Text>
                            ) : (
                                <View style={[styles.resultBox, { borderLeftColor: bmiResult.color }]}>
                                    <Text variant="displaySmall" style={{ fontWeight: 'bold', color: bmiResult.color }}>
                                        {bmiResult.bmi}
                                    </Text>
                                    <Text variant="titleMedium" style={{ color: bmiResult.color }}>
                                        {bmiResult.category}
                                    </Text>
                                    <Divider style={{ marginVertical: 8 }} />
                                    <Text variant="bodySmall" style={{ color: '#6B7280' }}>
                                        Asian Cut-offs: Normal 18.5–22.9 | Overweight 23–24.9 | Obese ≥25
                                    </Text>
                                </View>
                            )
                        )}
                    </Card.Content>
                </Card>

                {/* ── EDD ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>EDD Calculator</Title>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            Naegele's Rule: LMP + 9 months + 7 days
                        </Text>

                        <Button
                            mode="outlined"
                            icon="calendar"
                            onPress={() => setShowPicker(true)}
                            style={styles.input}
                        >
                            LMP: {formatDate(lmpDate)}
                        </Button>

                        {showPicker && (
                            <DateTimePicker
                                value={lmpDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                maximumDate={new Date()}
                                onChange={onDateChange}
                            />
                        )}

                        <Button mode="contained" onPress={calculateEDD} style={styles.calcButton}>
                            Calculate EDD
                        </Button>

                        {eddResult && (
                            <View style={[styles.resultBox, { borderLeftColor: '#8A2BE2' }]}>
                                <Text variant="titleMedium" style={{ color: '#6B7280' }}>LMP</Text>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{eddResult.lmp}</Text>
                                <Divider style={{ marginVertical: 8 }} />
                                <Text variant="titleMedium" style={{ color: '#6B7280' }}>Expected Date of Delivery</Text>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: '#8A2BE2' }}>
                                    {eddResult.edd}
                                </Text>
                                <Divider style={{ marginVertical: 8 }} />
                                <Text variant="titleMedium" style={{ color: '#6B7280' }}>Current AOG</Text>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold', color: '#111827' }}>
                                    {eddResult.aog}
                                </Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FBFCFE' },
    container: { padding: 16, paddingBottom: 48 },
    card: { marginBottom: 16, backgroundColor: '#FFF' },
    subtitle: { color: '#6B7280', marginBottom: 8 },
    input: { marginTop: 8, marginBottom: 4, backgroundColor: '#FFF' },
    calcButton: { marginTop: 16, paddingVertical: 6, backgroundColor: '#8A2BE2' },
    resultBox: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        borderLeftWidth: 4,
    },
});

export default AnthropometryScreen;
