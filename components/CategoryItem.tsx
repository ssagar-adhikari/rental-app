import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_META, DEFAULT_CATEGORY_META } from "@/constants/categoryMeta";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import type { Category } from "@/types/rental";
import { lightImpactHaptic } from "@/utils/haptics";

export default function CategoryItem({ item }: { item: Category }) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);
  const meta = CATEGORY_META[item.name] ?? DEFAULT_CATEGORY_META;
  const listingCount = item.listing_count;
  const countLabel = typeof listingCount === "number" ? `${listingCount} listings` : meta.count;

  return (
    <TouchableOpacity
      accessibilityHint="Opens this category"
      accessibilityLabel={`${item.name}, ${countLabel}`}
      accessibilityRole="button"
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => {
        lightImpactHaptic();
        router.push(`/service-list?categoryId=${item.id}&categoryName=${item.name}`);
      }}
    >
      {imageFailed ? (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name={meta.icon} size={26} color={Colors.light.primary} />
        </View>
      ) : (
        <ImageBackground source={{ uri: item.image }} style={styles.image} imageStyle={styles.imageRadius} onError={() => setImageFailed(true)}>
          <View style={styles.overlay} />
          <View style={[styles.iconBadge, { backgroundColor: meta.accent }]}>
            <Ionicons name={meta.icon} size={20} color="white" />
          </View>
        </ImageBackground>
      )}

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.arrowBadge}>
            <Ionicons name="chevron-forward" size={14} color={Colors.light.primary} />
          </View>
        </View>
        <Text style={styles.count}>{countLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  image: {
    height: 118,
    justifyContent: "flex-end",
  },
  imageRadius: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.light.overlay,
  },
  imagePlaceholder: {
    alignItems: "center",
    backgroundColor: Colors.light.imagePlaceholder,
    justifyContent: "center",
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    margin: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.light.onPrimarySubtle,
  },
  info: {
    padding: 13,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  arrowBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surfaceMuted,
  },
  count: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    ...Typography.eyebrow,
  },
});
