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
const BOTTOM_STRIP = 56;
const VOLUME_EDGE = 56;

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

/**
 * Native expo-video player with modern gestures.
 * Gestures stay in the RN view hierarchy (work in app fullscreen).
 */
const GestureVideoPlayer = ({
  sourceUri,
  posterUri,
  style,
  isFullscreen = false,
}) => {
  const [showPoster, setShowPoster] = useState(Boolean(posterUri));
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hud, setHud] = useState(null); // { type, label, side }
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const lastTapRef = useRef({ t: 0, side: null });
  const longPressTimerRef = useRef(null);
  const rateBoostRef = useRef(false);
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
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    if (isPlaying) {
      scheduleHideControls();
    } else {
      setControlsVisible(true);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    }
  }, [isPlaying, scheduleHideControls]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    revealControls();
  }, [player, revealControls]);

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
        player.playbackRate = 1;
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
          // Ignore bottom control strip for gesture start
          if (locationY > h - BOTTOM_STRIP) {
            touchStartRef.current = null;
            return;
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

          // Right-edge vertical drag → volume
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
            showHud({
              type: "volume",
              label: `${Math.round(next * 100)}%`,
              side: "right",
            });
          } else if (Math.abs(gesture.dx) > 12 || Math.abs(gesture.dy) > 12) {
            // Cancel long-press if user is dragging
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
          if (locationY > h - BOTTOM_STRIP) return;

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
            // Delay single-tap play/pause so double-tap on sides can win
            setTimeout(() => {
              const latest = lastTapRef.current;
              if (latest.t === now && latest.side === "center") {
                togglePlay();
              }
            }, DOUBLE_TAP_MS);
          } else {
            // First tap on side: show controls; second is seek
            revealControls();
            setTimeout(() => {
              // no-op: wait for possible double tap
            }, DOUBLE_TAP_MS);
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

      {/* Gesture surface (above video, below chrome HUD) */}
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

      {(controlsVisible || !isPlaying || isScrubbing) && !hasError ? (
        <View style={styles.controls} pointerEvents="box-none">
          <View style={styles.centerPlayRow} pointerEvents="box-none">
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
    justifyContent: "flex-end",
  },
  centerPlayRow: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.4)",
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
