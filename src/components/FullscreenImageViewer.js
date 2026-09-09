import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export const MIN_IMAGE_ZOOM = 1;
export const MAX_IMAGE_ZOOM = 4;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_ZOOM = 2.5;
const TAP_MOVE_SLOP = 14;
const HINT = "Double tap to zoom in or out.";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

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
  const pointers = useRef(new Map());
  const gesture = useRef({
    mode: null,
    startScale: 1,
    startDistance: 1,
    startTx: 0,
    startTy: 0,
    startPageX: 0,
    startPageY: 0,
    currentScale: 1,
    currentTx: 0,
    currentTy: 0,
    lastTapAt: 0,
  }).current;

  const resetTransform = useCallback(() => {
    pointers.current.clear();
    gesture.mode = null;
    gesture.startScale = 1;
    gesture.startDistance = 1;
    gesture.startTx = 0;
    gesture.startTy = 0;
    gesture.startPageX = 0;
    gesture.startPageY = 0;
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
    (nextScale) => ({
      extraX: Math.max(0, (baseSize.width * nextScale - baseSize.width) / 2),
      extraY: Math.max(0, (baseSize.height * nextScale - baseSize.height) / 2),
    }),
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

  const syncPointers = (nativeEvent) => {
    const next = new Map();
    const touches = nativeEvent.touches || [];
    for (let i = 0; i < touches.length; i += 1) {
      const touch = touches[i];
      next.set(touch.identifier, { x: touch.pageX, y: touch.pageY });
    }
    pointers.current = next;
    return [...next.values()];
  };

  const beginPinch = (points) => {
    gesture.mode = "pinch";
    gesture.startScale = gesture.currentScale;
    gesture.startDistance = distanceBetween(points[0], points[1]) || 1;
    gesture.startTx = gesture.currentTx;
    gesture.startTy = gesture.currentTy;
  };

  const beginPan = (point) => {
    gesture.mode = "pan";
    gesture.startTx = gesture.currentTx;
    gesture.startTy = gesture.currentTy;
    gesture.startPageX = point.x;
    gesture.startPageY = point.y;
  };

  const handleTouchStart = (event) => {
    const points = syncPointers(event.nativeEvent);
    if (points.length >= 2) {
      beginPinch(points);
      return;
    }
    if (points.length === 1) {
      beginPan(points[0]);
    }
  };

  const handleTouchMove = (event) => {
    const points = syncPointers(event.nativeEvent);
    if (points.length >= 2) {
      if (gesture.mode !== "pinch") {
        beginPinch(points);
      }
      const distance = distanceBetween(points[0], points[1]);
      if (!distance || !gesture.startDistance) return;
      applyTransform(
        gesture.startScale * (distance / gesture.startDistance),
        gesture.startTx,
        gesture.startTy,
      );
      return;
    }
    if (points.length === 1 && gesture.currentScale > 1.02) {
      if (gesture.mode !== "pan") {
        beginPan(points[0]);
      }
      applyTransform(
        gesture.currentScale,
        gesture.startTx + (points[0].x - gesture.startPageX),
        gesture.startTy + (points[0].y - gesture.startPageY),
      );
    }
  };

  const handleTouchEnd = (event) => {
    const ended = event.nativeEvent.changedTouches || [];
    const remaining = syncPointers(event.nativeEvent);

    if (gesture.mode === "pinch") {
      if (remaining.length >= 2) {
        beginPinch(remaining);
      } else if (remaining.length === 1) {
        beginPan(remaining[0]);
      } else {
        gesture.mode = null;
      }
      return;
    }

    if (remaining.length === 0 && ended.length >= 1) {
      const lift = ended[0];
      const moved = Math.hypot(
        lift.pageX - gesture.startPageX,
        lift.pageY - gesture.startPageY,
      );
      const now = Date.now();
      if (moved < TAP_MOVE_SLOP) {
        if (now - gesture.lastTapAt < DOUBLE_TAP_MS) {
          gesture.lastTapAt = 0;
          if (gesture.currentScale > 1.05) {
            applyTransform(1, 0, 0);
          } else {
            applyTransform(DOUBLE_TAP_ZOOM, 0, 0);
          }
        } else {
          gesture.lastTapAt = now;
        }
      }
      gesture.mode = null;
    }
  };

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

      <View
        collapsable={false}
        pointerEvents="box-only"
        style={styles.viewport}
        onLayout={onViewportLayout}
        onStartShouldSetResponder={() => true}
        onStartShouldSetResponderCapture={() => true}
        onMoveShouldSetResponder={() => true}
        onMoveShouldSetResponderCapture={() => true}
        onResponderTerminationRequest={() => false}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
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

      <Text style={styles.hint}>{HINT}</Text>
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
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewport: {
    width: "100%",
    height: "86%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 1,
  },
  imageWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  hint: {
    marginTop: 12,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});

export default FullscreenImageViewer;
