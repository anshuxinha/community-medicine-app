import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock react-native-paper BEFORE other imports that might use it
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity, TextInput } = require('react-native');
  return {
    MD3LightTheme: {
      colors: {},
    },
    configureFonts: jest.fn(),
    Text: ({ children, ...props }) => <Text {...props}>{children}</Text>,
    Button: ({ children, onPress, loading, disabled, ...props }) => (
      <TouchableOpacity onPress={onPress} disabled={loading || disabled} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Card: {
      Content: ({ children }) => <View>{children}</View>,
    },
    TextInput: (props) => <TextInput {...props} />,
  };
});

jest.mock('firebase/analytics', () => ({
  logEvent: jest.fn(),
}));

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  increment: jest.fn(),
  runTransaction: jest.fn(),
}));

jest.mock('../../config/firebase', () => ({
  db: {},
  auth: {},
  analytics: {},
  app: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  addPushTokenListener: jest.fn(),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

jest.mock('expo-device', () => ({
  brand: 'Apple',
  designName: 'iPhone',
  deviceName: 'iPhone 13',
}));

import PaywallScreen from '../PaywallScreen';
import { AppContext } from '../../context/AppContext';
import { logEvent } from 'firebase/analytics';
import { validateCoupon } from '../../services/couponService';
import NetInfo from '@react-native-community/netinfo';

// Mock rest of dependencies
jest.mock('../../services/couponService', () => ({
  validateCoupon: jest.fn(),
  applyDiscount: jest.fn((price) => price),
  incrementCouponUsage: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));

jest.mock('expo-constants', () => ({
  appOwnership: 'standalone',
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }) => <>{children}</>,
  };
});

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    getOfferings: jest.fn().mockResolvedValue({
      current: {
        availablePackages: [
          { packageType: '$rc_annual', product: { priceString: '₹999' } },
        ],
      },
      all: {},
    }),
    setAttributes: jest.fn(),
    purchasePackage: jest.fn(),
  },
}));

jest.mock('../../utils/screenCaptureProtection', () => ({
  enableScreenCaptureProtection: jest.fn(),
  disableScreenCaptureProtection: jest.fn(),
}));

// Mock navigation
const mockNavigation = {
  goBack: jest.fn(),
};

const mockContext = {
  upgradeToPremium: jest.fn(),
  isPremium: false,
};

describe('PaywallScreen Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logs coupon_apply_attempt when Apply is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <AppContext.Provider value={mockContext}>
        <PaywallScreen navigation={mockNavigation} />
      </AppContext.Provider>
    );

    // Show coupon input
    fireEvent.press(getByText(/Have a coupon code\?/));

    const input = getByPlaceholderText('Enter code');
    fireEvent.changeText(input, 'TESTCODE');
    fireEvent.press(getByText('Apply'));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'coupon_apply_attempt',
        expect.objectContaining({ code: 'TESTCODE' })
      );
    });
  });

  test('logs coupon_apply_success when coupon is valid', async () => {
    validateCoupon.mockResolvedValue({
      code: 'VALID10',
      discountType: 'percentage',
      discountValue: 10,
    });

    const { getByText, getByPlaceholderText } = render(
      <AppContext.Provider value={mockContext}>
        <PaywallScreen navigation={mockNavigation} />
      </AppContext.Provider>
    );

    fireEvent.press(getByText(/Have a coupon code\?/));
    fireEvent.changeText(getByPlaceholderText('Enter code'), 'VALID10');
    fireEvent.press(getByText('Apply'));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'coupon_apply_success',
        expect.objectContaining({ code: 'VALID10', discount_type: 'percentage' })
      );
    });
  });

  test('logs coupon_apply_failure when coupon is invalid', async () => {
    validateCoupon.mockRejectedValue(new Error('Invalid code'));

    const { getByText, getByPlaceholderText } = render(
      <AppContext.Provider value={mockContext}>
        <PaywallScreen navigation={mockNavigation} />
      </AppContext.Provider>
    );

    fireEvent.press(getByText(/Have a coupon code\?/));
    fireEvent.changeText(getByPlaceholderText('Enter code'), 'WRONG');
    fireEvent.press(getByText('Apply'));

    await waitFor(() => {
      expect(logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'coupon_apply_failure',
        expect.objectContaining({ code: 'WRONG', reason: 'Invalid code' })
      );
    });
  });
});
