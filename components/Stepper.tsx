import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Spacing, TouchTarget, Typography } from "@/constants/theme";

type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  step = 1,
  disabled = false,
  accessibilityLabel = "Quantity",
  style,
}: StepperProps) {
  const decDisabled = disabled || value - step < min;
  const incDisabled = disabled || value + step > max;

  function update(next: number) {
    const clamped = Math.min(max, Math.max(min, next));

    if (clamped !== value) {
      onChange(clamped);
    }
  }

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.container, style]}>
      <TouchableOpacity
        accessibilityLabel="Decrease"
        accessibilityRole="button"
        accessibilityState={{ disabled: decDisabled }}
        activeOpacity={0.75}
        disabled={decDisabled}
        hitSlop={6}
        onPress={() => update(value - step)}
        style={[styles.button, decDisabled && styles.buttonDisabled]}
      >
        <Ionicons color={decDisabled ? Colors.light.muted : Colors.light.text} name="remove" size={18} />
      </TouchableOpacity>

      <Text style={styles.value} accessibilityLiveRegion="polite">
        {value}
      </Text>

      <TouchableOpacity
        accessibilityLabel="Increase"
        accessibilityRole="button"
        accessibilityState={{ disabled: incDisabled }}
        activeOpacity={0.75}
        disabled={incDisabled}
        hitSlop={6}
        onPress={() => update(value + step)}
        style={[styles.button, incDisabled && styles.buttonDisabled]}
      >
        <Ionicons color={incDisabled ? Colors.light.muted : Colors.light.text} name="add" size={18} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: Spacing.xs,
  },
  button: {
    alignItems: "center",
    height: TouchTarget.min,
    justifyContent: "center",
    width: TouchTarget.min,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  value: {
    color: Colors.light.text,
    minWidth: 28,
    textAlign: "center",
    ...Typography.bodyStrong,
  },
});
