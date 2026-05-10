import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useCategories } from "@/context/CategoriesContext";
import { useListings } from "@/context/ListingsContext";
import { mapApiListingToRentalListing } from "@/services/listingApi";
import type { ListingSortKey } from "@/utils/listingFilters";
import { filterAndSortListings } from "@/utils/listingFilters";
import { clearRecentSearches, readRecentSearches, rememberRecentSearch } from "@/utils/recentSearches";
import type { ListingType, RentalListing } from "@/types/rental";

const popularSearches = ["Rooms under 15000", "Parking Available", "Near Bus Park", "Furnished Apartment"];
const sortOptions: { label: string; value: ListingSortKey }[] = [
  { label: "Relevant", value: "relevance" },
  { label: "Newest", value: "newest" },
  { label: "Price Low", value: "price_asc" },
  { label: "Price High", value: "price_desc" },
  { label: "Top Rated", value: "rating_desc" },
];

const typeOptions: { label: string; value: ListingType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Homes", value: "physical" },
  { label: "Services", value: "service" },
  { label: "Hybrid", value: "hybrid" },
];
const ratingOptions = [
  { label: "Any Rating", value: null },
  { label: "4.5+", value: 4.5 },
  { label: "4.0+", value: 4 },
  { label: "3.5+", value: 3.5 },
];

