import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const NotificationsScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.header}>Notifications</Text>
                <View style={styles.emptyState}>
                    <MaterialIcons name="notifications-none" size={72} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>You're all caught up!</Text>
                    <Text style={styles.emptyBody}>
                        Push notifications about study reminders, streaks, and new content will appear here.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FBFCFE' },
    container: { flex: 1, padding: 16 },
    header: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#374151',
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    emptyBody: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default NotificationsScreen;
