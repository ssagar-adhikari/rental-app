import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import RoomCard from "../components/RoomCard";
import { Colors } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useFavoriteIds, useToggleFavorite } from "../hooks/queries/favorites";
import { useListings } from "../context/ListingsContext";
import { mapApiListingToRentalListing } from "../services/listingApi";
import type { ListingSortKey } from "../utils/listingFilters";
import { filterAndSortListings } from "../utils/listingFilters";
import type { ListingType, RentalListing } from "../types/rental";

const COLORS = Colors.light;

const typeOptions: { label: string; value: ListingType | "all"; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: "All", value: "all", icon: "apps-outline" },
  { label: "Physical", value: "physical", icon: "home-outline" },
  { label: "Service", value: "service", icon: "briefcase-outline" },
  { label: "Hybrid", value: "hybrid", icon: "swap-horizontal-outline" },
];

const sortOptions: { label: string; value: ListingSortKey }[] = [
  { label: "Newest", value: "newest" },
  { label: "Relevant", value: "relevance" },
  { label: "Price Low", value: "price_asc" },
  { label: "Price High", value: "price_desc" },
  { label: "Top Rated", value: "rating_desc" },
];

const ratingOptions = [
  { label: "Any Rating", value: null },
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4 },
  { label: "3.5+", value: 3.5 },
];

