/**
 * Settings Screen — language, text size, offline sync, about.
 */

import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
} from "react-native";
import { useSettingsStore } from "@/store/settingsStore";
import { useCropStore } from "@/store/cropStore";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { LanguagePicker } from "@/components/LanguagePicker";
import { format, parseISO } from "date-fns";

export default function SettingsScreen() {
  const { language, setLanguage, textSize, setTextSize, offlineMode, setOfflineMode, lastSyncAt } =
    useSettingsStore();
  const { selectedCrop, plantingDate, resetCrop } = useCropStore();
  const { isSyncing, syncMessage, triggerSync } = useOfflineSync();

  const sectionTitle = (title: string) => (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "700",
        color: "#6b7280",
        letterSpacing: 1,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 20,
        paddingHorizontal: 4,
      }}
    >
      {title}
    </Text>
  );

  const row = (
    label: string,
    value: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 18,
        paddingHorizontal: 16,
        marginBottom: 6,
      }}
    >
      <Text style={{ fontSize: 18, color: "#111827", flex: 1 }}>{label}</Text>
      <View style={{ flexShrink: 0 }}>{value}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <StatusBar barStyle="light-content" backgroundColor="#2d6a4f" />

      {/* Header */}
      <View style={{ backgroundColor: "#2d6a4f", padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#fff" }}>
          ⚙️{" "}
          {language === "sw" ? "Mipangilio" : language === "ha" ? "Saituna" : "Settings"}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* ── Language ──────────────────────────────────────────────────── */}
        {sectionTitle(
          language === "sw" ? "Lugha" : language === "ha" ? "Harshe" : "Language"
        )}
        <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 6 }}>
          <LanguagePicker selected={language} onChange={setLanguage} />
        </View>

        {/* ── Text Size ─────────────────────────────────────────────────── */}
        {sectionTitle(
          language === "sw" ? "Ukubwa wa Maandishi" : language === "ha" ? "Girman Rubutu" : "Text Size"
        )}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 12,
            flexDirection: "row",
            gap: 8,
          }}
        >
          {(["normal", "large", "xlarge"] as const).map((size) => (
            <TouchableOpacity
              key={size}
              onPress={() => setTextSize(size)}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 10,
                backgroundColor: textSize === size ? "#2d6a4f" : "#f0fdf4",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: size === "normal" ? 14 : size === "large" ? 18 : 22,
                  color: textSize === size ? "#fff" : "#2d6a4f",
                  fontWeight: "700",
                }}
              >
                A{size === "normal" ? "" : size === "large" ? "A" : "A+"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Offline / Sync ────────────────────────────────────────────── */}
        {sectionTitle(
          language === "sw" ? "Data na Ulandanishi" : language === "ha" ? "Bayanai da Daidaitawa" : "Data & Sync"
        )}

        {row(
          language === "sw"
            ? "Hifadhi data ya rununu"
            : language === "ha"
            ? "Adana bayanan hannu"
            : "Save mobile data",
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: "#d1d5db", true: "#4ade80" }}
            thumbColor={offlineMode ? "#2d6a4f" : "#9ca3af"}
          />
        )}

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 6,
          }}
        >
          <TouchableOpacity
            onPress={triggerSync}
            disabled={isSyncing}
            style={{
              backgroundColor: isSyncing ? "#9ca3af" : "#2d6a4f",
              borderRadius: 10,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>
              {isSyncing
                ? language === "sw" ? "⏳ Inasawazisha..." : "⏳ Syncing..."
                : language === "sw" ? "🔄 Sawazisha Sasa" : language === "ha" ? "🔄 Daidaita Yanzu" : "🔄 Sync Now"}
            </Text>
          </TouchableOpacity>

          {syncMessage ? (
            <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center" }}>
              {syncMessage}
            </Text>
          ) : lastSyncAt ? (
            <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center" }}>
              {language === "sw" ? "Mara ya mwisho:" : language === "ha" ? "Karshe karo:" : "Last sync:"}{" "}
              {format(parseISO(lastSyncAt), "d MMM yyyy HH:mm")}
            </Text>
          ) : (
            <Text style={{ fontSize: 15, color: "#6b7280", textAlign: "center" }}>
              {language === "sw"
                ? "Haujawahi sawazisha"
                : language === "ha"
                ? "Bai taɓa daidaitawa ba"
                : "Never synced"}
            </Text>
          )}
        </View>

        {/* ── Current Crop ──────────────────────────────────────────────── */}
        {sectionTitle(
          language === "sw" ? "Zao la Sasa" : language === "ha" ? "Amfanin Gona Na Yanzu" : "Current Crop"
        )}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 6,
          }}
        >
          {selectedCrop ? (
            <>
              <Text style={{ fontSize: 18, color: "#1b5e3b", marginBottom: 4 }}>
                🌾 {selectedCrop} {plantingDate ? `• Planted: ${plantingDate}` : ""}
              </Text>
              <TouchableOpacity
                onPress={resetCrop}
                style={{
                  marginTop: 10,
                  backgroundColor: "#fef2f2",
                  borderRadius: 8,
                  paddingVertical: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#fca5a5",
                }}
              >
                <Text style={{ fontSize: 16, color: "#dc2626", fontWeight: "600" }}>
                  {language === "sw"
                    ? "🔄 Badilisha Zao"
                    : language === "ha"
                    ? "🔄 Canza Amfanin Gona"
                    : "🔄 Change Crop"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ fontSize: 17, color: "#6b7280" }}>
              {language === "sw"
                ? "Hakuna zao lililochaguliwa"
                : language === "ha"
                ? "Babu amfanin gona da aka zaɓa"
                : "No crop selected"}
            </Text>
          )}
        </View>

        {/* ── About ─────────────────────────────────────────────────────── */}
        {sectionTitle(language === "sw" ? "Kuhusu" : language === "ha" ? "Game Da" : "About")}
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#2d6a4f", marginBottom: 4 }}>
            🌾 AgriVoice v1.0
          </Text>
          <Text style={{ fontSize: 15, color: "#6b7280", lineHeight: 22 }}>
            {language === "sw"
              ? "Mshauri wa kilimo kwa wakulima wa Afrika. Data kutoka FAO na CABI."
              : language === "ha"
              ? "Mai ba da shawara na noma don manoman Afirka. Bayanai daga FAO da CABI."
              : "Agricultural advisor for African farmers. Data sourced from FAO and CABI."}
          </Text>
          <Text style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
            {language === "sw"
              ? "Inafanya kazi bila mtandao."
              : language === "ha"
              ? "Yana aiki ba tare da intanet ba."
              : "Works 100% offline."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
