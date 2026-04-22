import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { categories } from "@/data/categories";
import { rooms } from "@/data/mockData";
import type { RentalListing } from "@/types/rental";

const recentSearches = ["Apartment in Kathmandu", "Studio Room", "Luxury Flat", "Family House"];
const popularSearches = ["Rooms under 15000", "Parking Available", "Near Bus Park", "Furnished Apartment"];

export default function SearchScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleCategoryPress = (categoryName: string) => {
    router.push(`/service-list?categoryId=1&categoryName=${categoryName}`);
  };

  const handleServicePress = (serviceId: number) => {
    router.push(`/service-detail?serviceId=${serviceId}`);
  };

  const renderFeatured = ({ item }: { item: RentalListing }) => (
    <TouchableOpacity activeOpacity={0.9} style={styles.featuredCard} onPress={() => handleServicePress(item.id)}>
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
        onSearchBlur={() => setIsFocused(false)}
        searchFocused={isFocused}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <SectionHeader title="Recent Searches" actionLabel="Clear All" />
          <View style={styles.wrapList}>
            {recentSearches.map((item) => (
              <TouchableOpacity key={item} style={styles.recentItem} onPress={() => setSearchText(item)}>
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
              <TouchableOpacity key={item} style={styles.popularItem} onPress={() => setSearchText(item)}>
                <Ionicons name="trending-up" size={16} color={Colors.light.primary} />
                <Text style={styles.popularText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Browse Categories" actionLabel="" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard} onPress={() => handleCategoryPress(category.name)}>
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
            data={rooms}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.featuredListContent}
            renderItem={renderFeatured}
          />
        </View>

        <View style={[styles.section, styles.lastSection]}>
          <SectionHeader title="Nearby Recommendations" />
          {rooms.slice(0, 3).map((item) => (
            <TouchableOpacity key={item.id} style={styles.nearbyCard} onPress={() => handleServicePress(item.id)}>
              <Image source={{ uri: item.image }} style={styles.nearbyImage} />
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.nearbyPrice}>{item.price}</Text>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color={Colors.light.primary} />
                  <Text style={styles.nearbyLocation}>{item.location}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.heartBtn}>
                <Ionicons name="heart-outline" size={22} color={Colors.light.danger} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
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
});
