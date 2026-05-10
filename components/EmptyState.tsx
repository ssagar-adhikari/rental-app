import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";

type EmptyStateAction = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBackground?: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  variant?: "inline" | "fullscreen";
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  icon = "file-tray-outline",
  iconColor = Colors.light.primary,
  iconBackground = Colors.light.surfaceMuted,
  title,
  description,
  action,
  variant = "fullscreen",
  style,
}: EmptyStateProps) {
  return (
    <View style={[variant === "fullscreen" ? styles.fullscreen : styles.inline, style]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBackground }]}>
        <Ionicons color={iconColor} name={icon} size={32} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {action ? (
        <TouchableOpacity
          accessibilityLabel={action.label}
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={action.onPress}
          style={styles.actionButton}
        >
          {action.icon ? <Ionicons color="white" name={action.icon} size={18} /> : null}
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  inline: {
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: Radius.pill,
    height: 72,
    justifyContent: "center",
    width: 72,
  },
  title: {
    color: Colors.light.text,
    textAlign: "center",
    ...Typography.cardTitle,
  },
  description: {
    color: Colors.light.muted,
    maxWidth: 320,
    textAlign: "center",
    ...Typography.body,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.pill,
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  actionText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
});
