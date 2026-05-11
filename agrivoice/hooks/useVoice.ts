/**
 * useVoice — manages the voice input/output lifecycle.
 * Handles TTS playback and maps into the VoiceStatus state machine.
 *
 * STT (speech-to-text) is stubbed here — when react-native-whisper is
 * available in the project it can be dropped in at the TODO markers below.
 */

import { useState, useCallback, useRef } from "react";
import { VoiceStatus } from "@/types";
import {
  playAdvisory,
  stopPlayback,
  pausePlayback,
  resumePlayback,
} from "@/services/AudioService";
import { SupportedLanguage } from "@/types";

export interface UseVoiceOptions {
  onTranscript?: (text: string) => void;
  onError?: (msg: string) => void;
}

export interface UseVoiceResult {
  status: VoiceStatus;
  play: (audioPath: string, fallbackText: string, language: SupportedLanguage) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export function useVoice(opts: UseVoiceOptions = {}): UseVoiceResult {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  // Track if we paused so resume works correctly
  const isPaused = useRef(false);

  const play = useCallback(
    async (audioPath: string, fallbackText: string, language: SupportedLanguage) => {
      setStatus("speaking");
      isPaused.current = false;

      await playAdvisory({
        audioPath,
        fallbackText,
        language,
        onStart: () => setStatus("speaking"),
        onDone: () => {
          setStatus("idle");
          isPaused.current = false;
        },
        onError: (err) => {
          setStatus("error");
          opts.onError?.(err);
        },
      });
    },
    [opts]
  );

  const pause = useCallback(async () => {
    await pausePlayback();
    isPaused.current = true;
    setStatus("idle");
  }, []);

  const resume = useCallback(async () => {
    if (isPaused.current) {
      await resumePlayback();
      isPaused.current = false;
      setStatus("speaking");
    }
  }, []);

  const stop = useCallback(async () => {
    await stopPlayback();
    isPaused.current = false;
    setStatus("idle");
  }, []);

  /**
   * STT via Whisper — requires react-native-whisper.
   * When the library is installed, replace the TODO block with the
   * actual Whisper transcription call.
   */
  const startListening = useCallback(async () => {
    setStatus("listening");

    // TODO: replace with Whisper transcription when library is integrated
    // import { transcribe } from 'react-native-whisper';
    // const result = await transcribe({ language: language, modelPath: 'ml/models/whisper-tiny.bin' });
    // opts.onTranscript?.(result.text);

    // Placeholder: simulate a 2-second listening window
    setTimeout(() => {
      setStatus("idle");
      opts.onTranscript?.(""); // empty transcript triggers "unknown" intent
    }, 2000);
  }, [opts]);

  const stopListening = useCallback(() => {
    setStatus("idle");
  }, []);

  return { status, play, pause, resume, stop, startListening, stopListening };
}
