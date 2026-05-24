/**
 * CropCard — large touch target for crop selection.
 * Designed for low-literacy users: big icon, big text, strong contrast.
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  AccessibilityRole,
} from "react-native";
import { Crop } from "@/types";
import { useSettingsStore } from "@/store/settingsStore";

interface CropCardProps {
  crop: Crop;
  isSelected: boolean;
  onPress: (cropId: Crop["id"]) => void;
}

export function CropCard({ crop, isSelected, onPress }: CropCardProps) {
  const { language } = useSettingsStore();

  const name =
    language === "sw"
      ? crop.name_sw
      : language === "ha"
      ? crop.name_ha
      : crop.name_en;

  return (
    <TouchableOpacity
      onPress={() => onPress(crop.id)}
      accessible
      accessibilityRole={"button" as AccessibilityRole}
      accessibilityLabel={name}
      accessibilityState={{ selected: isSelected }}
      style={{
        flex: 1,
        minHeight: 110,
        margin: 6,
        borderRadius: 16,
        backgroundColor: isSelected ? "#2d6a4f" : "#f0fdf4",
        borderWidth: 2,
        borderColor: isSelected ? "#2d6a4f" : "#bbf7d0",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        // Elevation for Android — gives tactile feedback cue
        elevation: isSelected ? 6 : 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <Text style={{ fontSize: 42 }}>{crop.icon}</Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 18,
          fontWeight: "700",
          color: isSelected ? "#ffffff" : "#1b5e3b",
          textAlign: "center",
          paddingHorizontal: 4,
        }}
      >
        {name}
      </Text>
      {isSelected && (
        <View
          style={{
            marginTop: 6,
            backgroundColor: "#4ade80",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 2,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
