import * as Haptics from "expo-haptics";

export function selectionHaptic() {
  Haptics.selectionAsync().catch(() => null);
}

export function lightImpactHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
}

export function successHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => null);
}
