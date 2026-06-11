import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ReferralAnnouncementDialog from '../ReferralAnnouncementDialog';
import { PaperProvider } from 'react-native-paper';

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialIcons: (props) => React.createElement(View, props),
  };
});

describe('ReferralAnnouncementDialog', () => {
  it('renders correctly when visible', () => {
    const { getByText } = render(
      <PaperProvider>
        <ReferralAnnouncementDialog visible={true} onDismiss={jest.fn()} onAction={jest.fn()} />
      </PaperProvider>
    );

    expect(getByText('🎁 Introducing Refer & Earn!')).toBeTruthy();
    expect(getByText('Friends Get 15% Off')).toBeTruthy();
    expect(getByText('You Get 30 Days Free')).toBeTruthy();
    expect(getByText('Maybe Later')).toBeTruthy();
    expect(getByText('Go to Profile')).toBeTruthy();
  });

  it('triggers onDismiss callback when Maybe Later is pressed', () => {
    const mockDismiss = jest.fn();
    const { getByText } = render(
      <PaperProvider>
        <ReferralAnnouncementDialog visible={true} onDismiss={mockDismiss} onAction={jest.fn()} />
      </PaperProvider>
    );

    fireEvent.press(getByText('Maybe Later'));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('triggers onAction callback when Go to Profile is pressed', () => {
    const mockAction = jest.fn();
    const { getByText } = render(
      <PaperProvider>
        <ReferralAnnouncementDialog visible={true} onDismiss={jest.fn()} onAction={mockAction} />
      </PaperProvider>
    );

    fireEvent.press(getByText('Go to Profile'));
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
