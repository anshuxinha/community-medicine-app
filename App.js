import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import Purchases from 'react-native-purchases';
import { paperTheme } from './src/styles/theme';

const RC_API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY || 'test_vulmIhXWwQBkNrLyBuwhSPgPwut';

export default function App() {
  useEffect(() => {
    // Initialize RevenueCat
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: RC_API_KEY });
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <PaperProvider theme={paperTheme}>
          <AppNavigator />
        </PaperProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
