/**
 * VoiceButton — the primary interaction element.
 * Large mic button (min 80px) with animated pulse during listening/speaking.
 * High-contrast design works in direct sunlight on low-brightness screens.
 */

import React, { useEffect, useRef } from "react";
import {
  TouchableOpacity,
  Animated,
  Text,
  View,
  AccessibilityRole,
} from "react-native";
import { VoiceStatus } from "@/types";

interface VoiceButtonProps {
  status: VoiceStatus;
  onPress: () => void;
  size?: number;
}

const STATUS_CONFIGS: Record<
  VoiceStatus,
  { bg: string; label: string; icon: string }
> = {
  idle:       { bg: "#2d6a4f", label: "Tap to Speak", icon: "🎙️" },
  listening:  { bg: "#f59e0b", label: "Listening...",  icon: "👂" },
  processing: { bg: "#6366f1", label: "Processing...", icon: "⚙️" },
  speaking:   { bg: "#0ea5e9", label: "Playing...",    icon: "🔊" },
  error:      { bg: "#ef4444", label: "Error — Tap",   icon: "⚠️" },
};

export function VoiceButton({ status, onPress, size = 90 }: VoiceButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = STATUS_CONFIGS[status];
  const isAnimating = status === "listening" || status === "speaking";

  useEffect(() => {
    if (isAnimating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isAnimating, pulseAnim]);

  return (
    <View style={{ alignItems: "center" }}>
      {/* Outer pulse ring */}
      <Animated.View
        style={{
          position: "absolute",
          width: size * 1.5,
          height: size * 1.5,
          borderRadius: (size * 1.5) / 2,
          backgroundColor: config.bg + "30",
          transform: [{ scale: pulseAnim }],
          top: -(size * 0.25),
          left: -(size * 0.25),
          pointerEvents: "none",
        }}
      />

      {/* Main button */}
      <TouchableOpacity
        onPress={onPress}
        accessible
        accessibilityRole={"button" as AccessibilityRole}
        accessibilityLabel={config.label}
        accessibilityHint="Double tap to activate voice"
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: config.bg,
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: config.bg,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}
      >
        <Text style={{ fontSize: size * 0.38 }}>{config.icon}</Text>
      </TouchableOpacity>

      {/* Status label */}
      <Text
        style={{
          marginTop: 12,
          fontSize: 16,
          fontWeight: "600",
          color: config.bg,
          textAlign: "center",
        }}
      >
        {config.label}
      </Text>
    </View>
  );
}
