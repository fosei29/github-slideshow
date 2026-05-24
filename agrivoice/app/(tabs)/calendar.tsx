/**
 * Calendar Screen — planting window and seasonal overview.
 *
 * Shows:
 *  - Whether now is a good time to plant the selected crop
 *  - A 12-month grid highlighting rainy and dry seasons
 *  - Days remaining to harvest (or to next planting window)
 *  - Optimal planting month for user's region
 */

import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { format, addDays, parseISO, differenceInDays } from "date-fns";

import { useCropStore } from "@/store/cropStore";
import { useSettingsStore } from "@/store/settingsStore";
import { usePlantingCalendar } from "@/hooks/usePlantingCalendar";
import { CROPS } from "@/constants/crops";
import { LanguagePicker } from "@/components/LanguagePicker";
import { OfflineStatusBar } from "@/components/OfflineStatusBar";
import { CROPS as CROP_LIST } from "@/constants/crops";

const MONTHS_EN = [
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];
const MONTHS_SW = [
  "Jan","Feb","Mar","Apr","Mei","Jun",
  "Jul","Ago","Sep","Okt","Nov","Des",
];
const MONTHS_HA = [
  "Jan","Feb","Mar","Apr","Mayu","Jun",
  "Jul","Ago","Sep","Okt","Nuw","Des",
];

