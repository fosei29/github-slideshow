/**
 * AudioService.ts
 *
 * Manages TTS playback and cached MP3 audio.
 * Strategy:
 *   1. Check if a cached MP3 exists in FileSystem for the requested audio path.
 *   2. If yes, play cached file (works fully offline).
 *   3. If no, fall back to expo-speech TTS with the advisory text.
 *
 * Audio files are expected to be bundled in assets/audio/ at build time.
 * For voice > 60 seconds, expo-speech automatically handles chunking.
 */

import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { SupportedLanguage } from "@/types";

// expo-av sound instance — keep reference to stop/release manually
let currentSound: Audio.Sound | null = null;

// ─── Audio session setup ──────────────────────────────────────────────────────

/**
 * Call once at app startup to configure audio mode for outdoor use.
 * Allows audio to continue when phone is set to silent/vibrate.
 */
export async function initAudio(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,      // critical for field use
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

// ─── Playback ─────────────────────────────────────────────────────────────────

export interface PlayOptions {
  audioPath: string;      // e.g. "assets/audio/maize_planting_en.mp3"
  fallbackText: string;   // spoken by TTS if file not available
  language: SupportedLanguage;
  onStart?: () => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}

export async function playAdvisory(opts: PlayOptions): Promise<void> {
  await stopPlayback();

  try {
    const localUri = await resolveAudioUri(opts.audioPath);

    if (localUri) {
      await playFile(localUri, opts.onStart, opts.onDone, opts.onError);
    } else {
      await speakWithTTS(opts.fallbackText, opts.language, opts.onStart, opts.onDone);
    }
  } catch (e) {
    opts.onError?.(`Audio error: ${String(e)}`);
    // Always fall back to TTS so users still hear advice
    await speakWithTTS(opts.fallbackText, opts.language, opts.onStart, opts.onDone);
  }
}

/**
 * Resolves an audio path to a local file URI.
 * Checks the app asset bundle first, then the FileSystem cache directory.
 * Returns null if neither exists (triggers TTS fallback).
 */
async function resolveAudioUri(audioPath: string): Promise<string | null> {
  // Check FileSystem cache (downloaded audio)
  const cacheUri = FileSystem.cacheDirectory + audioPath.replace(/\//g, "_");
  const info = await FileSystem.getInfoAsync(cacheUri);
  if (info.exists) return cacheUri;

  // Check bundled assets — only works for files declared in assetBundlePatterns
  try {
    const asset = Asset.fromURI(audioPath);
    await asset.downloadAsync();
    if (asset.localUri) return asset.localUri;
  } catch {
    // Asset not bundled — TTS fallback will handle it
  }

  return null;
}

async function playFile(
  uri: string,
  onStart?: () => void,
  onDone?: () => void,
  onError?: (e: string) => void
): Promise<void> {
  const { sound } = await Audio.Sound.createAsync(
    { uri },
    { shouldPlay: true, volume: 1.0 }
  );

  currentSound = sound;
  onStart?.();

  sound.setOnPlaybackStatusUpdate((status) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) {
      sound.unloadAsync();
      currentSound = null;
      onDone?.();
    }
  });
}

// ─── TTS fallback ─────────────────────────────────────────────────────────────

// BCP-47 locale codes for expo-speech
const TTS_LOCALES: Record<SupportedLanguage, string> = {
  en: "en-KE",  // Kenyan English — closest to East/West Africa
  sw: "sw-KE",
  ha: "ha",
};

async function speakWithTTS(
  text: string,
  language: SupportedLanguage,
  onStart?: () => void,
  onDone?: () => void
): Promise<void> {
  // expo-speech on Android has a 4000-char limit; chunk longer advice
  const chunks = chunkText(text, 800);

  onStart?.();

  for (let i = 0; i < chunks.length; i++) {
    await new Promise<void>((resolve) => {
      Speech.speak(chunks[i], {
        language: TTS_LOCALES[language],
        rate: 0.85,     // slightly slower for non-native listeners
        pitch: 1.0,
        onDone: resolve,
        onError: () => resolve(), // continue even if one chunk errors
      });
    });
  }

  onDone?.();
}

/** Splits text at sentence boundaries to keep chunks under maxLen chars */
function chunkText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─── Playback controls ────────────────────────────────────────────────────────

export async function stopPlayback(): Promise<void> {
  Speech.stop();

  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {
      // Already unloaded — safe to ignore
    }
    currentSound = null;
  }
}

export async function pausePlayback(): Promise<void> {
  if (currentSound) {
    const status = await currentSound.getStatusAsync();
    if (status.isLoaded && status.isPlaying) {
      await currentSound.pauseAsync();
    }
  }
}

export async function resumePlayback(): Promise<void> {
  if (currentSound) {
    const status = await currentSound.getStatusAsync();
    if (status.isLoaded && !status.isPlaying) {
      await currentSound.playAsync();
    }
  }
}

export function isSpeaking(): boolean {
  return currentSound !== null;
}

// ─── Audio caching (called by SyncService) ───────────────────────────────────

/**
 * Downloads an audio file from a remote URL and saves it to the cache dir.
 * The cached file is keyed by its audioPath so resolveAudioUri can find it.
 */
export async function cacheAudioFile(
  remoteUrl: string,
  audioPath: string
): Promise<void> {
  const dest = FileSystem.cacheDirectory + audioPath.replace(/\//g, "_");
  const info = await FileSystem.getInfoAsync(dest);
  if (info.exists) return; // already cached

  await FileSystem.downloadAsync(remoteUrl, dest);
}
