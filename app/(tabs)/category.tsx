import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { categories } from "../../data/categories";

type Category = (typeof categories)[number];
type IconName = keyof typeof Ionicons.glyphMap;

const COLORS = {
  primary: "#3F56A5",
  background: "#F4F6FB",
  surface: "#FFFFFF",
  text: "#172033",
  muted: "#6D7587",
  border: "#E5E9F4",
  green: "#1B9A5A",
};

const CATEGORY_META: Record<string, { icon: IconName; count: string; accent: string }> = {
  Rooms: { icon: "bed-outline", count: "128 stays", accent: "#FF8A5B" },
  Apartment: { icon: "business-outline", count: "94 homes", accent: "#3F56A5" },
  Vehicles: { icon: "car-sport-outline", count: "72 rides", accent: "#1B9A5A" },
  Professionals: { icon: "briefcase-outline", count: "56 experts", accent: "#8B5CF6" },
  Shop: { icon: "storefront-outline", count: "41 stores", accent: "#F59E0B" },
  Gadgets: { icon: "phone-portrait-outline", count: "63 items", accent: "#0891B2" },
};

export default function CategoryScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const filteredCategories = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter((item) => item.name.toLowerCase().includes(query));
  }, [searchText]);

  const renderCategory = ({ item }: { item: Category }) => {
    const meta = CATEGORY_META[item.name] || {
      icon: "apps-outline" as IconName,
      count: "Browse now",
      accent: COLORS.primary,
    };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.categoryCard}
        onPress={() => router.push(`/service-list?categoryId=${item.id}&categoryName=${item.name}`)}
      >
        <ImageBackground source={{ uri: item.image }} style={styles.categoryImage} imageStyle={styles.categoryImageRadius}>
          <View style={styles.categoryOverlay} />
          <View style={[styles.iconBadge, { backgroundColor: meta.accent }]}>
            <Ionicons name={meta.icon} size={20} color="white" />
          </View>
        </ImageBackground>

        <View style={styles.categoryInfo}>
          <View style={styles.categoryTitleRow}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.arrowBadge}>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </View>
          </View>
          <Text style={styles.categoryCount}>{meta.count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.locationLabel}>Kathmandu</Text>
            <Text style={styles.headerTitle}>Find what you need</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.headerIconBtn}>
            <Ionicons name="notifications-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          Browse rentals, services, vehicles, and everyday essentials from one place.
        </Text>

        {/* SEARCH BAR */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search categories..."
            placeholderTextColor="#98A1B3"
            style={styles.searchInput}
          />
          <View style={styles.searchIconBadge}>
            <Ionicons name="options-outline" size={17} color={COLORS.primary} />
          </View>
        </View>
      </View>

      {/* CATEGORY GRID */}
      <FlatList
        data={filteredCategories}
        numColumns={2}
        key="category-grid"
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCategory}
        columnWrapperStyle={styles.categoryRow}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.statsRow}>
              <View style={styles.statPill}>
                <Ionicons name="sparkles-outline" size={16} color={COLORS.green} />
                <Text style={styles.statText}>{categories.length} categories</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.primary} />
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
            <Ionicons name="search-outline" size={30} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No category found</Text>
            <Text style={styles.emptyText}>Try a different keyword.</Text>
          </View>
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
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  locationLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },

  headerTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
  },

  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerSubtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
    marginTop: 12,
  },


  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    marginTop: 20,
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    marginLeft: 10,
  },

  searchIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 110,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },

  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  statText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 3,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
  },

  sectionCount: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },

  categoryRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  categoryCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },

  categoryImage: {
    height: 118,
    justifyContent: "flex-end",
  },

  categoryImageRadius: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,23,42,0.18)",
  },

  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    margin: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.75)",
  },

  categoryInfo: {
    padding: 13,
  },

  categoryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  categoryTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },

  arrowBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
  },

  categoryCount: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 42,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },
});
