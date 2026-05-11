/**
 * Pest ID Screen — camera-based pest and disease identification.
 *
 * Flow:
 *  1. User taps "Take Photo"
 *  2. Camera opens, user captures leaf/plant photo
 *  3. TFLite model runs locally, returns top prediction
 *  4. Treatment advice shown in active language
 *  5. User can tap "Hear Advice" to play TTS
 */

import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useCropStore } from "@/store/cropStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useVoice } from "@/hooks/useVoice";
import { identifyPest, loadModel } from "@/ml/PestIdentifier";
import { getPestAdvisory } from "@/services/AdvisoryEngine";
import { LanguagePicker } from "@/components/LanguagePicker";
import { VoiceButton } from "@/components/VoiceButton";
import { CROPS } from "@/constants/crops";

export default function PestIdScreen() {
  const { selectedCrop } = useCropStore();
  const { language, setLanguage } = useSettingsStore();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pestResult, setPestResult] = useState<ReturnType<typeof getPestAdvisory> | null>(null);
  const [confidence, setConfidence] = useState<number>(0);

  const { status, play, stop } = useVoice({
    onError: (msg) => Alert.alert("Audio Error", msg),
  });

  const handleTakePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        language === "sw" ? "Ruhusa Inahitajika" : "Permission Required",
        language === "sw"
          ? "AgriVoice inahitaji ruhusa ya kamera."
          : "AgriVoice needs camera permission."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,         // lower quality = smaller file = faster inference on low-end device
      allowsEditing: true,
      aspect: [1, 1],       // square crop for MobileNetV2 input
    });

    if (!result.canceled && result.assets[0]) {
      await analyzePhoto(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      await analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    if (!selectedCrop) {
      Alert.alert("", "Please select a crop on the Home screen first.");
      return;
    }

    setPhotoUri(uri);
    setIsAnalyzing(true);
    setPestResult(null);

    try {
      await loadModel();
      const prediction = await identifyPest(uri, selectedCrop);
      setConfidence(prediction.topPrediction.confidence);

      if (!prediction.isConfident) {
        // Low confidence — show a "not sure" message
        setPestResult(null);
        Alert.alert(
          language === "sw" ? "Hakika Kidogo" : "Low Confidence",
          language === "sw"
            ? "Picha haikuwa wazi. Jaribu tena na picha iliyo karibu zaidi na mwanga bora."
            : language === "ha"
            ? "Hoton bai bayyana ba. Sake gwadawa da hoton da ya fi kusa da haske mai kyau."
            : "Photo wasn't clear enough. Try again with a closer photo in good light."
        );
        return;
      }

      const advice = getPestAdvisory(
        selectedCrop,
        prediction.topPrediction.label,
        language
      );
      setPestResult(advice);
    } catch (e) {
      Alert.alert("Error", "Could not analyze photo. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePlayAdvice = () => {
    if (!pestResult) return;
    const text = `${pestResult.symptomsText}. ${pestResult.treatmentText}`;
    play("", text, language);
  };

  const crop = selectedCrop ? CROPS[selectedCrop] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2d6a4f" />

      {/* Header */}
      <View style={{ backgroundColor: "#2d6a4f", padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 8 }}>
          🐛{" "}
          {language === "sw"
            ? "Tambua Wadudu / Magonjwa"
            : language === "ha"
            ? "Gano Kwari / Cuta"
            : "Identify Pest / Disease"}
        </Text>
        <LanguagePicker selected={language} onChange={setLanguage} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* Crop badge */}
        {crop && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f0fdf4",
              borderRadius: 10,
              padding: 10,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#bbf7d0",
            }}
          >
            <Text style={{ fontSize: 24, marginRight: 8 }}>{crop.icon}</Text>
            <Text style={{ fontSize: 16, color: "#2d6a4f", fontWeight: "600" }}>
              {language === "sw"
                ? crop.name_sw
                : language === "ha"
                ? crop.name_ha
                : crop.name_en}
            </Text>
          </View>
        )}

        {/* Photo preview */}
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{
              width: "100%",
              aspectRatio: 1,
              borderRadius: 16,
              marginBottom: 16,
              backgroundColor: "#f3f4f6",
            }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              borderRadius: 16,
              backgroundColor: "#f0fdf4",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              borderWidth: 2,
              borderColor: "#bbf7d0",
              borderStyle: "dashed",
            }}
          >
            <Text style={{ fontSize: 72 }}>📷</Text>
            <Text style={{ fontSize: 18, color: "#6b7280", marginTop: 12, textAlign: "center" }}>
              {language === "sw"
                ? "Piga picha ya mmea"
                : language === "ha"
                ? "Ɗauki hoton tsiran"
                : "Take a photo of your plant"}
            </Text>
          </View>
        )}

        {/* Capture buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={handleTakePhoto}
            style={{
              flex: 1,
              backgroundColor: "#2d6a4f",
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 28 }}>📸</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 4 }}>
              {language === "sw" ? "Piga Picha" : language === "ha" ? "Ɗauki Hoto" : "Take Photo"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePickFromGallery}
            style={{
              flex: 1,
              backgroundColor: "#f0fdf4",
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#2d6a4f",
            }}
          >
            <Text style={{ fontSize: 28 }}>🖼️</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#2d6a4f", marginTop: 4 }}>
              {language === "sw" ? "Chagua Picha" : language === "ha" ? "Zaɓi Hoto" : "Gallery"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading indicator */}
        {isAnalyzing && (
          <View style={{ alignItems: "center", padding: 24 }}>
            <ActivityIndicator size="large" color="#2d6a4f" />
            <Text style={{ fontSize: 18, color: "#2d6a4f", marginTop: 12 }}>
              {language === "sw"
                ? "Inachunguza..."
                : language === "ha"
                ? "Ana bincike..."
                : "Analyzing..."}
            </Text>
          </View>
        )}

        {/* Result card */}
        {pestResult && !isAnalyzing && (
          <View>
            {/* Pest name + confidence */}
            <View
              style={{
                backgroundColor: "#fef3c7",
                borderRadius: 14,
                padding: 16,
                marginBottom: 14,
                borderLeftWidth: 4,
                borderLeftColor: "#f59e0b",
              }}
            >
              <Text style={{ fontSize: 14, color: "#92400e", marginBottom: 4 }}>
                {language === "sw" ? "Imetambuliwa:" : language === "ha" ? "An gano:" : "Identified:"}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: "800", color: "#92400e" }}>
                {pestResult.pest.name_en}
              </Text>
              <Text style={{ fontSize: 14, color: "#b45309", marginTop: 2 }}>
                {language === "sw"
                  ? pestResult.pest.name_sw
                  : language === "ha"
                  ? pestResult.pest.name_ha
                  : ""}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  height: 6,
                  backgroundColor: "#fde68a",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.round(confidence * 100)}%`,
                    height: "100%",
                    backgroundColor: confidence > 0.75 ? "#16a34a" : "#f59e0b",
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {Math.round(confidence * 100)}%{" "}
                {language === "sw" ? "uhakika" : language === "ha" ? "tabbaci" : "confidence"}
              </Text>
            </View>

            {/* Symptoms */}
            <View
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                borderLeftWidth: 3,
                borderLeftColor: "#f87171",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 6 }}>
                🔍{" "}
                {language === "sw" ? "Dalili" : language === "ha" ? "Alamun" : "Symptoms"}
              </Text>
              <Text style={{ fontSize: 17, color: "#7f1d1d", lineHeight: 26 }}>
                {pestResult.symptomsText}
              </Text>
            </View>

            {/* Treatment */}
            <View
              style={{
                backgroundColor: "#f0fdf4",
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                borderLeftWidth: 3,
                borderLeftColor: "#22c55e",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#16a34a", marginBottom: 6 }}>
                💊{" "}
                {language === "sw" ? "Matibabu" : language === "ha" ? "Jiyya" : "Treatment"}
              </Text>
              <Text style={{ fontSize: 17, color: "#14532d", lineHeight: 26 }}>
                {pestResult.treatmentText}
              </Text>
            </View>

            {/* Play advice button */}
            <View style={{ alignItems: "center" }}>
              <VoiceButton
                status={status}
                onPress={status === "speaking" ? stop : handlePlayAdvice}
                size={72}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
