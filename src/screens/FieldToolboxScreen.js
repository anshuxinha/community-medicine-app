import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useThemedStyles } from '../styles/useThemedStyles';

const TOOLS = [
    {
        key: 'ses',
        title: 'SES Calculator',
        desc: 'Compute Socio-Economic Status (Modified Kuppuswamy & BG Prasad)',
        icon: 'calculate',
        route: 'SESCalculator',
    },
    {
        key: 'diet',
        title: 'Dietary Survey',
        desc: '24-hour recall and family CU vs ICMR-NIN 2020, using IFCT 2017 foods',
        icon: 'restaurant-menu',
        route: 'DietarySurvey',
    },
    {
        key: 'anthro',
        title: 'Anthropometry',
        desc: 'Calculate BMI, MUAC, WHR, WHtR, and Ideal Body Weight',
        icon: 'accessibility-new',
        route: 'Anthropometry',
    },
    {
        key: 'nfhs',
        title: 'NFHS Tools',
        desc: 'NFHS-5 vs NFHS-6, rural vs urban, and trends across rounds 1 to 6',
        icon: 'insert-chart',
        route: 'NFHSTools',
    },
    {
        key: 'biostats',
        title: 'Biostats Assistant',
        desc: 'Sample size, 2x2 table (OR, RR, Se/Sp), vaccine efficacy, IMR',
        icon: 'functions',
        route: 'BiostatsAssistant',
    },
];

const FieldToolboxScreen = ({ navigation }) => {
  const { styles } = useThemedStyles(createStyles);

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text variant="headlineMedium" style={styles.title}>Field Toolbox</Text>
                {TOOLS.map((tool) => (
                    <Card
                        key={tool.key}
                        style={styles.card}
                        onPress={() => navigation.navigate(tool.route)}
                    >
                        <Card.Content style={styles.cardContent}>
                            <MaterialIcons name={tool.icon} size={40} color={theme.colors.secondary} />
                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>{tool.title}</Text>
                                <Text style={styles.cardDesc}>{tool.desc}</Text>
                            </View>
                        </Card.Content>
                    </Card>
                ))}
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
        padding: 16,
        paddingTop: 24,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 24,
        color: colors.textTitle,
    },
    card: {
        marginBottom: 16,
        backgroundColor: colors.surfacePrimary,
        borderRadius: 16,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textContainer: {
        marginLeft: 16,
        flex: 1,
    },
    cardTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        color: colors.textTitle,
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        color: colors.textBody,
        lineHeight: 20,
    },
});

export default FieldToolboxScreen;
