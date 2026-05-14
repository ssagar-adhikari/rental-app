import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useDeleteSavedSearch, useSavedSearches } from "@/hooks/queries/saved-searches";
import type { SavedSearch } from "@/services/savedSearchApi";

function describeFilters(filters: Record<string, unknown>): string {
  const parts: string[] = [];

  if (filters.searchText) parts.push(`"${String(filters.searchText)}"`);
  if (filters.cityFilter) parts.push(String(filters.cityFilter));
  if (filters.selectedType && filters.selectedType !== "all") parts.push(String(filters.selectedType));
  if (filters.minPrice || filters.maxPrice) {
    parts.push(`${filters.minPrice || "0"}–${filters.maxPrice || "∞"}`);
  }
  if (filters.minRating) parts.push(`${filters.minRating}★+`);

  return parts.length ? parts.join(" • ") : "No filters applied";
}

export default function SavedSearchesScreen() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const { data, isPending, error, isRefetching, refetch } = useSavedSearches();
  const deleteSearch = useDeleteSavedSearch();

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
        <AppHeader eyebrow="Account" title="Saved searches" subtitle="Bring back filters you use often." icon="bookmark-outline" />
        <EmptyState
          icon="lock-closed-outline"
          title="Sign in to view saved searches"
          description="Saved searches are tied to your account."
          action={{ label: "Log in", icon: "log-in-outline", onPress: () => router.push("/login" as Href) }}
        />
      </Screen>
    );
  }

  function applySearch(search: SavedSearch) {
    const payload = encodeURIComponent(JSON.stringify(search.filters));
    router.push(`/(tabs)/search?applySearchId=${search.id}&applySearchFilters=${payload}` as Href);
  }

  function confirmDelete(search: SavedSearch) {
    Alert.alert(
      `Delete "${search.name}"?`,
      "You can save a search again later from the filter panel.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteSearch.mutate(search.id) },
      ],
    );
  }

  const searches = data ?? [];

  return (
    <Screen>
      <AppHeader
        eyebrow="Account"
        title="Saved searches"
        subtitle="Tap a row to re-run the search. Long-press to delete."
        icon="bookmark-outline"
      />

      {error && !searches.length ? (
        <ErrorState
          title="Couldn't load saved searches"
          description={error instanceof Error ? error.message : "Something went wrong."}
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <LoadingState message="Loading saved searches..." />
      ) : (
        <FlatList
          contentContainerStyle={searches.length ? styles.list : styles.empty}
          data={searches}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={isRefetching} tintColor={Colors.light.primary} onRefresh={() => refetch()} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              accessibilityLabel={`Apply saved search ${item.name}`}
              accessibilityRole="button"
              activeOpacity={0.88}
              onPress={() => applySearch(item)}
              onLongPress={() => confirmDelete(item)}
              style={styles.row}
            >
              <View style={styles.rowIcon}>
                <Ionicons color={Colors.light.primary} name="bookmark-outline" size={22} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.rowSummary} numberOfLines={1}>{describeFilters(item.filters)}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Delete saved search ${item.name}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => confirmDelete(item)}
                style={styles.deleteButton}
              >
                <Ionicons color={Colors.light.danger} name="trash-outline" size={18} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="bookmark-outline"
              title="No saved searches yet"
              description="Save a search from the filter panel on the Search tab to reuse it later."
              action={{ label: "Open search", icon: "search-outline", onPress: () => router.push("/(tabs)/search" as Href) }}
            />
          }
        />
      )}

      <TouchableOpacity
        accessibilityLabel="Go back"
        accessibilityRole="button"
        activeOpacity={0.88}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Ionicons color={Colors.light.primary} name="arrow-back" size={18} />
      </TouchableOpacity>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 110,
  },
  empty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  rowSummary: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  deleteButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
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
