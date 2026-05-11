/**
 * LanguagePicker — three large flag/name buttons for language selection.
 * Positioned at the top of key screens for quick access.
 */

import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { SupportedLanguage } from "@/types";

interface LanguagePickerProps {
  selected: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
}

const LANGUAGES: {
  code: SupportedLanguage;
  label: string;
  flag: string;
  region: string;
}[] = [
  { code: "en", label: "English",  flag: "🇬🇧", region: "EN" },
  { code: "sw", label: "Kiswahili", flag: "🇰🇪", region: "SW" },
  { code: "ha", label: "Hausa",    flag: "🇳🇬", region: "HA" },
];

export function LanguagePicker({ selected, onChange }: LanguagePickerProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 6,
      }}
    >
      {LANGUAGES.map((lang) => {
        const isActive = selected === lang.code;
        return (
          <TouchableOpacity
            key={lang.code}
            onPress={() => onChange(lang.code)}
            accessible
            accessibilityLabel={`Switch to ${lang.label}`}
            accessibilityState={{ selected: isActive }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 24,
              backgroundColor: isActive ? "#2d6a4f" : "#f0fdf4",
              borderWidth: 1.5,
              borderColor: isActive ? "#2d6a4f" : "#bbf7d0",
              minWidth: 80,
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 4 }}>{lang.flag}</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: isActive ? "#ffffff" : "#2d6a4f",
              }}
            >
              {lang.region}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
