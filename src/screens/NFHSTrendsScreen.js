import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Modal, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Button, Card, Text, Chip, SegmentedButtons, List, ActivityIndicator, Divider, Portal, Dialog } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import DropdownPicker from '../components/DropdownPicker';
import { theme } from '../styles/theme';
import { NFHS, NFHS_META } from '../data/nfhsTrendsData';

const ROUND_ORDER = ["NFHS-1", "NFHS-2", "NFHS-3", "NFHS-4", "NFHS-5", "NFHS-6"];
const YEARS = {
    "NFHS-1": "1992-93",
    "NFHS-2": "1998-99",
    "NFHS-3": "2005-06",
    "NFHS-4": "2015-16",
    "NFHS-5": "2019-21",
    "NFHS-6": "2023-24"
};

const NFHSTrendsScreen = () => {
    // 1. Selector States
    const groups = NFHS_META.group_order;
    const [selectedGroup, setSelectedGroup] = useState(groups[0]);

    // Indicators in selected group
    const groupIndicators = useMemo(() => {
        return NFHS_META.groups[selectedGroup] || [];
    }, [selectedGroup]);

    const [selectedIndicator, setSelectedIndicator] = useState(groupIndicators[0] || "");

    // Reset indicator if selected group changes and current indicator is not in the new group
    useEffect(() => {
        if (groupIndicators.length > 0 && !groupIndicators.includes(selectedIndicator)) {
            setSelectedIndicator(groupIndicators[0]);
        }
    }, [selectedGroup, groupIndicators]);

    // Area: Total, Rural, Urban
    const [area, setArea] = useState("Total");

    // Selected States
    const [selectedStates, setSelectedStates] = useState(["India", "Maharashtra", "Uttar Pradesh"]);
    const [stateSearchQuery, setStateSearchQuery] = useState("");
    const [stateModalVisible, setStateModalVisible] = useState(false);

    // Accordion state
    const [expanded, setExpanded] = useState(false);

    // WebView ref and ready state
    const webViewRef = useRef(null);
    const [webViewReady, setWebViewReady] = useState(false);

    // Get comparability information for selected indicator
    const comparabilityInfo = useMemo(() => {
        return NFHS_META.comparability[selectedIndicator] || null;
    }, [selectedIndicator]);

    // Get definition labels by round
    const definitionsByRound = useMemo(() => {
        return NFHS_META.def_labels[selectedIndicator] || {};
    }, [selectedIndicator]);

    // Filter states based on search query
    const filteredStates = useMemo(() => {
        const query = stateSearchQuery.toLowerCase().trim();
        return NFHS_META.states.filter(state => 
            state.toLowerCase().includes(query)
        );
    }, [stateSearchQuery]);

    // Format dropdown items
    const groupDropdownItems = useMemo(() => {
        return groups.map(g => ({ label: g, value: g }));
    }, [groups]);

    const indicatorDropdownItems = useMemo(() => {
        return groupIndicators.map(i => ({ label: i, value: i }));
    }, [groupIndicators]);

    // Calculate traces and layout for Plotly
    const chartParams = useMemo(() => {
        const rows = NFHS.rows;
        const stateDict = NFHS.dicts.state;
        const roundDict = NFHS.dicts.round;
        const areaDict = NFHS.dicts.area;
        const hindDict = NFHS.dicts.harmonized_indicator;

        // Decode rows into accessible format for this indicator & area
        const activeRows = [];
        for (let i = 0; i < rows.length; i++) {
            const r = rows[i];
            const stateName = stateDict[r[0]];
            const roundName = roundDict[r[1]];
            const areaName = areaDict[r[2]];
            const hindName = hindDict[r[5]];
            const val = r[6];

            if (hindName === selectedIndicator && areaName === area) {
                activeRows.push({
                    state: stateName,
                    round: roundName,
                    value: val
                });
            }
        }

        const traces = selectedStates.map(st => {
            let lastIdx = -1;
            const y = ROUND_ORDER.map((rnd, i) => {
                const match = activeRows.find(r => r.state === st && r.round === rnd);
                if (match && match.value !== null && match.value !== undefined) {
                    lastIdx = i;
                    return match.value;
                }
                return null;
            });

            // State label at the last valid index of the line
            const textLabels = y.map((v, i) => i === lastIdx ? `  ${st}` : "");

            return {
                type: "scatter",
                mode: "lines+markers+text",
                name: st,
                x: ROUND_ORDER,
                y: y,
                connectgaps: false,
                line: { width: 2.8 },
                marker: { size: 9 },
                text: textLabels,
                textposition: "middle right",
                textfont: { size: 11, color: "#1F2937" },
                cliponaxis: false,
                hovertemplate: `<b>${st}</b><br>%{x} (%{customdata})<br>Value: %{y}<extra></extra>`,
                customdata: ROUND_ORDER.map(r => YEARS[r])
            };
        });

        const ticktext = ROUND_ORDER.map(r => `${r}<br>${YEARS[r]}`);
        const anyData = traces.some(t => t.y.some(v => v !== null));

        const layout = {
            margin: { t: 30, b: 50, l: 40, r: 100 },
            xaxis: {
                type: "category",
                categoryorder: "array",
                categoryarray: ROUND_ORDER,
                tickmode: "array",
                tickvals: ROUND_ORDER,
                ticktext: ticktext,
                tickfont: { size: 10, color: "#4B5563" },
                gridcolor: "#F3F4F6"
            },
            yaxis: {
                autorange: true,
                title: "",
                zeroline: false,
                gridcolor: "#E5E7EB",
                tickfont: { size: 10, color: "#4B5563" }
            },
            showlegend: true,
            legend: { 
                orientation: "h", 
                y: -0.25,
                x: 0,
                font: { size: 11 }
            },
            hovermode: "closest",
            plot_bgcolor: "#ffffff",
            paper_bgcolor: "#FBFCFE",
            annotations: anyData ? [] : [{
                text: "No data for this indicator / area in selected states.",
                showarrow: false,
                font: { size: 13, color: "#EF4444" },
                xref: "paper",
                yref: "paper",
                x: 0.5,
                y: 0.5
            }]
        };

        return { traces, layout, anyData };
    }, [selectedIndicator, area, selectedStates]);

    // Update WebView when ready or params change
    useEffect(() => {
        if (webViewReady && webViewRef.current) {
            const js = `updateChart(${JSON.stringify(chartParams.traces)}, ${JSON.stringify(chartParams.layout)});`;
            webViewRef.current.injectJavaScript(js);
        }
    }, [chartParams, webViewReady]);

    // Handle WebView communication
    const onMessage = (event) => {
        if (event.nativeEvent.data === 'READY') {
            setWebViewReady(true);
        }
    };

    // Toggle state selection
    const toggleState = (stateName) => {
        setSelectedStates(prev => {
            if (prev.includes(stateName)) {
                // Keep at least one state
                if (prev.length === 1) return prev;
                return prev.filter(s => s !== stateName);
            } else {
                return [...prev, stateName];
            }
        });
    };

    // Quick selections
    const selectAllStates = () => {
        setSelectedStates([...NFHS_META.states]);
    };

    const clearAllStates = () => {
        setSelectedStates(["India"]);
    };

    const selectIndiaOnly = () => {
        setSelectedStates(["India"]);
    };

    // Render definitions
    const definitionRows = Object.entries(definitionsByRound)
        .filter(([round, def]) => def)
        .map(([round, def]) => (
            <View key={round} style={styles.defRow}>
                <Text style={styles.defRound}>{round} ({YEARS[round]}):</Text>
                <Text style={styles.defText}>{def}</Text>
            </View>
        ));

    // WebView HTML content with CDN Plotly
    const webViewHtml = useMemo(() => `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Plotly Chart</title>
            <script src="https://cdn.jsdelivr.net/npm/plotly.js-dist@2.35.2/plotly.min.js"></script>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    background-color: #FBFCFE;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    width: 100vw;
                    overflow: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
                #chart-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                #chart {
                    width: 100%;
                    height: 100%;
                    display: none;
                }
                .loader-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .loader {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #8A2BE2;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    animation: spin 1s linear infinite;
                    margin-bottom: 8px;
                }
                .loader-text {
                    font-size: 12px;
                    color: #6B7280;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div id="chart-container">
                <div id="loader" class="loader-container">
                    <div class="loader"></div>
                    <div class="loader-text">Loading Plotly Chart...</div>
                </div>
                <div id="chart"></div>
            </div>
            <script>
                function updateChart(traces, layout) {
                    document.getElementById('loader').style.display = 'none';
                    document.getElementById('chart').style.display = 'block';
                    Plotly.newPlot('chart', traces, layout, {
                        responsive: true,
                        displayModeBar: false
                    });
                }
                
                // Signal ready when Plotly library is loaded and document is ready
                window.onload = function() {
                    const checkInterval = setInterval(() => {
                        if (window.Plotly) {
                            clearInterval(checkInterval);
                            window.ReactNativeWebView.postMessage('READY');
                        }
                    }, 50);
                };
            </script>
        </body>
        </html>
    `, []);

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* 1. Category / Indicator Dropdowns */}
                <Card style={styles.filterCard}>
                    <Card.Content style={{ padding: 12 }}>
                        <Text style={styles.label}>Indicator Group</Text>
                        <DropdownPicker
                            selectedValue={selectedGroup}
                            onValueChange={setSelectedGroup}
                            items={groupDropdownItems}
                            style={styles.dropdown}
                        />

                        <Text style={[styles.label, { marginTop: 12 }]}>Indicator</Text>
                        <DropdownPicker
                            selectedValue={selectedIndicator}
                            onValueChange={setSelectedIndicator}
                            items={indicatorDropdownItems}
                            style={styles.dropdown}
                        />

                        <Text style={[styles.label, { marginTop: 12, marginBottom: 8 }]}>Residence / Area</Text>
                        <SegmentedButtons
                            value={area}
                            onValueChange={setArea}
                            buttons={[
                                { value: 'Total', label: 'Total' },
                                { value: 'Rural', label: 'Rural' },
                                { value: 'Urban', label: 'Urban' },
                            ]}
                            theme={{ colors: { primary: theme.colors.secondary } }}
                            style={styles.segmentedButtons}
                        />
                    </Card.Content>
                </Card>

                {/* 2. States Selection */}
                <Card style={[styles.filterCard, { marginTop: 12 }]}>
                    <Card.Content style={{ padding: 12 }}>
                        <View style={styles.statesHeader}>
                            <Text style={styles.label}>Selected States / UTs ({selectedStates.length})</Text>
                            <Button 
                                compact 
                                mode="text" 
                                textColor={theme.colors.secondary}
                                onPress={() => {
                                    setStateSearchQuery("");
                                    setStateModalVisible(true);
                                }}
                                icon="edit"
                            >
                                Edit
                            </Button>
                        </View>
                        
                        <View style={styles.chipsContainer}>
                            {selectedStates.map(state => (
                                <Chip 
                                    key={state} 
                                    style={styles.chip}
                                    textStyle={styles.chipText}
                                    onClose={() => toggleState(state)}
                                >
                                    {state}
                                </Chip>
                            ))}
                        </View>
                    </Card.Content>
                </Card>

                {/* 3. Comparability & Info Card */}
                {comparabilityInfo && (
                    <Card style={[styles.infoCard, comparabilityInfo.level === "caution" ? styles.cautionCard : styles.okCard]}>
                        <Card.Content style={{ padding: 12, flexDirection: 'row', alignItems: 'flex-start' }}>
                            <MaterialIcons 
                                name={comparabilityInfo.level === "caution" ? "warning" : "check-circle"} 
                                size={22} 
                                color={comparabilityInfo.level === "caution" ? "#B45309" : "#047857"} 
                                style={{ marginRight: 8, marginTop: 1 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.infoTitle, comparabilityInfo.level === "caution" ? styles.cautionTitle : styles.okTitle]}>
                                    {comparabilityInfo.level === "caution" ? "Definition Changed Across Rounds" : "Comparable Across Rounds"}
                                </Text>
                                <Text style={styles.infoNote}>{comparabilityInfo.note}</Text>
                            </View>
                        </Card.Content>
                    </Card>
                )}

                {/* 4. Chart WebView */}
                <Card style={[styles.chartCard, { marginTop: 12 }]}>
                    <Card.Content style={{ padding: 8 }}>
                        <View style={styles.chartWrapper}>
                            <WebView
                                ref={webViewRef}
                                source={{ html: webViewHtml }}
                                style={styles.webview}
                                onMessage={onMessage}
                                javaScriptEnabled={true}
                                domStorageEnabled={true}
                                originWhitelist={['*']}
                                scrollEnabled={false}
                            />
                            {!webViewReady && (
                                <View style={styles.loaderContainer}>
                                    <ActivityIndicator size="large" color={theme.colors.secondary} />
                                    <Text style={{ marginTop: 12, color: theme.colors.textSecondary }}>Preparing chart engine...</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.chartFootnote}>
                            💡 Line breaks indicate that the round did not measure the indicator for that state or residence.
                        </Text>
                    </Card.Content>
                </Card>

                {/* 5. Definitions Accordion */}
                {Object.keys(definitionsByRound).length > 0 && (
                    <List.Accordion
                        title="Indicator Definitions by Round"
                        titleStyle={styles.accordionTitle}
                        style={styles.accordion}
                        expanded={expanded}
                        onPress={() => setExpanded(!expanded)}
                        left={props => <List.Icon {...props} icon="book-open-outline" color={theme.colors.secondary} />}
                    >
                        <View style={styles.definitionsContent}>
                            {definitionRows}
                        </View>
                    </List.Accordion>
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimerContainer}>
                    <Text style={styles.disclaimerText}>
                        Compiled from IIPS official fact sheets (NFHS-1 to NFHS-6). National levels (NFHS-1 &amp; NFHS-2) added for comparison. State boundaries and definitions shifted over time; review metadata notes before drawing strict longitudinal conclusions.
                    </Text>
                </View>
            </ScrollView>

            {/* States Selector Modal */}
            <Modal
                visible={stateModalVisible}
                animationType="slide"
                onRequestClose={() => setStateModalVisible(false)}
            >
                <SafeAreaView style={styles.modalSafeArea}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select States &amp; UTs</Text>
                        <TouchableOpacity onPress={() => setStateModalVisible(false)} style={styles.modalCloseButton}>
                            <MaterialIcons name="close" size={24} color={theme.colors.textTitle} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.modalSearchContainer}>
                        <MaterialIcons name="search" size={22} color={theme.colors.textSecondary} style={{ marginRight: 8 }} />
                        <TextInput
                            placeholder="Search state..."
                            value={stateSearchQuery}
                            onChangeText={setStateSearchQuery}
                            style={styles.modalSearchInput}
                            autoCorrect={false}
                        />
                        {stateSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setStateSearchQuery("")}>
                                <MaterialIcons name="cancel" size={20} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.modalControlsRow}>
                        <Button mode="outlined" compact onPress={selectIndiaOnly} style={styles.modalControlBtn} textColor={theme.colors.secondary}>
                            India Only
                        </Button>
                        <Button mode="outlined" compact onPress={clearAllStates} style={styles.modalControlBtn} textColor={theme.colors.secondary}>
                            Reset
                        </Button>
                        <Button mode="outlined" compact onPress={selectAllStates} style={styles.modalControlBtn} textColor={theme.colors.secondary}>
                            Select All
                        </Button>
                    </View>
                    
                    <Divider />

                    <FlatList
                        data={filteredStates}
                        keyExtractor={(item) => item}
                        ItemSeparatorComponent={Divider}
                        contentContainerStyle={styles.statesList}
                        renderItem={({ item }) => {
                            const isSelected = selectedStates.includes(item);
                            return (
                                <TouchableOpacity 
                                    style={[styles.stateItem, isSelected && styles.stateItemSelected]} 
                                    onPress={() => toggleState(item)}
                                >
                                    <Text style={[styles.stateItemText, isSelected && styles.stateItemTextSelected]}>
                                        {item}
                                    </Text>
                                    {isSelected ? (
                                        <MaterialIcons name="check-box" size={24} color={theme.colors.secondary} />
                                    ) : (
                                        <MaterialIcons name="check-box-outline-blank" size={24} color={theme.colors.textPlaceholder} />
                                    )}
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <View style={styles.modalFooter}>
                        <Button 
                            mode="contained" 
                            style={styles.doneButton}
                            buttonColor={theme.colors.secondary}
                            textColor="#fff"
                            onPress={() => setStateModalVisible(false)}
                        >
                            Done ({selectedStates.length} Selected)
                        </Button>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.colors.backgroundMain,
    },
    container: {
        padding: 16,
        paddingBottom: 40,
    },
    filterCard: {
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 12,
        elevation: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: theme.colors.textSecondary,
    },
    dropdown: {
        marginTop: 4,
        marginBottom: 4,
        borderColor: '#E5E7EB',
        borderRadius: 8,
    },
    segmentedButtons: {
        marginTop: 6,
    },
    statesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 6,
    },
    chip: {
        backgroundColor: theme.colors.surfaceSecondary,
        borderRadius: 8,
    },
    chipText: {
        fontSize: 12,
        color: theme.colors.textPrimary,
    },
    infoCard: {
        marginTop: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    okCard: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    cautionCard: {
        backgroundColor: '#FFFBEB',
        borderColor: '#FDE68A',
    },
    infoTitle: {
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 2,
    },
    okTitle: {
        color: '#065F46',
    },
    cautionTitle: {
        color: '#92400E',
    },
    infoNote: {
        fontSize: 12,
        color: '#374151',
        lineHeight: 16,
    },
    chartCard: {
        backgroundColor: theme.colors.surfacePrimary,
        borderRadius: 12,
        elevation: 2,
        overflow: 'hidden',
    },
    chartWrapper: {
        height: 420,
        position: 'relative',
    },
    webview: {
        flex: 1,
        backgroundColor: '#FBFCFE',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FBFCFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartFootnote: {
        fontSize: 11,
        color: theme.colors.textTertiary,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    accordion: {
        backgroundColor: theme.colors.surfacePrimary,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    accordionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textTitle,
    },
    definitionsContent: {
        backgroundColor: theme.colors.surfaceTertiary,
        padding: 12,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    defRow: {
        marginBottom: 10,
    },
    defRound: {
        fontWeight: 'bold',
        fontSize: 12,
        color: theme.colors.secondary,
        marginBottom: 1,
    },
    defText: {
        fontSize: 12,
        color: theme.colors.textPrimary,
        lineHeight: 16,
    },
    disclaimerContainer: {
        marginTop: 16,
        paddingHorizontal: 8,
    },
    disclaimerText: {
        fontSize: 11,
        color: theme.colors.textPlaceholder,
        textAlign: 'center',
        lineHeight: 15,
    },
    // Modal styles
    modalSafeArea: {
        flex: 1,
        backgroundColor: theme.colors.backgroundMain,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.textTitle,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceSecondary,
        margin: 12,
        paddingHorizontal: 12,
        borderRadius: 8,
        height: 44,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.textTitle,
        paddingVertical: 8,
    },
    modalControlsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        paddingBottom: 10,
    },
    modalControlBtn: {
        flex: 1,
        marginHorizontal: 4,
        borderColor: '#E5E7EB',
        borderRadius: 6,
    },
    statesList: {
        paddingHorizontal: 8,
    },
    stateItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    stateItemSelected: {
        backgroundColor: theme.colors.primaryLight,
    },
    stateItemText: {
        fontSize: 15,
        color: theme.colors.textPrimary,
    },
    stateItemTextSelected: {
        fontWeight: 'bold',
        color: theme.colors.primaryDark,
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: theme.colors.surfacePrimary,
    },
    doneButton: {
        borderRadius: 10,
        paddingVertical: 4,
    }
});

export default NFHSTrendsScreen;
