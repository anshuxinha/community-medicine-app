import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Divider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ─── BMI cut-offs (Asian Indian) ──────────────────────────────────────── */
const BMI_CATEGORIES_ASIAN = [
    { max: 18.5, label: 'Underweight', color: '#3B82F6' },
    { max: 23.0, label: 'Normal', color: '#15803D' },
    { max: 25.0, label: 'Overweight', color: '#D97706' },
    { max: Infinity, label: 'Obese', color: '#B91C1C' },
];

/* ─── Waist-Hip Ratio risk (WHO) ────────────────────────────────────────── */
const whrRisk = (whr, sex) => {
    if (sex === 'male') {
        if (whr < 0.90) return { label: 'Low Risk', color: '#15803D' };
        if (whr < 1.00) return { label: 'Moderate Risk', color: '#D97706' };
        return { label: 'High Risk', color: '#B91C1C' };
    } else {
        if (whr < 0.80) return { label: 'Low Risk', color: '#15803D' };
        if (whr < 0.85) return { label: 'Moderate Risk', color: '#D97706' };
        return { label: 'High Risk', color: '#B91C1C' };
    }
};

/* ─── MUAC — child (6–59 months, WHO SMART criteria) ───────────────────── */
const muacChildStatus = (muac) => {
    if (muac < 11.5) return { label: 'SAM — Severe Acute Malnutrition', color: '#B91C1C', band: 'RED' };
    if (muac < 12.5) return { label: 'MAM — Moderate Acute Malnutrition', color: '#D97706', band: 'YELLOW' };
    return { label: 'Normal / Well-Nourished', color: '#15803D', band: 'GREEN' };
};

/* ─── MUAC — adult ──────────────────────────────────────────────────────── */
const muacAdultStatus = (muac) => {
    if (muac < 18.5) return { label: 'Severely Malnourished', color: '#B91C1C' };
    if (muac < 22.0) return { label: 'Malnourished', color: '#D97706' };
    if (muac < 23.0) return { label: 'At-Risk', color: '#D97706' };
    return { label: 'Normal', color: '#15803D' };
};

