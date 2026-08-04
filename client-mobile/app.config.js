module.exports = {
  expo: {
    name: "TruthCheck Mobile",
    slug: "truthcheck-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0A0E1A"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.truthcheck.mobile"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0E1A"
      },
      package: "com.truthcheck.mobile",
      permissions: [
        "android.permission.READ_SMS",
        "android.permission.RECEIVE_SMS",
        "android.permission.VIBRATE",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ],
      intentFilters: [
        {
          action: "android.intent.action.SEND",
          data: [{ mimeType: "text/plain" }],
          category: ["android.intent.category.DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#3B82F6",
          sounds: [],
          androidMode: "default",
          androidCollapsedTitle: "TruthCheck Alerts",
          iosDisplayInForeground: true
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            minSdkVersion: 26
          }
        }
      ]
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5001",
      eas: {
        projectId: "your-eas-project-id"
      }
    }
  }
};
