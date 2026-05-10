import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_META, DEFAULT_CATEGORY_META } from "@/constants/categoryMeta";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import type { Category } from "@/types/rental";
import { lightImpactHaptic } from "@/utils/haptics";

export default function CategoryCard({ item }: { item: Category }) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);
  const meta = CATEGORY_META[item.title] ?? DEFAULT_CATEGORY_META;
  const listingCount = item.listing_count;
  const countLabel = typeof listingCount === "number" ? `${listingCount} listings` : meta.count;

  return (
    <TouchableOpacity
      accessibilityHint="Opens this category"
      accessibilityLabel={`${item.title}, ${countLabel}`}
      accessibilityRole="button"
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => {
        lightImpactHaptic();
        router.push(`/service-list?categoryId=${item.id}&categoryName=${item.title}`);
      }}
    >
      {imageFailed ? (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name={meta.icon} size={24} color={Colors.light.primary} />
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
        <Text style={styles.text} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.count}>{countLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    marginRight: 14,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  image: {
    height: 96,
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
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    margin: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.light.onPrimarySubtle,
  },
  info: {
    padding: Spacing.md,
  },
  text: {
    color: Colors.light.text,
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  count: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    ...Typography.eyebrow,
    minHeight: 16,
  },
});