function ServiceGridCard({
  item,
  isFavorited,
  onPress,
  onToggleFavorite,
}: {
  item: RentalListing;
  isFavorited: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const [priceAmount, priceUnit] = item.price.split("/").map((value: string) => value.trim());
  const firstFeature = item.features[0] ?? "Rental";
  const secondFeature = item.features[1] ?? "Available";

  return (
    <TouchableOpacity
      accessibilityLabel={`View ${item.title}`}
      accessibilityRole="button"
      activeOpacity={0.88}
      style={styles.gridCard}
      onPress={onPress}
    >
      <View style={styles.gridImageWrap}>
        <Image source={{ uri: item.image }} style={styles.gridImage} />
        <View style={styles.gridImageShade} />

        <View style={styles.gridRatingBadge}>
          <Ionicons name="star" size={11} color="#F59E0B" />
          <Text style={styles.gridRatingText}>{item.rating.toFixed(1)}</Text>
        </View>

        <TouchableOpacity
          accessibilityLabel={isFavorited ? `Remove ${item.title} from favorites` : `Save ${item.title} to favorites`}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorited }}
          activeOpacity={0.75}
          style={styles.gridHeartBtn}
          onPress={onToggleFavorite}
        >
          <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={16} color={isFavorited ? COLORS.danger : "white"} />
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
            <Text style={styles.gridMetaText} numberOfLines={1}>{firstFeature}</Text>
          </View>
          <View style={styles.gridMetaPill}>
            <Ionicons name="water-outline" size={12} color={COLORS.primary} />
            <Text style={styles.gridMetaText} numberOfLines={1}>{secondFeature}</Text>
          </View>
        </View>

        <View style={styles.gridFooter}>
          <View style={styles.gridPriceWrap}>
            <Text style={styles.gridPrice} numberOfLines={1}>
              {priceAmount}
            </Text>
            <Text style={styles.gridPriceUnit} numberOfLines={1}>
              {priceUnit ? `/${priceUnit}` : ""}
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
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { hasMoreListings, listings, loading, loadingMore, loadMoreListings, publicError, refreshListings, refreshing } = useListings();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  function onToggleFavorite(listingId: number) {
    if (!token) {
      router.push("/login" as Href);
      return;
    }
    toggleFavorite.mutate({ listingId, currentlyFavorited: favoriteIds.has(listingId) });
  }

  const [viewMode, setViewMode] = useState<"grid" | "row">("grid");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedType, setSelectedType] = useState<ListingType | "all">("all");
  const [sortBy, setSortBy] = useState<ListingSortKey>("newest");
  const [minRating, setMinRating] = useState<number | null>(null);
  const categoryTitle = Array.isArray(categoryName) ? categoryName[0] : categoryName;
  const selectedCategoryId = Number(Array.isArray(categoryId) ? categoryId[0] : categoryId);
  const parsedMinPrice = Number(minPrice);
  const parsedMaxPrice = Number(maxPrice);
  const services = useMemo(
    () =>
      filterAndSortListings(listings, {
        query: searchText,
        categoryId: Number.isFinite(selectedCategoryId) && selectedCategoryId > 0 ? selectedCategoryId : null,
        listingType: selectedType,
        city: cityFilter,
        minPrice: Number.isFinite(parsedMinPrice) && parsedMinPrice > 0 ? parsedMinPrice : null,
        maxPrice: Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null,
        minRating,
        availability: "available",
        sortBy,
      }).map(mapApiListingToRentalListing),
    [cityFilter, listings, minRating, parsedMaxPrice, parsedMinPrice, searchText, selectedCategoryId, selectedType, sortBy],
  );

  function resetFilters() {
    setSearchText("");
    setCityFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedType("all");
    setSortBy("newest");
    setMinRating(null);
  }

  const renderItem = ({ item }: { item: RentalListing }) => {
    if (viewMode === "grid") {
      return (
        <View style={styles.gridItem}>
          <ServiceGridCard
            item={item}
            isFavorited={favoriteIds.has(item.id)}
            onPress={() => router.push(`/service-detail?serviceId=${item.id}`)}
            onToggleFavorite={() => onToggleFavorite(item.id)}
          />
        </View>
      );
    }
    return (
      <View style={styles.rowItem}>
        <RoomCard
          item={item}
          cardStyle={styles.rowCard}
          isFavorited={favoriteIds.has(item.id)}
          onToggleFavorite={() => onToggleFavorite(item.id)}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity accessibilityLabel="Go back" accessibilityRole="button" style={styles.headerIconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerEyebrow}>Explore rentals</Text>
            <Text style={styles.title} numberOfLines={1}>{categoryTitle || "Services"}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Toggle filters"
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersVisible }}
            style={styles.headerIconBtn}
            onPress={() => setFiltersVisible((current) => !current)}
          >
            <Ionicons name="options-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            accessibilityLabel="Search listings"
            placeholder="Search area, room, apartment..."
            placeholderTextColor="#98A1B3"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
          <TouchableOpacity
            accessibilityLabel="Toggle filters"
            accessibilityRole="button"
            accessibilityState={{ expanded: filtersVisible }}
            activeOpacity={0.82}
            style={styles.searchTuneBtn}
            onPress={() => setFiltersVisible((current) => !current)}
          >
            <Ionicons name="options-outline" size={17} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {filtersVisible ? (
        <View style={styles.filterPanel}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Refine results</Text>
            <TouchableOpacity accessibilityLabel="Reset filters" accessibilityRole="button" activeOpacity={0.75} onPress={resetFilters}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={typeOptions}
            horizontal
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
            renderItem={({ item }) => {
              const selected = selectedType === item.value;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Filter by type: ${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  activeOpacity={0.85}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setSelectedType(item.value)}
                >
                  <Ionicons name={item.icon} size={15} color={selected ? "white" : COLORS.primary} />
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />

          <FlatList
            data={sortOptions}
            horizontal
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
            renderItem={({ item }) => {
              const selected = sortBy === item.value;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Sort by ${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  activeOpacity={0.85}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setSortBy(item.value)}
                >
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />

          <FlatList
            data={ratingOptions}
            horizontal
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipRow}
            renderItem={({ item }) => {
              const selected = minRating === item.value;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Minimum rating: ${item.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  activeOpacity={0.85}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setMinRating(item.value)}
                >
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.filterInputs}>
            <View style={styles.filterInputShell}>
              <Ionicons name="location-outline" size={16} color={COLORS.muted} />
              <TextInput accessibilityLabel="City or area" placeholder="City or area" placeholderTextColor="#98A1B3" value={cityFilter} onChangeText={setCityFilter} style={styles.filterInput} />
            </View>
            <View style={styles.priceInputRow}>
              <View style={styles.priceInputShell}>
                <TextInput accessibilityLabel="Minimum price" keyboardType="numeric" placeholder="Min price" placeholderTextColor="#98A1B3" value={minPrice} onChangeText={setMinPrice} style={styles.filterInput} />
              </View>
              <View style={styles.priceInputShell}>
                <TextInput accessibilityLabel="Maximum price" keyboardType="numeric" placeholder="Max price" placeholderTextColor="#98A1B3" value={maxPrice} onChangeText={setMaxPrice} style={styles.filterInput} />
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* TOGGLE BUTTONS */}
      <View style={styles.toolbar}>
        <View>
          <Text style={styles.resultCount}>{services.length} places found</Text>
          <Text style={styles.resultHint}>{searchText || cityFilter ? "Filtered matches near you" : "Fresh matches near you"}</Text>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            accessibilityLabel="Grid view"
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === "grid" }}
            style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons name="grid-outline" size={17} color={viewMode === "grid" ? "white" : COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="List view"
            accessibilityRole="button"
            accessibilityState={{ selected: viewMode === "row" }}
            style={[styles.toggleBtn, viewMode === "row" && styles.toggleBtnActive]}
            onPress={() => setViewMode("row")}
          >
            <Ionicons name="list-outline" size={18} color={viewMode === "row" ? "white" : COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {publicError ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
          <Text style={styles.errorText}>{publicError}</Text>
          <TouchableOpacity
            accessibilityLabel="Retry loading listings"
            accessibilityRole="button"
            activeOpacity={0.8}
            style={styles.retryButton}
            onPress={() => refreshListings()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={COLORS.primary} onRefresh={() => refreshListings()} />}
        onEndReached={hasMoreListings ? loadMoreListings : undefined}
        onEndReachedThreshold={0.35}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : hasMoreListings ? (
            <TouchableOpacity
              accessibilityLabel="Load more listings"
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.loadMoreButton}
              onPress={loadMoreListings}
            >
              <Text style={styles.loadMoreText}>Load more listings</Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={viewMode === "grid" ? styles.gridSkeletonWrap : styles.listSkeletonWrap}>
              {[0, 1, 2, 3].map((item) => (
                <View key={item} style={viewMode === "grid" ? styles.gridSkeleton : styles.rowSkeleton} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="home-outline" size={30} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptyText}>Try another category or search again later.</Text>
            </View>
          )
        }
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
  filterPanel: {
    backgroundColor: COLORS.surface,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  filterHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  resetText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  filterChipRow: {
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceMuted,
    borderColor: "#DDE4FF",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  selectedFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  selectedFilterText: {
    color: "white",
  },
  filterInputs: {
    gap: 10,
  },
  filterInputShell: {
    alignItems: "center",
    backgroundColor: "#FBFCFF",
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },
  filterInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    paddingVertical: 0,
  },
  priceInputRow: {
    flexDirection: "row",
    gap: 10,
  },
  priceInputShell: {
    backgroundColor: "#FBFCFF",
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
  },
  errorText: {
    color: COLORS.danger,
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  retryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  retryText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
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
  footerLoader: {
    paddingVertical: 22,
  },
  loadMoreButton: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    paddingVertical: 13,
  },
  loadMoreText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  gridSkeletonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    padding: 16,
  },
  listSkeletonWrap: {
    gap: 14,
    padding: 16,
  },
  gridSkeleton: {
    backgroundColor: COLORS.border,
    borderRadius: 18,
    height: 230,
    width: "47%",
  },
  rowSkeleton: {
    backgroundColor: COLORS.border,
    borderRadius: 18,
    height: 156,
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
    marginTop: 10,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
});
