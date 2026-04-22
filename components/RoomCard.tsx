import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

export default function RoomCard({ item, cardStyle }: { item: any; cardStyle?: ViewStyle }) {
  const router = useRouter();
  const [priceAmount, priceUnit] = item.price.split("/").map((value: string) => value.trim());

  return (
    <TouchableOpacity 
      style={[styles.card, cardStyle]}
      onPress={() => router.push(`/service-detail?serviceId=${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      
      {/* RATING BADGE */}
      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={12} color="#f39c12" />
          <Text style={styles.ratingText}>4.8</Text>
      </View>

      {/* HEART BUTTON */}
      <TouchableOpacity style={styles.heartBtn} onPress={() => {}}>
        <Ionicons name="heart-outline" size={18} color="white" />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.price} numberOfLines={1}>{priceAmount}</Text>
          <Text style={styles.priceUnit} numberOfLines={1}>/{priceUnit || "month"}</Text>
        </View>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6D7587" />
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
        </View>

        {/* FEATURES */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Ionicons name="bed-outline" size={14} color="#3F56A5" />
            <Text style={styles.featureText}>2 Bed</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="water-outline" size={14} color="#3F56A5" />
            <Text style={styles.featureText}>2 Bath</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="resize-outline" size={14} color="#3F56A5" />
            <Text style={styles.featureText}>1200 sqft</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E9F4",
    elevation: 4,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },

  image: {
    width: "100%",
    height: 150,
  },

  ratingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#172033",
  },

  heartBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(17,24,39,0.42)",
    borderRadius: 20,
    padding: 8,
  },

  info: {
    padding: 14,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#172033",
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 10,
    minWidth: 0,
  },

  price: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "900",
    color: "#3F56A5",
  },

  priceUnit: {
    fontSize: 12,
    color: "#6D7587",
    marginLeft: 4,
    fontWeight: "700",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },

  location: {
    fontSize: 13,
    color: "#6D7587",
    flex: 1,
    fontWeight: "600",
  },

  featuresRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#EEF1F7",
    paddingTop: 12,
    justifyContent: "space-between",
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  featureText: {
    fontSize: 11,
    color: "#6D7587",
    fontWeight: "700",
  },
});
