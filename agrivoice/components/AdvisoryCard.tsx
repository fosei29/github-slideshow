/**
 * AdvisoryCard — displays the current advisory text and stage header.
 * Dosage details are handled by DosageCalculator on the parent screen.
 */

import React from "react";
import { View, Text } from "react-native";
import { Advisory, SupportedLanguage } from "@/types";
import { GROWTH_STAGES } from "@/constants/stages";
import { selectText } from "@/services/AdvisoryEngine";

interface AdvisoryCardProps {
  advisory: Advisory;
  language: SupportedLanguage;
  daysSincePlanting?: number;
}

export function AdvisoryCard({ advisory, language, daysSincePlanting }: AdvisoryCardProps) {
  const stage = GROWTH_STAGES[advisory.stage];
  const stageName =
    language === "sw" ? stage.name_sw
    : language === "ha" ? stage.name_ha
    : stage.name_en;

  const adviceText = selectText(advisory, language);

  const dayLabel =
    language === "sw" ? `Siku ${daysSincePlanting} tangu kupanda`
    : language === "ha" ? `Kwana ${daysSincePlanting} tun da shuka`
    : `Day ${daysSincePlanting} since planting`;

  return (
    <View>
      {/* Stage header chip */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#2d6a4f",
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
        }}
      >
        <Text style={{ fontSize: 32, marginRight: 12 }}>{stage.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#ffffff" }}>
            {stageName}
          </Text>
          {daysSincePlanting !== undefined && (
            <Text style={{ fontSize: 14, color: "#bbf7d0", marginTop: 2 }}>
              {dayLabel}
            </Text>
          )}
        </View>
      </View>

      {/* Advisory body — large font for field readability */}
      <View
        style={{
          backgroundColor: "#f0fdf4",
          borderRadius: 12,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: "#2d6a4f",
        }}
      >
        <Text style={{ fontSize: 18, lineHeight: 28, color: "#1a2e1a" }}>
          {adviceText}
        </Text>
      </View>
    </View>
  );
}
