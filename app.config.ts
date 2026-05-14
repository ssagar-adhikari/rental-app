import type { ExpoConfig } from "expo/config";

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const universalLinkHost = process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST;

if (!googleMapsApiKey) {
  console.warn(
    "[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Maps will not render on Android. Add it to your .env file.",
  );
}

const config: ExpoConfig = {
  name: "rental-app",
  slug: "rental-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "rentalapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    associatedDomains: universalLinkHost ? [`applinks:${universalLinkHost}`] : undefined,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "Rental App uses your location to show rentals near your current area.",
      NSCameraUsageDescription:
        "Rental App uses your camera to add photos to your listings.",
      NSPhotoLibraryUsageDescription:
        "Rental App uses your photo library to add images to your listings.",
    },
  },
  android: {
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "CAMERA"],
    intentFilters: universalLinkHost
      ? [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              { scheme: "https", host: universalLinkHost, pathPrefix: "/listings" },
              { scheme: "https", host: universalLinkHost, pathPrefix: "/bookings" },
              { scheme: "https", host: universalLinkHost, pathPrefix: "/email/verify" },
              { scheme: "https", host: universalLinkHost, pathPrefix: "/password/reset" },
            ],
            category: ["BROWSABLE", "DEFAULT"],
          },
        ]
      : undefined,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    config: googleMapsApiKey
      ? {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        }
      : undefined,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    "expo-secure-store",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Rental App uses your location to show rentals near your current area.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Rental App uses your photo library to add images to your listings.",
        cameraPermission:
          "Rental App uses your camera to add photos to your listings.",
      },
    ],
    [
      "expo-notifications",
      {
        color: "#3F56A5",
      },
    ],
    "@sentry/react-native/expo",
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? "development",
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    universalLinkHost: process.env.EXPO_PUBLIC_UNIVERSAL_LINK_HOST,
  },
};

export default config;
