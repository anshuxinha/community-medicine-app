const fs = require('fs');

const run = () => {
  let content = fs.readFileSync('src/navigation/AppNavigator.js', 'utf8');

  // Add import
  content = content.replace(
    'import { AppContext } from "../context/AppContext";',
    'import { AppContext } from "../context/AppContext";\nimport { useSessionEnforcer } from "../hooks/useSessionEnforcer";'
  );

  // Use hook
  content = content.replace(
    'const { user, deviceConflict } = React.useContext(AppContext);',
    'const { user } = React.useContext(AppContext);\n\n  useSessionEnforcer();'
  );

  // Navigation structure
  const navStartStr = `        {!user && !deviceConflict ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : deviceConflict ? (
          <Stack.Screen
            name="DeviceConflict"
            component={DeviceConflictScreen}
            options={{ headerShown: false }}
          />
        ) : (`;

  const navReplacement = `        {!user ? (
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />
            <Stack.Screen
              name="DeviceConflict"
              component={DeviceConflictScreen}
            />
          </Stack.Group>
        ) : (`;

  content = content.replace(navStartStr, navReplacement);

  fs.writeFileSync('src/navigation/AppNavigator.js', content);
  console.log('Modified AppNavigator.js successfully');
};

run();