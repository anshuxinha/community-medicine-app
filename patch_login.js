const fs = require('fs');
const path = 'd:/The App/src/context/AppContext.js';
let c = fs.readFileSync(path, 'utf8');

const oldBlock = `    setUser(userData);\r
    if (userData.isPremium !== undefined) {\r
      setAccountPremium(Boolean(userData.isPremium));\r
    }\r
  };`;

const newBlock = `    setUser(userData);\r
    if (userData.isPremium !== undefined) {\r
      setAccountPremium(Boolean(userData.isPremium));\r
    }\r
\r
    // If onAuthStateChanged didn't hydrate (e.g. device conflict resolved\r
    // via LoginScreen modal), fetch learning progress from cloud now.\r
    if (!cloudHydratedRef.current && userData.uid) {\r
      try {\r
        const userDocRef = doc(db, "users", userData.uid);\r
        const userDoc = await Promise.race([\r
          getDoc(userDocRef),\r
          timeoutPromise(5000),\r
        ]);\r
        if (userDoc.exists()) {\r
          const data = userDoc.data();\r
          const cloudState = hydrateStoredState(data);\r
          if (cloudState.lastReadDate) {\r
            const diffDays = dayDiffFromToday(cloudState.lastReadDate);\r
            if (diffDays !== null && diffDays > 1) {\r
              setCurrentStreak(0);\r
            }\r
          }\r
          await AsyncStorage.setItem(\r
            getAccountStateKey(userData.uid),\r
            JSON.stringify(cloudState),\r
          );\r
        }\r
        cloudHydratedRef.current = true;\r
      } catch (err) {\r
        console.warn("Cloud hydration during login failed:", err?.message);\r
        try {\r
          const cached = await AsyncStorage.getItem(getAccountStateKey(userData.uid));\r
          if (cached) hydrateStoredState(JSON.parse(cached));\r
        } catch (_) {}\r
        cloudHydratedRef.current = true;\r
      }\r
    }\r
  };`;

if (c.includes(oldBlock)) {
  c = c.replace(oldBlock, newBlock);
  fs.writeFileSync(path, c);
  console.log('Patched successfully');
} else {
  console.log('Target block not found');
}
