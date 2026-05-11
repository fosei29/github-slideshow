/**
 * AdvisoryCard — displays the current advisory text.
 * Large font, icons, and clear dosage table for low-literacy users.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Advisory, DosageInfo, SupportedLanguage } from "@/types";
import { GROWTH_STAGES } from "@/constants/stages";
import { selectText } from "@/services/AdvisoryEngine";

interface AdvisoryCardProps {
  advisory: Advisory;
  language: SupportedLanguage;
  daysSincePlanting?: number;
}

export function AdvisoryCard({
  advisory,
  language,
  daysSincePlanting,
}: AdvisoryCardProps) {
  const [showDosage, setShowDosage] = useState(false);
  const stage = GROWTH_STAGES[advisory.stage];
  const stageName =
    language === "sw"
      ? stage.name_sw
      : language === "ha"
      ? stage.name_ha
      : stage.name_en;

  const adviceText = selectText(advisory, language);

  const dosageLabelMap: Record<SupportedLanguage, string> = {
    en: "Input Guide",
    sw: "Mwongozo wa Pembejeo",
    ha: "Jagorar Shigarwa",
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Stage header */}
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
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#ffffff",
            }}
          >
            {stageName}
          </Text>
          {daysSincePlanting !== undefined && (
            <Text style={{ fontSize: 14, color: "#bbf7d0", marginTop: 2 }}>
              {language === "sw"
                ? `Siku ${daysSincePlanting} tangu kupanda`
                : language === "ha"
                ? `Kwana ${daysSincePlanting} tun da shuka`
                : `Day ${daysSincePlanting} since planting`}
            </Text>
          )}
        </View>
      </View>

      {/* Advisory text — large font */}
      <View
        style={{
          backgroundColor: "#f0fdf4",
          borderRadius: 12,
          padding: 16,
          borderLeftWidth: 4,
          borderLeftColor: "#2d6a4f",
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            lineHeight: 28,
            color: "#1a2e1a",
            fontWeight: "400",
          }}
        >
          {adviceText}
        </Text>
      </View>

      {/* Dosage / input table */}
      {advisory.dosageInfo && advisory.dosageInfo.length > 0 && (
        <View>
          <TouchableOpacity
            onPress={() => setShowDosage((v) => !v)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fbbf24",
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 22, marginRight: 8 }}>📋</Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: "#1a1a00",
                flex: 1,
              }}
            >
              {dosageLabelMap[language]}
            </Text>
            <Text style={{ fontSize: 22 }}>{showDosage ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {showDosage && (
            <View
              style={{
                backgroundColor: "#fffbeb",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: "#fde68a",
              }}
            >
              {advisory.dosageInfo.map((d, i) => (
                <DosageRow key={i} dosage={d} language={language} />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function DosageRow({
  dosage,
  language,
}: {
  dosage: DosageInfo;
  language: SupportedLanguage;
}) {
  const note =
    language === "sw"
      ? dosage.notes_sw
      : language === "ha"
      ? dosage.notes_ha
      : dosage.notes_en;

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "#fde68a",
        paddingVertical: 10,
      }}
    >
      <Text style={{ fontSize: 17, fontWeight: "700", color: "#92400e" }}>
        🌿 {dosage.input}
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginTop: 4,
          gap: 8,
        }}
      >
        <Pill label={`📦 ${dosage.quantity}`} color="#d97706" />
        <Pill label={`⏰ ${dosage.timing}`} color="#059669" />
      </View>
      {note && (
        <Text style={{ fontSize: 15, color: "#78350f", marginTop: 4 }}>
          ℹ️ {note}
        </Text>
      )}
    </View>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={{
        backgroundColor: color + "20",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 14, color, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
