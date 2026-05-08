const fs = require('fs');

const run = () => {
  let content = fs.readFileSync('src/screens/LoginScreen.js', 'utf8');

  // Imports
  content = content.replace(
    'import { AppContext } from "../context/AppContext";',
    'import { AppContext } from "../context/AppContext";\nimport { useNavigation } from "@react-navigation/native";\nimport { getDeviceId } from "../utils/deviceUtils";'
  );

  content = content.replace(
    'const { login } = useContext(AppContext);',
    'const { login } = useContext(AppContext);\n  const navigation = useNavigation();'
  );

  // handleGoogleLogin
  const googleStartStr = `const user = userCredential.user;

      // Device registration is handled by AppContext's onAuthStateChanged.
      // If there's a conflict, it will show the DeviceConflict screen.

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
      await login({
        uid: user.uid,
        email: user.email,
        username: user.displayName || "Google User",
        isPremium: premiumStatus,
      });`;

  const googleReplacement = `const user = userCredential.user;

      const tokenResult = await getIdTokenResult(user, true);
      const claimsPremium = tokenResult.claims.isPremium === true;

      let premiumStatus = claimsPremium;
      let data = {};
      try {
        const userDoc = await Promise.race([
          getDoc(doc(db, "users", user.uid)),
          timeoutPromise(2000),
        ]);
        
        data = userDoc.exists() ? userDoc.data() : {};

        if (userDoc.exists()) {
          premiumStatus = data.isPremium === true || claimsPremium;
        } else {
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            isPremium: claimsPremium,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Firestore unavailable during Google Login:", err.message);
      }

      const deviceId = await getDeviceId();
      const userData = {
        uid: user.uid,
        email: user.email,
        username: user.displayName || "Google User",
        isPremium: premiumStatus,
        isAdmin: data.isAdmin === true || tokenResult.claims.isAdmin === true,
      };

      if (data.currentDeviceId && data.currentDeviceId !== deviceId) {
        setLoading(false);
        navigation.navigate("DeviceConflict", {
          uid: user.uid,
          newDeviceId: deviceId,
          userData,
        });
        return;
      }

      if (!data.currentDeviceId) {
        await setDoc(doc(db, "users", user.uid), { currentDeviceId: deviceId }, { merge: true }).catch(()=>{});
      }

      await login(userData);`;

  content = content.replace(googleStartStr, googleReplacement);

  // handleAuth (Register)
  const authRegStartStr = `const user = userCredential.user;

        // Device registration is handled by AppContext's onAuthStateChanged

        await setDoc(doc(db, "users", user.uid), {
          email,
          isPremium: false,
          createdAt: new Date().toISOString(),
        });
        await login({ uid: user.uid, email, username: "New User", isPremium: false });`;

  const authRegReplacement = `const user = userCredential.user;
        const deviceId = await getDeviceId();

        await setDoc(doc(db, "users", user.uid), {
          email,
          isPremium: false,
          createdAt: new Date().toISOString(),
          currentDeviceId: deviceId,
        });
        await login({ uid: user.uid, email, username: "New User", isPremium: false });`;

  content = content.replace(authRegStartStr, authRegReplacement);

  // handleAuth (Login)
  const authLogStartStr = `const user = userCredential.user;

        // Device registration is handled by AppContext's onAuthStateChanged.
        // If there's a conflict, it will show the DeviceConflict screen.

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
        await login({
          uid: user.uid,
          email,
          username: displayName,
          isPremium: premiumStatus,
        });`;

  const authLogReplacement = `const user = userCredential.user;

        const tokenResult = await getIdTokenResult(user, true);
        const claimsPremium = tokenResult.claims.isPremium === true;

        let premiumStatus = claimsPremium;
        let data = {};
        try {
          const userDoc = await Promise.race([
            getDoc(doc(db, "users", user.uid)),
            timeoutPromise(2000),
          ]);
          data = userDoc.exists() ? userDoc.data() : {};
          premiumStatus = userDoc.exists()
            ? data.isPremium === true || claimsPremium
            : claimsPremium;
        } catch (err) {
          console.warn("Firestore unavailable during login:", err.message);
        }

        const deviceId = await getDeviceId();
        const displayName = user.displayName || "User";
        const userData = {
          uid: user.uid,
          email,
          username: displayName,
          isPremium: premiumStatus,
          isAdmin: data.isAdmin === true || tokenResult.claims.isAdmin === true,
        };

        if (data.currentDeviceId && data.currentDeviceId !== deviceId) {
          setLoading(false);
          navigation.navigate("DeviceConflict", {
            uid: user.uid,
            newDeviceId: deviceId,
            userData,
          });
          return;
        }

        if (!data.currentDeviceId) {
          await setDoc(doc(db, "users", user.uid), { currentDeviceId: deviceId }, { merge: true }).catch(()=>{});
        }

        await login(userData);`;

  content = content.replace(authLogStartStr, authLogReplacement);

  fs.writeFileSync('src/screens/LoginScreen.js', content);
  console.log('Modified LoginScreen.js successfully');
};

run();