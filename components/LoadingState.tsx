import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Colors, Spacing, Typography } from "@/constants/theme";

type LoadingStateProps = {
  message?: string;
  variant?: "inline" | "fullscreen";
  size?: "small" | "large";
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingState({
  message,
  variant = "fullscreen",
  size = "large",
  color = Colors.light.primary,
  style,
}: LoadingStateProps) {
  return (
    <View style={[variant === "fullscreen" ? styles.fullscreen : styles.inline, style]}>
      <ActivityIndicator color={color} size={size} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  inline: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  message: {
    color: Colors.light.muted,
    textAlign: "center",
    ...Typography.body,
  },
});
