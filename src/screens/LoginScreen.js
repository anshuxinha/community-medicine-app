import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// NOTE: Must configure with your Web Client ID from Firebase Console to obtain the idToken
GoogleSignin.configure({
    webClientId: '856703659616-8e0k1obmgom04783jjf695hkianm4hme.apps.googleusercontent.com',
});

const LoginScreen = ({ navigation }) => {
    const { login } = useContext(AppContext);
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.idToken;

            if (!idToken) throw new Error("No ID token returned from Google Sign-In.");

            const googleCredential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, googleCredential);
            const user = userCredential.user;

            // Check if user document exists to fetch premium status, otherwise create it
            const userDoc = await getDoc(doc(db, "users", user.uid));
            let premiumStatus = false;

            if (userDoc.exists()) {
                premiumStatus = userDoc.data().isPremium;
            } else {
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    isPremium: false,
                    createdAt: new Date().toISOString()
                });
            }

            login({ uid: user.uid, email: user.email, username: user.displayName || 'Google User', isPremium: premiumStatus });
        } catch (error) {
            alert(`Google Sign-In Error: ${error.message}\nThis requires a custom dev build, it will not run in standard Expo Go.`);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            // Temporary Admin Bypass
            if (email.toLowerCase() === 'admin@admin.com') {
                login({ uid: 'admin-123', email: 'admin@admin.com', username: 'Super Admin', isPremium: true });
                return;
            }

            // Test User for Paywall Verification
            if (email.toLowerCase() === 'test@test.com') {
                login({ uid: 'test-123', email: 'test@test.com', username: 'Standard User', isPremium: false });
                return;
            }

            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: username });

                await setDoc(doc(db, "users", user.uid), {
                    email: email,
                    isPremium: false,
                    createdAt: new Date().toISOString()
                });

                login({ uid: user.uid, email, username: 'New User', isPremium: false });
            } else {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Fetch premium status from Firestore
                const userDoc = await getDoc(doc(db, "users", user.uid));
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
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Header Image Area (Mocking the wallet/3D illustration from design) */}
                    <View style={styles.headerImageContainer}>
                        <FontAwesome5 name="shield-alt" size={80} color="#E0F2FE" style={styles.mockImageBg} />
                        <MaterialIcons name="security" size={50} color="#38BDF8" style={styles.mockImageForeground} />
                    </View>

                    <Text variant="headlineMedium" style={styles.title}>
                        {isRegistering ? 'Create Account' : 'Welcome Back'}
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {isRegistering ? 'Sign up to continue' : 'Log in to continue'}
                    </Text>

                    {/* Input Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Email"
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
                        <View style={styles.inputWrapper}>
                            <MaterialIcons name="lock-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                style={styles.input}
                                textColor="#111827"
                                placeholderTextColor="#9CA3AF"
                                activeUnderlineColor="transparent"
                                underlineColor="transparent"
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleAuth}
                            style={styles.actionButton}
                            labelStyle={styles.actionButtonLabel}
                            loading={loading}
                            disabled={loading}
                        >
                            {isRegistering ? 'Register' : 'Login'}
                        </Button>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialIconBtn} onPress={handleGoogleLogin} disabled={loading}>
                                <FontAwesome5 name="google" size={20} color="#EA4335" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIconBtn} onPress={() => { }} disabled={loading}>
                                <MaterialIcons name="apple" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialIconBtn} onPress={() => { }} disabled={loading}>
                                <MaterialIcons name="play-arrow" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Toggle Auth Mode */}
                        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.toggleTextContainer}>
                            <Text style={styles.toggleText}>
                                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                                <Text style={styles.toggleLink}>{isRegistering ? 'Log in' : 'Sign Up'}</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FBFCFE', // Soft light background
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 32,
        paddingBottom: 20,
        justifyContent: 'center',
    },
    headerImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        marginBottom: 10,
        height: 80,
    },
    mockImageBg: {
        position: 'absolute',
        opacity: 0.5,
    },
    mockImageForeground: {
        position: 'absolute',
    },
    title: {
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 32,
        marginBottom: 4,
    },
    subtitle: {
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    formContainer: {
        flex: 1,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        height: 56,
        fontSize: 16,
    },
    actionButton: {
        backgroundColor: '#38BDF8', // Cyan/blue gradient feel
        borderRadius: 24,
        paddingVertical: 8,
        marginTop: 16,
        marginBottom: 32,
        elevation: 4,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    actionButtonLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 40,
    },
    socialIconBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 12,
    },
    toggleTextContainer: {
        alignItems: 'center',
        marginTop: 'auto',
    },
    toggleText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    toggleLink: {
        color: '#9CA3AF',
        fontWeight: 'bold',
    }
});

export default LoginScreen;
