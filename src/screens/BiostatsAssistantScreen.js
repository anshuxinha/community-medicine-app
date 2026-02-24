import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, Title, Divider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// ── Preset MCQ problems ──────────────────────────────────────────────────────
const PRESET_PROBLEMS = [
    {
        id: '1', title: 'Chi-Square Example',
        type: 'chi2',
        description: 'Out of 100 vaccinated children, 10 got disease. Out of 100 unvaccinated, 40 got disease. Test significance.',
        data: { a: 10, b: 90, c: 40, d: 60 },
    },
    {
        id: '2', title: 'Vaccine Efficacy',
        type: 'efficacy',
        description: 'Attack rate in vaccinated=10%, unvaccinated=40%. Calculate vaccine efficacy.',
        data: { arV: 10, arU: 40 },
    },
    {
        id: '3', title: 'IMR Calculation',
        type: 'imr',
        description: '500 infant deaths, 20,000 live births in a year. Calculate IMR.',
        data: { deaths: 500, births: 20000 },
    },
];

// ── Calculator logic ─────────────────────────────────────────────────────────
function calcChi2(a, b, c, d) {
    const n = a + b + c + d;
    const chi2 = n * Math.pow(Math.abs(a * d - b * c) - n / 2, 2) /
        ((a + b) * (c + d) * (a + c) * (b + d));
    const significant = chi2 > 3.84;
    return {
        chi2: chi2.toFixed(3),
        result: significant
            ? `χ²=${chi2.toFixed(2)} > 3.84 → Significant (p < 0.05)`
            : `χ²=${chi2.toFixed(2)} < 3.84 → Not Significant (p > 0.05)`,
        significant,
    };
}

function calcEfficacy(arV, arU) {
    const ve = ((arU - arV) / arU) * 100;
    return { ve: ve.toFixed(1) };
}

function calcIMR(deaths, births) {
    return { imr: ((deaths / births) * 1000).toFixed(1) };
}

