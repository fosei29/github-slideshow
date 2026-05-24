/**
 * Tab navigator layout.
 * Four tabs: Home, Advisory, Pest ID, Settings.
 * Uses emoji icons for icon-only navigation (no FontAwesome dependency).
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSettingsStore } from "@/store/settingsStore";

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  const { language } = useSettingsStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2d6a4f",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:
            language === "sw" ? "Nyumbani" : language === "ha" ? "Gida" : "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏡" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="advisory"
        options={{
          title:
            language === "sw" ? "Ushauri" : language === "ha" ? "Shawarar" : "Advisory",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎙️" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pest-id"
        options={{
          title:
            language === "sw" ? "Wadudu" : language === "ha" ? "Kwari" : "Pest ID",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🐛" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title:
            language === "sw" ? "Kalenda" : language === "ha" ? "Kalandar" : "Calendar",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📅" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title:
            language === "sw" ? "Mpangilio" : language === "ha" ? "Saitin" : "Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚙️" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
