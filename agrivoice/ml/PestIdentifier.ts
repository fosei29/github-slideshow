/**
 * PestIdentifier.ts
 *
 * TensorFlow Lite wrapper for on-device pest/disease identification.
 * Runs a MobileNetV2-based classifier compiled to TFLite format.
 *
 * Bundle a .tflite model at ml/models/pest_classifier.tflite.
 * The model outputs class probabilities for the labels in PEST_LABELS.
 *
 * NOTE: The actual TFLite bridge requires react-native-fast-tflite or
 * @tensorflow/tfjs-react-native. This file provides the integration
 * contract and a simulation fallback for development.
 */

import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { CropId } from "@/types";

// ─── Model labels (must match training order) ─────────────────────────────────
// These are shared across crops; crop filter is applied after inference.

const PEST_LABELS: string[] = [
  "fall_armyworm",
  "stem_borer",
  "maize_streak_virus",
  "healthy",
  "leaf_blight",
  "aphids",
  "root_rot",
  "mealybug",
  "cassava_mosaic",
  "rice_blast",
];

const MODEL_ASSET_PATH = "ml/models/pest_classifier.tflite";
const INPUT_SIZE = 224; // MobileNetV2 expects 224×224 pixels

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PestPrediction {
  label: string;
  confidence: number; // 0.0–1.0
}

export interface IdentificationResult {
  topPrediction: PestPrediction;
  allPredictions: PestPrediction[];
  /** True if confidence is high enough to act on */
  isConfident: boolean;
}

// ─── Model state ─────────────────────────────────────────────────────────────

let modelLoaded = false;
let modelUri: string | null = null;

/**
 * Loads the TFLite model from the app bundle into a temp file.
 * Must be called once at startup (or lazily before first inference).
 */
export async function loadModel(): Promise<void> {
  if (modelLoaded) return;

  try {
    // Copy bundled model to FileSystem so TFLite can read it by path
    const asset = Asset.fromURI(MODEL_ASSET_PATH);
    await asset.downloadAsync();

    if (asset.localUri) {
      const dest = FileSystem.cacheDirectory + "pest_classifier.tflite";
      await FileSystem.copyAsync({ from: asset.localUri, to: dest });
      modelUri = dest;
      modelLoaded = true;
    }
  } catch (e) {
    console.warn("[PestIdentifier] Model load failed — using simulation mode:", e);
  }
}

/**
 * Runs inference on a photo URI (from expo-camera or expo-image-picker).
 * Returns ranked pest predictions.
 *
 * @param photoUri  - file:// URI from camera capture
 * @param crop      - active crop, used to filter irrelevant labels
 */
export async function identifyPest(
  photoUri: string,
  crop: CropId
): Promise<IdentificationResult> {
  if (!modelLoaded || !modelUri) {
    // Simulation mode — returns a plausible result for UI development
    return simulateIdentification(crop);
  }

  /**
   * Real TFLite inference would go here.
   * Example using react-native-fast-tflite:
   *
   *   import { loadTensorflowModel } from 'react-native-fast-tflite';
   *   const model = await loadTensorflowModel({ url: modelUri });
   *   const input = await preprocessImage(photoUri, INPUT_SIZE);
   *   const output = await model.run([input]);
   *   return parseOutput(output[0] as Float32Array, crop);
   *
   * Stub until library is installed:
   */
  return simulateIdentification(crop);
}

// ─── Output parsing ───────────────────────────────────────────────────────────

function parseOutput(probabilities: Float32Array, crop: CropId): IdentificationResult {
  const predictions: PestPrediction[] = PEST_LABELS.map((label, i) => ({
    label,
    confidence: probabilities[i] ?? 0,
  }));

  // Sort descending by confidence
  predictions.sort((a, b) => b.confidence - a.confidence);

  // Filter to labels relevant for this crop
  const relevant = predictions.filter((p) => isRelevantForCrop(p.label, crop));

  const top = relevant[0] ?? predictions[0];

  return {
    topPrediction: top,
    allPredictions: relevant.slice(0, 3),
    isConfident: top.confidence >= 0.65,
  };
}

/** Filters TFLite model outputs to only those relevant for the selected crop */
function isRelevantForCrop(label: string, crop: CropId): boolean {
  const CROP_PEST_MAP: Record<CropId, string[]> = {
    maize: ["fall_armyworm", "stem_borer", "maize_streak_virus", "healthy", "leaf_blight", "aphids"],
    rice: ["rice_blast", "healthy", "leaf_blight", "aphids"],
    cassava: ["cassava_mosaic", "healthy", "mealybug", "root_rot"],
    pineapple: ["mealybug", "root_rot", "healthy"],
    sorghum: ["aphids", "stem_borer", "healthy", "leaf_blight"],
  };

  return CROP_PEST_MAP[crop]?.includes(label) ?? false;
}

// ─── Simulation (dev / no-model fallback) ────────────────────────────────────

function simulateIdentification(crop: CropId): IdentificationResult {
  const cropPests: Record<CropId, string> = {
    maize: "fall_armyworm",
    rice: "rice_blast",
    cassava: "cassava_mosaic",
    pineapple: "mealybug",
    sorghum: "aphids",
  };

  const topLabel = cropPests[crop];

  return {
    topPrediction: { label: topLabel, confidence: 0.82 },
    allPredictions: [
      { label: topLabel, confidence: 0.82 },
      { label: "healthy", confidence: 0.12 },
      { label: "leaf_blight", confidence: 0.06 },
    ],
    isConfident: true,
  };
}

// ─── Image preprocessing (placeholder) ───────────────────────────────────────

/**
 * Resizes and normalizes a photo to the model's expected input tensor.
 * Implementation depends on available image library (e.g., expo-image-manipulator).
 */
async function preprocessImage(
  photoUri: string,
  size: number
): Promise<Float32Array> {
  // TODO: implement with expo-image-manipulator:
  // 1. Resize to size × size
  // 2. Normalize pixels to [0, 1] or [-1, 1] depending on model training
  // 3. Return flat Float32Array in HWC format

  return new Float32Array(size * size * 3).fill(0);
}
