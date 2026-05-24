/**
 * USSDService.ts
 *
 * USSD fallback for feature-phone users who cannot use the app.
 *
 * Approach:
 *   - Generates a structured SMS-length text (≤160 chars) of the advisory.
 *   - On Android, can deep-link to the phone's USSD dialer.
 *   - For full USSD integration, partner with a local telecom aggregator
 *     (e.g., Africa's Talking, BICS) and implement webhook handler server-side.
 *
 * This file provides:
 *   1. Message compression for SMS (160-char advisory summary)
 *   2. USSD string builder for simple feature-phone menus
 *   3. Android dialer deep-link launcher
 */

import { Linking, Platform } from "react-native";
import { Advisory, SupportedLanguage } from "@/types";

// ─── SMS summary generator ────────────────────────────────────────────────────

/**
 * Compresses an advisory into a ≤160-character SMS summary.
 * Takes the first two sentences from the advice text.
 */
export function generateSMSSummary(
  advisory: Advisory,
  language: SupportedLanguage
): string {
  const fullText =
    language === "sw"
      ? advisory.advice_sw
      : language === "ha"
      ? advisory.advice_ha
      : advisory.advice_en;

  // Extract first two sentences
  const sentences = fullText.match(/[^.!?]+[.!?]+/g) ?? [fullText];
  const summary = sentences.slice(0, 2).join(" ").trim();

  // Truncate to 160 chars and add ellipsis if needed
  if (summary.length <= 160) return summary;
  return summary.slice(0, 157) + "...";
}

// ─── SMS deep-link ────────────────────────────────────────────────────────────

/**
 * Opens the device's SMS app with a pre-filled advisory summary.
 * Useful for farmers who want to share advice with a neighbor by text.
 */
export async function shareViaSMS(
  advisory: Advisory,
  language: SupportedLanguage,
  recipientPhone?: string
): Promise<void> {
  const message = generateSMSSummary(advisory, language);
  const encoded = encodeURIComponent(message);

  let url: string;
  if (Platform.OS === "ios") {
    url = recipientPhone
      ? `sms:${recipientPhone}&body=${encoded}`
      : `sms:?body=${encoded}`;
  } else {
    // Android
    url = recipientPhone
      ? `sms:${recipientPhone}?body=${encoded}`
      : `sms:?body=${encoded}`;
  }

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}

// ─── USSD menu strings ────────────────────────────────────────────────────────

/**
 * USSD menu strings for a simple telecom-hosted menu.
 * Format: short numeric codes that fit feature-phone screens (14 chars/line).
 *
 * Example session:
 *   *384*0#  → Welcome: 1.Maize 2.Rice 3.Cassava ...
 *   *384*1#  → Maize: 1.LandPrep 2.Planting 3.Vegetative ...
 *   *384*1*2# → Maize Planting advice (SMS'd to user)
 */
export const USSD_MENU = {
  mainCode: "*384*0#",  // Replace with actual code from telecom partner

  crops: {
    en: "1.Maize\n2.Rice\n3.Cassava\n4.Pineapple\n5.Sorghum",
    sw: "1.Mahindi\n2.Mchele\n3.Muhogo\n4.Nanasi\n5.Mtama",
    ha: "1.Masara\n2.Shinkafa\n3.Rogo\n4.Anabas\n5.Dawa",
  },

  stages: {
    en: "1.LandPrep\n2.Planting\n3.Growing\n4.Flowering\n5.Pests\n6.Harvest",
    sw: "1.Ardhi\n2.Kupanda\n3.Kukua\n4.Maua\n5.Wadudu\n6.Mavuno",
    ha: "1.Shirya\n2.Shuka\n3.Girma\n4.Fure\n5.Kwari\n6.Girbi",
  },
};

// ─── USSD dialer (Android only) ───────────────────────────────────────────────

/**
 * Opens the Android phone dialer with a USSD code pre-filled.
 * The user still has to press "Call" — we cannot auto-dial for security.
 */
export async function openUSSDDialer(ussdCode: string): Promise<boolean> {
  if (Platform.OS !== "android") return false;

  // Android requires encoding # as %23 in tel: URLs
  const encoded = ussdCode.replace(/#/g, "%23");
  const url = `tel:${encoded}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  return false;
}

// ─── Offline advisory SMS pack ────────────────────────────────────────────────

/**
 * Generates a complete "advisory pack" SMS for all stages of a crop.
 * Can be pre-loaded on the SIM toolkit or sent as a multi-part SMS.
 * Format: stage code | first-sentence advice (compressed)
 */
export function generateAdvisoryPack(
  advisories: Advisory[],
  language: SupportedLanguage
): string[] {
  const stageCode: Record<string, string> = {
    land_prep:   "LP",
    planting:    "PL",
    vegetative:  "VG",
    flowering:   "FL",
    pest_disease: "PD",
    harvest:     "HV",
  };

  return advisories.map((adv) => {
    const text =
      language === "sw"
        ? adv.advice_sw
        : language === "ha"
        ? adv.advice_ha
        : adv.advice_en;

    // First sentence only for pack format
    const first = (text.match(/[^.!?]+[.!?]+/)?.[0] ?? text).trim();
    const code = stageCode[adv.stage] ?? adv.stage.slice(0, 2).toUpperCase();
    const line = `${code}:${first}`;

    return line.length > 160 ? line.slice(0, 157) + "..." : line;
  });
}
