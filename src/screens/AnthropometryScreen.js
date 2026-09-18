import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Divider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';
import {
    bmiFromCmKg,
    interpretMuac,
    calculateIbw,
} from '../utils/anthropometry';

/* ─── Waist-Hip Ratio risk (WHO) ────────────────────────────────────────── */
const whrRisk = (whr, sex) => {
    if (sex === 'male') {
        if (whr < 0.90) return { label: 'Low Risk', color: '#15803D' };
        if (whr < 1.00) return { label: 'Moderate Risk', color: theme.colors.accent };
        return { label: 'High Risk', color: '#B91C1C' };
    } else {
        if (whr < 0.80) return { label: 'Low Risk', color: '#15803D' };
        if (whr < 0.85) return { label: 'Moderate Risk', color: theme.colors.accent };
        return { label: 'High Risk', color: '#B91C1C' };
    }
};

const AnthropometryScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);

    /* ── BMI state ─────────────────────────────────────────────────────── */
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [bmiResult, setBmiResult] = useState(null);

    /* ── WHR state ─────────────────────────────────────────────────────── */
    const [waistWHR, setWaistWHR] = useState('');
    const [hipWHR, setHipWHR] = useState('');
    const [whrSex, setWhrSex] = useState('male');
    const [whrResult, setWhrResult] = useState(null);

    /* ── WHtR state ────────────────────────────────────────────────────── */
    const [waistWHtR, setWaistWHtR] = useState('');
    const [heightWHtR, setHeightWHtR] = useState('');
    const [whtRResult, setWhtRResult] = useState(null);

    /* ── MUAC state ────────────────────────────────────────────────────── */
    const [muacValue, setMuacValue] = useState('');
    const [muacMode, setMuacMode] = useState('child'); // 'child' | 'adult'
    const [muacResult, setMuacResult] = useState(null);

    /* ── IBW state ─────────────────────────────────────────────────────── */
    const [ibwHeight, setIbwHeight] = useState('');
    const [ibwWeight, setIbwWeight] = useState('');
    const [ibwSex, setIbwSex] = useState('male');
    const [ibwMethod, setIbwMethod] = useState('broca');
    const [ibwResult, setIbwResult] = useState(null);

    /* ── Calculators ───────────────────────────────────────────────────── */
    const calculateBMI = () => {
        const result = bmiFromCmKg(height, weight);
        if (result.error) {
            setBmiResult(result);
            return;
        }
        setBmiResult({ ...result, bmi: result.bmi.toFixed(1) });
    };

    const calculateWHR = () => {
        const w = parseFloat(waistWHR);
        const h = parseFloat(hipWHR);
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            setWhrResult({ error: 'Enter valid waist and hip measurements (cm).' });
            return;
        }
        const whr = w / h;
        const risk = whrRisk(whr, whrSex);
        setWhrResult({ whr: whr.toFixed(2), ...risk });
    };

    const calculateWHtR = () => {
        const w = parseFloat(waistWHtR);
        const h = parseFloat(heightWHtR);
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            setWhtRResult({ error: 'Enter valid waist (cm) and height (cm).' });
            return;
        }
        const ratio = w / h;
        let label, color;
        if (ratio < 0.40) { label = 'Underweight Risk'; color = theme.colors.chartBlue; }
        else if (ratio < 0.50) { label = 'Healthy'; color = '#15803D'; }
        else if (ratio < 0.60) { label = 'Overweight Risk'; color = theme.colors.accent; }
        else { label = 'Obese — High Metabolic Risk'; color = '#B91C1C'; }
        setWhtRResult({ ratio: ratio.toFixed(3), label, color });
    };

    const calculateMUAC = () => {
        const result = interpretMuac(muacValue, muacMode);
        if (result.error) {
            setMuacResult(result);
            return;
        }
        setMuacResult({ ...result, muac: result.muac.toFixed(1) });
    };

    const calculateIBW = () => {
        const result = calculateIbw({
            heightCm: ibwHeight,
            sex: ibwSex,
            method: ibwMethod,
            actualKg: ibwWeight,
        });
        if (result.error) {
            setIbwResult(result);
            return;
        }
        setIbwResult({ ...result, ibw: result.ibw.toFixed(1) });
    };

    /* ── Shared result box ─────────────────────────────────────────────── */
    const ResultBox = ({ color, children }) => (
        <View style={[styles.resultBox, { borderLeftColor: color || theme.colors.secondary }]}>
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>

                {/* ── 1. BMI ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>BMI Calculator</Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            Asian Indian cut-offs (WHO 2004)
                        </Text>
                        <TextInput label="Height (cm)" value={height} onChangeText={setHeight}
                            keyboardType="numeric" mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight}
                            keyboardType="numeric" mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <Button mode="contained" textColor="#FFFFFF" onPress={calculateBMI} style={styles.calcButton}>
                            Calculate BMI
                        </Button>
                        {bmiResult && (bmiResult.error
                            ? <Text style={styles.errorText}>{bmiResult.error}</Text>
                            : <ResultBox color={bmiResult.color}>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: bmiResult.color }}>
                                    {bmiResult.bmi}
                                </Text>
                                <Text variant="titleMedium" style={{ color: bmiResult.color }}>
                                    {bmiResult.category}
                                </Text>
                                <Divider style={{ marginVertical: 8 }} />
                                <Text variant="bodySmall" style={styles.noteText}>
                                    Normal: 18.5–22.9 | Overweight: 23–24.9 | Obese: ≥25
                                </Text>
                            </ResultBox>
                        )}
                    </Card.Content>
                </Card>

                {/* ── 2. Waist-Hip Ratio ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Waist-Hip Ratio (WHR)</Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            WHO cut-offs for cardiovascular risk
                        </Text>
                        <SegmentedButtons
                            value={whrSex}
                            onValueChange={setWhrSex}
                            buttons={[
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                            ]}
                            style={styles.segmented}
                        />
                        <TextInput label="Waist circumference (cm)" value={waistWHR}
                            onChangeText={setWaistWHR} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <TextInput label="Hip circumference (cm)" value={hipWHR}
                            onChangeText={setHipWHR} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <Button mode="contained" textColor="#FFFFFF" onPress={calculateWHR} style={styles.calcButton}>
                            Calculate WHR
                        </Button>
                        {whrResult && (whrResult.error
                            ? <Text style={styles.errorText}>{whrResult.error}</Text>
                            : <ResultBox color={whrResult.color}>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: whrResult.color }}>
                                    {whrResult.whr}
                                </Text>
                                <Text variant="titleMedium" style={{ color: whrResult.color }}>
                                    {whrResult.label}
                                </Text>
                                <Divider style={{ marginVertical: 8 }} />
                                <Text variant="bodySmall" style={styles.noteText}>
                                    {whrSex === 'male'
                                        ? 'Low: <0.90 | Moderate: 0.90–0.99 | High: ≥1.00'
                                        : 'Low: <0.80 | Moderate: 0.80–0.84 | High: ≥0.85'}
                                </Text>
                            </ResultBox>
                        )}
                    </Card.Content>
                </Card>

                {/* ── 3. Waist-to-Height Ratio ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Waist-to-Height Ratio (WHtR)</Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            Metabolic syndrome risk — boundary: 0.5
                        </Text>
                        <TextInput label="Waist circumference (cm)" value={waistWHtR}
                            onChangeText={setWaistWHtR} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <TextInput label="Height (cm)" value={heightWHtR}
                            onChangeText={setHeightWHtR} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <Button mode="contained" textColor="#FFFFFF" onPress={calculateWHtR} style={styles.calcButton}>
                            Calculate WHtR
                        </Button>
                        {whtRResult && (whtRResult.error
                            ? <Text style={styles.errorText}>{whtRResult.error}</Text>
                            : <ResultBox color={whtRResult.color}>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: whtRResult.color }}>
                                    {whtRResult.ratio}
                                </Text>
                                <Text variant="titleMedium" style={{ color: whtRResult.color }}>
                                    {whtRResult.label}
                                </Text>
                                <Divider style={{ marginVertical: 8 }} />
                                <Text variant="bodySmall" style={styles.noteText}>
                                    {'<'}0.40 Underweight | 0.40–0.49 Healthy | 0.50–0.59 Overweight | ≥0.60 Obese
                                </Text>
                            </ResultBox>
                        )}
                    </Card.Content>
                </Card>

                {/* ── 4. MUAC ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>MUAC</Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            Mid-Upper Arm Circumference — nutritional status assessment
                        </Text>

                        {/* Mode toggle */}
                        <SegmentedButtons
                            value={muacMode}
                            onValueChange={(v) => { setMuacMode(v); setMuacResult(null); }}
                            buttons={[
                                { value: 'child', label: 'Child 6-59 mo' },
                                { value: 'adult', label: 'Adult' },
                                { value: 'pregnant', label: 'Pregnant' },
                            ]}
                            style={styles.segmented}
                        />

                        <TextInput label="MUAC (cm)" value={muacValue}
                            onChangeText={setMuacValue} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        <Button mode="contained" textColor="#FFFFFF" onPress={calculateMUAC} style={styles.calcButton}>
                            Interpret MUAC
                        </Button>

                        {muacResult && (muacResult.error
                            ? <Text style={styles.errorText}>{muacResult.error}</Text>
                            : <ResultBox color={muacResult.color}>
                                {/* Result value + label */}
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: muacResult.color }}>
                                    {muacResult.muac} cm
                                </Text>
                                <Text variant="titleMedium" style={{ color: muacResult.color }}>
                                    {muacResult.label}
                                </Text>

                                {/* Child: colour-band indicator */}
                                {muacResult.mode === 'child' && (
                                    <View style={styles.muacBandRow}>
                                        {[{ band: 'RED', color: '#B91C1C', label: 'SAM' },
                                        { band: 'YELLOW', color: theme.colors.accent, label: 'MAM' },
                                        { band: 'GREEN', color: '#15803D', label: 'Normal' }]
                                            .map(b => (
                                                <View key={b.band} style={[
                                                    styles.muacBandChip,
                                                    { backgroundColor: b.color + '22', borderColor: b.color },
                                                    muacResult.band === b.band && { backgroundColor: b.color },
                                                ]}>
                                                    <Text style={[
                                                        styles.muacBandText,
                                                        { color: muacResult.band === b.band ? theme.colors.surfacePrimary : b.color },
                                                    ]}>{b.label}</Text>
                                                </View>
                                            ))
                                        }
                                    </View>
                                )}

                                <Divider style={{ marginVertical: 10 }} />

                                {/* Reference table */}
                                {muacResult.mode === 'child' ? (
                                    <>
                                        <Text style={[styles.noteText, { fontWeight: '700', marginBottom: 4 }]}>
                                            WHO SMART: children 6-59 months
                                        </Text>
                                        <View style={styles.refRow}>
                                            <View style={[styles.refDot, { backgroundColor: '#B91C1C' }]} />
                                            <Text style={styles.noteText}>{'<'}11.5 cm: SAM. Refer for therapeutic feeding.</Text>
                                        </View>
                                        <View style={styles.refRow}>
                                            <View style={[styles.refDot, { backgroundColor: theme.colors.accent }]} />
                                            <Text style={styles.noteText}>11.5-12.4 cm: MAM. Supplementary feeding.</Text>
                                        </View>
                                        <View style={styles.refRow}>
                                            <View style={[styles.refDot, { backgroundColor: '#15803D' }]} />
                                            <Text style={styles.noteText}>≥12.5 cm: Normal / well-nourished</Text>
                                        </View>
                                    </>
                                ) : muacResult.mode === 'pregnant' ? (
                                    <>
                                        <Text style={[styles.noteText, { fontWeight: '700', marginBottom: 4 }]}>
                                            Pregnancy cut-off (ICDS / NHM)
                                        </Text>
                                        <Text style={styles.noteText}>{'<'}23.0 cm: undernourished. Extra ration and counselling.</Text>
                                        <Text style={styles.noteText}>≥23.0 cm: above this programme cut-off</Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={[styles.noteText, { fontWeight: '700', marginBottom: 4 }]}>
                                            Adult field bands (Indian surveys; CED often {'<'}23 cm)
                                        </Text>
                                        <Text style={styles.noteText}>{'<'}19.0 cm: severe undernutrition</Text>
                                        <Text style={styles.noteText}>19.0-21.9 cm: moderate undernutrition</Text>
                                        <Text style={styles.noteText}>22.0-22.9 cm: at risk</Text>
                                        <Text style={styles.noteText}>≥23.0 cm: normal</Text>
                                        <Text style={[styles.noteText, { marginTop: 6, fontStyle: 'italic' }]}>
                                            Source: FANTA adult MUAC practice and NNMB-style {'<'}23 cm CED cut-off.
                                        </Text>
                                    </>
                                )}
                            </ResultBox>
                        )}
                    </Card.Content>
                </Card>

                {/* ── 5. Ideal Body Weight ── */}
                <Card style={styles.card}>
                    <Card.Content>
                        <Text style={styles.sectionTitle}>Ideal Body Weight (IBW)</Text>
                        <Text variant="bodySmall" style={styles.subtitle}>
                            Default Broca (Indian clinico-social). BMI 22 for Asian adults. Devine for drug dosing.
                        </Text>
                        <SegmentedButtons
                            value={ibwMethod}
                            onValueChange={(v) => { setIbwMethod(v); setIbwResult(null); }}
                            buttons={[
                                { value: 'broca', label: 'Broca' },
                                { value: 'bmi22', label: 'BMI 22' },
                                { value: 'devine', label: 'Devine' },
                            ]}
                            style={styles.segmented}
                        />
                        {ibwMethod !== 'bmi22' ? (
                        <SegmentedButtons
                            value={ibwSex}
                            onValueChange={setIbwSex}
                            buttons={[
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                            ]}
                            style={styles.segmented}
                        />
                        ) : null}
                        <TextInput label="Height (cm)" value={ibwHeight}
                            onChangeText={setIbwHeight} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        {ibwMethod === 'devine' ? (
                        <TextInput label="Actual weight (kg), optional for adjusted BW" value={ibwWeight}
                            onChangeText={setIbwWeight} keyboardType="numeric"
                            mode="outlined" textColor={colors.textTitle} placeholderTextColor={colors.textPlaceholder} outlineColor={colors.borderStrong} activeOutlineColor={colors.secondary} style={styles.input} />
                        ) : null}
                        <Button mode="contained" textColor="#FFFFFF" onPress={calculateIBW} style={styles.calcButton}>
                            Calculate IBW
                        </Button>
                        {ibwResult && (ibwResult.error
                            ? <Text style={styles.errorText}>{ibwResult.error}</Text>
                            : <ResultBox color={colors.secondary}>
                                <Text variant="titleMedium" style={{ color: theme.colors.textTertiary }}>Ideal Body Weight</Text>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: theme.colors.secondary }}>
                                    {ibwResult.ibw} kg
                                </Text>
                                {ibwResult.abwNote && (
                                    <>
                                        <Divider style={{ marginVertical: 8 }} />
                                        <Text variant="bodySmall" style={styles.noteText}>
                                            {ibwResult.abwNote}
                                        </Text>
                                    </>
                                )}
                                <Divider style={{ marginVertical: 8 }} />
                                <Text variant="bodySmall" style={styles.noteText}>
                                    {ibwResult.formula}
                                </Text>
                            </ResultBox>
                        )}
                    </Card.Content>
                </Card>

            </ScrollView>
        </SafeAreaView>
    );
};

const createStyles = (colors) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.backgroundMain },
    container: { padding: 16, paddingBottom: 48 },
    card: { marginBottom: 16, backgroundColor: colors.surfacePrimary },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textTitle, marginBottom: 4 },
    subtitle: { color: colors.textTertiary, marginBottom: 8 },
    input: { marginTop: 8, marginBottom: 4, backgroundColor: colors.surfacePrimary },
    segmented: { marginTop: 8, marginBottom: 4 },
    calcButton: { marginTop: 12, paddingVertical: 6, backgroundColor: colors.secondary },
    resultBox: {
        marginTop: 16,
        padding: 16,
        backgroundColor: colors.primaryLight,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    errorText: { color: colors.errorStrong, marginTop: 8 },
    noteText: { color: colors.textTertiary, lineHeight: 18 },
    /* MUAC band chips */
    muacBandRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
        marginBottom: 4,
    },
    muacBandChip: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    muacBandText: { fontSize: 11, fontWeight: '700' },
    refRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    refDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, marginRight: 8, flexShrink: 0 },
});

export default AnthropometryScreen;
