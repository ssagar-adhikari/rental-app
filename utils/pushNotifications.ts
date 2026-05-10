import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Config } from "@/constants/config";
import { pushApi } from "@/services/pushApi";
import { logger } from "@/utils/logger";

export type PushCategory = "bookings" | "inbox" | "marketing";

const ANDROID_CHANNELS: Array<{
  id: PushCategory;
  name: string;
  importance: Notifications.AndroidImportance;
  description: string;
}> = [
  {
    id: "bookings",
    name: "Bookings",
    importance: Notifications.AndroidImportance.HIGH,
    description: "Booking confirmations, reminders, and status changes.",
  },
  {
    id: "inbox",
    name: "Vendor Inbox",
    importance: Notifications.AndroidImportance.DEFAULT,
    description: "Messages and updates from vendors.",
  },
  {
    id: "marketing",
    name: "Promotions",
    importance: Notifications.AndroidImportance.LOW,
    description: "Discounts, new listings, and seasonal offers.",
  },
];

let foregroundHandlerConfigured = false;
let channelsConfigured = false;

export function configureForegroundHandler(): void {
  if (foregroundHandlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  foregroundHandlerConfigured = true;
}

export async function configureAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android" || channelsConfigured) {
    return;
  }

  for (const channel of ANDROID_CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: channel.name,
      importance: channel.importance,
      description: channel.description,
      sound: "default",
    });
  }

  channelsConfigured = true;
}

async function ensurePermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();

  if (existing.granted) {
    return true;
  }

  if (!existing.canAskAgain) {
    return false;
  }

  const next = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });

  return next.granted;
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    logger.info("push", "Skipping push token fetch: simulator detected.");
    return null;
  }

  if (!Config.easProjectId) {
    logger.warn(
      "push",
      "EXPO_PUBLIC_EAS_PROJECT_ID is not set. Push tokens cannot be issued without a project id.",
    );
    return null;
  }

  const granted = await ensurePermission();

  if (!granted) {
    logger.info("push", "Notification permission denied.");
    return null;
  }

  await configureAndroidChannels();

  try {
    const result = await Notifications.getExpoPushTokenAsync({
      projectId: Config.easProjectId,
    });

    return result.data ?? null;
  } catch (error) {
    logger.error("push", error);
    return null;
  }
}

export async function syncPushTokenWithBackend(authToken: string): Promise<string | null> {
  const expoToken = await getExpoPushToken();

  if (!expoToken) {
    return null;
  }

  try {
    await pushApi.register(
      {
        token: expoToken,
        provider: "expo",
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
        device_name: Device.deviceName ?? Device.modelName ?? `${Platform.OS} device`,
      },
      authToken,
    );

    return expoToken;
  } catch (error) {
    logger.error("push", error, { phase: "register" });
    return null;
  }
}

export async function unregisterPushToken(expoToken: string, authToken: string): Promise<void> {
  try {
    await pushApi.unregister(expoToken, authToken);
  } catch (error) {
    logger.warn("push", "Failed to unregister push token; continuing logout.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
