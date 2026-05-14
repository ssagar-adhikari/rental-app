import { useRouter, type Href } from "expo-router";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CategoryCard from "@/components/CategoryCard";
import Header from "@/components/Header";
import RoomCard from "@/components/RoomCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/context/CategoriesContext";
import { useListings } from "@/context/ListingsContext";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/queries/favorites";
import type { RentalListing } from "@/types/rental";

export default function HomeScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { loading, publicError, refreshListings, refreshing, rentalListings } = useListings();
  const { categories, loading: categoriesLoading, refreshCategories } = useCategories();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const trendingListings = [...rentalListings].sort((a, b) => b.rating - a.rating);
  const showListingSkeleton = loading && !rentalListings.length;
  const showCategorySkeleton = categoriesLoading && !categories.length;

  function onToggleFavorite(listingId: number) {
    if (!token) {
      router.push("/login" as Href);
      return;
    }
    toggleFavorite.mutate({ listingId, currentlyFavorited: favoriteIds.has(listingId) });
  }

  const renderHorizontalRoomCard = ({ item }: { item: RentalListing }) => (
    <RoomCard
      item={item}
      cardStyle={styles.horizontalRoomCard}
      isFavorited={favoriteIds.has(item.id)}
      onToggleFavorite={() => onToggleFavorite(item.id)}
    />
  );

  async function refreshHome() {
    await Promise.all([refreshListings(), refreshCategories()]);
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing || categoriesLoading} tintColor={Colors.light.primary} onRefresh={refreshHome} />}
      >
        <Header />

        {publicError ? (
          <View style={styles.errorBox}>
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
          <SectionHeader eyebrow="Explore" title="Popular categories" />
          {showCategorySkeleton ? (
            <View style={styles.skeletonRow}>
              {[0, 1, 2].map((item) => <View key={item} style={styles.categorySkeleton} />)}
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <CategoryCard item={item} />}
              contentContainerStyle={styles.categoryListContent}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader eyebrow="Nearby" title="Available rooms" />
          {showListingSkeleton ? (
            <View style={styles.skeletonRow}>
              {[0, 1].map((item) => <View key={item} style={styles.roomSkeleton} />)}
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={rentalListings}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHorizontalRoomCard}
              contentContainerStyle={styles.horizontalListContent}
            />
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader eyebrow="Popular" title="Trending now" actionLabel="" />
          {showListingSkeleton ? (
            <View style={styles.skeletonRow}>
              {[0, 1].map((item) => <View key={item} style={styles.roomSkeleton} />)}
            </View>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={trendingListings}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderHorizontalRoomCard}
              contentContainerStyle={styles.horizontalListContent}
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  categoryListContent: {
    paddingRight: Spacing.lg,
  },
  horizontalListContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.lg,
  },
  horizontalRoomCard: {
    width: 280,
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FAD4D4",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
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
  skeletonRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  categorySkeleton: {
    backgroundColor: Colors.light.border,
    borderRadius: Radius.lg,
    height: 132,
    width: 126,
  },
  roomSkeleton: {
    backgroundColor: Colors.light.border,
    borderRadius: Radius.lg,
    height: 230,
    width: 280,
  },
});
