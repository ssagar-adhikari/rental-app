import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import RoomCard from "../components/RoomCard";
import { Colors } from "../constants/theme";
import { rooms } from "../data/mockData";
import type { RentalListing } from "../types/rental";

const COLORS = Colors.light;

function ServiceGridCard({ item, onPress }: { item: RentalListing; onPress: () => void }) {
  const [priceAmount, priceUnit] = item.price.split("/").map((value: string) => value.trim());

  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.gridCard} onPress={onPress}>
      <View style={styles.gridImageWrap}>
        <Image source={{ uri: item.image }} style={styles.gridImage} />
        <View style={styles.gridImageShade} />

        <View style={styles.gridRatingBadge}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.gridRatingText}>4.8</Text>
        </View>

        <TouchableOpacity activeOpacity={0.75} style={styles.gridHeartBtn}>
          <Ionicons name="heart-outline" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.gridInfo}>
        <Text style={styles.gridTitle} numberOfLines={1}>
          {item.title}
        </Text>

        <View style={styles.gridLocationRow}>
          <Ionicons name="location-outline" size={13} color={COLORS.muted} />
          <Text style={styles.gridLocation} numberOfLines={1}>
            {item.location}
          </Text>
        </View>

        <View style={styles.gridMetaRow}>
          <View style={styles.gridMetaPill}>
            <Ionicons name="bed-outline" size={12} color={COLORS.primary} />
            <Text style={styles.gridMetaText}>2 Bed</Text>
          </View>
          <View style={styles.gridMetaPill}>
            <Ionicons name="water-outline" size={12} color={COLORS.primary} />
            <Text style={styles.gridMetaText}>2 Bath</Text>
          </View>
        </View>

        <View style={styles.gridFooter}>
          <View style={styles.gridPriceWrap}>
            <Text style={styles.gridPrice} numberOfLines={1}>
              {priceAmount}
            </Text>
            <Text style={styles.gridPriceUnit} numberOfLines={1}>
              /{priceUnit || "month"}
            </Text>
          </View>
          <View style={styles.gridArrowBtn}>
            <Ionicons name="chevron-forward" size={14} color="white" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ServiceListScreen() {
  const { categoryName } = useLocalSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");
  const categoryTitle = Array.isArray(categoryName) ? categoryName[0] : categoryName;

  // Filter services based on category (for now showing all rooms)
  const services = rooms;

  const renderItem = ({ item }: { item: RentalListing }) => {
    if (viewMode === "grid") {
      return (
        <View style={styles.gridItem}>
          <ServiceGridCard item={item} onPress={() => router.push(`/service-detail?serviceId=${item.id}`)} />
        </View>
      );
    }
    return (
      <View style={styles.rowItem}>
        <RoomCard item={item} cardStyle={styles.rowCard} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerEyebrow}>Explore rentals</Text>
            <Text style={styles.title} numberOfLines={1}>{categoryTitle || "Services"}</Text>
          </View>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Ionicons name="options-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            placeholder="Search area, room, apartment..."
            placeholderTextColor="#98A1B3"
            style={styles.searchInput}
          />
          <View style={styles.searchTuneBtn}>
            <Ionicons name="options-outline" size={17} color={COLORS.primary} />
          </View>
        </View>
      </View>

      {/* TOGGLE BUTTONS */}
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.resultCount}>{services.length} places found</Text>
          <Text style={styles.resultHint}>Fresh matches near you</Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons name="grid-outline" size={17} color={viewMode === "grid" ? "white" : COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "row" && styles.toggleBtnActive]}
            onPress={() => setViewMode("row")}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === "row" ? "white" : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SERVICE LIST */}
      <FlatList
        data={services}
        key={`${viewMode}`}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={viewMode === "grid" ? 2 : 1}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
        contentContainerStyle={[
          viewMode === "grid" ? styles.gridContent : styles.listContent,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  headerEyebrow: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  title: {
    color: "white",
    fontSize: 21,
    fontWeight: "800",
  },
  searchContainer: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    shadowColor: "#18254F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  searchTuneBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
  },
  resultCount: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  resultHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#E9EDF8",
    borderRadius: 18,
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    width: 38,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridItem: {
    width: "48%",
  },
  rowItem: {
    marginBottom: 0,
  },
  gridCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  gridImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1.08,
    backgroundColor: "#E7EAF3",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridImageShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "52%",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  gridRatingBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 3,
  },
  gridRatingText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  gridHeartBtn: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(17,24,39,0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  gridInfo: {
    padding: 12,
  },
  gridTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 7,
  },
  gridLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  gridLocation: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "500",
  },
  gridMetaRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  gridMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F5FF",
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  gridMetaText: {
    color: COLORS.primaryDark,
    fontSize: 10,
    fontWeight: "700",
  },
  gridFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  gridPriceWrap: {
    flex: 1,
    minWidth: 0,
  },
  gridPrice: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  gridPriceUnit: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 1,
  },
  gridArrowBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCard: {
    width: "100%",
    marginRight: 0,
  },
});
