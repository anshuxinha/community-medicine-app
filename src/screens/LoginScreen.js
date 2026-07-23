import React, { useState, useContext, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Linking,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Text, TextInput, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppContext } from "../context/AppContext";
import { getDeviceId } from "../utils/deviceUtils";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { auth, db } from "../config/firebase";
import NetInfo from "@react-native-community/netinfo";
import {
  enableScreenCaptureProtection,
  disableScreenCaptureProtection,
} from "../utils/screenCaptureProtection";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  OAuthProvider,
  getIdTokenResult,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import Constants from "expo-constants";
import { useThemedStyles } from '../styles/useThemedStyles';
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

let GoogleSignin;
if (Constants.appOwnership !== "expo") {
  GoogleSignin =
    require("@react-native-google-signin/google-signin").GoogleSignin;
  GoogleSignin.configure({
    webClientId:
      "856703659616-8e0k1obmgom04783jjf695hkianm4hme.apps.googleusercontent.com",
    iosClientId: 
      "856703659616-pel4uk9eb2u2qc12m2ldgk4o8eitu75v.apps.googleusercontent.com",
  });
}

// ── Timeout helper for Firestore queries (prevents freezing on offline) ───
const timeoutPromise = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Firebase Request Timed Out")), ms),
  );

const randomNonceString = (length = 32) => {
  const charset = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._";
  const randomBytes = Crypto.getRandomBytes(length);
  return Array.from(randomBytes)
    .map((byte) => charset[byte % charset.length])
    .join("");
};

const formatAppleName = (fullName) => {
  if (!fullName) return "";
  return [fullName.givenName, fullName.middleName, fullName.familyName]
    .filter(Boolean)
    .join(" ")
    .trim();
};

// Shown after a reset request (success or unknown email). Browser link only.
const PASSWORD_RESET_SENT_MESSAGE =
  "If an account exists for that email, we sent a reset link. Open it in your browser to set a new password, then sign in here. Check spam if needed. Google/Apple-only accounts should use those buttons instead.";

