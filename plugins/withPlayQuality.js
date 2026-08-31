const {
  withAppBuildGradle,
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const CREDENTIALS_DEP = 'implementation("androidx.credentials:credentials:1.5.0")';
const CREDENTIALS_PLAY_DEP =
  'implementation("androidx.credentials:credentials-play-services-auth:1.5.0")';

function copyNativeSources(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java/com/communitymed/app",
      );
      const srcDir = path.join(__dirname, "restore-credentials");
      fs.mkdirSync(destDir, { recursive: true });
      for (const file of fs.readdirSync(srcDir)) {
        fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
      }
      return config;
    },
  ]);
}

function withGradleDeps(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;
    contents = contents.replace(
      'getDefaultProguardFile("proguard-android.txt")',
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );
    if (!contents.includes("androidx.credentials:credentials:")) {
      contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {
    ${CREDENTIALS_DEP}
    ${CREDENTIALS_PLAY_DEP}
`,
      );
    }
    config.modResults.contents = contents;
    return config;
  });
}

function withBackupAgent(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application?.$) {
      application.$["android:backupAgent"] = ".StromaBackupAgent";
    }
    return config;
  });
}

function withRestorePackage(config) {
  return withMainApplication(config, (config) => {
    let src = config.modResults.contents;
    if (!src.includes("RestoreCredentialsPackage")) {
      if (src.includes("add(ScreenCaptureProtectionPackage())")) {
        src = src.replace(
          "add(ScreenCaptureProtectionPackage())",
          "add(ScreenCaptureProtectionPackage())\n              add(RestoreCredentialsPackage())",
        );
      } else {
        src = src.replace(
          /PackageList\(this\)\.packages\.apply \{/,
          "PackageList(this).packages.apply {\n              add(RestoreCredentialsPackage())",
        );
      }
    }
    config.modResults.contents = src;
    return config;
  });
}

function withPlayQuality(config) {
  config = copyNativeSources(config);
  config = withGradleDeps(config);
  config = withBackupAgent(config);
  config = withRestorePackage(config);
  return config;
}

module.exports = withPlayQuality;
