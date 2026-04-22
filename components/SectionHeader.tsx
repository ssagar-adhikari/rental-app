import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors, Spacing, Typography } from "@/constants/theme";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
};

export function SectionHeader({ eyebrow, title, actionLabel = "See all" }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel ? (
        <TouchableOpacity activeOpacity={0.8} style={styles.action}>
          <Text style={styles.actionText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  eyebrow: {
    color: Colors.light.primary,
    marginBottom: 3,
    ...Typography.eyebrow,
  },
  title: {
    color: Colors.light.text,
    ...Typography.sectionTitle,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 3,
  },
  actionText: {
    color: Colors.light.primary,
    ...Typography.eyebrow,
  },
});
