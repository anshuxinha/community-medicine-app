#!/bin/bash
# ============================================================
# Community Medicine App - WSL2 Android Build Setup Script
# Run this ONCE inside your Ubuntu terminal after the reboot
# ============================================================
set -e

echo "🚀 Starting Android build environment setup..."

# ── 1. System packages ───────────────────────────────────────
sudo apt-get update -qq
sudo apt-get install -y curl wget unzip git openjdk-17-jdk-headless

# Verify Java
java -version

# ── 2. Node.js 20 via nvm ───────────────────────────────────
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
fi
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
node --version
npm --version

# ── 3. Android SDK (command-line tools only, no Android Studio needed) ──
ANDROID_SDK_ROOT="$HOME/android-sdk"
CMDLINE_TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
mkdir -p "$ANDROID_SDK_ROOT/cmdline-tools"

if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools/latest" ]; then
  echo "Downloading Android command-line tools..."
  wget -q -O /tmp/cmdline-tools.zip "$CMDLINE_TOOLS_URL"
  unzip -q /tmp/cmdline-tools.zip -d /tmp/cmdline-tools-extract
  mv /tmp/cmdline-tools-extract/cmdline-tools "$ANDROID_SDK_ROOT/cmdline-tools/latest"
  rm /tmp/cmdline-tools.zip
fi

# ── 4. Environment variables ────────────────────────────────
PROFILE_BLOCK='
# Android SDK
export ANDROID_SDK_ROOT="$HOME/android-sdk"
export ANDROID_HOME="$HOME/android-sdk"
export PATH="$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/build-tools/35.0.0"
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
export PATH="$PATH:$JAVA_HOME/bin"
'
if ! grep -q "android-sdk" "$HOME/.bashrc"; then
  echo "$PROFILE_BLOCK" >> "$HOME/.bashrc"
fi
export ANDROID_SDK_ROOT="$HOME/android-sdk"
export ANDROID_HOME="$HOME/android-sdk"
export PATH="$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools"
export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"

# ── 5. Accept SDK licenses & install required components ────
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0" "ndk;26.1.10909125"

echo ""
echo "✅ Setup complete! Android SDK, NDK 26.1, Java 17, and Node 20 installed."
echo ""
echo "Now run the build script: ./build-android.sh"
