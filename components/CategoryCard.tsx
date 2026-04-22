import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;

const CATEGORY_META: Record<string, { icon: IconName; count: string; accent: string }> = {
  Rooms: { icon: "bed-outline", count: "128 stays", accent: "#FF8A5B" },
  Apartments: { icon: "business-outline", count: "94 homes", accent: "#3F56A5" },
  Vehicles: { icon: "car-sport-outline", count: "72 rides", accent: "#1B9A5A" },
  Professionals: { icon: "briefcase-outline", count: "56 experts", accent: "#8B5CF6" },
};

export default function CategoryCard({ item }: any) {
  const router = useRouter();
  const meta = CATEGORY_META[item.title] || {
    icon: "apps-outline" as IconName,
    count: "Browse",
    accent: "#3F56A5",
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/service-list?categoryId=${item.id}&categoryName=${item.title}`)}
      activeOpacity={0.9}
    >
      <ImageBackground source={{ uri: item.image }} style={styles.image} imageStyle={styles.imageRadius}>
        <View style={styles.overlay} />
        <View style={[styles.iconBadge, { backgroundColor: meta.accent }]}>
          <Ionicons name={meta.icon} size={20} color="white" />
        </View>
      </ImageBackground>
      <View style={styles.info}>
        <Text style={styles.text} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.count}>{meta.count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 148,
    marginRight: 14,
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E9F4",
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  image: {
    height: 96,
    justifyContent: "flex-end",
  },

  imageRadius: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.18)",
  },

  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.75)",
  },

  info: {
    padding: 12,
  },

  text: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "900",
  },

  count: {
    color: "#6D7587",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
});
