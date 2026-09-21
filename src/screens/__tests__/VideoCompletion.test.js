import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

// Mock vector icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    MaterialIcons: ({ name, ...props }) => React.createElement(Text, props, name),
    MaterialCommunityIcons: ({ name, ...props }) => React.createElement(Text, props, name),
  };
});

// Mock safe-area provider matching existing test conventions
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

// Mock expo-video
let mockCurrentTime = 10;
let mockDuration = 100;
jest.mock('expo-video', () => {
  return {
    useVideoPlayer: () => ({
      play: jest.fn(),
      pause: jest.fn(),
      replaceAsync: jest.fn(),
      playing: true,
      currentTime: mockCurrentTime,
      duration: mockDuration,
      muted: false,
      playbackRate: 1,
    }),
    VideoView: () => null,
  };
});

import GestureVideoPlayer from '../../components/GestureVideoPlayer';

describe('Video Completion & Controls', () => {
  beforeEach(() => {
    mockCurrentTime = 10;
    mockDuration = 100;
  });

  it('renders "Mark as Complete" when incomplete and triggers onToggleComplete on press', () => {
    const onToggleComplete = jest.fn();

    const { getByText, getByLabelText } = render(
      <PaperProvider>
        <GestureVideoPlayer
          sourceUri="https://example.com/stream.m3u8"
          isCompleted={false}
          onToggleComplete={onToggleComplete}
          fallbackDuration={100}
        />
      </PaperProvider>
    );

    const markBtn = getByText('Mark as Complete');
    expect(markBtn).toBeTruthy();

    fireEvent.press(getByLabelText('Mark as Complete'));
    expect(onToggleComplete).toHaveBeenCalledTimes(1);
  });

  it('renders "Marked as Complete" when isCompleted is true', () => {
    const onToggleComplete = jest.fn();

    const { getByText, getByLabelText } = render(
      <PaperProvider>
        <GestureVideoPlayer
          sourceUri="https://example.com/stream.m3u8"
          isCompleted={true}
          onToggleComplete={onToggleComplete}
          fallbackDuration={100}
        />
      </PaperProvider>
    );

    expect(getByText('Marked as Complete')).toBeTruthy();
    fireEvent.press(getByLabelText('Marked as Complete'));
    expect(onToggleComplete).toHaveBeenCalledTimes(1);
  });

  it('reports watch progress ratio for 90% completion trigger', () => {
    const onWatchProgress = jest.fn();
    mockCurrentTime = 95;
    mockDuration = 100;

    render(
      <PaperProvider>
        <GestureVideoPlayer
          sourceUri="https://example.com/stream.m3u8"
          onWatchProgress={onWatchProgress}
          fallbackDuration={100}
        />
      </PaperProvider>
    );

    expect(onWatchProgress).toHaveBeenCalledWith(0.95);
  });
});
