import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { TextInput, Button, Card, Text, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropdownPicker from '../components/DropdownPicker';
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
    DEFAULT_CPI_IW,
    DEFAULT_CPI_IW_LABEL,
    calculateKuppuswamy,
    calculateBGPrasad,
    formatSlabRange,
} from '../utils/sesCalculator';

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
  const { styles, colors } = useThemedStyles(createStyles);

    const [scaleType, setScaleType] = useState('kuppuswamy'); // 'kuppuswamy' or 'bgprasad'

    // Kuppuswamy State
    const [education, setEducation] = useState(EDUCATION_OPTIONS[0].value);
    const [occupation, setOccupation] = useState(OCCUPATION_OPTIONS[0].value);
    const [familyIncome, setFamilyIncome] = useState('');

    // BG Prasad State
    const [perCapitaIncome, setPerCapitaIncome] = useState('');
    const [cpi, setCpi] = useState(String(DEFAULT_CPI_IW));
    const [kCpi, setKCpi] = useState(String(DEFAULT_CPI_IW));

    // Result
    const [result, setResult] = useState(null);

    const handleCalculate = () => {
        if (scaleType === 'kuppuswamy') {
            setResult(calculateKuppuswamy({
                education,
                occupation,
                familyIncome,
                cpi: kCpi,
            }));
        } else {
            setResult(calculateBGPrasad({
                perCapitaIncome,
                cpi,
            }));
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.hintContainer}>
                    <Text style={styles.hintText}>
                        Default CPI-IW is {DEFAULT_CPI_IW} ({DEFAULT_CPI_IW_LABEL}; base 2016 = 100). Replace it with a newer Labour Bureau month if you have one:{" "}
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
                                label={`CPI-IW (2016=100), default ${DEFAULT_CPI_IW_LABEL}`}
                                value={kCpi}
                                onChangeText={setKCpi}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary}
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
                                textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary}
                            />
                        </Card.Content>
                    </Card>
                ) : (
                    <Card style={styles.card}>
                        <Card.Content>
                            <Text style={styles.sectionTitle}>BG Prasad Scale</Text>

                            <TextInput
                                label={`CPI-IW (2016=100), default ${DEFAULT_CPI_IW_LABEL}`}
                                value={cpi}
                                onChangeText={setCpi}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary}
                            />

                            <TextInput
                                label="Per Capita Monthly Income (₹)"
                                value={perCapitaIncome}
                                onChangeText={setPerCapitaIncome}
                                keyboardType="numeric"
                                mode="outlined"
                                style={styles.input}
                                placeholder="Total Family Income / Family Size"
                                textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary}
                            />
                        </Card.Content>
                    </Card>
                )}

                <Button mode="contained" textColor={colors.buttonText} onPress={handleCalculate} style={styles.calcButton}>
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
                                        <Text variant="titleMedium" style={{ color: theme.colors.textTitle }}>Total Score: {result.score} (income score {result.incomeScore})</Text>
                                    )}
                                    <Text style={{ marginTop: 8, color: theme.colors.textTertiary }}>
                                        CPI-IW {result.cpi} ({DEFAULT_CPI_IW_LABEL})
                                    </Text>
                                    {result.slabs ? (
                                        <View style={{ marginTop: 10 }}>
                                            <Text style={{ fontWeight: 'bold', color: theme.colors.textTitle, marginBottom: 4 }}>
                                                Income slabs at this CPI
                                            </Text>
                                            {result.slabs.map((slab) => (
                                                <Text key={slab.score || slab.label} style={{ color: theme.colors.textTertiary, marginBottom: 2 }}>
                                                    {slab.score != null
                                                        ? `Score ${slab.score}: ${formatSlabRange(slab.min, slab.maxExclusive)}`
                                                        : `${slab.label}: ${formatSlabRange(slab.min, slab.maxExclusive)}`}
                                                </Text>
                                            ))}
                                        </View>
                                    ) : null}
                                </>
                            )}
                        </Card.Content>
                    </Card>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (colors) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.backgroundMain,
    },
    container: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 16,
    },
    hintContainer: {
        backgroundColor: colors.warningBackground,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.warning,
    },
    hintText: {
        color: colors.warningText,
        fontSize: 14,
        lineHeight: 20,
    },
    linkText: {
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    card: {
        marginBottom: 16,
        backgroundColor: colors.surfacePrimary,
    },
    input: {
        marginTop: 8,
        marginBottom: 8,
        backgroundColor: colors.surfacePrimary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textTitle,
        marginBottom: 8,
    },
    label: {
        marginTop: 16,
        color: colors.textSecondary,
        fontWeight: 'bold',
    },
    calcButton: {
        marginVertical: 16,
        paddingVertical: 8,
        backgroundColor: colors.secondary,
    },
    resultCard: {
        backgroundColor: colors.primarySoft,
        marginBottom: 32,
    },
    resultTitle: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    }
});

export default SESCalculatorScreen;
