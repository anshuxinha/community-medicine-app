import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const LoginScreen = ({ navigation }) => {
    const { login } = useContext(AppContext);
    const [isRegistering, setIsRegistering] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: username });

                // Save additional info to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    isPremium: false,
                    createdAt: new Date().toISOString()
                });

                login({ uid: user.uid, email, username, isPremium: false });
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
                        <MaterialIcons name="account-balance-wallet" size={100} color="#3B82F6" style={styles.mockImage} />
                    </View>

                    <Text variant="headlineMedium" style={styles.title}>
                        {isRegistering ? 'Create an account' : 'Welcome back'}
                    </Text>
                    <Text variant="bodyMedium" style={styles.subtitle}>
                        {isRegistering ? 'Sign up with:' : 'Log in with:'}
                    </Text>

                    {/* Social Buttons */}
                    <View style={styles.socialRow}>
                        <TouchableOpacity style={styles.socialButton}>
                            <MaterialIcons name="g-translate" size={20} color="#EA4335" />
                            <Text style={styles.socialButtonText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialButton}>
                            <MaterialIcons name="facebook" size={20} color="#1877F2" />
                            <Text style={styles.socialButtonText}>Facebook</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Input Form */}
                    <View style={styles.formContainer}>
                        {isRegistering && (
                            <TextInput
                                label="Username"
                                value={username}
                                onChangeText={setUsername}
                                style={styles.input}
                                textColor="#FFFFFF"
                                theme={{ colors: { onSurfaceVariant: '#9CA3AF' } }}
                                activeUnderlineColor="#3B82F6"
                                underlineColor="transparent"
                            />
                        )}
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            textColor="#FFFFFF"
                            theme={{ colors: { onSurfaceVariant: '#9CA3AF' } }}
                            activeUnderlineColor="#3B82F6"
                            underlineColor="transparent"
                        />
                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={styles.input}
                            textColor="#FFFFFF"
                            theme={{ colors: { onSurfaceVariant: '#9CA3AF' } }}
                            activeUnderlineColor="#3B82F6"
                            underlineColor="transparent"
                        />

                        {/* Toggle Auth Mode */}
                        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={styles.toggleTextContainer}>
                            <Text style={styles.toggleText}>
                                {isRegistering ? 'Already have an account? Log in' : 'New here? Create an account'}
                            </Text>
                        </TouchableOpacity>

                        <Button
                            mode="contained"
                            onPress={handleAuth}
                            style={styles.actionButton}
                            labelStyle={styles.actionButtonLabel}
                            loading={loading}
                            disabled={loading}
                        >
                            {isRegistering ? 'Register' : 'Next'}
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#15171E', // Dark slate background matching the design
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        justifyContent: 'center',
    },
    headerImageContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
    },
    mockImage: {
        opacity: 0.9,
    },
    title: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 24,
    },
    socialRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#22242B',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 6,
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
    formContainer: {
        flex: 1,
    },
    input: {
        backgroundColor: '#22242B',
        marginBottom: 16,
        borderRadius: 8,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        height: 56,
        paddingHorizontal: 4,
    },
    toggleTextContainer: {
        alignItems: 'flex-end',
        marginBottom: 24,
    },
    toggleText: {
        color: '#3B82F6',
        fontSize: 14,
        fontWeight: '600',
    },
    actionButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 6,
    },
    actionButtonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    }
});

export default LoginScreen;
