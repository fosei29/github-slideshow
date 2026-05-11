/**
 * Home / Crop Selector Screen.
 *
 * Step 1: Pick your crop (large icon cards).
 * Step 2: Enter planting date (or "today").
 * Step 3: Pick your region (for climate-aware advice).
 *
 * All stored locally via Zustand + AsyncStorage.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { format } from "date-fns";

import { useCropStore } from "@/store/cropStore";
import { useSettingsStore } from "@/store/settingsStore";
import { CropCard } from "@/components/CropCard";
import { LanguagePicker } from "@/components/LanguagePicker";
import { CROP_LIST } from "@/constants/crops";
import { CropId, UserLocation } from "@/types";

const REGIONS: { label: string; value: UserLocation }[] = [
  {
    label: "🇰🇪 Kenya / East Africa",
    value: { country: "Kenya", region: "East Africa", climateZone: "sub_humid" },
  },
  {
    label: "🇳🇬 Nigeria / West Africa",
    value: { country: "Nigeria", region: "West Africa", climateZone: "sub_humid" },
  },
  {
    label: "🇸🇩 Sahel / Dry Region",
    value: { country: "Niger", region: "Sahel", climateZone: "semi_arid" },
  },
  {
    label: "🇪🇹 Ethiopia / Horn of Africa",
    value: { country: "Ethiopia", region: "East Africa", climateZone: "semi_arid" },
  },
  {
    label: "🇬🇭 Ghana / West Africa",
    value: { country: "Ghana", region: "West Africa", climateZone: "sub_humid" },
  },
];

export default function HomeScreen() {
  const { selectedCrop, plantingDate, location, setSelectedCrop, setPlantingDate, setLocation } =
    useCropStore();
  const { language, setLanguage } = useSettingsStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tempCrop, setTempCrop] = useState<CropId | null>(selectedCrop);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateInput, setDateInput] = useState(
    plantingDate ?? format(new Date(), "yyyy-MM-dd")
  );

  const LABELS = {
    title: {
      en: "AgriVoice",
      sw: "AgriVoice",
      ha: "AgriVoice",
    },
    stepCrop: {
      en: "Choose Your Crop",
      sw: "Chagua Zao Lako",
      ha: "Zaɓi Amfanin Gonarka",
    },
    stepDate: {
      en: "When Did You Plant?",
      sw: "Ulipanda Lini?",
      ha: "Yaushe Kuka Shuka?",
    },
    stepRegion: {
      en: "Where Are You?",
      sw: "Uko Wapi?",
      ha: "Ina Kake?",
    },
    today: {
      en: "I planted today",
      sw: "Nilipanda leo",
      ha: "Na shuka yau",
    },
    continue: {
      en: "Continue →",
      sw: "Endelea →",
      ha: "Ci gaba →",
    },
    getAdvice: {
      en: "Get Advice 🎙️",
      sw: "Pata Ushauri 🎙️",
      ha: "Sami Shawarar 🎙️",
    },
  } as const;

  const t = (key: keyof typeof LABELS) =>
    (LABELS[key] as Record<string, string>)[language] ?? LABELS[key]["en"];

  const handleCropSelect = (cropId: CropId) => {
    setTempCrop(cropId);
  };

  const handleCropConfirm = () => {
    if (!tempCrop) {
      Alert.alert("", language === "sw" ? "Tafadhali chagua zao" : "Please select a crop");
      return;
    }
    setSelectedCrop(tempCrop);
    setStep(2);
  };

  const handleDateConfirm = (date: string) => {
    // Validate YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert(
        "",
        language === "sw"
          ? "Tarehe si sahihi. Tumia umbizo: 2024-03-15"
          : "Invalid date. Use format: 2024-03-15"
      );
      return;
    }
    setPlantingDate(date);
    setShowDateModal(false);
    setStep(3);
  };

  const handleRegionSelect = (region: UserLocation) => {
    setLocation(region);
    router.replace("/advisory");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0fdf4" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0fdf4" />

      {/* App header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 28, fontWeight: "900", color: "#2d6a4f" }}>
            🌾 {t("title")}
          </Text>
          <Text style={{ fontSize: 14, color: "#4a7a5e" }}>
            {language === "sw"
              ? "Mshauri wako wa kilimo"
              : language === "ha"
              ? "Mashawaranka na noma"
              : "Your farming advisor"}
          </Text>
        </View>
      </View>

      {/* Language picker */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <LanguagePicker selected={language} onChange={setLanguage} />
      </View>

      {/* Step indicator */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 20,
          marginBottom: 16,
          gap: 6,
        }}
      >
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={{
              flex: 1,
              height: 5,
              borderRadius: 3,
              backgroundColor: step >= s ? "#2d6a4f" : "#dcfce7",
            }}
          />
        ))}
      </View>

      {/* ── Step 1: Crop selection ─────────────────────────────────────────── */}
      {step === 1 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 120 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: "#1b5e3b",
              paddingHorizontal: 8,
              marginBottom: 12,
            }}
          >
            {t("stepCrop")}
          </Text>

          <FlatList
            data={CROP_LIST}
            numColumns={2}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <CropCard
                crop={item}
                isSelected={tempCrop === item.id}
                onPress={handleCropSelect}
              />
            )}
          />

          <TouchableOpacity
            onPress={handleCropConfirm}
            style={{
              backgroundColor: tempCrop ? "#2d6a4f" : "#9ca3af",
              borderRadius: 14,
              paddingVertical: 18,
              marginHorizontal: 8,
              marginTop: 20,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>
              {t("continue")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── Step 2: Planting date ─────────────────────────────────────────── */}
      {step === 2 && (
        <View style={{ flex: 1, padding: 20 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1b5e3b", marginBottom: 24 }}>
            {t("stepDate")}
          </Text>

          {/* "I planted today" shortcut */}
          <TouchableOpacity
            onPress={() => {
              const today = format(new Date(), "yyyy-MM-dd");
              setPlantingDate(today);
              setStep(3);
            }}
            style={{
              backgroundColor: "#2d6a4f",
              borderRadius: 14,
              paddingVertical: 22,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 4 }}>🌱</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
              {t("today")}
            </Text>
          </TouchableOpacity>

          {/* Enter custom date */}
          <TouchableOpacity
            onPress={() => setShowDateModal(true)}
            style={{
              backgroundColor: "#f0fdf4",
              borderRadius: 14,
              paddingVertical: 22,
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#2d6a4f",
            }}
          >
            <Text style={{ fontSize: 40, marginBottom: 4 }}>📅</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#2d6a4f" }}>
              {language === "sw"
                ? "Ingiza tarehe nyingine"
                : language === "ha"
                ? "Saka wata rana"
                : "Enter a different date"}
            </Text>
            {plantingDate && (
              <Text style={{ fontSize: 15, color: "#6b7280", marginTop: 4 }}>
                {plantingDate}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>← Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Step 3: Region selection ──────────────────────────────────────── */}
      {step === 3 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#1b5e3b", marginBottom: 16 }}>
            {t("stepRegion")}
          </Text>

          {REGIONS.map((r) => (
            <TouchableOpacity
              key={r.label}
              onPress={() => handleRegionSelect(r.value)}
              style={{
                backgroundColor: location?.country === r.value.country ? "#2d6a4f" : "#ffffff",
                borderRadius: 12,
                paddingVertical: 18,
                paddingHorizontal: 20,
                marginBottom: 10,
                borderWidth: 1.5,
                borderColor: location?.country === r.value.country ? "#2d6a4f" : "#dcfce7",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 22, marginRight: 12 }}>
                {r.label.split(" ")[0]}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: location?.country === r.value.country ? "#fff" : "#1b5e3b",
                }}
              >
                {r.label.replace(r.label.split(" ")[0] + " ", "")}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => router.replace("/advisory")}
            style={{
              backgroundColor: "#f59e0b",
              borderRadius: 14,
              paddingVertical: 20,
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>
              {t("getAdvice")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setStep(2)} style={{ marginTop: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Date input modal */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "#00000080",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1b5e3b", marginBottom: 16 }}>
              {language === "sw"
                ? "Ingiza Tarehe ya Kupanda"
                : language === "ha"
                ? "Saka Ranar Shuka"
                : "Enter Planting Date"}
            </Text>
            <TextInput
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD"
              keyboardType="numeric"
              style={{
                borderWidth: 2,
                borderColor: "#2d6a4f",
                borderRadius: 12,
                padding: 16,
                fontSize: 22,
                fontWeight: "700",
                color: "#1a2e1a",
                textAlign: "center",
                letterSpacing: 2,
              }}
            />
            <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 8 }}>
              Example: {format(new Date(), "yyyy-MM-dd")}
            </Text>
            <TouchableOpacity
              onPress={() => handleDateConfirm(dateInput)}
              style={{
                backgroundColor: "#2d6a4f",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
                {language === "sw" ? "Thibitisha" : language === "ha" ? "Tabbatar" : "Confirm"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDateModal(false)}
              style={{ alignItems: "center", marginTop: 12 }}
            >
              <Text style={{ fontSize: 16, color: "#6b7280" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
