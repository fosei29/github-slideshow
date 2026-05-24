/**
 * OfflineStatusBar — shows a slim banner when device has no internet.
 * Disappears automatically when connection is restored.
 * Non-intrusive: only 28px tall, positioned below the screen header.
 */

import React, { useEffect, useState } from "react";
import { View, Text, Animated } from "react-native";
import * as Network from "expo-network";

export function OfflineStatusBar() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOffline(!state.isConnected);
    };

    check();
    // Poll every 10 seconds — lightweight enough for 2GB RAM devices
    interval = setInterval(check, 10_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOffline, slideAnim]);

  const height = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 28],
  });

  return (
    <Animated.View
      style={{
        height,
        backgroundColor: "#fbbf24",
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: "#78350f" }}>
        📴 Offline — using saved data
      </Text>
    </Animated.View>
  );
}
