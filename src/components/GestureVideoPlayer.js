import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { MaterialIcons } from "@expo/vector-icons";

const SEEK_STEP = 10;
const DOUBLE_TAP_MS = 280;
const LONG_PRESS_MS = 420;
const HUD_MS = 700;
const CONTROLS_HIDE_MS = 3200;
const TOP_STRIP = 52;
const BOTTOM_STRIP = 96;
const VOLUME_EDGE = 56;

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
};

const formatSpeedLabel = (rate) => {
  if (rate === 1) return "1×";
  if (Number.isInteger(rate)) return `${rate}×`;
  return `${rate}×`;
};

/**
 * Native expo-video player with modern gestures + chrome.
 * Gestures stay in the RN view hierarchy (work in app fullscreen).
 */
const GestureVideoPlayer = ({
  sourceUri,
  posterUri,
  style,
  isFullscreen = false,
  onFullscreenPress,
}) => {
  const [showPoster, setShowPoster] = useState(Boolean(posterUri));
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hud, setHud] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const lastTapRef = useRef({ t: 0, side: null });
  const longPressTimerRef = useRef(null);
  const rateBoostRef = useRef(false);
  const baseRateRef = useRef(1);
  const volumeGestureRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const hudTimerRef = useRef(null);
  const scrubBarWidthRef = useRef(0);
  const durationRef = useRef(0);
  const touchStartRef = useRef(null);

  const videoSource = useMemo(() => {
    if (!sourceUri) return null;
    return { uri: sourceUri, contentType: "hls" };
  }, [sourceUri]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.timeUpdateEventInterval = 0.25;
    p.loop = false;
    p.preservesPitch = true;
  });

  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { status, error } = useEvent(player, "statusChange", {
    status: player.status,
    error: null,
  });
  const { currentTime } = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
  });

  const duration = player.duration || 0;
  durationRef.current = duration;

  useEffect(() => {
    setShowPoster(Boolean(posterUri));
    setPlaybackRate(1);
    baseRateRef.current = 1;
    setIsMuted(false);
    setSpeedMenuOpen(false);
  }, [sourceUri, posterUri]);

  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch (_e) {
        // ignore
      }
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    };
  }, [player]);

  const showHud = useCallback((next) => {
    setHud(next);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => setHud(null), HUD_MS);
  }, []);

  const scheduleHideControls = useCallback(() => {
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (speedMenuOpen) return;
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setSpeedMenuOpen(false);
    }, CONTROLS_HIDE_MS);
  }, [speedMenuOpen]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    if (speedMenuOpen) {
      setControlsVisible(true);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
      return;
    }
    if (isPlaying) {
      scheduleHideControls();
    } else {
      setControlsVisible(true);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    }
  }, [isPlaying, scheduleHideControls, speedMenuOpen]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    revealControls();
  }, [player, revealControls]);

  const applyRate = useCallback(
    (rate) => {
      const next = Number(rate) || 1;
      try {
        player.playbackRate = next;
        player.preservesPitch = true;
      } catch (_e) {
        // ignore
      }
      baseRateRef.current = next;
      setPlaybackRate(next);
    },
    [player],
  );

  const selectSpeed = useCallback(
    (rate) => {
      applyRate(rate);
      setSpeedMenuOpen(false);
      showHud({ type: "rate", label: formatSpeedLabel(rate), side: "center" });
      revealControls();
    },
    [applyRate, revealControls, showHud],
  );

  const toggleMute = useCallback(() => {
    const next = !player.muted;
    player.muted = next;
    setIsMuted(next);
    showHud({
      type: "mute",
      label: next ? "Muted" : "Unmuted",
      side: "center",
    });
    revealControls();
  }, [player, revealControls, showHud]);

  const seekBy = useCallback(
    (delta, side) => {
      const next = Math.max(
        0,
        Math.min(
          durationRef.current || player.duration || 0,
          (player.currentTime || 0) + delta,
        ),
      );
      player.currentTime = next;
      showHud({
        type: "seek",
        label: delta < 0 ? `−${SEEK_STEP}s` : `+${SEEK_STEP}s`,
        side,
      });
      revealControls();
    },
    [player, revealControls, showHud],
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (rateBoostRef.current) {
      rateBoostRef.current = false;
      try {
        player.playbackRate = baseRateRef.current || 1;
      } catch (_e) {
        // ignore
      }
      setHud(null);
    }
  }, [player]);

  const sideFromX = useCallback(
    (x) => {
      const w = layout.width || 1;
      if (x < w / 3) return "left";
      if (x > (2 * w) / 3) return "right";
      return "center";
    },
    [layout.width],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const h = layout.height || 1;
          // Ignore top/bottom chrome for gesture start
          if (locationY < TOP_STRIP || locationY > h - BOTTOM_STRIP) {
            touchStartRef.current = null;
            return;
          }

          if (speedMenuOpen) {
            setSpeedMenuOpen(false);
          }

          touchStartRef.current = {
            x: locationX,
            y: locationY,
            side: sideFromX(locationX),
            t: Date.now(),
          };
          volumeGestureRef.current = null;

          const side = sideFromX(locationX);
          longPressTimerRef.current = setTimeout(() => {
            if (!touchStartRef.current) return;
            rateBoostRef.current = true;
            try {
              player.playbackRate = 2;
              if (!player.playing) player.play();
            } catch (_e) {
              // ignore
            }
            showHud({ type: "rate", label: "2×", side });
          }, LONG_PRESS_MS);
        },
        onPanResponderMove: (evt, gesture) => {
          if (!touchStartRef.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          const w = layout.width || 1;
          const h = layout.height || 1;

          const nearRight = touchStartRef.current.x > w - VOLUME_EDGE;
          if (
            nearRight &&
            Math.abs(gesture.dy) > 10 &&
            Math.abs(gesture.dy) > Math.abs(gesture.dx)
          ) {
            clearLongPress();
            if (!volumeGestureRef.current) {
              volumeGestureRef.current = {
                startY: touchStartRef.current.y,
                startVol: player.volume ?? 1,
              };
            }
            const dy = locationY - volumeGestureRef.current.startY;
            const next = Math.max(
              0,
              Math.min(1, volumeGestureRef.current.startVol - dy / (h * 0.6)),
            );
            player.volume = next;
            if (player.muted && next > 0) {
              player.muted = false;
              setIsMuted(false);
            }
            showHud({
              type: "volume",
              label: `${Math.round(next * 100)}%`,
              side: "right",
            });
          } else if (Math.abs(gesture.dx) > 12 || Math.abs(gesture.dy) > 12) {
            if (longPressTimerRef.current && !rateBoostRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
          }
        },
        onPanResponderRelease: (evt) => {
          const start = touchStartRef.current;
          touchStartRef.current = null;

          if (rateBoostRef.current) {
            clearLongPress();
            return;
          }
          clearLongPress();

          if (!start) return;
          if (volumeGestureRef.current) {
            volumeGestureRef.current = null;
            return;
          }

          const { locationX, locationY } = evt.nativeEvent;
          const h = layout.height || 1;
          if (locationY < TOP_STRIP || locationY > h - BOTTOM_STRIP) return;

          const side = sideFromX(locationX);
          const now = Date.now();
          const last = lastTapRef.current;

          if (
            side !== "center" &&
            last.side === side &&
            now - last.t < DOUBLE_TAP_MS
          ) {
            lastTapRef.current = { t: 0, side: null };
            seekBy(side === "left" ? -SEEK_STEP : SEEK_STEP, side);
            return;
          }

          lastTapRef.current = { t: now, side };

          if (side === "center") {
            setTimeout(() => {
              const latest = lastTapRef.current;
              if (latest.t === now && latest.side === "center") {
                togglePlay();
              }
            }, DOUBLE_TAP_MS);
          } else {
            revealControls();
          }
        },
        onPanResponderTerminate: () => {
          touchStartRef.current = null;
          volumeGestureRef.current = null;
          clearLongPress();
        },
      }),
    [
      clearLongPress,
      layout.height,
      layout.width,
      player,
      revealControls,
      seekBy,
      showHud,
      sideFromX,
      speedMenuOpen,
      togglePlay,
    ],
  );

  const progress =
    isScrubbing
      ? scrubRatio
      : duration > 0
        ? Math.min(1, Math.max(0, (currentTime || 0) / duration))
        : 0;

  const onScrubGrant = (evt) => {
    setIsScrubbing(true);
    const x = evt.nativeEvent.locationX;
    const ratio = scrubBarWidthRef.current
      ? Math.min(1, Math.max(0, x / scrubBarWidthRef.current))
      : 0;
    setScrubRatio(ratio);
  };

  const onScrubMove = (evt) => {
    const x = evt.nativeEvent.locationX;
    const ratio = scrubBarWidthRef.current
      ? Math.min(1, Math.max(0, x / scrubBarWidthRef.current))
      : 0;
    setScrubRatio(ratio);
  };

  const onScrubRelease = () => {
    if (duration > 0) {
      player.currentTime = scrubRatio * duration;
    }
    setIsScrubbing(false);
    revealControls();
  };

  const isLoading = status === "loading" || (!sourceUri && !error);
  const hasError = status === "error" || Boolean(error);
  const showChrome =
    (controlsVisible || !isPlaying || isScrubbing || speedMenuOpen) && !hasError;

  return (
    <View
      style={[styles.root, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {sourceUri ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="contain"
          nativeControls={false}
          allowsFullscreen={false}
          onFirstFrameRender={() => setShowPoster(false)}
        />
      ) : null}

      {showPoster && posterUri ? (
        <Image
          source={{ uri: posterUri }}
          style={styles.poster}
          resizeMode="contain"
        />
      ) : null}

      {isLoading && !hasError ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      ) : null}

      {hasError ? (
        <View style={styles.centerOverlay} pointerEvents="none">
          <MaterialIcons name="error-outline" size={36} color="#FBBF24" />
          <Text style={styles.errorText}>
            {error?.message || "Unable to play this video."}
          </Text>
        </View>
      ) : null}

      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />

      {hud ? (
        <View
          style={[
            styles.hud,
            hud.side === "left" && styles.hudLeft,
            hud.side === "right" && styles.hudRight,
            hud.side === "center" && styles.hudCenter,
          ]}
          pointerEvents="none"
        >
          <Text style={styles.hudText}>{hud.label}</Text>
        </View>
      ) : null}

      {showChrome ? (
        <View style={styles.controls} pointerEvents="box-none">
          <View style={styles.topBar} pointerEvents="box-none">
            <Pressable
              onPress={toggleMute}
              hitSlop={10}
              style={styles.chromeBtn}
              accessibilityLabel={isMuted ? "Unmute" : "Mute"}
            >
              <MaterialIcons
                name={isMuted ? "volume-off" : "volume-up"}
                size={22}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.topBarRight}>
              <Pressable
                onPress={() => {
                  setSpeedMenuOpen((open) => !open);
                  setControlsVisible(true);
                  if (hideControlsTimerRef.current) {
                    clearTimeout(hideControlsTimerRef.current);
                  }
                }}
                hitSlop={10}
                style={[styles.chromeBtn, styles.speedBtn]}
                accessibilityLabel="Playback speed"
              >
                <Text style={styles.speedBtnText}>
                  {formatSpeedLabel(playbackRate)}
                </Text>
              </Pressable>

              {typeof onFullscreenPress === "function" ? (
                <Pressable
                  onPress={() => {
                    setSpeedMenuOpen(false);
                    onFullscreenPress();
                    revealControls();
                  }}
                  hitSlop={10}
                  style={styles.chromeBtn}
                  accessibilityLabel={
                    isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                  }
                >
                  <MaterialIcons
                    name={isFullscreen ? "fullscreen-exit" : "fullscreen"}
                    size={24}
                    color="#FFFFFF"
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          {speedMenuOpen ? (
            <View style={styles.speedMenu} pointerEvents="box-none">
              <Text style={styles.speedMenuTitle}>Speed</Text>
              {SPEED_OPTIONS.map((rate) => {
                const selected = playbackRate === rate;
                return (
                  <Pressable
                    key={String(rate)}
                    onPress={() => selectSpeed(rate)}
                    style={[
                      styles.speedOption,
                      selected && styles.speedOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.speedOptionText,
                        selected && styles.speedOptionTextSelected,
                      ]}
                    >
                      {formatSpeedLabel(rate)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.centerPlayRow} pointerEvents="box-none">
            <Pressable
              onPress={() => seekBy(-SEEK_STEP, "left")}
              hitSlop={8}
              style={styles.seekBtn}
              accessibilityLabel="Rewind 10 seconds"
            >
              <MaterialIcons name="replay-10" size={28} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={togglePlay}
              hitSlop={12}
              style={styles.centerPlayBtn}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={isFullscreen ? 42 : 36}
                color="#FFFFFF"
              />
            </Pressable>
            <Pressable
              onPress={() => seekBy(SEEK_STEP, "right")}
              hitSlop={8}
              style={styles.seekBtn}
              accessibilityLabel="Forward 10 seconds"
            >
              <MaterialIcons name="forward-10" size={28} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.bottomBar}>
            <Text style={styles.timeText}>
              {formatTime(isScrubbing ? scrubRatio * duration : currentTime || 0)}
            </Text>
            <View
              style={styles.scrubTrack}
              onLayout={(e) => {
                scrubBarWidthRef.current = e.nativeEvent.layout.width;
              }}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={onScrubGrant}
              onResponderMove={onScrubMove}
              onResponderRelease={onScrubRelease}
              onResponderTerminate={() => setIsScrubbing(false)}
            >
              <View style={styles.scrubBg} />
              <View style={[styles.scrubFill, { width: `${progress * 100}%` }]} />
              <View
                style={[styles.scrubThumb, { left: `${progress * 100}%` }]}
              />
            </View>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  centerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 10,
    color: "#F3F4F6",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  hud: {
    position: "absolute",
    top: "42%",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  hudLeft: {
    left: "12%",
  },
  hudRight: {
    right: "12%",
  },
  hudCenter: {
    alignSelf: "center",
    left: "40%",
  },
  hudText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  controls: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chromeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  speedBtn: {
    minWidth: 48,
    paddingHorizontal: 8,
  },
  speedBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  speedMenu: {
    position: "absolute",
    top: 56,
    right: 10,
    backgroundColor: "rgba(20,20,20,0.94)",
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 112,
    zIndex: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  speedMenuTitle: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  speedOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  speedOptionSelected: {
    backgroundColor: "rgba(192,132,252,0.22)",
  },
  speedOptionText: {
    color: "#E5E7EB",
    fontSize: 15,
    fontWeight: "600",
  },
  speedOptionTextSelected: {
    color: "#E9D5FF",
  },
  centerPlayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  centerPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  seekBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    gap: 8,
  },
  timeText: {
    color: "#E5E7EB",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    minWidth: 36,
    textAlign: "center",
  },
  scrubTrack: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  scrubBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  scrubFill: {
    position: "absolute",
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#C084FC",
  },
  scrubThumb: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    backgroundColor: "#FFFFFF",
    top: 8,
  },
});

export default GestureVideoPlayer;
