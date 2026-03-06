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
import { AppContext } from '../context/AppContext';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

const MENU_ITEMS = [
    { icon: 'person-outline', label: 'Profile', action: 'profile', iconLib: 'material' },
    { icon: 'diamond', label: 'Go Premium', screen: 'Paywall', iconLib: 'material' },
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
    const { currentStreak, studyScore, readingProgress, logout } = React.useContext(AppContext);

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
            setTimeout(() => navigation.navigate(item.screen), 300);
            return;
        }
        // Delay all Alerts by 300ms so the drawer modal fully closes first
        // (Modal unmounting on Android dismisses any Alert that opens during teardown)
        setTimeout(() => {
            switch (item.action) {
                case 'profile':
                    Alert.alert(
                        '👤 My Profile',
                        `Name: ${displayName}\nEmail: ${user?.email || 'N/A'}\n\nAccount Type: ${user ? 'Registered' : 'Guest'}`,
                        [{ text: 'Close', style: 'cancel' }]
                    );
                    break;

                case 'rate':
                    Linking.openURL('market://details?id=com.communitymed.app');
                    break;
                case 'feedback':
                    Linking.openURL('mailto:anshuxinha@gmail.com?subject=STROMA%20App%20Feedback');
                    break;
                case 'privacy':
                    Linking.openURL('https://community-med-app.web.app/privacy');
                    break;
                case 'logout':
                    Alert.alert('Log Out', 'Are you sure you want to log out?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Log Out', style: 'destructive',
                            onPress: async () => {
                                await signOut(auth);
                                logout();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'Login' }],
                                });
                            },
                        },
                    ]);
                    break;
            }
        }, 300);
    };

    if (!visible && slideAnim._value === -DRAWER_WIDTH) return null;

    const displayName = user?.username || user?.displayName || 'STROMA User';
    const initials = displayName
        .split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S';

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
                        {displayName}
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
                                        color={item.danger ? theme.colors.error : theme.colors.secondary}
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
        backgroundColor: theme.colors.surfacePrimary,
        elevation: 16,
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    drawerHeader: {
        backgroundColor: theme.colors.textPrimary,
        paddingTop: 56,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    avatar: {
        backgroundColor: theme.colors.secondary,
        marginBottom: 12,
    },
    avatarLabel: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.surfacePrimary,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.surfacePrimary,
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 13,
        color: theme.colors.textPlaceholder,
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
        backgroundColor: theme.colors.errorLight,
    },
    menuLabel: {
        flex: 1,
        fontSize: 15,
        color: theme.colors.textTitle,
        fontWeight: '500',
    },
    menuLabelDanger: {
        color: theme.colors.error,
    },
    divider: {
        marginVertical: 6,
        marginHorizontal: 20,
        backgroundColor: theme.colors.surfaceSecondary,
    },
    version: {
        textAlign: 'center',
        color: theme.colors.textPlaceholder,
        fontSize: 12,
        paddingVertical: 16,
    },
});

export default DrawerMenu;
