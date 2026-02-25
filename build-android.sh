#!/bin/bash
# ============================================================
# Community Medicine App - Local Android APK Build Script
# Run from inside WSL2 after running setup-wsl-android.sh
# Usage: ./build-android.sh [debug|release]
# ============================================================
set -e

BUILD_TYPE=${1:-debug}

# Source environment
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export ANDROID_SDK_ROOT="$HOME/android-sdk"
export ANDROID_HOME="$HOME/android-sdk"
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export PATH="$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/35.0.0:$JAVA_HOME/bin"

# ── Navigate to project (Windows drive mounted at /mnt/d) ───
PROJECT_DIR="/mnt/d/The App"
cd "$PROJECT_DIR"

echo "📦 Installing npm dependencies..."
npm install

echo "🔨 Running expo prebuild (Android only)..."
npx expo prebuild --clean --platform android

echo "🏗️  Building $BUILD_TYPE APK..."
cd android
if [ "$BUILD_TYPE" = "release" ]; then
  ./gradlew assembleRelease
  APK_PATH="app/build/outputs/apk/release/app-release.apk"
else
  ./gradlew assembleDebug
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..

# Copy APK to Windows-accessible location
OUTPUT_DIR="/mnt/d/The App/output"
mkdir -p "$OUTPUT_DIR"
cp "android/$APK_PATH" "$OUTPUT_DIR/community-medicine-$BUILD_TYPE.apk"

echo ""
echo "✅ Build complete!"
echo "📱 APK saved to: D:\\The App\\output\\community-medicine-$BUILD_TYPE.apk"
echo "   Install with Android File Transfer or ADB"
