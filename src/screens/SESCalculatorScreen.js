import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Linking } from 'react-native';
import { TextInput, Button, Card, Text, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropdownPicker from '../components/DropdownPicker';
import { theme } from '../styles/theme';

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
    const [cpi, setCpi] = useState('148.6'); // CPI for BG Prasad (Base 2016 = 100)
    const [kCpi, setKCpi] = useState('148.6'); // CPI for Kuppuswamy (Base 2016 = 100)

    // Result
    const [result, setResult] = useState(null);

    const calculateKuppuswamy = () => {
        if (!familyIncome || isNaN(Number(familyIncome)) || !kCpi || isNaN(Number(kCpi))) {
            setResult({ error: 'Please enter valid numbers for Income and CPI' });
            return;
        }

        const income = Number(familyIncome);
        const currentCPI = Number(kCpi);
        const conversionFactor = currentCPI / 100;

        // Thresholds for Base 2016 (CPI = 100)
        const t12 = 51646 * conversionFactor;
        const t10 = 25811 * conversionFactor;
        const t6 = 19351 * conversionFactor;
        const t4 = 12890 * conversionFactor;
        const t3 = 7725 * conversionFactor;
        const t2 = 2586 * conversionFactor;

        let incomeScore = 1;
        if (income >= t12) incomeScore = 12;
        else if (income >= t10) incomeScore = 10;
        else if (income >= t6) incomeScore = 6;
        else if (income >= t4) incomeScore = 4;
        else if (income >= t3) incomeScore = 3;
        else if (income >= t2) incomeScore = 2;
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
            details: `Education: ${education} | Occupation: ${occupation} | Income Score: ${incomeScore} (Threshold Class I: ₹${t12.toFixed(0)})`
        });
    };

    const calculateBGPrasad = () => {
        if (!perCapitaIncome || isNaN(Number(perCapitaIncome)) || !cpi || isNaN(Number(cpi))) {
            setResult({ error: 'Please enter valid numbers for Income and CPI' });
            return;
        }

        const currentCPI = Number(cpi);
        // Multiplication Factor from 1961 to 2016 = 2.88 * 4.63 * 4.93 = 65.731392
        const linkingFactor = 65.731392;
        const conversionFactor = (currentCPI / 100) * linkingFactor;
        
        const income = Number(perCapitaIncome);

        let sesClass = '';
        if (income >= 100 * conversionFactor) sesClass = 'Upper (Class I)';
        else if (income >= 50 * conversionFactor) sesClass = 'Upper Middle (Class II)';
        else if (income >= 30 * conversionFactor) sesClass = 'Middle (Class III)';
        else if (income >= 15 * conversionFactor) sesClass = 'Lower Middle (Class IV)';
        else sesClass = 'Lower (Class V)';

        const classIThreshold = 100 * conversionFactor;

        setResult({
            class: sesClass,
            details: `Threshold for Class I: ₹${classIThreshold.toFixed(0)}`
        });
    };

    const handleCalculate = () => {
        if (scaleType === 'kuppuswamy') calculateKuppuswamy();
        else calculateBGPrasad();
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>
                        Tip: You can get the latest CPI-IW data from the Labour Bureau website:{" "}
                        <Text 
                            style={styles.linkText} 
                            onPress={() => Linking.openURL('https://labourbureau.gov.in')}
                        >
                            labourbureau.gov.in
                        </Text>
                    </Text>
                </View>

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

                            <TextInput
                                label="Current CPI-IW (Base 2016 = 100)"
                                value={kCpi}
                                onChangeText={setKCpi}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                textColor={theme.colors.textTitle}
                            />

                            <Text style={styles.label}>Education of Head of Family</Text>
                            <DropdownPicker
                                selectedValue={education}
                                onValueChange={(itemValue) => setEducation(itemValue)}
                                items={EDUCATION_OPTIONS}
                                labelExtractor={(opt) => `${opt.label} (${opt.value})`}
                            />

                            <Text style={styles.label}>Occupation of Head of Family</Text>
                            <DropdownPicker
                                selectedValue={occupation}
                                onValueChange={(itemValue) => setOccupation(itemValue)}
                                items={OCCUPATION_OPTIONS}
                                labelExtractor={(opt) => `${opt.label} (${opt.value})`}
                            />

                            <TextInput
                                label="Total Monthly Family Income (₹)"
                                value={familyIncome}
                                onChangeText={setFamilyIncome}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                textColor={theme.colors.textTitle}
                            />
                        </Card.Content>
                    </Card>
                ) : (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>BG Prasad Scale</Text>

                            <TextInput
                                label="Current CPI-IW (Base 2016 = 100)"
                                value={cpi}
                                onChangeText={setCpi}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                textColor={theme.colors.textTitle}
                            />

                            <TextInput
                                label="Per Capita Monthly Income (₹)"
                                value={perCapitaIncome}
                                onChangeText={setPerCapitaIncome}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                placeholder="Total Family Income / Family Size"
                                textColor={theme.colors.textTitle}
                            />
                        </Card.Content>
                    </Card>
                )}

                <Button mode="contained" textColor={theme.colors.buttonText} onPress={handleCalculate} style={styles.calcButton}>
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
                                        <Text variant="titleMedium" style={{ color: theme.colors.textTitle }}>Total Score: {result.score}</Text>
                                    )}
                                    <Text style={{ marginTop: 8, color: theme.colors.textTertiary }}>{result.details}</Text>
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
        backgroundColor: theme.colors.backgroundMain,
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
    },
    hintContainer: {
        backgroundColor: theme.colors.warningBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: theme.colors.warning,
    },
    hintText: {
        color: theme.colors.warningText,
        fontSize: 14,
        lineHeight: 20,
    },
    linkText: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    card: {
        marginBottom: 16,
        backgroundColor: theme.colors.surfacePrimary,
    },
    input: {
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: theme.colors.surfacePrimary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textTitle,
        marginBottom: 8,
    },
    label: {
        marginTop: 16,
        color: theme.colors.textSecondary,
        fontWeight: 'bold',
    },
    calcButton: {
        marginVertical: 16,
        paddingVertical: 8,
        backgroundColor: theme.colors.secondary,
    },
    resultCard: {
        backgroundColor: '#F3E8FF',
        marginBottom: 32,
    },
    resultTitle: {
        color: theme.colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    }
});

export default SESCalculatorScreen;
