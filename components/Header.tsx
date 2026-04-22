import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <View>
          <Text style={styles.location}>Kathmandu</Text>
          <Text style={styles.title}>Find your next place</Text>
        </View>

        <View style={styles.iconRow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
            <Ionicons name="heart-outline" size={21} color="white" />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Browse verified rentals, vehicles, services, and essentials near you.
      </Text>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color="#6D7587" />
        <TextInput
          placeholder="Search area, room, apartment..."
          placeholderTextColor="#98A1B3"
          style={styles.searchInput}
        />
        <View style={styles.searchBadge}>
          <Ionicons name="options-outline" size={17} color="#3F56A5" />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Ionicons name="shield-checkmark-outline" size={15} color="#1B9A5A" />
          <Text style={styles.statText}>Verified</Text>
        </View>
        <View style={styles.statPill}>
          <Ionicons name="sparkles-outline" size={15} color="#F59E0B" />
          <Text style={styles.statText}>Fresh listings</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#3F56A5",
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  iconRow: {
    flexDirection: "row",
    gap: 10,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },

  location: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },

  title: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
  },

  subtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: 12,
  },

  search: {
    backgroundColor: "white",
    borderRadius: 16,
    height: 54,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },

  searchInput: {
    flex: 1,
    color: "#172033",
    fontSize: 16,
  },

  searchBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  statText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
});
