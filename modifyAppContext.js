const fs = require('fs');

const run = () => {
  let content = fs.readFileSync('src/context/AppContext.js', 'utf8');

  // 1. Remove device states
  content = content.replace(
    /const \[deviceConflict, setDeviceConflict\] = useState\(null\);\s*const \[registeredDevices, setRegisteredDevices\] = useState\(\[\]\);/,
    ''
  );

  // 2. Add initialLoadRef
  content = content.replace(
    /const isLoggingOutRef = useRef\(false\);/,
    'const isLoggingOutRef = useRef(false);\n  const initialLoadRef = useRef(true);'
  );

  // 3. Remove registerDeviceForUser
  const registerStartRegex = /\/\/ Register device and check device limit \(single device enforcement\)/;
  const registerEndRegex = /useEffect\(\(\) => \{\s*const unsubscribe = onAuthStateChanged/;
  
  const startMatch = content.match(registerStartRegex);
  const endMatch = content.match(registerEndRegex);
  
  if (startMatch && endMatch) {
    content = content.substring(0, startMatch.index) + content.substring(endMatch.index);
  } else {
    console.error("Could not find registerDeviceForUser");
  }

  // 4. Update onAuthStateChanged
  const onAuthStartRegex = /try \{\s*\/\/ First, register device and check limit[\s\S]*?const userData = \{/;
  
  const replacement = `try {
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

            const userData = {`;
            
  if (content.match(onAuthStartRegex)) {
    content = content.replace(onAuthStartRegex, replacement);
  } else {
    console.error("Could not find onAuthStateChanged try block");
  }

  // 5. Cleanup catch block in onAuthStateChanged
  content = content.replace(
    /cloudHydratedRef\.current = false;\s*setDeviceConflict\(null\);\s*setRegisteredDevices\(\[\]\);\s*currentDeviceIdRef\.current = null;/g,
    'cloudHydratedRef.current = false;\n          currentDeviceIdRef.current = null;'
  );

  // 6. Remove DEVICE VALIDATION BLOCK in refreshFromCloud
  const validationStart = content.indexOf('// --- DEVICE VALIDATION BLOCK ---');
  const validationEnd = content.indexOf('// -------------------------------') + '// -------------------------------'.length;
  if (validationStart !== -1 && validationEnd !== -1) {
    content = content.substring(0, validationStart) + content.substring(validationEnd);
  }

  // 7. Simplify login function
  const loginStartRegex = /\/\/ Check device conflict BEFORE setting the user state[\s\S]*?\/\/ No conflict - now it is safe to set the user/;
  content = content.replace(loginStartRegex, '// No conflict - safe to set the user');

  // 8. Cleanup logout function
  content = content.replace(
    /setDeviceConflict\(null\);\s*setRegisteredDevices\(\[\]\);/g,
    ''
  );

  // 9. Remove resolveDeviceConflict and cancelDeviceConflict
  const resolveStartRegex = /\/\/ Resolve device conflict: clear other device[\s\S]*?setAccountPremium\(false\);\s*\};/;
  content = content.replace(resolveStartRegex, '');

  // 10. Update AppContext.Provider values
  content = content.replace(
    /deviceConflict,[\s\S]*?isScreenCapturePrevented,/g,
    'isScreenCapturePrevented,'
  );

  // 11. Remove dependencies in useEffect
  content = content.replace(
    /registeredDevices,/g,
    ''
  );
  content = content.replace(
    /deviceConflict\s*\]\);/g,
    '];'
  );

  // 12. Fix the lastActive update in saveState
  const saveStateStartRegex = /\/\/ Only update the lastActive time IF we already verified we are the active device[\s\S]*?\}\s*await updateDoc\(doc\(db, "users", user\.uid\), updateData\);/;
  content = content.replace(saveStateStartRegex, 'await updateDoc(doc(db, "users", user.uid), updateData);');

  fs.writeFileSync('src/context/AppContext.js', content);
  console.log('Modified AppContext.js successfully');
};

run();