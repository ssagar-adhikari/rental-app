import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import type { RentalListing } from "@/types/rental";

type RoomCardProps = {
  item: RentalListing;
  cardStyle?: StyleProp<ViewStyle>;
};

const featureIcons = ["bed-outline", "water-outline", "resize-outline"] as const;

export default function RoomCard({ item, cardStyle }: RoomCardProps) {
  const router = useRouter();
  const [priceAmount, priceUnit] = item.price.split("/").map((value) => value.trim());

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, cardStyle]}
      onPress={() => router.push(`/service-detail?serviceId=${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={12} color={Colors.light.warning} />
        <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.8} style={styles.heartBtn} onPress={() => {}}>
        <Ionicons name="heart-outline" size={18} color="white" />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price} numberOfLines={1}>
            {priceAmount}
          </Text>
          <Text style={styles.priceUnit} numberOfLines={1}>
            /{priceUnit || "month"}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.light.muted} />
          <Text style={styles.location} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.featuresRow}>
          {item.features.slice(0, 3).map((feature, index) => (
            <View key={feature} style={styles.featureItem}>
              <Ionicons name={featureIcons[index] ?? "checkmark-circle-outline"} size={14} color={Colors.light.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  image: {
    width: "100%",
    height: 150,
    backgroundColor: Colors.light.border,
  },
  ratingBadge: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    gap: Spacing.xs,
  },
  ratingText: {
    color: Colors.light.text,
    ...Typography.eyebrow,
  },
  heartBtn: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: "rgba(17,24,39,0.42)",
    borderRadius: Radius.pill,
    padding: Spacing.sm,
  },
  info: {
    padding: 14,
  },
  title: {
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
    minWidth: 0,
  },
  price: {
    flexShrink: 1,
    color: Colors.light.primary,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
  },
  priceUnit: {
    color: Colors.light.muted,
    marginLeft: Spacing.xs,
    ...Typography.eyebrow,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: 6,
  },
  location: {
    flex: 1,
    color: Colors.light.muted,
    ...Typography.label,
  },
  featuresRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEF1F7",
    paddingTop: Spacing.md,
    justifyContent: "space-between",
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  featureText: {
    color: Colors.light.muted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
});
