import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useMemo } from "react";
import { FlatList, RefreshControl, StyleSheet, TouchableOpacity } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import RoomCard from "@/components/RoomCard";
import { Screen } from "@/components/Screen";
import { Colors, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useFavoriteIds, useFavorites, useToggleFavorite } from "@/hooks/queries/favorites";
import { mapApiListingToRentalListing } from "@/services/listingApi";
import type { RentalListing } from "@/types/rental";

export default function FavoritesScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { data, error, isPending, isRefetching, refetch } = useFavorites();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const listings = useMemo<RentalListing[]>(
    () => (data?.data ?? []).map(mapApiListingToRentalListing),
    [data],
  );

  if (authLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (!token) {
    return (
      <Screen>
        <AppHeader eyebrow="Account" title="Favorites" subtitle="Save listings to come back to them later." icon="heart-outline" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view favorites"
          description="Favorites are tied to your account. Log in to save and revisit listings across devices."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.push("/login" as Href) }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        eyebrow="Account"
        title="Favorites"
        subtitle="Listings you've saved. Tap the heart on any card to remove."
        icon="heart-outline"
      />

      {error && !listings.length ? (
        <ErrorState
          title="Unable to load favorites"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <LoadingState message="Loading your favorites..." />
      ) : (
        <FlatList
          contentContainerStyle={listings.length ? styles.list : styles.empty}
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={isRefetching} tintColor={Colors.light.primary} onRefresh={() => refetch()} />}
          renderItem={({ item }) => (
            <RoomCard
              item={item}
              cardStyle={styles.card}
              isFavorited={favoriteIds.has(item.id)}
              onToggleFavorite={() =>
                toggleFavorite.mutate({ listingId: item.id, currentlyFavorited: favoriteIds.has(item.id) })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No favorites yet"
              description="Tap the heart on any listing to save it here for quick access."
              action={{
                label: "Browse listings",
                icon: "search-outline",
                onPress: () => router.push("/(tabs)" as Href),
              }}
            />
          }
        />
      )}

      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        activeOpacity={0.88}
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={18} color={Colors.light.primary} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 110,
  },
  empty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    width: "100%",
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    left: Spacing.xl,
    position: "absolute",
    top: Spacing.xl,
    width: 44,
  },
});
