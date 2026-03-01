import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Title, Divider, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

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
function calcEfficacy(arV, arU) { return { ve: (((arU - arV) / arU) * 100).toFixed(1) }; }
function calcIMR(deaths, births) { return { imr: ((deaths / births) * 1000).toFixed(1) }; }

function zForCI(ci) {
    if (ci === 99) return 2.576;
    if (ci === 95) return 1.96;
    if (ci === 90) return 1.645;
    return 1.96;
}
function ssSingleProp({ p, e, ci }) {
    const z = zForCI(ci);
    return Math.ceil((z * z * p * (1 - p)) / (e * e));
}
function ssTwoProps({ p1, p2, ci, power }) {
    const z_alpha = zForCI(ci);
    const z_beta = power === 90 ? 1.282 : power === 80 ? 0.842 : power === 95 ? 1.645 : 0.842;
    const p_bar = (p1 + p2) / 2;
    return Math.ceil(
        Math.pow(z_alpha * Math.sqrt(2 * p_bar * (1 - p_bar)) + z_beta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2)
        / Math.pow(p1 - p2, 2)
    );
}
function ssTwoMeans({ sd, delta, ci, power }) {
    const z_alpha = zForCI(ci);
    const z_beta = power === 90 ? 1.282 : power === 80 ? 0.842 : power === 95 ? 1.645 : 0.842;
    return Math.ceil((2 * Math.pow((z_alpha + z_beta) * sd, 2)) / Math.pow(delta, 2));
}

const PRESET_PROBLEMS = [
    {
        id: '1', title: 'Chi-Square Example', type: 'chi2',
        description: '100 vaccinated: 10 got disease. 100 unvaccinated: 40 got disease. Test significance.',
        data: { a: 10, b: 90, c: 40, d: 60 },
    },
    {
        id: '2', title: 'Vaccine Efficacy', type: 'efficacy',
        description: 'Attack rate: Vaccinated=10%, Unvaccinated=40%. Calculate vaccine efficacy.',
        data: { arV: 10, arU: 40 },
    },
    {
        id: '3', title: 'IMR Calculation', type: 'imr',
        description: '500 infant deaths, 20,000 live births in a year. Calculate IMR.',
        data: { deaths: 500, births: 20000 },
    },
];

// Y-offsets for each solver card so we can scroll to them accurately
const SOLVER_OFFSETS = { chi2: 0, efficacy: 0, imr: 0 };