// ── Main screen ──────────────────────────────────────────────────────────────
const BiostatsAssistantScreen = () => {
    const [tab, setTab] = useState('solver');

    // Chi-Square inputs
    const [a, setA] = useState('');
    const [b, setB] = useState('');
    const [c, setC] = useState('');
    const [d, setD] = useState('');

    // Efficacy inputs
    const [arV, setArV] = useState('');
    const [arU, setArU] = useState('');

    // Rates inputs
    const [deaths, setDeaths] = useState('');
    const [births, setBirths] = useState('');

    const [result, setResult] = useState(null);
    const [resultType, setResultType] = useState('');

    const runChi2 = () => {
        const vals = [a, b, c, d].map(Number);
        if (vals.some(isNaN) || vals.some(v => v < 0)) {
            setResult({ error: 'Enter non-negative numbers in all four cells.' }); return;
        }
        setResultType('chi2');
        setResult(calcChi2(...vals));
    };

    const runEfficacy = () => {
        const v = parseFloat(arV), u = parseFloat(arU);
        if (isNaN(v) || isNaN(u)) { setResult({ error: 'Enter valid attack rates.' }); return; }
        setResultType('efficacy');
        setResult(calcEfficacy(v, u));
    };

    const runIMR = () => {
        const d2 = parseFloat(deaths), b2 = parseFloat(births);
        if (isNaN(d2) || isNaN(b2)) { setResult({ error: 'Enter valid numbers.' }); return; }
        setResultType('imr');
        setResult(calcIMR(d2, b2));
    };

    const loadPreset = (preset) => {
        setResult(null);
        if (preset.type === 'chi2') {
            setA(String(preset.data.a)); setB(String(preset.data.b));
            setC(String(preset.data.c)); setD(String(preset.data.d));
        } else if (preset.type === 'efficacy') {
            setArV(String(preset.data.arV)); setArU(String(preset.data.arU));
        } else if (preset.type === 'imr') {
            setDeaths(String(preset.data.deaths)); setBirths(String(preset.data.births));
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.headerText}>📊 Biostats Assistant</Text>

                <SegmentedButtons
                    value={tab}
                    onValueChange={setTab}
                    buttons={[
                        { value: 'solver', label: 'Solver' },
                        { value: 'presets', label: 'MCQ Presets' },
                        { value: 'reference', label: 'Reference' },
                    ]}
                    style={{ marginBottom: 20 }}
                />

                {/* ── SOLVER TAB ── */}
                {tab === 'solver' && (
                    <>
                        {/* Chi-Square */}
                        <Card style={styles.card}>
                            <Card.Content>
                                <Title>Chi-Square Test (2×2)</Title>
                                <Text style={styles.hint}>Yates' corrected formula</Text>
                                <View style={styles.grid2x2}>
                                    <View style={styles.gridRow}>
                                        <TextInput label="a (Disease+, Exp+)" value={a} onChangeText={setA} keyboardType="numeric" mode="outlined" style={styles.cell} dense />
                                        <TextInput label="b (Disease–, Exp+)" value={b} onChangeText={setB} keyboardType="numeric" mode="outlined" style={styles.cell} dense />
                                    </View>
                                    <View style={styles.gridRow}>
                                        <TextInput label="c (Disease+, Exp–)" value={c} onChangeText={setC} keyboardType="numeric" mode="outlined" style={styles.cell} dense />
                                        <TextInput label="d (Disease–, Exp–)" value={d} onChangeText={setD} keyboardType="numeric" mode="outlined" style={styles.cell} dense />
                                    </View>
                                </View>
                                <Button mode="contained" onPress={runChi2} style={styles.btn}>Calculate χ²</Button>
                                {result && resultType === 'chi2' && !result.error && (
                                    <View style={[styles.resultBox, { borderLeftColor: result.significant ? '#15803D' : '#B91C1C' }]}>
                                        <Text style={{ fontWeight: 'bold', color: result.significant ? '#15803D' : '#B91C1C' }}>
                                            {result.result}
                                        </Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>

                        {/* Vaccine Efficacy */}
                        <Card style={styles.card}>
                            <Card.Content>
                                <Title>Vaccine Efficacy</Title>
                                <Text style={styles.hint}>VE = (ARu – ARv) / ARu × 100</Text>
                                <TextInput label="Attack Rate in Vaccinated (%)" value={arV} onChangeText={setArV} keyboardType="numeric" mode="outlined" style={styles.input} />
                                <TextInput label="Attack Rate in Unvaccinated (%)" value={arU} onChangeText={setArU} keyboardType="numeric" mode="outlined" style={styles.input} />
                                <Button mode="contained" onPress={runEfficacy} style={styles.btn}>Calculate VE</Button>
                                {result && resultType === 'efficacy' && !result.error && (
                                    <View style={[styles.resultBox, { borderLeftColor: '#8A2BE2' }]}>
                                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#6B21A8' }}>
                                            VE = {result.ve}%
                                        </Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>

                        {/* Rates */}
                        <Card style={styles.card}>
                            <Card.Content>
                                <Title>Infant Mortality Rate (IMR)</Title>
                                <Text style={styles.hint}>IMR = (Infant Deaths / Live Births) × 1000</Text>
                                <TextInput label="Infant Deaths" value={deaths} onChangeText={setDeaths} keyboardType="numeric" mode="outlined" style={styles.input} />
                                <TextInput label="Live Births" value={births} onChangeText={setBirths} keyboardType="numeric" mode="outlined" style={styles.input} />
                                <Button mode="contained" onPress={runIMR} style={styles.btn}>Calculate IMR</Button>
                                {result && resultType === 'imr' && !result.error && (
                                    <View style={[styles.resultBox, { borderLeftColor: '#8A2BE2' }]}>
                                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#6B21A8' }}>
                                            IMR = {result.imr} / 1000 live births
                                        </Text>
                                    </View>
                                )}
                            </Card.Content>
                        </Card>

                        {result?.error && (
                            <Text style={{ color: 'red', marginTop: 8 }}>{result.error}</Text>
                        )}
                    </>
                )}

                {/* ── PRESETS TAB ── */}
                {tab === 'presets' && (
                    <>
                        <Text style={{ color: '#6B7280', marginBottom: 12 }}>
                            Tap a preset to load values into the solver.
                        </Text>
                        {PRESET_PROBLEMS.map(p => (
                            <Card key={p.id} style={styles.card} onPress={() => { loadPreset(p); setTab('solver'); }}>
                                <Card.Content>
                                    <Title style={{ fontSize: 16 }}>{p.title}</Title>
                                    <Text style={{ color: '#6B7280', lineHeight: 20 }}>{p.description}</Text>
                                    <Button mode="outlined" compact style={{ marginTop: 12, alignSelf: 'flex-start' }}
                                        onPress={() => { loadPreset(p); setTab('solver'); }}>
                                        Load →
                                    </Button>
                                </Card.Content>
                            </Card>
                        ))}
                    </>
                )}

                {/* ── REFERENCE TAB ── */}
                {tab === 'reference' && (
                    <>
                        {[
                            { title: 'Measures of Central Tendency', items: ['Mean – Mathematical average, affected by outliers', 'Median – Middle value; best for skewed data', 'Mode – Most frequently occurring value'] },
                            { title: 'Measures of Dispersion', items: ['Range – Max – Min', 'Standard Deviation (SD) – Spread around mean', '±1 SD = 68% | ±2 SD = 95% | ±3 SD = 99.7%'] },
                            { title: 'Tests of Significance', items: ['p < 0.05 = Statistically Significant', 'Chi-square: Qualitative data (proportions)', 't-test: Quantitative data, small samples (<30)', 'Z-test: Quantitative data, large samples (>30)'] },
                            { title: 'Vital Statistics Formulas', items: ['IMR = (Infant deaths / Live births) × 1000', 'MMR = (Maternal deaths / Live births) × 100,000', 'CFR = (Deaths / Cases) × 100', 'Attack Rate = (New cases / Population at risk) × 100', 'VE = (ARu – ARv) / ARu × 100'] },
                            { title: 'Sampling Methods', items: ['Simple Random – Every unit has equal chance', 'Stratified – Divide into strata, then random sample', 'Systematic – Every nth unit selected', 'Cluster – Groups (clusters) randomly selected'] },
                        ].map(section => (
                            <Card key={section.title} style={styles.card}>
                                <Card.Content>
                                    <Title style={{ fontSize: 15 }}>{section.title}</Title>
                                    <Divider style={{ marginVertical: 8 }} />
                                    {section.items.map((item, i) => (
                                        <View key={i} style={styles.refRow}>
                                            <MaterialIcons name="chevron-right" size={16} color="#8A2BE2" />
                                            <Text style={styles.refText}>{item}</Text>
                                        </View>
                                    ))}
                                </Card.Content>
                            </Card>
                        ))}
                    </>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FBFCFE' },
    container: { padding: 16, paddingBottom: 48 },
    headerText: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    card: { marginBottom: 14, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
    hint: { color: '#6B7280', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
    grid2x2: { gap: 8 },
    gridRow: { flexDirection: 'row', gap: 8 },
    cell: { flex: 1, backgroundColor: '#FFF' },
    input: { marginBottom: 8, backgroundColor: '#FFF' },
    btn: { marginTop: 12, backgroundColor: '#8A2BE2', paddingVertical: 4 },
    resultBox: { marginTop: 12, padding: 14, backgroundColor: '#F5F3FF', borderRadius: 10, borderLeftWidth: 4 },
    refRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    refText: { flex: 1, color: '#374151', lineHeight: 20 },
});

export default BiostatsAssistantScreen;