const LoginScreen = () => {
  const { styles, colors } = useThemedStyles(createStyles);

  const { login } = useContext(AppContext);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    enableScreenCaptureProtection();
    return () => {
      disableScreenCaptureProtection();
    };
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [resetInfo, setResetInfo] = useState("");
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);

  // ── Device conflict modal state ──
  const [isConflictModalVisible, setIsConflictModalVisible] = useState(false);
  const [pendingUserUid, setPendingUserUid] = useState(null);
  const [pendingUserData, setPendingUserData] = useState(null);
  const [localDeviceId, setLocalDeviceId] = useState(null);
  const [conflictLoading, setConflictLoading] = useState(false);

  // Fetch local device ID on mount
  useEffect(() => {
    getDeviceId().then(setLocalDeviceId).catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    if (Platform.OS !== "ios") {
      setIsAppleSignInAvailable(false);
      return () => {
        mounted = false;
      };
    }

    AppleAuthentication.isAvailableAsync()
      .then((available) => {
        if (mounted) {
          setIsAppleSignInAvailable(available);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsAppleSignInAvailable(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // ── Shared device conflict check ──
  const checkDeviceConflict = async (firebaseUser, userData) => {
    try {
      const deviceId = localDeviceId || (await getDeviceId());
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await Promise.race([
        getDoc(userDocRef),
        timeoutPromise(8000),
      ]);
      const data = userDoc.exists() ? userDoc.data() : {};

      if (!data.currentDeviceId || data.currentDeviceId === deviceId) {
        // No conflict — register this device and proceed
        await setDoc(userDocRef, { currentDeviceId: deviceId }, { merge: true });
        await login(userData);
      } else {
        // Conflict — show modal, don't let user in
        setPendingUserUid(firebaseUser.uid);
        setPendingUserData(userData);
        setIsConflictModalVisible(true);
      }
    } catch (err) {
      // Firestore unreachable — let user through with a warning
      console.warn("Device conflict check failed:", err?.message);
      await login(userData);
    }
  };

  // ── Conflict modal handlers ──
  const handleCancelConflict = async () => {
    try {
      await signOut(auth);
    } catch (_) {}
    setPendingUserUid(null);
    setPendingUserData(null);
    setIsConflictModalVisible(false);
  };

  const handleProceedConflict = async () => {
    setConflictLoading(true);
    try {
      const deviceId = localDeviceId || (await getDeviceId());
      await updateDoc(doc(db, "users", pendingUserUid), {
        currentDeviceId: deviceId,
      });
      setIsConflictModalVisible(false);
      await login(pendingUserData);
    } catch (err) {
      console.warn("Failed to resolve conflict:", err?.message);
      setValidationError("Failed to sign out the other device. Please try again.");
      setIsConflictModalVisible(false);
      try { await signOut(auth); } catch (_) {}
    } finally {
      setPendingUserUid(null);
      setPendingUserData(null);
      setConflictLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (Constants.appOwnership === "expo") {
      alert(
        "Google Sign-In is not supported in Expo Go. Please use email/password or use a development build.",
      );
      return;
    }
    try {
      setLoading(true);

      // Check internet connectivity
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setValidationError("Please connect to the internet to sign in.");
        setLoading(false);
        return;
      }

      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken)
        throw new Error("No ID token returned from Google Sign-In.");
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);
      const user = userCredential.user;

      const tokenResult = await getIdTokenResult(user, true);
      const claimsPremium = tokenResult.claims.isPremium === true;

      let premiumStatus = claimsPremium;
      try {
        const userDoc = await Promise.race([
          getDoc(doc(db, "users", user.uid)),
          timeoutPromise(2000),
        ]);

        if (userDoc.exists()) {
          premiumStatus = userDoc.data().isPremium === true || claimsPremium;
        } else {
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            isPremium: claimsPremium,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Offline or timeout - gracefully fallback to non-premium
        console.warn("Firestore unavailable during Google Login:", err.message);
      }

      const userData = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || "Google User",
        isPremium: premiumStatus,
      };

      // Intercept: check device conflict before allowing in
      await checkDeviceConflict(user, userData);
    } catch (error) {
      if (!isConflictModalVisible) {
        alert(`Google Sign-In Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setValidationError("");

    if (Platform.OS !== "ios" || !isAppleSignInAvailable) {
      setValidationError("Apple Sign-In is available only on supported Apple devices.");
      return;
    }

    try {
      setLoading(true);

      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setValidationError("Please connect to the internet to sign in.");
        setLoading(false);
        return;
      }

      const rawNonce = randomNonceString();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!appleCredential.identityToken) {
        throw new Error("No identity token returned from Apple Sign-In.");
      }

      const provider = new OAuthProvider("apple.com");
      const authCredential = provider.credential({
        idToken: appleCredential.identityToken,
        rawNonce,
      });
      const userCredential = await signInWithCredential(auth, authCredential);
      const user = userCredential.user;

      const tokenResult = await getIdTokenResult(user, true);
      const claimsPremium = tokenResult.claims.isPremium === true;
      const appleDisplayName = formatAppleName(appleCredential.fullName);
      const appleEmail = appleCredential.email || user.email || "";

      let premiumStatus = claimsPremium;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await Promise.race([
          getDoc(userDocRef),
          timeoutPromise(2000),
        ]);

        if (userDoc.exists()) {
          premiumStatus = userDoc.data().isPremium === true || claimsPremium;
        } else {
          await setDoc(userDocRef, {
            email: appleEmail,
            username: appleDisplayName || user.displayName || "Apple User",
            appleUser: appleCredential.user,
            isPremium: claimsPremium,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Firestore unavailable during Apple Login:", err.message);
      }

      const userData = {
        uid: user.uid,
        email: appleEmail,
        username: appleDisplayName || user.displayName || "Apple User",
        isPremium: premiumStatus,
      };

      await checkDeviceConflict(user, userData);
    } catch (error) {
      if (error?.code !== "ERR_REQUEST_CANCELED" && !isConflictModalVisible) {
        setValidationError(`Apple Sign-In Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setValidationError("");
    setResetInfo("");

    if (!email.trim()) {
      setValidationError("Please enter your email address.");
      return;
    }

    if (!password) {
      setValidationError("Please enter your password.");
      return;
    }

    if (isRegistering && password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Check internet connectivity
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setValidationError("Please connect to the internet to sign in.");
        setLoading(false);
        return;
      }

      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        const deviceId = localDeviceId || (await getDeviceId());
        await setDoc(doc(db, "users", user.uid), {
          email,
          isPremium: false,
          createdAt: new Date().toISOString(),
          currentDeviceId: deviceId,
        });
        await login({ uid: user.uid, email, username: "New User", isPremium: false });
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = userCredential.user;

        const tokenResult = await getIdTokenResult(user, true);
        const claimsPremium = tokenResult.claims.isPremium === true;

        let premiumStatus = claimsPremium;
        try {
          const userDoc = await Promise.race([
            getDoc(doc(db, "users", user.uid)),
            timeoutPromise(2000),
          ]);
          premiumStatus = userDoc.exists()
            ? userDoc.data().isPremium === true || claimsPremium
            : claimsPremium;
        } catch (err) {
          console.warn("Firestore unavailable during login:", err.message);
        }

        const displayName = user.displayName || "User";
        const userData = {
          uid: user.uid,
          email,
          username: displayName,
          isPremium: premiumStatus,
        };

        // Intercept: check device conflict before allowing in
        await checkDeviceConflict(user, userData);
      }
    } catch (error) {
      if (error.message.includes("auth/email-already-in-use")) {
        setValidationError(
          "This email is already registered. Try signing in instead.",
        );
      } else if (error.message.includes("auth/invalid-email")) {
        setValidationError("Please enter a valid email address.");
      } else if (error.message.includes("auth/weak-password")) {
        setValidationError("Password must be at least 6 characters.");
      } else if (
        error.message.includes("auth/user-not-found") ||
        error.message.includes("auth/wrong-password")
      ) {
        setValidationError("Invalid email or password. Please try again.");
      } else {
        setValidationError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Browser-hosted Firebase password reset (email link → Firebase reset page).
  const handleForgotPassword = async () => {
    setValidationError("");
    setResetInfo("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError("Enter your email address above, then tap Forgot password.");
      return;
    }

    setLoading(true);
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setValidationError("Please connect to the internet to reset your password.");
        return;
      }

      await sendPasswordResetEmail(auth, trimmedEmail);
      // Generic copy whether or not the account exists (avoids email enumeration).
      setResetInfo(PASSWORD_RESET_SENT_MESSAGE);
    } catch (error) {
      const code = error?.code || "";
      const message = error?.message || "";

      // Treat missing user the same as success when Firebase still surfaces it.
      if (
        code === "auth/user-not-found" ||
        message.includes("auth/user-not-found")
      ) {
        setResetInfo(PASSWORD_RESET_SENT_MESSAGE);
      } else if (
        code === "auth/invalid-email" ||
        message.includes("auth/invalid-email")
      ) {
        setValidationError("Please enter a valid email address.");
      } else if (
        code === "auth/too-many-requests" ||
        message.includes("auth/too-many-requests")
      ) {
        setValidationError("Too many attempts. Please wait a few minutes and try again.");
      } else if (
        code === "auth/network-request-failed" ||
        message.includes("auth/network-request-failed")
      ) {
        setValidationError("Network error. Check your connection and try again.");
      } else {
        setValidationError(
          message || "Could not send reset email. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Brand navy hero — matches logo/splash so the mark sits cleanly */}
      <View style={styles.topHalf}>
        <Image
          source={require("../../assets/stroma_logo_login.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="STROMA"
        />
        <Text style={styles.brandTagline}>Community Medicine · Simplified</Text>
      </View>

      {/* Form sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.sheet}
      >
        <ScrollView
          contentContainerStyle={styles.sheetContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            {isRegistering ? "Create Account" : "Welcome Back"}
          </Text>
          <Text style={styles.subtitle}>
            {isRegistering
              ? "Join the STROMA community"
              : "Sign in to continue learning"}
          </Text>

          {/* Validation error */}
          {validationError ? (
            <View style={styles.errorBanner}>
              <MaterialIcons
                name="error-outline"
                size={16}
                color={colors.error}
              />
              <Text style={styles.errorText}>{validationError}</Text>
            </View>
          ) : null}

          {/* Password reset info */}
          {resetInfo ? (
            <View style={styles.successBanner}>
              <MaterialIcons
                name="mark-email-read"
                size={16}
                color={colors.successStrong}
              />
              <Text style={styles.successText}>{resetInfo}</Text>
            </View>
          ) : null}

          {/* Email field */}
          <View style={styles.inputRow}>
            <MaterialIcons
              name="mail-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Email address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (resetInfo) setResetInfo("");
                if (validationError) setValidationError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              textColor={colors.inputText}
              placeholderTextColor={colors.inputPlaceholder}
              activeUnderlineColor="transparent"
              underlineColor="transparent"
              selectionColor={colors.secondary}
            />
          </View>

          {/* Password field */}
          <View style={styles.inputRow}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={colors.secondary}
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
              textColor={colors.inputText}
              placeholderTextColor={colors.inputPlaceholder}
              activeUnderlineColor="transparent"
              underlineColor="transparent"
              selectionColor={colors.secondary}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={20}
                color={colors.inputPlaceholder}
              />
            </TouchableOpacity>
          </View>

          {/* Forgot password — sign-in only; opens Firebase browser reset */}
          {!isRegistering ? (
            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={loading}
              style={styles.forgotPasswordBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
          ) : null}

          {/* Primary CTA */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {loading
                ? "Please wait…"
                : isRegistering
                  ? "Create Account"
                  : "Sign In"}
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
            <FontAwesome5
              name="google"
              size={18}
              color={colors.error}
              style={styles.googleIcon}
            />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          {isAppleSignInAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={14}
              style={[styles.appleBtn, loading && styles.primaryBtnDisabled]}
              onPress={loading ? () => {} : handleAppleLogin}
            />
          ) : null}

          {/* Toggle */}
          <TouchableOpacity
            onPress={() => {
              setIsRegistering(!isRegistering);
              setValidationError("");
              setResetInfo("");
            }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {isRegistering
                ? "Already have an account? "
                : "Don't have an account? "}
              <Text style={styles.toggleLink}>
                {isRegistering ? "Sign In" : "Sign Up"}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("https://community-med-app.web.app/privacy")
            }
            style={styles.privacyLink}
          >
            <Text style={styles.privacyText}>Privacy Policy</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Device Conflict Modal ── */}
      <Modal
        transparent
        visible={isConflictModalVisible}
        animationType="fade"
        onRequestClose={handleCancelConflict}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Icon */}
            <View style={styles.modalIconCircle}>
              <MaterialIcons
                name="devices-other"
                size={36}
                color={colors.accent}
              />
            </View>

            {/* Title */}
            <Text style={styles.modalTitle}>Account in Use</Text>

            {/* Body */}
            <Text style={styles.modalBody}>
              You are currently logged in on another device. Do you want to sign
              out of the other device and log in here?
            </Text>

            {/* Primary action */}
            <TouchableOpacity
              style={[
                styles.modalPrimaryBtn,
                conflictLoading && styles.primaryBtnDisabled,
              ]}
              onPress={handleProceedConflict}
              disabled={conflictLoading}
              activeOpacity={0.85}
            >
              {conflictLoading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.onPrimary}
                />
              ) : (
                <>
                  <MaterialIcons
                    name="logout"
                    size={18}
                    color={colors.onPrimary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalPrimaryBtnText}>
                    Sign Out Other Device
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel action */}
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={handleCancelConflict}
              disabled={conflictLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  // Brand navy fills the screen behind the logo (matches logo asset)
  root: { flex: 1, backgroundColor: colors.brandHero },

  // ── Top hero ─────────────────────────────────────────────────
  topHalf: {
    height: 188,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 12 : 8,
    paddingBottom: 4,
    backgroundColor: colors.brandHero,
  },
  logo: {
    width: 168,
    height: 132,
    marginBottom: 4,
  },
  brandTagline: {
    fontSize: 12,
    color: "rgba(248,250,252,0.62)",
    letterSpacing: 0.8,
  },

  // ── Bottom form sheet ────────────────────────────────────────
  sheet: {
    flex: 1,
    backgroundColor: colors.surfacePrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  sheetContent: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.textTitle,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 24,
  },

  // ── Inputs (shared theme tokens: inputBackground / inputBorder / …) ──
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 56,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 15,
    height: 56,
  },
  eyeBtn: { padding: 4 },

  // ── Forgot password ──────────────────────────────────────────
  forgotPasswordBtn: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    marginBottom: 4,
  },
  forgotPasswordText: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Error / success banners ────────────────────────────────
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.successSoft,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    flex: 1,
    color: colors.successStrong,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Primary button ───────────────────────────────────────────
  primaryBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
    elevation: 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: colors.surfacePrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // ── Divider ──────────────────────────────────────────────────
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: {
    fontSize: 13,
    color: colors.textPlaceholder,
    marginHorizontal: 12,
  },

  // ── Google button ────────────────────────────────────────────
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfacePrimary,
    borderRadius: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
    elevation: 1,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  googleIcon: { marginRight: 10 },
  googleBtnText: {
    color: colors.textBody,
    fontSize: 15,
    fontWeight: "600",
  },
  appleBtn: {
    width: "100%",
    height: 52,
    marginBottom: 28,
  },

  // ── Toggle ───────────────────────────────────────────────────
  toggle: { alignItems: "center", marginBottom: 20 },
  toggleText: { color: colors.textPlaceholder, fontSize: 14 },
  toggleLink: { color: colors.secondary, fontWeight: "700" },

  // ── Privacy link ─────────────────────────────────────────────
  privacyLink: { alignItems: "center", paddingVertical: 4 },
  privacyText: {
    color: colors.secondary,
    fontSize: 12,
    textDecorationLine: "underline",
  },

  // ── Conflict Modal ───────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    elevation: 8,
    shadowColor: colors.textTitle,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textTitle,
    textAlign: "center",
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  modalPrimaryBtn: {
    flexDirection: "row",
    backgroundColor: colors.secondary,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 12,
    elevation: 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  modalPrimaryBtnText: {
    color: colors.surfacePrimary,
    fontSize: 15,
    fontWeight: "700",
  },
  modalCancelBtn: {
    borderRadius: 14,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalCancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: "600",
  },
});

export default LoginScreen;