const BiostatsAssistantScreen = () => {
    const [tab, setTab] = useState('samplesize');
    const scrollRef = useRef(null);

    // Layout tracking refs for the 3 solver cards
    const chi2Ref = useRef(null);
    const efficacyRef = useRef(null);
    const imrRef = useRef(null);

    // Sample Size state
    const [ssType, setSsType] = useState('prop1');
    const [ssCI, setSsCI] = useState(95);
    const [ssPower, setSsPower] = useState(80);
    const [ssP, setSsP] = useState('0.50');
    const [ssE, setSsE] = useState('0.05');
    const [ssP1, setSsP1] = useState('');
    const [ssP2, setSsP2] = useState('');
    const [ssSd, setSsSd] = useState('');
    const [ssDelta, setSsDelta] = useState('');
    const [ssResult, setSsResult] = useState(null);

    // Solver state
    const [a, setA] = useState(''); const [b, setB] = useState('');
    const [c, setC] = useState(''); const [d, setD] = useState('');
    const [arV, setArV] = useState(''); const [arU, setArU] = useState('');
    const [deaths, setDeaths] = useState(''); const [births, setBirths] = useState('');
    const [result, setResult] = useState(null);
    const [resultType, setResultType] = useState('');

    const calculateSS = () => {
        try {
            if (ssType === 'prop1') {
                const p = parseFloat(ssP), e = parseFloat(ssE);
                if (isNaN(p) || isNaN(e) || p <= 0 || p >= 1 || e <= 0) { setSsResult({ error: 'Enter prevalence (0–1) and margin of error (0–1).' }); return; }
                setSsResult({ n: ssSingleProp({ p, e, ci: ssCI }), label: 'Per group (single proportion / prevalence)' });
            } else if (ssType === 'prop2') {
                const p1 = parseFloat(ssP1) / 100, p2 = parseFloat(ssP2) / 100;
                if (isNaN(p1) || isNaN(p2)) { setSsResult({ error: 'Enter both proportions as %.' }); return; }
                setSsResult({ n: ssTwoProps({ p1, p2, ci: ssCI, power: ssPower }), label: 'Per group (each arm)' });
            } else {
                const sd = parseFloat(ssSd), delta = parseFloat(ssDelta);
                if (isNaN(sd) || isNaN(delta)) { setSsResult({ error: 'Enter SD and minimum detectable difference.' }); return; }
                setSsResult({ n: ssTwoMeans({ sd, delta, ci: ssCI, power: ssPower }), label: 'Per group (each arm)' });
            }
        } catch (e) { setSsResult({ error: 'Calculation error. Check your inputs.' }); }
    };

    const runChi2 = () => {
        const vals = [a, b, c, d].map(Number);
        if (vals.some(isNaN)) { setResult({ error: 'Enter numbers in all four cells.' }); return; }
        setResultType('chi2'); setResult(calcChi2(...vals));
    };
    const runEfficacy = () => {
        const v = parseFloat(arV), u = parseFloat(arU);
        if (isNaN(v) || isNaN(u)) { setResult({ error: 'Enter valid attack rates.' }); return; }
        setResultType('efficacy'); setResult(calcEfficacy(v, u));
    };
    const runIMR = () => {
        const d2 = parseFloat(deaths), b2 = parseFloat(births);
        if (isNaN(d2) || isNaN(b2)) { setResult({ error: 'Enter valid numbers.' }); return; }
        setResultType('imr'); setResult(calcIMR(d2, b2));
    };

    // Load preset and scroll to the relevant solver section
    const loadPreset = (preset) => {
        setResult(null);
        if (preset.type === 'chi2') {
            setA(String(preset.data.a)); setB(String(preset.data.b));
            setC(String(preset.data.c)); setD(String(preset.data.d));
            setTimeout(() => {
                chi2Ref.current?.measureLayout(
                    scrollRef.current,
                    (x, y) => scrollRef.current?.scrollTo({ y: y - 16, animated: true }),
                    () => scrollRef.current?.scrollTo({ y: 0, animated: true })
                );
            }, 100);
        } else if (preset.type === 'efficacy') {
            setArV(String(preset.data.arV)); setArU(String(preset.data.arU));
            setTimeout(() => {
                efficacyRef.current?.measureLayout(
                    scrollRef.current,
                    (x, y) => scrollRef.current?.scrollTo({ y: y - 16, animated: true }),
                    () => scrollRef.current?.scrollTo({ y: 200, animated: true })
                );
            }, 100);
        } else if (preset.type === 'imr') {
            setDeaths(String(preset.data.deaths)); setBirths(String(preset.data.births));
            setTimeout(() => {
                imrRef.current?.measureLayout(
                    scrollRef.current,
                    (x, y) => scrollRef.current?.scrollTo({ y: y - 16, animated: true }),
                    () => scrollRef.current?.scrollTo({ y: 400, animated: true })
                );
            }, 100);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
                <Text style={styles.headerText}>📊 Biostats Assistant</Text>

                <SegmentedButtons
                    value={tab}
                    onValueChange={setTab}
                    buttons={[
                        { value: 'samplesize', label: 'Sample Size', labelStyle: tab !== 'samplesize' ? { color: '#374151' } : {} },
                        { value: 'solver', label: 'Solver', labelStyle: tab !== 'solver' ? { color: '#374151' } : {} },
                        { value: 'reference', label: 'Reference', labelStyle: tab !== 'reference' ? { color: '#374151' } : {} },
                    ]}
                    style={{ marginBottom: 20 }}
                />

                {/* ── TAB 1: SAMPLE SIZE CALCULATOR ── */}
                {tab === 'samplesize' && (
                    <>
                        <Card style={styles.card}>
                            <Card.Content>
                                <Title style={styles.cardTitle}>Study Design</Title>
                                {[
                                    { value: 'prop1', label: '📊 Single Proportion / Prevalence Study' },
                                    { value: 'prop2', label: '⚖️ Comparing Two Proportions (RCT / Cohort / Case-Control)' },
                                    { value: 'means', label: '📈 Comparing Two Means (Unpaired)' },
                                ].map(opt => (
                                    <Button key={opt.value} mode={ssType === opt.value ? 'contained' : 'outlined'}
                                        onPress={() => { setSsType(opt.value); setSsResult(null); }}
                                        style={styles.typeBtn}
                                        labelStyle={{ color: ssType === opt.value ? '#FFF' : '#374151', fontSize: 13 }}
                                        contentStyle={{ justifyContent: 'flex-start' }}>
                                        {opt.label}
                                    </Button>
                                ))}
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Content>
                                <Title style={styles.cardTitle}>Confidence Level</Title>
                                <View style={styles.pillRow}>
                                    {[90, 95, 99].map(ci => (
                                        <Button key={ci} mode={ssCI === ci ? 'contained' : 'outlined'}
                                            onPress={() => setSsCI(ci)} style={styles.pill}
                                            labelStyle={{ color: ssCI === ci ? '#FFF' : '#374151' }}>
                                            {ci}%
                                        </Button>
                                    ))}
                                </View>
                                {(ssType === 'prop2' || ssType === 'means') && (
                                    <>
                                        <Title style={[styles.cardTitle, { marginTop: 12 }]}>Power (1-β)</Title>
                                        <View style={styles.pillRow}>
                                            {[80, 90, 95].map(pw => (
                                                <Button key={pw} mode={ssPower === pw ? 'contained' : 'outlined'}
                                                    onPress={() => setSsPower(pw)} style={styles.pill}
                                                    labelStyle={{ color: ssPower === pw ? '#FFF' : '#374151' }}>
                                                    {pw}%
                                                </Button>
                                            ))}
                                        </View>
                                    </>
                                )}
                            </Card.Content>
                        </Card>

                        <Card style={styles.card}>
                            <Card.Content>
                                {ssType === 'prop1' && (
                                    <>
                                        <Title style={styles.cardTitle}>Prevalence Study / Cross-Sectional</Title>
                                        <Text style={styles.hint}>Formula: n = Z² × P(1-P) / e²</Text>
                                        <TextInput label="Expected Prevalence P (0 to 1, e.g. 0.5)" value={ssP}
                                            onChangeText={setSsP} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                        <TextInput label="Margin of Error e (e.g. 0.05 for ±5%)" value={ssE}
                                            onChangeText={setSsE} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    </>
                                )}
                                {ssType === 'prop2' && (
                                    <>
                                        <Title style={styles.cardTitle}>Two Proportions (RCT / Cohort / Case-Control)</Title>
                                        <Text style={styles.hint}>Formula: uses z_alpha + z_beta with p̄</Text>
                                        <TextInput label="P1 – Proportion in Group 1 (%)" value={ssP1}
                                            onChangeText={setSsP1} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                        <TextInput label="P2 – Proportion in Group 2 (%)" value={ssP2}
                                            onChangeText={setSsP2} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    </>
                                )}
                                {ssType === 'means' && (
                                    <>
                                        <Title style={styles.cardTitle}>Two Independent Means</Title>
                                        <Text style={styles.hint}>Formula: n = 2(z_α + z_β)²σ² / Δ²</Text>
                                        <TextInput label="SD – Standard Deviation (pooled estimate)" value={ssSd}
                                            onChangeText={setSsSd} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                        <TextInput label="Δ – Minimum Detectable Difference" value={ssDelta}
                                            onChangeText={setSsDelta} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    </>
                                )}
                                <Button mode="contained" onPress={calculateSS} style={styles.btn}>Calculate Sample Size</Button>
                                {ssResult && !ssResult.error && (
                                    <View style={[styles.resultBox, { borderLeftColor: '#8A2BE2' }]}>
                                        <Text style={{ color: '#6B7280', marginBottom: 4 }}>{ssResult.label}</Text>
                                        <Text variant="displaySmall" style={{ fontWeight: 'bold', color: '#8A2BE2' }}>n = {ssResult.n}</Text>
                                        <Divider style={{ marginVertical: 8 }} />
                                        <Text style={{ color: '#374151', fontSize: 13 }}>
                                            CI: {ssCI}% {(ssType !== 'prop1') ? `| Power: ${ssPower}%` : ''}
                                        </Text>
                                        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4 }}>Add 10–20% for expected non-response / dropout</Text>
                                    </View>
                                )}
                                {ssResult?.error && <Text style={styles.errText}>{ssResult.error}</Text>}
                            </Card.Content>
                        </Card>
                    </>
                )}

                {/* ── TAB 2: SOLVER (+ MCQ presets merged in) ── */}
                {tab === 'solver' && (
                    <>
                        {/* Chi-Square — ref for scroll targeting */}
                        <View ref={chi2Ref} collapsable={false}>
                            <Card style={styles.card}>
                                <Card.Content>
                                    <Title style={styles.cardTitle}>Chi-Square Test (2×2)</Title>
                                    <Text style={styles.hint}>Yates' corrected formula</Text>
                                    <View style={styles.grid2x2}>
                                        <View style={styles.gridRow}>
                                            <TextInput label="a (D+, E+)" value={a} onChangeText={setA} keyboardType="numeric" mode="outlined" style={styles.cell} dense textColor="#111827" />
                                            <TextInput label="b (D–, E+)" value={b} onChangeText={setB} keyboardType="numeric" mode="outlined" style={styles.cell} dense textColor="#111827" />
                                        </View>
                                        <View style={styles.gridRow}>
                                            <TextInput label="c (D+, E–)" value={c} onChangeText={setC} keyboardType="numeric" mode="outlined" style={styles.cell} dense textColor="#111827" />
                                            <TextInput label="d (D–, E–)" value={d} onChangeText={setD} keyboardType="numeric" mode="outlined" style={styles.cell} dense textColor="#111827" />
                                        </View>
                                    </View>
                                    <Button mode="contained" onPress={runChi2} style={styles.btn}>Calculate χ²</Button>
                                    {result && resultType === 'chi2' && !result.error && (
                                        <View style={[styles.resultBox, { borderLeftColor: result.significant ? '#15803D' : '#B91C1C' }]}>
                                            <Text style={{ fontWeight: 'bold', color: result.significant ? '#15803D' : '#B91C1C' }}>{result.result}</Text>
                                        </View>
                                    )}
                                </Card.Content>
                            </Card>
                        </View>

                        {/* Vaccine Efficacy */}
                        <View ref={efficacyRef} collapsable={false}>
                            <Card style={styles.card}>
                                <Card.Content>
                                    <Title style={styles.cardTitle}>Vaccine Efficacy</Title>
                                    <Text style={styles.hint}>VE = (ARu – ARv) / ARu × 100</Text>
                                    <TextInput label="Attack Rate in Vaccinated (%)" value={arV} onChangeText={setArV} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    <TextInput label="Attack Rate in Unvaccinated (%)" value={arU} onChangeText={setArU} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    <Button mode="contained" onPress={runEfficacy} style={styles.btn}>Calculate VE</Button>
                                    {result && resultType === 'efficacy' && !result.error && (
                                        <View style={[styles.resultBox, { borderLeftColor: '#8A2BE2' }]}>
                                            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#6B21A8' }}>VE = {result.ve}%</Text>
                                        </View>
                                    )}
                                </Card.Content>
                            </Card>
                        </View>

                        {/* IMR */}
                        <View ref={imrRef} collapsable={false}>
                            <Card style={styles.card}>
                                <Card.Content>
                                    <Title style={styles.cardTitle}>Infant Mortality Rate (IMR)</Title>
                                    <Text style={styles.hint}>IMR = (Infant Deaths / Live Births) × 1000</Text>
                                    <TextInput label="Infant Deaths" value={deaths} onChangeText={setDeaths} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    <TextInput label="Live Births" value={births} onChangeText={setBirths} keyboardType="numeric" mode="outlined" style={styles.input} textColor="#111827" />
                                    <Button mode="contained" onPress={runIMR} style={styles.btn}>Calculate IMR</Button>
                                    {result && resultType === 'imr' && !result.error && (
                                        <View style={[styles.resultBox, { borderLeftColor: '#8A2BE2' }]}>
                                            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: '#6B21A8' }}>IMR = {result.imr} / 1000 live births</Text>
                                        </View>
                                    )}
                                </Card.Content>
                            </Card>
                        </View>

                        {result?.error && <Text style={styles.errText}>{result.error}</Text>}

                        <Divider style={{ marginVertical: 16 }} />
                        <Text style={[styles.headerText, { fontSize: 18, marginBottom: 4 }]}>📝 MCQ Presets</Text>
                        <Text style={{ color: '#6B7280', marginBottom: 12 }}>Tap "Load" to fill the solver above and jump to it.</Text>
                        {PRESET_PROBLEMS.map(p => (
                            <Card key={p.id} style={styles.card}>
                                <Card.Content>
                                    <Title style={[styles.cardTitle, { fontSize: 15 }]}>{p.title}</Title>
                                    <Text style={{ color: '#374151', lineHeight: 20 }}>{p.description}</Text>
                                    <Button mode="outlined" compact style={{ marginTop: 10, alignSelf: 'flex-start' }} onPress={() => loadPreset(p)}>Load →</Button>
                                </Card.Content>
                            </Card>
                        ))}
                    </>
                )}

                {/* ── TAB 3: REFERENCE ── */}
                {tab === 'reference' && (
                    <>
                        {[
                            { title: 'Measures of Central Tendency', items: ['Mean – Mathematical average, affected by outliers', 'Median – Middle value; best for skewed data', 'Mode – Most frequently occurring value'] },
                            { title: 'Measures of Dispersion', items: ['Range – Max – Min', 'Standard Deviation (SD) – Spread around mean', '±1 SD = 68% | ±2 SD = 95% | ±3 SD = 99.7%'] },
                            { title: 'Tests of Significance', items: ['p < 0.05 = Statistically Significant', 'Chi-square: Qualitative data (proportions)', 't-test: Quantitative data, small samples (<30)', 'Z-test: Quantitative data, large samples (>30)'] },
                            { title: 'Vital Statistics Formulas', items: ['IMR = (Infant deaths / Live births) × 1000', 'MMR = (Maternal deaths / Live births) × 100,000', 'CFR = (Deaths / Cases) × 100', 'Attack Rate = (New cases / Population at risk) × 100', 'VE = (ARu – ARv) / ARu × 100'] },
                            { title: 'Sample Size Key Concepts', items: ['n ↑ as CI increases (90 → 95 → 99%)', 'n ↑ as power increases (80 → 90 → 95%)', 'n ↑ as margin of error (e) decreases', 'n ↑ when P = 0.5 (maximum variability)', 'Add 10–20% for non-response rate'] },
                            { title: 'Sampling Methods', items: ['Simple Random – Every unit has equal chance', 'Stratified – Divide into strata, then random sample', 'Systematic – Every Kth unit selected', 'Cluster – Groups (clusters) randomly selected', 'Multistage – Combination of above methods'] },
                        ].map(section => (
                            <Card key={section.title} style={styles.card}>
                                <Card.Content>
                                    <Title style={[styles.cardTitle, { fontSize: 15 }]}>{section.title}</Title>
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
    headerText: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    card: { marginBottom: 14, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    hint: { color: '#6B7280', fontSize: 12, marginBottom: 8, fontStyle: 'italic' },
    typeBtn: { marginTop: 8, borderColor: '#E5E7EB' },
    pillRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    pill: { flex: 1 },
    grid2x2: { gap: 8 },
    gridRow: { flexDirection: 'row', gap: 8 },
    cell: { flex: 1, backgroundColor: '#FFF' },
    input: { marginBottom: 8, backgroundColor: '#FFF' },
    btn: { marginTop: 12, backgroundColor: '#8A2BE2', paddingVertical: 4 },
    resultBox: { marginTop: 12, padding: 14, backgroundColor: '#F5F3FF', borderRadius: 10, borderLeftWidth: 4 },
    errText: { color: '#B91C1C', marginTop: 8, fontWeight: '500' },
    refRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    refText: { flex: 1, color: '#374151', lineHeight: 20 },
});

export default BiostatsAssistantScreen;
