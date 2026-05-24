// Required for proper JSON imports, TFLite model bundling, and SVG support.
// Without this, Metro won't include .json data files or .tflite assets.

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow TFLite model files to be bundled as assets
config.resolver.assetExts.push("tflite", "bin", "mp3");

// Allow JSON data files to be imported as modules
config.resolver.sourceExts.push("json");

module.exports = withNativeWind(config, { input: "./global.css" });
