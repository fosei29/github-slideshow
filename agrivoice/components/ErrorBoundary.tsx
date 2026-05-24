/**
 * ErrorBoundary — catches React render errors and shows a friendly screen.
 * Critical for low-end devices where OOM errors can happen mid-render.
 */

import React, { Component, ReactNode, ErrorInfo } from "react";
import {
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

interface Props {
  children: ReactNode;
  fallbackLanguage?: "en" | "sw" | "ha";
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to an error tracker if network available
    console.error("[ErrorBoundary]", error.message, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = this.props.fallbackLanguage ?? "en";

    const titles: Record<string, string> = {
      en: "Something went wrong",
      sw: "Hitilafu imetokea",
      ha: "Wani abu ya kuskure",
    };
    const bodies: Record<string, string> = {
      en: "The app hit an error. Your crop data is safe. Tap below to try again.",
      sw: "Programu imegonga hitilafu. Data yako ya zao iko salama. Gonga hapa chini kujaribu tena.",
      ha: "App ta kai kuskure. Bayanan amfanin gonar ka suna aminci. Taɓa ƙasa don sake gwadawa.",
    };
    const btnLabels: Record<string, string> = {
      en: "Try Again",
      sw: "Jaribu Tena",
      ha: "Sake Gwadawa",
    };

    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff7ed",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Text style={{ fontSize: 64, marginBottom: 16 }}>🌾</Text>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            color: "#92400e",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {titles[lang]}
        </Text>
        <Text
          style={{
            fontSize: 17,
            color: "#78350f",
            textAlign: "center",
            lineHeight: 26,
            marginBottom: 32,
          }}
        >
          {bodies[lang]}
        </Text>
        <TouchableOpacity
          onPress={this.handleReset}
          style={{
            backgroundColor: "#d97706",
            borderRadius: 14,
            paddingVertical: 18,
            paddingHorizontal: 36,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff" }}>
            {btnLabels[lang]}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
}
