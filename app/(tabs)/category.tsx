import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import CategoryItem from "@/components/CategoryItem";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { categories } from "@/data/categories";
import type { Category } from "@/types/rental";

export default function CategoryScreen() {
  const [searchText, setSearchText] = useState("");

  const filteredCategories = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return query ? categories.filter((item) => item.name.toLowerCase().includes(query)) : categories;
  }, [searchText]);

  return (
    <Screen>
      <AppHeader
        eyebrow="Kathmandu"
        title="Find what you need"
        subtitle="Browse rentals, services, vehicles, and everyday essentials from one place."
        searchPlaceholder="Search categories..."
        searchValue={searchText}
        onSearchChange={setSearchText}
      />

      <FlatList
        data={filteredCategories}
        numColumns={2}
        key="category-grid"
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }: { item: Category }) => <CategoryItem item={item} />}
        columnWrapperStyle={styles.categoryRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Ionicons name="sparkles-outline" size={16} color={Colors.light.success} />
                <Text style={styles.statText}>{categories.length} categories</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="shield-checkmark-outline" size={16} color={Colors.light.primary} />
                <Text style={styles.statText}>Verified listings</Text>
              </View>
            </View>

            <View style={styles.sectionTitleRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Explore</Text>
                <Text style={styles.sectionTitle}>Popular categories</Text>
              </View>
              <Text style={styles.sectionCount}>{filteredCategories.length} shown</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={30} color={Colors.light.primary} />
            <Text style={styles.emptyTitle}>No category found</Text>
            <Text style={styles.emptyText}>Try a different keyword.</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 18,
    paddingBottom: 110,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 22,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  statText: {
    color: Colors.light.text,
    ...Typography.eyebrow,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionEyebrow: {
    color: Colors.light.primary,
    marginBottom: 3,
    ...Typography.eyebrow,
  },
  sectionTitle: {
    color: Colors.light.text,
    ...Typography.sectionTitle,
  },
  sectionCount: {
    color: Colors.light.muted,
    marginBottom: 3,
    ...Typography.eyebrow,
  },
  categoryRow: {
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 42,
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
    ...Typography.label,
  },
});