const AnthropometryScreen = () => {
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
    const [ibwSex, setIbwSex] = useState('male');
    const [ibwResult, setIbwResult] = useState(null);

    /* ── Calculators ───────────────────────────────────────────────────── */
    const calculateBMI = () => {
        const h = parseFloat(height);
        const w = parseFloat(weight);
        if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
            setBmiResult({ error: 'Enter valid height (cm) and weight (kg).' });
            return;
        }
        const hM = h / 100;
        const bmi = w / (hM * hM);
        const category = BMI_CATEGORIES_ASIAN.find(c => bmi < c.max);
        setBmiResult({ bmi: bmi.toFixed(1), category: category.label, color: category.color });
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
        if (ratio < 0.40) { label = 'Underweight Risk'; color = '#3B82F6'; }
        else if (ratio < 0.50) { label = 'Healthy'; color = '#15803D'; }
        else if (ratio < 0.60) { label = 'Overweight Risk'; color = '#D97706'; }
        else { label = 'Obese — High Metabolic Risk'; color = '#B91C1C'; }
        setWhtRResult({ ratio: ratio.toFixed(3), label, color });
    };

    const calculateMUAC = () => {
        const m = parseFloat(muacValue);
        if (isNaN(m) || m <= 0) {
            setMuacResult({ error: 'Enter a valid MUAC measurement (cm).' });
            return;
        }
        const status = muacMode === 'child' ? muacChildStatus(m) : muacAdultStatus(m);
        setMuacResult({ muac: m.toFixed(1), mode: muacMode, ...status });
    };

    const calculateIBW = () => {
        const h = parseFloat(ibwHeight);
        if (isNaN(h) || h <= 0) {
            setIbwResult({ error: 'Enter a valid height (cm).' });
            return;
        }
        // Devine formula (height in inches)
        const hInch = h / 2.54;
        const base = ibwSex === 'male' ? 50 : 45.5;
        const ibw = base + 2.3 * (hInch - 60);
        const abw = ibw + 0.4 * (parseFloat(weight) - ibw);
        setIbwResult({
            ibw: ibw.toFixed(1),
            abwNote: (weight && !isNaN(parseFloat(weight)))
                ? `Adjusted BW (if obese): ${abw.toFixed(1)} kg`
                : null,
        });
    };

    /* ── Shared result box ─────────────────────────────────────────────── */
    const ResultBox = ({ color, children }) => (
        <View style={[styles.resultBox, { borderLeftColor: color || '#8A2BE2' }]}>
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
                            keyboardType="numeric" mode="outlined" style={styles.input} />
                        <TextInput label="Weight (kg)" value={weight} onChangeText={setWeight}
                            keyboardType="numeric" mode="outlined" style={styles.input} />
                        <Button mode="contained" onPress={calculateBMI} style={styles.calcButton}>
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
                            mode="outlined" style={styles.input} />
                        <TextInput label="Hip circumference (cm)" value={hipWHR}
                            onChangeText={setHipWHR} keyboardType="numeric"
                            mode="outlined" style={styles.input} />
                        <Button mode="contained" onPress={calculateWHR} style={styles.calcButton}>
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
                            mode="outlined" style={styles.input} />
                        <TextInput label="Height (cm)" value={heightWHtR}
                            onChangeText={setHeightWHtR} keyboardType="numeric"
                            mode="outlined" style={styles.input} />
                        <Button mode="contained" onPress={calculateWHtR} style={styles.calcButton}>
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
                                { value: 'child', label: 'Child (6–59 mo)' },
                                { value: 'adult', label: 'Adult' },
                            ]}
                            style={styles.segmented}
                        />

                        <TextInput label="MUAC (cm)" value={muacValue}
                            onChangeText={setMuacValue} keyboardType="numeric"
                            mode="outlined" style={styles.input} />
                        <Button mode="contained" onPress={calculateMUAC} style={styles.calcButton}>
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
                                        { band: 'YELLOW', color: '#D97706', label: 'MAM' },
                                        { band: 'GREEN', color: '#15803D', label: 'Normal' }]
                                            .map(b => (
                                                <View key={b.band} style={[
                                                    styles.muacBandChip,
                                                    { backgroundColor: b.color + '22', borderColor: b.color },
                                                    muacResult.band === b.band && { backgroundColor: b.color },
                                                ]}>
                                                    <Text style={[
                                                        styles.muacBandText,
                                                        { color: muacResult.band === b.band ? '#FFF' : b.color },
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
                                            WHO Reference — Children 6–59 months
                                        </Text>
                                        <View style={styles.refRow}>
                                            <View style={[styles.refDot, { backgroundColor: '#B91C1C' }]} />
                                            <Text style={styles.noteText}>{'<'}11.5 cm → SAM (Severe Acute Malnutrition) — refer for therapeutic feeding</Text>
                                        </View>
                                        <View style={styles.refRow}>
                                            <View style={[styles.refDot, { backgroundColor: '#D97706' }]} />
                                            <Text style={styles.noteText}>11.5–12.4 cm → MAM (Moderate Acute Malnutrition) — supplementary feeding</Text>
                                        </View>
                                        <View style={styles.refRow}>
                                            <View style={[styles.refDot, { backgroundColor: '#15803D' }]} />
                                            <Text style={styles.noteText}>≥12.5 cm → Normal / Well-Nourished</Text>
                                        </View>
                                        <Text style={[styles.noteText, { marginTop: 6, fontStyle: 'italic' }]}>
                                            Source: WHO SMART methodology; used in ICDS, NHM, SAM protocols
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Text style={[styles.noteText, { fontWeight: '700', marginBottom: 4 }]}>
                                            Reference — Adults
                                        </Text>
                                        <Text style={styles.noteText}>{'<'}18.5 cm → Severely Malnourished</Text>
                                        <Text style={styles.noteText}>18.5–21.9 cm → Malnourished</Text>
                                        <Text style={styles.noteText}>22.0–22.9 cm → At-Risk</Text>
                                        <Text style={styles.noteText}>≥23.0 cm → Normal</Text>
                                        <Text style={[styles.noteText, { marginTop: 6, fontStyle: 'italic' }]}>
                                            Source: Jelliffe (1966); used in field nutrition surveys
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
                            Devine formula — used in drug dosing & nutrition planning
                        </Text>
                        <SegmentedButtons
                            value={ibwSex}
                            onValueChange={setIbwSex}
                            buttons={[
                                { value: 'male', label: 'Male' },
                                { value: 'female', label: 'Female' },
                            ]}
                            style={styles.segmented}
                        />
                        <TextInput label="Height (cm)" value={ibwHeight}
                            onChangeText={setIbwHeight} keyboardType="numeric"
                            mode="outlined" style={styles.input} />
                        <TextInput label="Actual weight (kg) — optional, for ABW" value={weight}
                            onChangeText={setWeight} keyboardType="numeric"
                            mode="outlined" style={styles.input} />
                        <Button mode="contained" onPress={calculateIBW} style={styles.calcButton}>
                            Calculate IBW
                        </Button>
                        {ibwResult && (ibwResult.error
                            ? <Text style={styles.errorText}>{ibwResult.error}</Text>
                            : <ResultBox color="#8A2BE2">
                                <Text variant="titleMedium" style={{ color: '#6B7280' }}>Ideal Body Weight</Text>
                                <Text variant="displaySmall" style={{ fontWeight: 'bold', color: '#8A2BE2' }}>
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
                                    {ibwSex === 'male'
                                        ? 'Male: 50 kg + 2.3 kg per inch over 5 ft'
                                        : 'Female: 45.5 kg + 2.3 kg per inch over 5 ft'}
                                </Text>
                            </ResultBox>
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
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    subtitle: { color: '#6B7280', marginBottom: 8 },
    input: { marginTop: 8, marginBottom: 4, backgroundColor: '#FFF' },
    segmented: { marginTop: 8, marginBottom: 4 },
    calcButton: { marginTop: 12, paddingVertical: 6, backgroundColor: '#8A2BE2' },
    resultBox: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F5F3FF',
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    errorText: { color: '#B91C1C', marginTop: 8 },
    noteText: { color: '#6B7280', lineHeight: 18 },
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
