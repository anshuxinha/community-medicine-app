import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

// In-app notification log — these simulate the push notification history
const NOTIFICATIONS = [
    { id: '1', icon: 'local-fire-department', color: '#F97316', title: '🔥 3-Day Streak!', body: "You're building a habit. Keep it up!", time: '2 hours ago' },
    { id: '2', icon: 'lightbulb', color: '#EAB308', title: '💡 Study Tip', body: 'Anopheles rests at 45° (Angular!). Culex rests parallel.', time: 'Yesterday' },
    { id: '3', icon: 'menu-book', color: '#8A2BE2', title: '📚 Daily Reminder', body: "You haven't studied today. Open a chapter to maintain your streak!", time: 'Yesterday' },
    { id: '4', icon: 'bar-chart', color: '#10B981', title: '📊 Weekly Progress', body: "You've read 5 chapters this week. Great progress!", time: '3 days ago' },
    { id: '5', icon: 'lightbulb', color: '#EAB308', title: '💡 Study Tip', body: 'VE = (ARu – ARv) / ARu × 100. Vaccine Efficacy formula!', time: '4 days ago' },
    { id: '6', icon: 'lightbulb', color: '#EAB308', title: '💡 Study Tip', body: "Gram +ve = Violet/Purple. Gram –ve = Pink/Red (Safranin).", time: '1 week ago' },
];

const NotificationsScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Notifications</Text>

                {NOTIFICATIONS.map((notif, idx) => (
                    <React.Fragment key={notif.id}>
                        <View style={styles.item}>
                            <View style={[styles.iconBox, { backgroundColor: notif.color + '20' }]}>
                                <MaterialIcons name={notif.icon} size={22} color={notif.color} />
                            </View>
                            <View style={styles.content}>
                                <Text style={styles.title}>{notif.title}</Text>
                                <Text style={styles.body}>{notif.body}</Text>
                                <Text style={styles.time}>{notif.time}</Text>
                            </View>
                        </View>
                        {idx < NOTIFICATIONS.length - 1 && <Divider style={styles.divider} />}
                    </React.Fragment>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FBFCFE' },
    container: { padding: 16, paddingBottom: 48 },
    header: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
    item: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    content: { flex: 1 },
    title: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    body: { fontSize: 13, color: '#374151', lineHeight: 18, marginBottom: 4 },
    time: { fontSize: 12, color: '#9CA3AF' },
    divider: { backgroundColor: '#F3F4F6' },
});

export default NotificationsScreen;
