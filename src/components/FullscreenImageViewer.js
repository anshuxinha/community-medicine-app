import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 4;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_ZOOM = 2.5;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const touchDistance = (nativeEvent) => {
  const touches = nativeEvent?.touches || [];
  if (touches.length < 2) return 0;
  const dx = touches[0].pageX - touches[1].pageX;
  const dy = touches[0].pageY - touches[1].pageY;
  return Math.hypot(dx, dy);
};

const FullscreenImageViewer = ({
  visible,
  source,
  alt,
  baseSize,
  onClose,
  onViewportLayout,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const gesture = useRef({
    mode: null,
    startScale: 1,
    startDistance: 0,
    startTx: 0,
    startTy: 0,
    currentScale: 1,
    currentTx: 0,
    currentTy: 0,
    lastTapAt: 0,
  }).current;

  const resetTransform = useCallback(() => {
    gesture.mode = null;
    gesture.startScale = 1;
    gesture.startDistance = 0;
    gesture.startTx = 0;
    gesture.startTy = 0;
    gesture.currentScale = 1;
    gesture.currentTx = 0;
    gesture.currentTy = 0;
    scale.setValue(1);
    translate.setValue({ x: 0, y: 0 });
  }, [gesture, scale, translate]);

  useEffect(() => {
    if (!visible) {
      resetTransform();
    }
  }, [resetTransform, visible]);

  useEffect(() => {
    resetTransform();
  }, [resetTransform, source]);

  const maxPan = useCallback(
    (nextScale) => {
      const extraX = Math.max(0, (baseSize.width * nextScale - baseSize.width) / 2);
      const extraY = Math.max(0, (baseSize.height * nextScale - baseSize.height) / 2);
      return { extraX, extraY };
    },
    [baseSize.height, baseSize.width],
  );

  const applyTransform = useCallback(
    (nextScale, nextTx, nextTy) => {
      const clampedScale = clamp(nextScale, MIN_IMAGE_ZOOM, MAX_IMAGE_ZOOM);
      const { extraX, extraY } = maxPan(clampedScale);
      const tx = clampedScale <= 1.01 ? 0 : clamp(nextTx, -extraX, extraX);
      const ty = clampedScale <= 1.01 ? 0 : clamp(nextTy, -extraY, extraY);
      gesture.currentScale = clampedScale;
      gesture.currentTx = tx;
      gesture.currentTy = ty;
      scale.setValue(clampedScale);
      translate.setValue({ x: tx, y: ty });
    },
    [gesture, maxPan, scale, translate],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, event) =>
          (event.nativeEvent.touches || []).length >= 2 ||
          gesture.currentScale > 1.02,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches || [];
          gesture.startScale = gesture.currentScale;
          gesture.startTx = gesture.currentTx;
          gesture.startTy = gesture.currentTy;
          if (touches.length >= 2) {
            gesture.mode = "pinch";
            gesture.startDistance = touchDistance(event.nativeEvent) || 1;
            return;
          }
          gesture.mode = "pan";
        },
        onPanResponderMove: (event, state) => {
          const touches = event.nativeEvent.touches || [];
          if (touches.length >= 2) {
            if (gesture.mode !== "pinch") {
              gesture.mode = "pinch";
              gesture.startScale = gesture.currentScale;
              gesture.startDistance = touchDistance(event.nativeEvent) || 1;
            }
            const distance = touchDistance(event.nativeEvent);
            if (!distance || !gesture.startDistance) return;
            applyTransform(
              gesture.startScale * (distance / gesture.startDistance),
              gesture.currentTx,
              gesture.currentTy,
            );
            return;
          }
          if (gesture.currentScale <= 1.02) return;
          applyTransform(
            gesture.currentScale,
            gesture.startTx + state.dx,
            gesture.startTy + state.dy,
          );
        },
        onPanResponderRelease: (_event, state) => {
          const now = Date.now();
          const moved = Math.hypot(state.dx, state.dy);
          const wasTap = gesture.mode !== "pinch" && moved < 12;
          if (wasTap && now - gesture.lastTapAt < DOUBLE_TAP_MS) {
            gesture.lastTapAt = 0;
            if (gesture.currentScale > 1.05) {
              applyTransform(1, 0, 0);
            } else {
              applyTransform(DOUBLE_TAP_ZOOM, 0, 0);
            }
          } else if (wasTap) {
            gesture.lastTapAt = now;
          }
          gesture.mode = null;
        },
        onPanResponderTerminate: () => {
          gesture.mode = null;
        },
      }),
    [applyTransform, gesture],
  );

  if (!visible || !source) {
    return null;
  }

  return (
    <View style={styles.backdrop}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close fullscreen image"
        style={styles.close}
        onPress={onClose}
      >
        <MaterialIcons name="close" size={28} color="#FFFFFF" />
      </Pressable>

      <View style={styles.viewport} onLayout={onViewportLayout} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.imageWrap,
            {
              width: baseSize.width,
              height: baseSize.height,
              transform: [
                { translateX: translate.x },
                { translateY: translate.y },
                { scale },
              ],
            },
          ]}
        >
          <Image
            source={source}
            style={styles.image}
            resizeMode="contain"
            accessible
            accessibilityLabel={alt}
          />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(13, 20, 28, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  close: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewport: {
    width: "100%",
    height: "92%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default FullscreenImageViewer;
