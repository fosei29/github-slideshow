/**
 * Onboarding — shown only on first app launch.
 * 4 swipeable cards explaining the app without walls of text.
 * After completion, sets a flag in AsyncStorage and routes to home.
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    id: "1",
    emoji: "🌾",
    titleEn: "Welcome to AgriVoice",
    bodyEn:
      "Your farming assistant that works without internet. Get step-by-step advice for your crops — in your language.",
    titleSw: "Karibu AgriVoice",
    bodySw:
      "Mshauri wako wa kilimo ambao hufanya kazi bila mtandao. Pata ushauri wa hatua kwa hatua kwa mazao yako — kwa lugha yako.",
    titleHa: "Barka da zuwa AgriVoice",
    bodyHa:
      "Mataimakin noman ka wanda ke aiki ba tare da intanet ba. Sami shawarar mataki-mataki don amfanin gonar ka — a cikin harshenko.",
    bg: "#2d6a4f",
    textColor: "#ffffff",
  },
  {
    id: "2",
    emoji: "🎙️",
    titleEn: "Voice First",
    bodyEn:
      "Tap the big microphone to speak. The app will read advice out loud. You do not need to read or type anything.",
    titleSw: "Sauti Kwanza",
    bodySw:
      "Gonga maikrofoni mkubwa kusema. Programu itasoma ushauri kwa sauti. Huhitaji kusoma au kuandika chochote.",
    titleHa: "Murya Da Farko",
    bodyHa:
      "Taɓa babban microphone don magana. App zai karanta shawarar da ƙarfi. Ba kwa buƙatar karanta ko rubuta komai ba.",
    bg: "#0ea5e9",
    textColor: "#ffffff",
  },
  {
    id: "3",
    emoji: "🐛",
    titleEn: "Identify Pests",
    bodyEn:
      "Take a photo of a sick plant. The app will identify the pest or disease and tell you how to treat it — no internet needed.",
    titleSw: "Tambua Wadudu",
    bodySw:
      "Piga picha ya mmea mgonjwa. Programu itatambua wadudu au ugonjwa na kukuambia jinsi ya kutibu — bila mtandao.",
    titleHa: "Gano Kwari",
    bodyHa:
      "Ɗauki hoton tsiran da ke ciwo. App zai gano ƙwarin ko cutar kuma ya gaya maka yadda ake jiyya — ba tare da intanet ba.",
    bg: "#f59e0b",
    textColor: "#1a1a00",
  },
  {
    id: "4",
    emoji: "📴",
    titleEn: "Works Offline",
    bodyEn:
      "All farming advice is saved on your phone. Use AgriVoice anywhere — even with no SIM card or network signal.",
    titleSw: "Inafanya Kazi Bila Mtandao",
    bodySw:
      "Ushauri wote wa kilimo umehifadhiwa kwenye simu yako. Tumia AgriVoice mahali popote — hata bila kadi ya SIM au ishara ya mtandao.",
    titleHa: "Yana Aiki Ba Tare da Intanet",
    bodyHa:
      "Duk shawarar noma ana ajiye shi a wayar ka. Yi amfani da AgriVoice a ko'ina — ko ba tare da katunan SIM ko alama ta cibiyar sadarwa ba.",
    bg: "#7c4b1e",
    textColor: "#ffffff",
  },
] as const;

type Lang = "en" | "sw" | "ha";

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lang] = useState<Lang>("en");
  const listRef = useRef<FlatList>(null);

  const handleFinish = async () => {
    await AsyncStorage.setItem("onboarding_done", "1");
    router.replace("/");
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  };

  const slide = SLIDES[activeIndex];

  const title =
    lang === "sw" ? slide.titleSw : lang === "ha" ? slide.titleHa : slide.titleEn;
  const body =
    lang === "sw" ? slide.bodySw : lang === "ha" ? slide.bodyHa : slide.bodyEn;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: slide.bg }}>
      <StatusBar
        barStyle={slide.textColor === "#ffffff" ? "light-content" : "dark-content"}
        backgroundColor={slide.bg}
      />

      {/* Slide cards */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => {
          const t = lang === "sw" ? item.titleSw : lang === "ha" ? item.titleHa : item.titleEn;
          const b = lang === "sw" ? item.bodySw  : lang === "ha" ? item.bodyHa  : item.bodyEn;
          return (
            <View
              style={{
                width: SCREEN_W,
                flex: 1,
                backgroundColor: item.bg,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 36,
              }}
            >
              <Text style={{ fontSize: 96, marginBottom: 24 }}>{item.emoji}</Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: item.textColor,
                  textAlign: "center",
                  marginBottom: 20,
                  lineHeight: 36,
                }}
              >
                {t}
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  color: item.textColor,
                  textAlign: "center",
                  lineHeight: 30,
                  opacity: 0.92,
                }}
              >
                {b}
              </Text>
            </View>
          );
        }}
        style={{ flex: 1 }}
      />

      {/* Bottom controls */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 20,
          backgroundColor: slide.bg,
        }}
      >
        {/* Dot indicators */}
        <View
          style={{ flexDirection: "row", justifyContent: "center", marginBottom: 20 }}
        >
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === activeIndex
                    ? slide.textColor
                    : slide.textColor + "40",
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Next / Start button */}
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: slide.textColor,
            borderRadius: 16,
            paddingVertical: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: slide.bg,
            }}
          >
            {activeIndex < SLIDES.length - 1
              ? lang === "sw" ? "Endelea →" : lang === "ha" ? "Ci gaba →" : "Next →"
              : lang === "sw" ? "Anza! 🌱" : lang === "ha" ? "Fara! 🌱" : "Let's Start! 🌱"}
          </Text>
        </TouchableOpacity>

        {/* Skip link */}
        {activeIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleFinish} style={{ marginTop: 14, alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: slide.textColor, opacity: 0.7 }}>
              {lang === "sw" ? "Ruka" : lang === "ha" ? "Tsallake" : "Skip"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
