import React, { useState, useContext } from 'react';
import {
    View, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
    Platform, ScrollView, Image, ImageBackground,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    updateProfile, signInWithCredential, GoogleAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
    webClientId: '856703659616-8e0k1obmgom04783jjf695hkianm4hme.apps.googleusercontent.com',
});

const LoginScreen = () => {
    const { login } = useContext(AppContext);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data?.idToken || userInfo.idToken;
            if (!idToken) throw new Error('No ID token returned from Google Sign-In.');
            const googleCredential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            let premiumStatus = false;
            if (userDoc.exists()) {
                premiumStatus = userDoc.data().isPremium;
            } else {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email, isPremium: false, createdAt: new Date().toISOString(),
                });
            }
            login({ uid: user.uid, email: user.email, username: user.displayName || 'Google User', isPremium: premiumStatus });
        } catch (error) {
            alert(`Google Sign-In Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            // Admin bypass
            if (email.toLowerCase() === 'admin@admin.com') {
                login({ uid: 'admin-123', email: 'admin@admin.com', username: 'Admin', isPremium: true });
                return;
            }
            if (email.toLowerCase() === 'test@test.com') {
                login({ uid: 'test-123', email: 'test@test.com', username: 'Standard User', isPremium: false });
                return;
            }
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, 'users', user.uid), {
                    email, isPremium: false, createdAt: new Date().toISOString(),
                });
                login({ uid: user.uid, email, username: 'New User', isPremium: false });
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const premiumStatus = userDoc.exists() ? userDoc.data().isPremium : false;
                const displayName = user.displayName || userDoc.data()?.username || 'User';
                login({ uid: user.uid, email, username: displayName, isPremium: premiumStatus });
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            {/* Dark top half with full logo (icon + STROMA text baked in) */}
            <View style={styles.topHalf}>
                <Image
                    source={require('../../assets/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.brandTagline}>Community Medicine · Simplified</Text>
            </View>

            {/* White bottom sheet */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheet}
            >
                <ScrollView
                    contentContainerStyle={styles.sheetContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isRegistering ? 'Join the STROMA community' : 'Sign in to continue learning'}
                    </Text>

                    {/* Email field */}
                    <View style={styles.inputRow}>
                        <MaterialIcons name="mail-outline" size={20} color="#8A2BE2" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Email address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            textColor="#111827"
                            placeholderTextColor="#9CA3AF"
                            activeUnderlineColor="transparent"
                            underlineColor="transparent"
                        />
                    </View>

                    {/* Password field */}
                    <View style={styles.inputRow}>
                        <MaterialIcons name="lock-outline" size={20} color="#8A2BE2" style={styles.inputIcon} />
                        <TextInput
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            style={styles.input}
                            textColor="#111827"
                            placeholderTextColor="#9CA3AF"
                            activeUnderlineColor="transparent"
                            underlineColor="transparent"
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                            <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Primary CTA */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleAuth}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryBtnText}>
                            {loading ? 'Please wait…' : isRegistering ? 'Create Account' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or continue with</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Google Sign-In — full width */}
                    <TouchableOpacity
                        style={[styles.googleBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        <FontAwesome5 name="google" size={18} color="#EA4335" style={styles.googleIcon} />
                        <Text style={styles.googleBtnText}>Continue with Google</Text>
                    </TouchableOpacity>

                    {/* Toggle */}
                    <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.toggle}>
                        <Text style={styles.toggleText}>
                            {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                            <Text style={styles.toggleLink}>{isRegistering ? 'Sign In' : 'Sign Up'}</Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0D1B2A' },

    // ── Top dark half ────────────────────────────────────────────
    topHalf: {
        height: 280,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
    },
    logo: {
        width: 240,
        height: 220,
        marginBottom: 2,
    },
    brandTagline: {
        fontSize: 13,
        color: '#9CA3AF',
        letterSpacing: 1,
    },

    // ── Bottom white sheet ───────────────────────────────────────
    sheet: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    sheetContent: {
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 28,
    },

    // ── Inputs ───────────────────────────────────────────────────
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 14,
        marginBottom: 14,
        height: 56,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        fontSize: 15,
        height: 56,
    },
    eyeBtn: { padding: 4 },

    // ── Primary button ───────────────────────────────────────────
    primaryBtn: {
        backgroundColor: '#8A2BE2',
        borderRadius: 14,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#8A2BE2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ── Divider ──────────────────────────────────────────────────
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: {
        fontSize: 13,
        color: '#9CA3AF',
        marginHorizontal: 12,
    },

    // ── Google button ────────────────────────────────────────────
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        height: 52,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        marginBottom: 28,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    googleIcon: { marginRight: 10 },
    googleBtnText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '600',
    },

    // ── Toggle ───────────────────────────────────────────────────
    toggle: { alignItems: 'center' },
    toggleText: { color: '#9CA3AF', fontSize: 14 },
    toggleLink: { color: '#8A2BE2', fontWeight: '700' },
});

export default LoginScreen;
