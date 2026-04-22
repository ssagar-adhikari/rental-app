import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";

type SearchBarProps = TextInputProps & {
  focused?: boolean;
};

export function SearchBar({ focused, style, ...props }: SearchBarProps) {
  return (
    <View style={[styles.container, focused && styles.focused]}>
      <Ionicons name="search" size={20} color={focused ? Colors.light.primary : Colors.light.muted} />
      <TextInput
        placeholderTextColor="#98A1B3"
        style={[styles.input, style]}
        {...props}
      />
      <View style={styles.badge}>
        <Ionicons name="options-outline" size={17} color={Colors.light.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    ...Shadows.header,
  },
  focused: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  input: {
    flex: 1,
    color: Colors.light.text,
    ...Typography.bodyStrong,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceMuted,
  },
});
