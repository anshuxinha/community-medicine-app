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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const SEEK_STEP = 10;
const DOUBLE_TAP_MS = 280;
const LONG_PRESS_MS = 420;
const HUD_MS = 700;
const CONTROLS_HIDE_MS = 3200;
const TOP_STRIP = 24;
const BOTTOM_STRIP_BASE = 100;
const VOLUME_EDGE = 56;
const SEEKER_COLOR = "#9333EA";

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

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

const trackHeightLabel = (track) => {
  const h = track?.size?.height || track?.height;
  if (!h) return track?.id || "Track";
  return `${h}p`;
};

/**
 * YouTube-inspired expo-video player: dark tap overlay, controls above a thin
 * purple seeker, mute / quality / speed / fullscreen on the action row.
 */
const GestureVideoPlayer = ({
  sourceUri,
  posterUri,
  style,
  isFullscreen = false,
  onFullscreenPress,
  isDark = true,
}) => {
  const insets = useSafeAreaInsets();
  const canvasBg = isDark ? "#000000" : "#FFFFFF";

  const [showPoster, setShowPoster] = useState(Boolean(posterUri));
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hud, setHud] = useState(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubRatio, setScrubRatio] = useState(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
  const [qualityLabel, setQualityLabel] = useState("Auto");
  const [videoTracks, setVideoTracks] = useState([]);

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

  const bottomSafe = isFullscreen ? Math.max(insets.bottom, 0) : 0;
  const menuOpen = speedMenuOpen || qualityMenuOpen;
  const bottomStrip =
    BOTTOM_STRIP_BASE + bottomSafe + (menuOpen ? 44 : 0);

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

  const refreshTracks = useCallback(() => {
    try {
      const tracks = player.availableVideoTracks || [];
      setVideoTracks(Array.isArray(tracks) ? tracks : []);
    } catch (_e) {
      setVideoTracks([]);
    }
  }, [player]);

  useEventListenerSafe(player, "sourceLoad", refreshTracks);
  useEventListenerSafe(player, "videoTrackChange", () => {
    try {
      const current = player.videoTrack;
      setQualityLabel(current ? trackHeightLabel(current) : "Auto");
    } catch (_e) {
      // ignore
    }
  });

  useEffect(() => {
    setShowPoster(Boolean(posterUri));
    setPlaybackRate(1);
    baseRateRef.current = 1;
    setIsMuted(false);
    setSpeedMenuOpen(false);
    setQualityMenuOpen(false);
    setQualityLabel("Auto");
    setVideoTracks([]);
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
    if (menuOpen) return;
    hideControlsTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
      setSpeedMenuOpen(false);
      setQualityMenuOpen(false);
    }, CONTROLS_HIDE_MS);
  }, [menuOpen]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHideControls();
  }, [scheduleHideControls]);

  useEffect(() => {
    if (menuOpen) {
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
  }, [isPlaying, scheduleHideControls, menuOpen]);

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

  const selectQuality = useCallback(
    (track) => {
      try {
        // null / undefined → auto (adaptive)
        player.videoTrack = track || null;
        setQualityLabel(track ? trackHeightLabel(track) : "Auto");
        showHud({
          type: "quality",
          label: track ? trackHeightLabel(track) : "Auto",
          side: "center",
        });
      } catch (_e) {
        showHud({ type: "quality", label: "N/A", side: "center" });
      }
      setQualityMenuOpen(false);
      revealControls();
    },
    [player, revealControls, showHud],
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
          if (locationY < TOP_STRIP || locationY > h - bottomStrip) {
            touchStartRef.current = null;
            return;
          }

          if (menuOpen) {
            setSpeedMenuOpen(false);
            setQualityMenuOpen(false);
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
          if (locationY < TOP_STRIP || locationY > h - bottomStrip) return;

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
      bottomStrip,
      clearLongPress,
      layout.height,
      layout.width,
      menuOpen,
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
  const showChrome =
    (controlsVisible || !isPlaying || isScrubbing || menuOpen) && !hasError;

  const qualityOptions = useMemo(() => {
    const sorted = [...videoTracks].sort(
      (a, b) => (b?.size?.height || 0) - (a?.size?.height || 0),
    );
    return [{ key: "auto", track: null, label: "Auto" }, ...sorted.map((t) => ({
      key: t.id || trackHeightLabel(t),
      track: t,
      label: trackHeightLabel(t),
    }))];
  }, [videoTracks]);

  return (
    <View
      style={[styles.root, { backgroundColor: canvasBg }, style]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width, height });
      }}
    >
      {sourceUri ? (
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          // cover in fullscreen fills edges (crops slightly); contain otherwise
          contentFit={isFullscreen ? "cover" : "contain"}
          nativeControls={false}
          allowsFullscreen={false}
          onFirstFrameRender={() => {
            setShowPoster(false);
            refreshTracks();
          }}
        />
      ) : null}

      {showPoster && posterUri ? (
        <Image
          source={{ uri: posterUri }}
          style={[styles.poster, { backgroundColor: canvasBg }]}
          resizeMode={isFullscreen ? "cover" : "contain"}
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

      {/* Light dark overlay while controls are visible (YouTube-style) */}
      {showChrome ? (
        <View style={styles.tapOverlay} pointerEvents="none" />
      ) : null}

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
          <View style={styles.centerPlayRow} pointerEvents="box-none">
            <Pressable
              onPress={() => seekBy(-SEEK_STEP, "left")}
              hitSlop={8}
              style={styles.iconHit}
              accessibilityLabel="Rewind 10 seconds"
            >
              <MaterialIcons name="replay-10" size={32} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={togglePlay}
              hitSlop={12}
              style={styles.iconHit}
            >
              <MaterialIcons
                name={isPlaying ? "pause" : "play-arrow"}
                size={isFullscreen ? 48 : 44}
                color="#FFFFFF"
              />
            </Pressable>
            <Pressable
              onPress={() => seekBy(SEEK_STEP, "right")}
              hitSlop={8}
              style={styles.iconHit}
              accessibilityLabel="Forward 10 seconds"
            >
              <MaterialIcons name="forward-10" size={32} color="#FFFFFF" />
            </Pressable>
          </View>

          <View
            style={[styles.bottomChrome, { paddingBottom: 6 + bottomSafe }]}
          >
            {(speedMenuOpen || qualityMenuOpen) && (
              <View style={styles.chipRow} pointerEvents="box-none">
                {speedMenuOpen
                  ? SPEED_OPTIONS.map((rate) => {
                      const selected = playbackRate === rate;
                      return (
                        <Pressable
                          key={String(rate)}
                          onPress={() => selectSpeed(rate)}
                          style={[
                            styles.chip,
                            selected && styles.chipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected && styles.chipTextSelected,
                            ]}
                          >
                            {formatSpeedLabel(rate)}
                          </Text>
                        </Pressable>
                      );
                    })
                  : qualityOptions.map((opt) => {
                      const selected = qualityLabel === opt.label;
                      return (
                        <Pressable
                          key={opt.key}
                          onPress={() => selectQuality(opt.track)}
                          style={[
                            styles.chip,
                            selected && styles.chipSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected && styles.chipTextSelected,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
              </View>
            )}

            {/* Controls ABOVE seeker (YouTube-style) */}
            <View style={styles.actionsRow}>
              <Text style={styles.timeCombined} numberOfLines={1}>
                {formatTime(
                  isScrubbing ? scrubRatio * duration : currentTime || 0,
                )}
                {" / "}
                {formatTime(duration)}
              </Text>

              <View style={styles.actionsSpacer} />

              <Pressable
                onPress={toggleMute}
                hitSlop={10}
                style={styles.iconHit}
                accessibilityLabel={isMuted ? "Unmute" : "Mute"}
              >
                <MaterialIcons
                  name={isMuted ? "volume-off" : "volume-up"}
                  size={22}
                  color="#FFFFFF"
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  refreshTracks();
                  setQualityMenuOpen((open) => !open);
                  setSpeedMenuOpen(false);
                  setControlsVisible(true);
                  if (hideControlsTimerRef.current) {
                    clearTimeout(hideControlsTimerRef.current);
                  }
                }}
                hitSlop={10}
                style={styles.iconHit}
                accessibilityLabel="Quality"
              >
                <Text style={styles.metaBtnText}>
                  {qualityLabel === "Auto" ? "Auto" : qualityLabel}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setSpeedMenuOpen((open) => !open);
                  setQualityMenuOpen(false);
                  setControlsVisible(true);
                  if (hideControlsTimerRef.current) {
                    clearTimeout(hideControlsTimerRef.current);
                  }
                }}
                hitSlop={10}
                style={styles.iconHit}
                accessibilityLabel="Playback speed"
              >
                <Text style={styles.metaBtnText}>
                  {formatSpeedLabel(playbackRate)}
                </Text>
              </Pressable>

              {typeof onFullscreenPress === "function" ? (
                <Pressable
                  onPress={() => {
                    setSpeedMenuOpen(false);
                    setQualityMenuOpen(false);
                    onFullscreenPress();
                    revealControls();
                  }}
                  hitSlop={10}
                  style={styles.iconHit}
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

            {/* Thin purple seeker */}
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
              <View
                style={[styles.scrubFill, { width: `${progress * 100}%` }]}
              />
              <View
                style={[styles.scrubThumb, { left: `${progress * 100}%` }]}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
};

/** Optional listener helper — ignores missing event names on older runtimes */
function useEventListenerSafe(player, eventName, listener) {
  useEffect(() => {
    if (!player || typeof player.addListener !== "function") return undefined;
    let sub;
    try {
      sub = player.addListener(eventName, listener);
    } catch (_e) {
      return undefined;
    }
    return () => {
      try {
        sub?.remove?.();
      } catch (_e) {
        // ignore
      }
    };
  }, [player, eventName, listener]);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
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
  hudLeft: { left: "12%" },
  hudRight: { right: "12%" },
  hudCenter: { alignSelf: "center", left: "40%" },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
    paddingBottom: 48,
  },
  iconHit: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomChrome: {
    width: "100%",
    paddingTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 4,
    gap: 2,
  },
  actionsSpacer: { flex: 1 },
  timeCombined: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    marginLeft: 4,
  },
  metaBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  chip: {
    minWidth: 48,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "rgba(147,51,234,0.55)",
  },
  chipText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },
  scrubTrack: {
    height: 20,
    justifyContent: "center",
    marginHorizontal: 10,
    marginBottom: 2,
  },
  scrubBg: {
    height: 2,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  scrubFill: {
    position: "absolute",
    left: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: SEEKER_COLOR,
  },
  scrubThumb: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    backgroundColor: SEEKER_COLOR,
    top: 5,
  },
});

export default GestureVideoPlayer;
