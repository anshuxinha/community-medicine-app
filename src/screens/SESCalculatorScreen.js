import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { TextInput, Button, Card, Text, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker'; // requires @react-native-picker/picker

const EDUCATION_OPTIONS = [
    { label: 'Profession or Honours', value: 7 },
    { label: 'Graduate or Postgraduate', value: 6 },
    { label: 'Intermediate or Post high school diploma', value: 5 },
    { label: 'High school certificate', value: 4 },
    { label: 'Middle school certificate', value: 3 },
    { label: 'Primary school certificate', value: 2 },
    { label: 'Illiterate', value: 1 },
];

const OCCUPATION_OPTIONS = [
    { label: 'Profession', value: 10 },
    { label: 'Semi-Profession', value: 6 },
    { label: 'Clerical, Shop-owner, Farmer', value: 5 },
    { label: 'Skilled worker', value: 4 },
    { label: 'Semi-skilled worker', value: 3 },
    { label: 'Unskilled worker', value: 2 },
    { label: 'Unemployed', value: 1 },
];

const SESCalculatorScreen = () => {
    const [scaleType, setScaleType] = useState('kuppuswamy'); // 'kuppuswamy' or 'bgprasad'

    // Kuppuswamy State
    const [education, setEducation] = useState(EDUCATION_OPTIONS[0].value);
    const [occupation, setOccupation] = useState(OCCUPATION_OPTIONS[0].value);
    const [familyIncome, setFamilyIncome] = useState('');

    // BG Prasad State
    const [perCapitaIncome, setPerCapitaIncome] = useState('');
    const [cpi, setCpi] = useState('400'); // CPI only needed for BG Prasad

    // Result
    const [result, setResult] = useState(null);

    const calculateKuppuswamy = () => {
        if (!familyIncome || isNaN(Number(familyIncome))) {
            setResult({ error: 'Please enter a valid number for Monthly Family Income' });
            return;
        }

        const income = Number(familyIncome);

        // Kuppuswamy income scoring uses fixed 2001-base thresholds (no CPI adjustment)
        let incomeScore = 1;
        if (income >= 2000) incomeScore = 12;
        else if (income >= 1000) incomeScore = 10;
        else if (income >= 750) incomeScore = 6;
        else if (income >= 500) incomeScore = 4;
        else if (income >= 300) incomeScore = 3;
        else if (income >= 100) incomeScore = 2;
        else incomeScore = 1;

        const totalScore = education + occupation + incomeScore;

        let sesClass = '';
        if (totalScore >= 26) sesClass = 'Upper (Class I)';
        else if (totalScore >= 16) sesClass = 'Upper Middle (Class II)';
        else if (totalScore >= 11) sesClass = 'Lower Middle (Class III)';
        else if (totalScore >= 5) sesClass = 'Upper Lower (Class IV)';
        else sesClass = 'Lower (Class V)';

        setResult({
            score: totalScore,
            class: sesClass,
            details: `Education: ${education} | Occupation: ${occupation} | Income Score: ${incomeScore}`
        });
    };

    const calculateBGPrasad = () => {
        if (!perCapitaIncome || isNaN(Number(perCapitaIncome)) || !cpi || isNaN(Number(cpi))) {
            setResult({ error: 'Please enter valid numbers for Income and CPI' });
            return;
        }

        const currentCPI = Number(cpi);
        const conversionFactor = currentCPI / 100; // Base 2001 = 100
        const baseIncome = Number(perCapitaIncome) / conversionFactor;

        let sesClass = '';
        if (baseIncome >= 1000) sesClass = 'Upper (Class I)';
        else if (baseIncome >= 500) sesClass = 'Upper Middle (Class II)';
        else if (baseIncome >= 300) sesClass = 'Middle (Class III)';
        else if (baseIncome >= 150) sesClass = 'Lower Middle (Class IV)';
        else sesClass = 'Lower (Class V)';

        setResult({
            class: sesClass,
            details: `Base Adjusted Per Capita Income: ₹${baseIncome.toFixed(2)}`
        });
    };

    const handleCalculate = () => {
        if (scaleType === 'kuppuswamy') calculateKuppuswamy();
        else calculateBGPrasad();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>

                {/* Scale Selector */}
                <Card style={styles.card}>
                    <Card.Content>
                        <SegmentedButtons
                            value={scaleType}
                            onValueChange={(val) => { setScaleType(val); setResult(null); }}
                            buttons={[
                                { value: 'kuppuswamy', label: 'Kuppuswamy (Urban)' },
                                { value: 'bgprasad', label: 'BG Prasad (Rural)' },
                            ]}
                        />
                    </Card.Content>
                </Card>

                {scaleType === 'kuppuswamy' ? (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Modified Kuppuswamy Scale</Text>

                            <Text style={styles.label}>Education of Head of Family</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={education}
                                    onValueChange={(itemValue) => setEducation(itemValue)}
                                    style={{ color: '#111827' }}
                                    dropdownIconColor="#111827"
                                >
                                    {EDUCATION_OPTIONS.map((opt) => (
                                        <Picker.Item key={opt.value} label={`${opt.label} (${opt.value})`} value={opt.value} color="#111827" style={{ fontSize: 14 }} />
                                    ))}
                                </Picker>
                            </View>

                            <Text style={styles.label}>Occupation of Head of Family</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={occupation}
                                    onValueChange={(itemValue) => setOccupation(itemValue)}
                                    style={{ color: '#111827' }}
                                    dropdownIconColor="#111827"
                                >
                                    {OCCUPATION_OPTIONS.map((opt) => (
                                        <Picker.Item key={opt.value} label={`${opt.label} (${opt.value})`} value={opt.value} color="#111827" style={{ fontSize: 14 }} />
                                    ))}
                                </Picker>
                            </View>

                            <TextInput
                                label="Total Monthly Family Income (₹)"
                                value={familyIncome}
                                onChangeText={setFamilyIncome}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />
                        </Card.Content>
                    </Card>
                ) : (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>BG Prasad Scale</Text>

                            <TextInput
                                label="Current CPI (Base 2001 = 100)"
                                value={cpi}
                                onChangeText={setCpi}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                            />

                            <TextInput
                                label="Per Capita Monthly Income (₹)"
                                value={perCapitaIncome}
                                onChangeText={setPerCapitaIncome}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                placeholder="Total Family Income / Family Size"
                            />
                        </Card.Content>
                    </Card>
                )}

                <Button mode="contained" onPress={handleCalculate} style={styles.calcButton}>
                    Calculate SES
                </Button>

                {result && (
                    <Card style={styles.resultCard}>
                        <Card.Content>
                            {result.error ? (
                                <Text style={{ color: 'red' }}>{result.error}</Text>
                            ) : (
                                <>
                                    <Text style={styles.resultTitle}>Result: {result.class}</Text>
                                    {result.score !== undefined && (
                                        <Text variant="titleMedium" style={{ color: '#111827' }}>Total Score: {result.score}</Text>
                                    )}
                                    <Text style={{ marginTop: 8, color: '#6B7280' }}>{result.details}</Text>
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFE',
    },
    container: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        backgroundColor: '#FFFFFF',
    },
    input: {
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    label: {
        marginTop: 16,
        color: '#4B5563',
        fontWeight: 'bold',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 4,
        marginTop: 8,
        backgroundColor: '#FFFFFF',
    },
    calcButton: {
        marginVertical: 16,
        paddingVertical: 8,
        backgroundColor: '#8A2BE2',
    },
    resultCard: {
        backgroundColor: '#F3E8FF',
        marginBottom: 32,
    },
    resultTitle: {
        color: '#6B21A8',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    }
});

export default SESCalculatorScreen;
