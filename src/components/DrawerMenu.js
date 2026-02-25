import React, { useEffect, useRef } from 'react';
import {
    View, StyleSheet, TouchableOpacity, Animated,
    Dimensions, Modal, ScrollView, Linking, Alert,
} from 'react-native';
import { Text, Avatar, Divider } from 'react-native-paper';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const MENU_ITEMS = [
    { icon: 'person-outline', label: 'Profile', screen: 'Profile', iconLib: 'material' },
    { icon: 'bar-chart', label: 'Study Statistics', screen: 'Stats', iconLib: 'material' },
    { icon: 'diamond', label: 'Go Premium', screen: 'Paywall', iconLib: 'material' },
    { icon: 'settings', label: 'Settings', screen: 'Settings', iconLib: 'material' },
    { divider: true },
    { icon: 'star-outline', label: 'Rate the App', action: 'rate', iconLib: 'material' },
    { icon: 'feedback', label: 'Send Feedback', action: 'feedback', iconLib: 'material' },
    { icon: 'privacy-tip', label: 'Privacy Policy', action: 'privacy', iconLib: 'material' },
    { divider: true },
    { icon: 'logout', label: 'Log Out', action: 'logout', iconLib: 'material', danger: true },
];

const DrawerMenu = ({ visible, onClose, user }) => {
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0 }),
                Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
                Animated.timing(backdropAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const handleItem = async (item) => {
        onClose();
        if (item.screen) {
            setTimeout(() => navigation.navigate(item.screen), 250);
            return;
        }
        switch (item.action) {
            case 'rate':
                Linking.openURL('market://details?id=com.stroma.communitymed');
                break;
            case 'feedback':
                Linking.openURL('mailto:support@stroma.app?subject=Feedback');
                break;
            case 'privacy':
                Linking.openURL('https://stroma.app/privacy');
                break;
            case 'logout':
                Alert.alert('Log Out', 'Are you sure you want to log out?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Log Out', style: 'destructive', onPress: () => signOut(auth) },
                ]);
                break;
        }
    };

    if (!visible && slideAnim._value === -DRAWER_WIDTH) return null;

    const initials = user?.displayName
        ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : (user?.email?.[0] || 'S').toUpperCase();

    return (
        <Modal transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
            {/* Backdrop */}
            <Animated.View
                style={[styles.backdrop, { opacity: backdropAnim }]}
            >
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Drawer panel */}
            <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.drawerHeader}>
                    <Avatar.Text
                        size={60}
                        label={initials}
                        style={styles.avatar}
                        labelStyle={styles.avatarLabel}
                    />
                    <Text style={styles.userName}>
                        {user?.displayName || 'STROMA User'}
                    </Text>
                    <Text style={styles.userEmail} numberOfLines={1}>
                        {user?.email || ''}
                    </Text>
                </View>

                <Divider style={styles.headerDivider} />

                {/* Menu items */}
                <ScrollView showsVerticalScrollIndicator={false} style={styles.menuScroll}>
                    {MENU_ITEMS.map((item, idx) => {
                        if (item.divider) return <Divider key={`div-${idx}`} style={styles.divider} />;
                        return (
                            <TouchableOpacity
                                key={item.label}
                                style={styles.menuItem}
                                onPress={() => handleItem(item)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, item.danger && styles.iconBoxDanger]}>
                                    <MaterialIcons
                                        name={item.icon}
                                        size={20}
                                        color={item.danger ? '#EF4444' : '#8A2BE2'}
                                    />
                                </View>
                                <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                                    {item.label}
                                </Text>
                                <MaterialIcons name="chevron-right" size={18} color="#D1D5DB" />
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Footer version */}
                <Text style={styles.version}>STROMA v1.0.0</Text>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    drawer: {
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: '#FFFFFF',
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    drawerHeader: {
        backgroundColor: '#0D1B2A',
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    avatar: {
        backgroundColor: '#8A2BE2',
        marginBottom: 12,
    },
    avatarLabel: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: '#9CA3AF',
    },
    headerDivider: {
        backgroundColor: '#E5E7EB',
        height: 1,
    },
    menuScroll: {
        flex: 1,
        paddingTop: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 20,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    iconBoxDanger: {
        backgroundColor: '#FEE2E2',
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    menuLabelDanger: {
        color: '#EF4444',
    },
    divider: {
        marginVertical: 6,
        marginHorizontal: 20,
        backgroundColor: '#F3F4F6',
    },
    version: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        paddingVertical: 16,
    },
});

export default DrawerMenu;