export default function CalendarScreen() {
  const { selectedCrop, plantingDate, location } = useCropStore();
  const { language, setLanguage } = useSettingsStore();
  const { weather, plantingWindow, stressAlert } = usePlantingCalendar();

  const crop = selectedCrop ? CROPS[selectedCrop] : null;
  const currentMonth = new Date().getMonth(); // 0-indexed

  const monthNames =
    language === "sw" ? MONTHS_SW : language === "ha" ? MONTHS_HA : MONTHS_EN;

  // Compute harvest date estimate
  const daysToHarvest = selectedCrop ? CROP_LIST[selectedCrop].daysToHarvest : 0;
  const harvestDate = plantingDate
    ? addDays(parseISO(plantingDate), daysToHarvest)
    : null;
  const daysRemaining = harvestDate
    ? differenceInDays(harvestDate, new Date())
    : null;

  const cropName = crop
    ? language === "sw" ? crop.name_sw : language === "ha" ? crop.name_ha : crop.name_en
    : "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2d6a4f" />
      <OfflineStatusBar />

      {/* Header */}
      <View style={{ backgroundColor: "#2d6a4f", padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 8 }}>
          📅{" "}
          {language === "sw"
            ? "Kalenda ya Kilimo"
            : language === "ha"
            ? "Kalandar Noma"
            : "Farming Calendar"}
        </Text>
        <LanguagePicker selected={language} onChange={setLanguage} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* No crop selected */}
        {!selectedCrop && (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Text style={{ fontSize: 56 }}>🌱</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#2d6a4f", marginTop: 16, textAlign: "center" }}>
              {language === "sw"
                ? "Chagua zao kwanza"
                : language === "ha"
                ? "Zaɓi amfanin gona da farko"
                : "Select a crop first"}
            </Text>
            <TouchableOpacity
              onPress={() => router.replace("/")}
              style={{
                marginTop: 20,
                backgroundColor: "#2d6a4f",
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 28,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
                {language === "sw" ? "← Nyumbani" : language === "ha" ? "← Gida" : "← Home"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedCrop && (
          <>
            {/* Crop + planting summary */}
            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 36, marginRight: 10 }}>{crop!.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: "#1b5e3b" }}>
                    {cropName}
                  </Text>
                  {plantingDate && (
                    <Text style={{ fontSize: 15, color: "#4a7a5e", marginTop: 2 }}>
                      {language === "sw" ? "Ilipandwa:" : language === "ha" ? "An shuka:" : "Planted:"}{" "}
                      {format(parseISO(plantingDate), "d MMM yyyy")}
                    </Text>
                  )}
                </View>
              </View>

              {/* Harvest countdown */}
              {daysRemaining !== null && (
                <View
                  style={{
                    backgroundColor: daysRemaining <= 14 ? "#fef3c7" : "#ecfdf5",
                    borderRadius: 10,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 28, marginRight: 10 }}>
                    {daysRemaining <= 14 ? "🌾" : "⏳"}
                  </Text>
                  <View>
                    {daysRemaining > 0 ? (
                      <>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1b5e3b" }}>
                          {daysRemaining}{" "}
                          {language === "sw" ? "siku hadi mavuno" : language === "ha" ? "kwanaki zuwa girbi" : "days to harvest"}
                        </Text>
                        <Text style={{ fontSize: 14, color: "#6b7280" }}>
                          ~{format(harvestDate!, "MMMM yyyy")}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: "700", color: "#d97706" }}>
                        {language === "sw"
                          ? "Wakati wa kuvuna umefika!"
                          : language === "ha"
                          ? "Lokacin girbi ya zo!"
                          : "Harvest time is here!"}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Weather + planting window banner */}
            {plantingWindow && (
              <View
                style={{
                  backgroundColor: plantingWindow.isGoodTimeToPlant ? "#dcfce7" : "#fef3c7",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 16,
                  borderLeftWidth: 4,
                  borderLeftColor: plantingWindow.isGoodTimeToPlant ? "#16a34a" : "#d97706",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: plantingWindow.isGoodTimeToPlant ? "#15803d" : "#92400e", marginBottom: 4 }}>
                  {plantingWindow.isGoodTimeToPlant ? "✅" : "📅"}{" "}
                  {language === "sw"
                    ? "Wakati wa Kupanda"
                    : language === "ha"
                    ? "Lokacin Shuka"
                    : "Planting Window"}
                </Text>
                <Text style={{ fontSize: 16, color: plantingWindow.isGoodTimeToPlant ? "#14532d" : "#78350f", lineHeight: 24 }}>
                  {language === "sw"
                    ? plantingWindow.reason_sw
                    : language === "ha"
                    ? plantingWindow.reason_ha
                    : plantingWindow.reason_en}
                </Text>
                <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
                  {language === "sw" ? "Hali ya hewa:" : language === "ha" ? "Yanayin yanayi:" : "Current weather:"}{" "}
                  <Text style={{ fontWeight: "700" }}>{weather.condition}</Text>
                  {" "}({weather.description})
                </Text>
              </View>
            )}

            {/* 12-month seasonal grid */}
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1b5e3b", marginBottom: 10 }}>
              {language === "sw"
                ? "Kalenda ya Mwaka — Mvua na Kiangazi"
                : language === "ha"
                ? "Kalandar Shekara — Damina da Rani"
                : "Yearly Calendar — Rains & Dry Season"}
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 16,
              }}
            >
              {monthNames.map((name, idx) => {
                const isCurrentMonth = idx === currentMonth;
                const isOptimalPlanting =
                  plantingWindow && idx === plantingWindow.optimalMonth - 1;
                const isWet = weather.condition === "wet" && isCurrentMonth;
                const isDry = weather.condition === "dry" && isCurrentMonth;

                return (
                  <View
                    key={idx}
                    style={{
                      width: "30%",
                      borderRadius: 10,
                      padding: 10,
                      alignItems: "center",
                      backgroundColor: isCurrentMonth
                        ? "#2d6a4f"
                        : isOptimalPlanting
                        ? "#dcfce7"
                        : "#f9fafb",
                      borderWidth: isOptimalPlanting && !isCurrentMonth ? 2 : 0,
                      borderColor: "#16a34a",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: isCurrentMonth ? "800" : "600",
                        color: isCurrentMonth ? "#fff" : isOptimalPlanting ? "#15803d" : "#374151",
                      }}
                    >
                      {name}
                    </Text>
                    {isCurrentMonth && (
                      <Text style={{ fontSize: 11, color: "#bbf7d0", marginTop: 2 }}>
                        {isWet ? "🌧️" : isDry ? "☀️" : "🌤️"}
                      </Text>
                    )}
                    {isOptimalPlanting && !isCurrentMonth && (
                      <Text style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>
                        🌱
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              <LegendItem color="#2d6a4f" label={language === "sw" ? "Mwezi huu" : language === "ha" ? "Wannan wata" : "This month"} />
              <LegendItem color="#dcfce7" label={language === "sw" ? "Wakati bora wa kupanda" : language === "ha" ? "Mafi kyawun lokacin shuka" : "Optimal planting"} textColor="#15803d" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function LegendItem({
  color,
  label,
  textColor = "#374151",
}: {
  color: string;
  label: string;
  textColor?: string;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: textColor }}>{label}</Text>
    </View>
  );
}
