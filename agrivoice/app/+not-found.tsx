import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>🌾</Text>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#2d6a4f", marginBottom: 8 }}>
          Page not found
        </Text>
        <Link href="/" style={{ fontSize: 18, color: "#2d6a4f", textDecorationLine: "underline" }}>
          Go Home
        </Link>
      </View>
    </>
  );
}
