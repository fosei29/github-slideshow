/**
 * Advisory Screen — the primary screen of AgriVoice.
 *
 * Shows:
 *  - Current growth stage indicator
 *  - Voice advisory text (large font)
 *  - Big mic button for voice input
 *  - Play/Pause/Stop controls for audio output
 *  - Language switcher
 *
 * Designed for one-hand use in the field. All touch targets ≥ 48px.
 */

import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

import { useAdvisory } from "@/hooks/useAdvisory";
import { useVoice } from "@/hooks/useVoice";
import { useCropStore } from "@/store/cropStore";
import { useSettingsStore } from "@/store/settingsStore";

import { VoiceButton } from "@/components/VoiceButton";
import { StageIndicator } from "@/components/StageIndicator";
import { AdvisoryCard } from "@/components/AdvisoryCard";
import { LanguagePicker } from "@/components/LanguagePicker";

import { CROPS } from "@/constants/crops";
import { parseVoiceCommand } from "@/services/AdvisoryEngine";

export default function AdvisoryScreen() {
  const { selectedCrop, plantingDate } = useCropStore();
  const { language, setLanguage } = useSettingsStore();

  const { advice, spokenText, audioPath, stageProgress, isLoading, error } =
    useAdvisory();

  const { status, play, pause, resume, stop, startListening } = useVoice({
    onTranscript: (text) => {
      const intent = parseVoiceCommand(text);
      handleVoiceIntent(intent);
    },
    onError: (msg) => Alert.alert("Voice Error", msg),
  });

  // Auto-play advisory when it loads (first load only)
  useEffect(() => {
    if (advice && spokenText && status === "idle") {
      play(audioPath, spokenText, language);
    }
    // Only trigger on initial advice load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advice?.id]);

  const handleVoiceIntent = useCallback(
    (intent: ReturnType<typeof parseVoiceCommand>) => {
      switch (intent) {
        case "get_advice":
          if (spokenText) play(audioPath, spokenText, language);
          break;
        case "change_language_en":
          setLanguage("en");
          break;
        case "change_language_sw":
          setLanguage("sw");
          break;
        case "change_language_ha":
          setLanguage("ha");
          break;
        default:
          break;
      }
    },
    [audioPath, language, play, setLanguage, spokenText]
  );

  const handleMicPress = useCallback(() => {
    if (status === "speaking") {
      // Tap mic during playback = stop and listen
      stop().then(() => startListening());
    } else if (status === "listening") {
      // Second tap = cancel listening
      // stopListening() not exposed here; useVoice will timeout naturally
    } else {
      startListening();
    }
  }, [status, stop, startListening]);

  const handlePlayPause = useCallback(() => {
    if (status === "speaking") {
      pause();
    } else if (status === "idle" && spokenText) {
      play(audioPath, spokenText, language);
    }
  }, [audioPath, language, pause, play, spokenText, status]);

  // Guard: redirect to home if no crop selected
  if (!selectedCrop || !plantingDate) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌾</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#2d6a4f", textAlign: "center", paddingHorizontal: 32 }}>
          {language === "sw"
            ? "Tafadhali chagua zao kwanza"
            : language === "ha"
            ? "Da fatan za a zaɓi amfanin gona da farko"
            : "Please select a crop first"}
        </Text>
        <Text
          onPress={() => router.replace("/")}
          style={{
            marginTop: 20,
            fontSize: 18,
            color: "#2d6a4f",
            textDecorationLine: "underline",
            fontWeight: "600",
          }}
        >
          {language === "sw" ? "← Rudi Nyumbani" : language === "ha" ? "← Koma Gida" : "← Go Home"}
        </Text>
      </SafeAreaView>
    );
  }

  const crop = CROPS[selectedCrop];
  const cropName =
    language === "sw" ? crop.name_sw : language === "ha" ? crop.name_ha : crop.name_en;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2d6a4f" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#2d6a4f",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 28, marginRight: 8 }}>{crop.icon}</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: "#ffffff", flex: 1 }}>
            {cropName}
          </Text>
          {stageProgress && (
            <Text style={{ fontSize: 14, color: "#bbf7d0" }}>
              {stageProgress.percentComplete}%
            </Text>
          )}
        </View>

        <LanguagePicker selected={language} onChange={setLanguage} />
      </View>

      {/* Stage progress indicator */}
      {stageProgress && (
        <View style={{ backgroundColor: "#f8fffe", paddingHorizontal: 8 }}>
          <StageIndicator
            currentStage={stageProgress.currentStage}
            percentComplete={stageProgress.percentComplete}
          />
        </View>
      )}

      {/* Advisory content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 200 }}
      >
        {isLoading && (
          <View style={{ alignItems: "center", padding: 40 }}>
            <Text style={{ fontSize: 40 }}>⏳</Text>
            <Text style={{ fontSize: 18, color: "#6b7280", marginTop: 12 }}>
              {language === "sw" ? "Inapakia..." : language === "ha" ? "Ana lodi..." : "Loading..."}
            </Text>
          </View>
        )}

        {error && (
          <View
            style={{
              backgroundColor: "#fef2f2",
              borderRadius: 12,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: "#ef4444",
            }}
          >
            <Text style={{ fontSize: 18, color: "#dc2626" }}>⚠️ {error}</Text>
          </View>
        )}

        {advice && !isLoading && (
          <AdvisoryCard
            advisory={advice}
            language={language}
            daysSincePlanting={stageProgress?.daysSincePlanting}
          />
        )}
      </ScrollView>

      {/* Floating controls bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          paddingBottom: 24,
          paddingTop: 16,
          paddingHorizontal: 24,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>

          {/* Play/Pause button */}
          <View style={{ alignItems: "center" }}>
            <Text
              onPress={handlePlayPause}
              style={{
                fontSize: 48,
                textAlign: "center",
              }}
              accessibilityLabel={status === "speaking" ? "Pause" : "Play"}
            >
              {status === "speaking" ? "⏸️" : "▶️"}
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              {status === "speaking"
                ? language === "sw" ? "Simama" : language === "ha" ? "Tsayawa" : "Pause"
                : language === "sw" ? "Cheza" : language === "ha" ? "Wasa" : "Play"}
            </Text>
          </View>

          {/* Main mic button */}
          <VoiceButton
            status={status}
            onPress={handleMicPress}
            size={80}
          />

          {/* Stop button */}
          <View style={{ alignItems: "center" }}>
            <Text
              onPress={stop}
              style={{
                fontSize: 48,
                textAlign: "center",
              }}
              accessibilityLabel="Stop"
            >
              ⏹️
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
              {language === "sw" ? "Acha" : language === "ha" ? "Tsaya" : "Stop"}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
