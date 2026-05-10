import type { StyleProp, ViewStyle } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { EmptyState } from "@/components/EmptyState";

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "inline" | "fullscreen";
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  retryLabel = "Try again",
  icon = "alert-circle-outline",
  variant = "fullscreen",
  style,
}: ErrorStateProps) {
  return (
    <EmptyState
      action={onRetry ? { label: retryLabel, icon: "refresh-outline", onPress: onRetry } : undefined}
      description={description}
      icon={icon}
      iconBackground={Colors.light.dangerSoft}
      iconColor={Colors.light.danger}
      style={style}
      title={title}
      variant={variant}
    />
  );
}
