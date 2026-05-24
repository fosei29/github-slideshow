/**
 * DosageCalculator — scales fertilizer/input quantities to the farmer's land size.
 * All dosages in the data are per acre. This component adjusts for field size.
 * Input: farm size in acres or hectares. Output: scaled quantities.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { DosageInfo, SupportedLanguage } from "@/types";

interface DosageCalculatorProps {
  dosageInfo: DosageInfo[];
  language: SupportedLanguage;
}

type Unit = "acres" | "hectares";

const ACRE_TO_HECTARE = 0.404686;

const LABELS = {
  title:    { en: "Input Calculator", sw: "Kikokotoo cha Pembejeo", ha: "Lissafin Shigarwa" },
  farmSize: { en: "Farm size", sw: "Ukubwa wa shamba", ha: "Girman gona" },
  acres:    { en: "Acres", sw: "Ekari", ha: "Eka" },
  hectares: { en: "Hectares", sw: "Hekta", ha: "Hektea" },
  input:    { en: "Input", sw: "Pembejeo", ha: "Kaya" },
  quantity: { en: "Needed", sw: "Inayohitajika", ha: "Da ake buƙata" },
  timing:   { en: "When", sw: "Lini", ha: "Yaushe" },
};

export function DosageCalculator({ dosageInfo, language }: DosageCalculatorProps) {
  const [farmSize, setFarmSize] = useState("1");
  const [unit, setUnit] = useState<Unit>("acres");
  const [expanded, setExpanded] = useState(false);

  const t = (key: keyof typeof LABELS) =>
    LABELS[key][language] ?? LABELS[key]["en"];

  const acres =
    unit === "acres"
      ? parseFloat(farmSize) || 1
      : (parseFloat(farmSize) || 1) / ACRE_TO_HECTARE;

  /** Parse a quantity string like "50 kg per acre" → scaled value */
  function scaleQuantity(quantityStr: string): string {
    // Match patterns like "50 kg", "2 tonnes", "8-10 kg"
    const match = quantityStr.match(/^([\d.]+)(?:[-–]([\d.]+))?\s*(\w+)/);
    if (!match) return quantityStr;

    const low = parseFloat(match[1]);
    const high = match[2] ? parseFloat(match[2]) : null;
    const quantityUnit = match[3];

    const scaledLow  = (low  * acres).toFixed(1);
    const scaledHigh = high ? (high * acres).toFixed(1) : null;

    const scaled = scaledHigh ? `${scaledLow}–${scaledHigh}` : scaledLow;
    return `${scaled} ${quantityUnit}`;
  }

  if (!expanded) {
    return (
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#ecfdf5",
          borderRadius: 10,
          padding: 12,
          marginTop: 8,
          borderWidth: 1,
          borderColor: "#86efac",
        }}
      >
        <Text style={{ fontSize: 22, marginRight: 8 }}>🧮</Text>
        <Text style={{ fontSize: 17, fontWeight: "600", color: "#2d6a4f", flex: 1 }}>
          {t("title")}
        </Text>
        <Text style={{ fontSize: 18, color: "#2d6a4f" }}>▼</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "#ecfdf5",
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#86efac",
      }}
    >
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded(false)}
        style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
      >
        <Text style={{ fontSize: 22, marginRight: 8 }}>🧮</Text>
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#2d6a4f", flex: 1 }}>
          {t("title")}
        </Text>
        <Text style={{ fontSize: 18, color: "#2d6a4f" }}>▲</Text>
      </TouchableOpacity>

      {/* Farm size input */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <Text style={{ fontSize: 16, color: "#1b5e3b", fontWeight: "600" }}>
          {t("farmSize")}:
        </Text>
        <TextInput
          value={farmSize}
          onChangeText={setFarmSize}
          keyboardType="numeric"
          style={{
            borderWidth: 1.5,
            borderColor: "#2d6a4f",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            fontSize: 18,
            fontWeight: "700",
            color: "#1a2e1a",
            width: 72,
            textAlign: "center",
          }}
        />

        {/* Unit toggle */}
        <View style={{ flexDirection: "row", borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#2d6a4f" }}>
          {(["acres", "hectares"] as Unit[]).map((u) => (
            <TouchableOpacity
              key={u}
              onPress={() => setUnit(u)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 8,
                backgroundColor: unit === u ? "#2d6a4f" : "#fff",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "700", color: unit === u ? "#fff" : "#2d6a4f" }}>
                {t(u as keyof typeof LABELS)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scaled dosage table */}
      {dosageInfo.map((d, i) => (
        <View
          key={i}
          style={{
            backgroundColor: "#fff",
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#d1fae5",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#1b5e3b", marginBottom: 4 }}>
            🌿 {d.input}
          </Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>{t("quantity")}</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#2d6a4f" }}>
                {scaleQuantity(d.quantity)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>{t("timing")}</Text>
              <Text style={{ fontSize: 14, color: "#374151", fontWeight: "600", maxWidth: 140, textAlign: "right" }}>
                {d.timing}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
