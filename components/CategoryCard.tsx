import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_META, DEFAULT_CATEGORY_META } from "@/constants/categoryMeta";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import type { Category } from "@/types/rental";

export default function CategoryCard({ item }: { item: Category }) {
  const router = useRouter();
  const meta = CATEGORY_META[item.title] ?? DEFAULT_CATEGORY_META;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push(`/service-list?categoryId=${item.id}&categoryName=${item.title}`)}
    >
      <ImageBackground source={{ uri: item.image }} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.overlay} />
        <View style={[styles.iconBadge, { backgroundColor: meta.accent }]}>
          <Ionicons name={meta.icon} size={20} color="white" />
        </View>
      </ImageBackground>
      <View style={styles.info}>
        <Text style={styles.text} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.count}>{meta.count}</Text>
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
    backgroundColor: "rgba(15,23,42,0.18)",
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    margin: Spacing.md,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.75)",
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
  },
});