export default function SearchScreen() {
  const router = useRouter();
  const { hasMoreListings, listings, loadingMore, loadMoreListings, publicError, refreshListings, refreshing } = useListings();
  const { categories } = useCategories();
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<ListingType | "all">("all");
  const [sortBy, setSortBy] = useState<ListingSortKey>("relevance");
  const [cityFilter, setCityFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState<number | null>(null);
  const parsedMinPrice = Number(minPrice);
  const parsedMaxPrice = Number(maxPrice);
  const filteredListings = useMemo(
    () =>
      filterAndSortListings(listings, {
        query: searchText,
        categoryId: selectedCategoryId,
        listingType: selectedType,
        city: cityFilter,
        minPrice: Number.isFinite(parsedMinPrice) && parsedMinPrice > 0 ? parsedMinPrice : null,
        maxPrice: Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0 ? parsedMaxPrice : null,
        minRating,
        sortBy,
      }).map(mapApiListingToRentalListing),
    [cityFilter, listings, maxPrice, minPrice, minRating, parsedMaxPrice, parsedMinPrice, searchText, selectedCategoryId, selectedType, sortBy],
  );
  const hasFilters = Boolean(
    searchText || selectedCategoryId || selectedType !== "all" || cityFilter || minPrice || maxPrice || minRating || sortBy !== "relevance",
  );
  const featuredListings = hasFilters ? filteredListings : listings.map(mapApiListingToRentalListing);

  useEffect(() => {
    readRecentSearches().then(setRecentSearches);
  }, []);

  async function applySearch(term: string) {
    setSearchText(term);
    const underPriceMatch = term.match(/under\s+(\d+)/i);

    if (underPriceMatch?.[1]) {
      setMaxPrice(underPriceMatch[1]);
    }

    setRecentSearches(await rememberRecentSearch(term));
  }

  async function clearSearchHistory() {
    await clearRecentSearches();
    setRecentSearches([]);
  }

  const handleCategoryPress = (categoryId: number, categoryName: string) => {
    router.push(`/service-list?categoryId=${categoryId}&categoryName=${categoryName}`);
  };

  const handleServicePress = (serviceId: number) => {
    router.push(`/service-detail?serviceId=${serviceId}`);
  };

  const renderFeatured = ({ item }: { item: RentalListing }) => (
    <TouchableOpacity
      accessibilityLabel={`View ${item.title}`}
      accessibilityRole="button"
      activeOpacity={0.9}
      style={styles.featuredCard}
      onPress={() => handleServicePress(item.id)}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.featuredPrice}>{item.price}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={14} color={Colors.light.muted} />
          <Text style={styles.featuredLocation}>{item.location}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen>
      <AppHeader
        eyebrow="Search"
        title="Find faster"
        subtitle="Search listings, explore categories, and revisit your recent rental ideas."
        icon="sparkles-outline"
        searchPlaceholder="Search for rooms, apartments..."
        searchValue={searchText}
        onSearchChange={setSearchText}
        onSearchFocus={() => setIsFocused(true)}
        onSearchBlur={() => {
          setIsFocused(false);
          if (searchText.trim()) {
            rememberRecentSearch(searchText).then(setRecentSearches);
          }
        }}
        searchFocused={isFocused}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={Colors.light.primary} onRefresh={() => refreshListings()} />}
      >
        {publicError ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
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

        <View style={styles.section}>
          <SectionHeader title="Recent Searches" actionLabel={recentSearches.length ? "Clear All" : ""} onActionPress={clearSearchHistory} />
          <View style={styles.wrapList}>
            {(recentSearches.length ? recentSearches : ["Apartment in Kathmandu", "Studio Room", "Luxury Flat"]).map((item) => (
              <TouchableOpacity
                accessibilityLabel={`Search for ${item}`}
                accessibilityRole="button"
                key={item}
                style={styles.recentItem}
                onPress={() => applySearch(item)}
              >
                <Ionicons name="time-outline" size={18} color={Colors.light.muted} />
                <Text style={styles.recentText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Popular Searches" actionLabel="" />
          <View style={styles.wrapList}>
            {popularSearches.map((item) => (
              <TouchableOpacity
                accessibilityLabel={`Search for ${item}`}
                accessibilityRole="button"
                key={item}
                style={styles.popularItem}
                onPress={() => applySearch(item)}
              >
                <Ionicons name="trending-up" size={16} color={Colors.light.primary} />
                <Text style={styles.popularText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Filters" actionLabel={selectedCategoryId || selectedType !== "all" || sortBy !== "relevance" || cityFilter || minPrice || maxPrice || minRating ? "Reset" : ""} onActionPress={() => {
            setSelectedCategoryId(null);
            setSelectedType("all");
            setSortBy("relevance");
            setCityFilter("");
            setMinPrice("");
            setMaxPrice("");
            setMinRating(null);
          }} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {typeOptions.map((option) => {
              const selected = selectedType === option.value;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Filter by type: ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.value}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setSelectedType(option.value)}
                >
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <TouchableOpacity
              accessibilityLabel="All Categories"
              accessibilityRole="button"
              accessibilityState={{ selected: selectedCategoryId === null }}
              style={[styles.filterChip, selectedCategoryId === null && styles.selectedFilterChip]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text style={[styles.filterChipText, selectedCategoryId === null && styles.selectedFilterText]}>All Categories</Text>
            </TouchableOpacity>
            {categories.map((category) => {
              const selected = selectedCategoryId === category.id;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Filter by category: ${category.name}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={category.id}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setSelectedCategoryId(category.id)}
                >
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{category.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {sortOptions.map((option) => {
              const selected = sortBy === option.value;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Sort by ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.value}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setSortBy(option.value)}
                >
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {ratingOptions.map((option) => {
              const selected = minRating === option.value;

              return (
                <TouchableOpacity
                  accessibilityLabel={`Minimum rating: ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.label}
                  style={[styles.filterChip, selected && styles.selectedFilterChip]}
                  onPress={() => setMinRating(option.value)}
                >
                  <Text style={[styles.filterChipText, selected && styles.selectedFilterText]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.filterInputs}>
            <View style={styles.filterInputShell}>
              <Ionicons name="location-outline" size={16} color={Colors.light.muted} />
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

        <View style={styles.section}>
          <SectionHeader title="Browse Categories" actionLabel="" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                accessibilityLabel={`Browse ${category.name}`}
                accessibilityRole="button"
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id, category.name)}
              >
                <View style={styles.categoryImageContainer}>
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Featured Listings" />
          <FlatList
            data={featuredListings}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.featuredListContent}
            renderItem={renderFeatured}
            ListEmptyComponent={
              <View style={styles.inlineEmptyState}>
                <Text style={styles.emptyTitle}>No matches</Text>
                <Text style={styles.emptyText}>Try a different search or reset filters.</Text>
              </View>
            }
          />
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <SectionHeader title={hasFilters ? "Matching Listings" : "Nearby Recommendations"} />
          {featuredListings.slice(0, 5).map((item) => (
            <TouchableOpacity
              accessibilityLabel={`View ${item.title}`}
              accessibilityRole="button"
              key={item.id}
              style={styles.nearbyCard}
              onPress={() => handleServicePress(item.id)}
            >
              <Image source={{ uri: item.image }} style={styles.nearbyImage} />
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.nearbyPrice}>{item.price}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={Colors.light.primary} />
                  <Text style={styles.nearbyLocation}>{item.location}</Text>
                </View>
              </View>
              <TouchableOpacity accessibilityLabel={`Favorite ${item.title}`} accessibilityRole="button" style={styles.heartBtn}>
                <Ionicons name="heart-outline" size={22} color={Colors.light.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          {!featuredListings.length ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={30} color={Colors.light.primary} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptyText}>Try removing filters or searching another area.</Text>
            </View>
          ) : null}
          {hasMoreListings ? (
            <TouchableOpacity
              accessibilityLabel="Load more listings"
              accessibilityRole="button"
              accessibilityState={{ busy: loadingMore }}
              activeOpacity={0.85}
              style={styles.loadMoreButton}
              onPress={loadMoreListings}
            >
              <Text style={styles.loadMoreText}>{loadingMore ? "Loading..." : "Load more listings"}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.label,
  },
  retryButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  retryText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  lastSection: {
    marginBottom: 100,
  },
  wrapList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  recentText: {
    color: Colors.light.muted,
    ...Typography.body,
    fontWeight: "700",
  },
  popularItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: "#DDE4FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: Radius.md,
    gap: 6,
  },
  popularText: {
    color: Colors.light.primary,
    ...Typography.body,
    fontWeight: "800",
  },
  filterRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  selectedFilterChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  selectedFilterText: {
    color: "white",
  },
  filterInputs: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  filterInputShell: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 46,
    paddingHorizontal: Spacing.md,
  },
  filterInput: {
    color: Colors.light.text,
    flex: 1,
    paddingVertical: 0,
    ...Typography.body,
    fontWeight: "700",
  },
  priceInputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  priceInputShell: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: Spacing.md,
  },
  categoriesContainer: {
    paddingRight: Spacing.xl,
    gap: 15,
  },
  categoryCard: {
    alignItems: "center",
    width: 96,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    padding: 10,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryName: {
    color: Colors.light.text,
    ...Typography.label,
    fontWeight: "800",
  },
  featuredListContent: {
    paddingRight: Spacing.xl,
    gap: Spacing.lg,
  },
  featuredCard: {
    width: 200,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  featuredImage: {
    width: "100%",
    height: 120,
  },
  featuredInfo: {
    padding: Spacing.md,
  },
  featuredTitle: {
    color: Colors.light.text,
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  featuredPrice: {
    color: Colors.light.primary,
    marginTop: Spacing.xs,
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  featuredLocation: {
    color: Colors.light.muted,
    ...Typography.eyebrow,
  },
  nearbyCard: {
    flexDirection: "row",
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.card,
  },
  nearbyImage: {
    width: 100,
    height: 100,
  },
  nearbyInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
  },
  nearbyTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  nearbyPrice: {
    color: Colors.light.primary,
    marginTop: Spacing.xs,
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  nearbyLocation: {
    color: Colors.light.muted,
    ...Typography.label,
  },
  heartBtn: {
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  inlineEmptyState: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    width: 240,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.light.text,
    marginTop: Spacing.sm,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  emptyText: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    textAlign: "center",
    ...Typography.label,
  },
  loadMoreButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
  },
  loadMoreText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
});
