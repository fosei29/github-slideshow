/**
 * WeatherBanner — contextual banner shown when a weather stress alert is active.
 * Appears between the stage indicator and advisory text on the advisory screen.
 * Dismissable by the user for the session.
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { StressAlert } from "@/services/WeatherService";
import { SupportedLanguage } from "@/types";

interface WeatherBannerProps {
  alert: StressAlert;
  language: SupportedLanguage;
}

export function WeatherBanner({ alert, language }: WeatherBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!alert.hasAlert || dismissed) return null;

  const message =
    language === "sw"
      ? alert.message_sw
      : language === "ha"
      ? alert.message_ha
      : alert.message_en;

  const bgColor =
    alert.alertType === "drought_risk" ? "#fef3c7" : "#eff6ff";
  const borderColor =
    alert.alertType === "drought_risk" ? "#f59e0b" : "#3b82f6";
  const textColor =
    alert.alertType === "drought_risk" ? "#92400e" : "#1e40af";

  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <Text style={{ fontSize: 16, lineHeight: 24, color: textColor, flex: 1 }}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={() => setDismissed(true)}
        style={{ marginLeft: 8, padding: 4 }}
        accessibilityLabel="Dismiss alert"
      >
        <Text style={{ fontSize: 18, color: textColor }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
