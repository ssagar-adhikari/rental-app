import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "@/constants/theme";

type RatingStarsProps = {
  rating: number;
  count?: number | null;
  size?: number;
  color?: string;
  emptyColor?: string;
  showValue?: boolean;
  style?: StyleProp<ViewStyle>;
};

const MAX_STARS = 5;

export function RatingStars({
  rating,
  count,
  size = 16,
  color = "#F5A623",
  emptyColor = Colors.light.border,
  showValue = false,
  style,
}: RatingStarsProps) {
  const clamped = Math.max(0, Math.min(MAX_STARS, Number.isFinite(rating) ? rating : 0));

  return (
    <View accessibilityLabel={`Rated ${clamped.toFixed(1)} out of ${MAX_STARS}`} style={[styles.row, style]}>
      <View style={styles.stars}>
        {Array.from({ length: MAX_STARS }).map((_, index) => {
          const filled = clamped - index;
          const iconName: keyof typeof Ionicons.glyphMap =
            filled >= 1 ? "star" : filled >= 0.5 ? "star-half" : "star-outline";

          return (
            <Ionicons
              color={filled > 0 ? color : emptyColor}
              key={index}
              name={iconName}
              size={size}
            />
          );
        })}
      </View>
      {showValue ? <Text style={styles.value}>{clamped.toFixed(1)}</Text> : null}
      {typeof count === "number" ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  value: {
    color: Colors.light.text,
    ...Typography.label,
    fontWeight: "900",
  },
  count: {
    color: Colors.light.muted,
    ...Typography.label,
  },
});
