import React from 'react';
import { render } from '@testing-library/react-native';
import NFHSTrendsScreen from '../NFHSTrendsScreen';
import { PaperProvider } from 'react-native-paper';

// Mock react-native-webview since it's a native component
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: View
  };
});

// Mock @expo/vector-icons to prevent FontLoader/expo-asset resolution failures
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialIcons: (props) => React.createElement(View, props),
  };
});

// Mock safety area insets provider
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insetContext = React.createContext({ top: 0, right: 0, bottom: 0, left: 0 });
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    SafeAreaContext: insetContext,
    SafeAreaConsumer: insetContext.Consumer,
    SafeAreaInsetsContext: insetContext,
    SafeAreaInsetsConsumer: insetContext.Consumer,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

describe('NFHSTrendsScreen', () => {
  it('renders dropdown selectors and segmented buttons', () => {
    const { getByText } = render(
      <PaperProvider>
        <NFHSTrendsScreen />
      </PaperProvider>
    );

    // Verify indicator group label exists
    expect(getByText('Indicator Group')).toBeTruthy();
    
    // Verify indicator label exists
    expect(getByText('Indicator')).toBeTruthy();

    // Verify residence area labels exist
    expect(getByText('Residence / Area')).toBeTruthy();
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('Rural')).toBeTruthy();
    expect(getByText('Urban')).toBeTruthy();
  });
});
