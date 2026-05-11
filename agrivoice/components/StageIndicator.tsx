/**
 * StageIndicator — horizontal progress bar showing crop growth stages.
 * Uses icon + name labels; no literacy required to understand progress.
 */

import React from "react";
import { View, Text, ScrollView } from "react-native";
import { GrowthStageId } from "@/types";
import { GROWTH_STAGES, STAGE_ORDER } from "@/constants/stages";
import { useSettingsStore } from "@/store/settingsStore";

interface StageIndicatorProps {
  currentStage: GrowthStageId;
  percentComplete: number;
}

// Stages shown in the indicator (pest_disease is tracked separately)
const VISIBLE_STAGES = STAGE_ORDER.filter((s) => s !== "pest_disease");

export function StageIndicator({ currentStage, percentComplete }: StageIndicatorProps) {
  const { language } = useSettingsStore();
  const currentIndex = VISIBLE_STAGES.indexOf(currentStage);

  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 4 }}>
      {/* Progress bar */}
      <View
        style={{
          height: 8,
          backgroundColor: "#dcfce7",
          borderRadius: 4,
          marginHorizontal: 8,
          marginBottom: 10,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percentComplete}%`,
            height: "100%",
            backgroundColor: "#2d6a4f",
            borderRadius: 4,
          }}
        />
      </View>

      {/* Stage icons row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", paddingHorizontal: 4 }}>
          {VISIBLE_STAGES.map((stageId, index) => {
            const stage = GROWTH_STAGES[stageId];
            const isActive = stageId === currentStage;
            const isPast = index < currentIndex;
            const name =
              language === "sw"
                ? stage.name_sw
                : language === "ha"
                ? stage.name_ha
                : stage.name_en;

            return (
              <View
                key={stageId}
                style={{
                  alignItems: "center",
                  width: 72,
                  marginHorizontal: 2,
                }}
              >
                {/* Dot connector line */}
                <View style={{ flexDirection: "row", alignItems: "center", width: 72 }}>
                  <View
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: isPast || isActive ? "#2d6a4f" : "#dcfce7",
                    }}
                  />
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isActive
                        ? "#2d6a4f"
                        : isPast
                        ? "#4ade80"
                        : "#dcfce7",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: isActive ? 2 : 0,
                      borderColor: "#fff",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>
                      {isPast ? "✓" : stage.icon}
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: isPast ? "#2d6a4f" : "#dcfce7",
                    }}
                  />
                </View>

                {/* Stage name */}
                <Text
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: isActive ? "#2d6a4f" : "#6b7280",
                    fontWeight: isActive ? "700" : "400",
                    textAlign: "center",
                    flexWrap: "wrap",
                  }}
                  numberOfLines={2}
                >
                  {name}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
