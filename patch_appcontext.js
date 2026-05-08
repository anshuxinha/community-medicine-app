const fs = require('fs');
let content = fs.readFileSync('src/context/AppContext.js', 'utf8');

// 1. Remove deviceConflict and registeredDevices states
content = content.replace(
  /const \[deviceConflict, setDeviceConflict\] = useState\(null\);\s*const \[registeredDevices, setRegisteredDevices\] = useState\(\[\]\);/,
  ''
);

// 2. Add initialLoadRef
content = content.replace(
  /const isLoggingOutRef = useRef\(false\);/,
  'const isLoggingOutRef = useRef(false);\n  const initialLoadRef = useRef(true);'
);

// 3. Replace registerDeviceForUser
const registerStart = content.indexOf('// Register device and check device limit');
const registerEnd = content.indexOf('useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {');
if(registerStart !== -1 && registerEnd !== -1) {
  content = content.substring(0, registerStart) + content.substring(registerEnd);
} else {
  // Let's try another string
  const registerEndAlt = content.indexOf('useEffect(() => {\n      const unsubscribe = onAuthStateChanged');
  if(registerStart !== -1 && registerEndAlt !== -1) {
    content = content.substring(0, registerStart) + content.substring(registerEndAlt);
  } else {
     console.error("Could not find registerDeviceForUser boundaries");
  }
}

// 4. Replace onAuthStateChanged logic
content = content.replace(
  /try \{\s*\/\/ First, register device and check limit[\s\S]*?const userData = \{/,
  `try {
            const deviceId = await getDeviceId();
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await Promise.race([
              getDoc(userDocRef),
              timeoutPromise(8000),
            ]);
            const data = userDoc.exists() ? userDoc.data() : {};

            const isInitialLoad = initialLoadRef.current;
            initialLoadRef.current = false;

            if (data.currentDeviceId && data.currentDeviceId !== deviceId) {
              if (isInitialLoad) {
                try { await signOut(auth); } catch(e) {}
                setUser(null);
                setAccountPremium(false);
                cloudHydratedRef.current = true;
              } else {
                setUser(null);
                cloudHydratedRef.current = true;
              }
              return;
            }

            if (!data.currentDeviceId) {
               await setDoc(userDocRef, { currentDeviceId: deviceId }, { merge: true }).catch(()=>{});
            }

            const premiumStatus = data.isPremium === true || claimsPremium;
            const isAdmin = data.isAdmin === true || claimsAdmin;
            const fetchedPremiumType = data.premiumType || null;
            setPremiumType(fetchedPremiumType);

            const userData = {`
);

// 5. Clean up else block of onAuthStateChanged
content = content.replace(
  /cloudHydratedRef\.current = false;\s*setDeviceConflict\(null\);\s*setRegisteredDevices\(\[\]\);\s*currentDeviceIdRef\.current = null;/g,
  'cloudHydratedRef.current = false;\n          currentDeviceIdRef.current = null;'
);

// 6. Clean up refreshFromCloud device checking
content = content.replace(
  /\/\/ --- DEVICE VALIDATION BLOCK ---[\s\S]*?\/\/ -------------------------------/,
  ''
);

// 7. Clean up login
content = content.replace(
  /\/\/ Check device conflict BEFORE setting the user state[\s\S]*?\/\/ No conflict - now it is safe to set the user/,
  '// No conflict - safe to set the user'
);

// 8. Clean up logout
content = content.replace(
  /setDeviceConflict\(null\);\s*setRegisteredDevices\(\[\]\);/g,
  ''
);

// 9. Remove resolveDeviceConflict and cancelDeviceConflict
content = content.replace(
  /\/\/ Resolve device conflict: clear other device[\s\S]*?setAccountPremium\(false\);\s*\};/g,
  ''
);

// 10. Update AppContext.Provider value
content = content.replace(
  /deviceConflict,[\s\S]*?isScreenCapturePrevented,/g,
  'isScreenCapturePrevented,'
);

// 11. Update useEffect dependencies
content = content.replace(
  /registeredDevices,/g,
  ''
);

// 12. Fix the lastActive update in saveState
content = content.replace(
  /\/\/ Only update the lastActive time IF we already verified we are the active device[\s\S]*?\}\s*await updateDoc\(doc\(db, "users", user\.uid\), updateData\);/,
  'await updateDoc(doc(db, "users", user.uid), updateData);'
);

fs.writeFileSync('src/context/AppContext.js', content);
console.log('Patch complete.');