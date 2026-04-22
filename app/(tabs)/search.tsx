import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { categories } from "../../data/categories";
import { rooms } from "../../data/mockData";

const recentSearches = ["Apartment in Kathmandu", "Studio Room", "Luxury Flat", "Family House"];
const popularSearches = ["Rooms under 15000", "Parking Available", "Near Bus Park", "Furnished Apartment"];

const COLORS = {
  primary: "#3F56A5",
  background: "#F4F6FB",
  surface: "#FFFFFF",
  text: "#172033",
  muted: "#6D7587",
  border: "#E5E9F4",
  green: "#1B9A5A",
};

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

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.locationLabel}>Search</Text>
            <Text style={styles.headerTitle}>Find faster</Text>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.headerIconBtn}>
            <Ionicons name="sparkles-outline" size={21} color="white" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          Search listings, explore categories, and revisit your recent rental ideas.
        </Text>

        {/* SEARCH BAR */}
        <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
          <Ionicons name="search" size={20} color={isFocused ? COLORS.primary : COLORS.muted} />
          <TextInput 
            placeholder="Search for rooms, apartments..." 
            placeholderTextColor="#98A1B3"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* RECENT SEARCHES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentList}>
            {recentSearches.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.recentItem}
                onPress={() => setSearchText(item)}
              >
                <Ionicons name="time-outline" size={18} color={COLORS.muted} />
                <Text style={styles.recentText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* POPULAR SEARCHES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.popularList}>
            {popularSearches.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.popularItem}
                onPress={() => setSearchText(item)}
              >
                <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                <Text style={styles.popularText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.name)}
              >
                <View style={styles.categoryImageContainer}>
                  <Image 
                    source={{ uri: category.image }} 
                    style={styles.categoryImage}
                  />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* FEATURED LISTINGS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Listings</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={rooms}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.featuredListContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.featuredCard}
                onPress={() => handleServicePress(item.id)}
              >
                <Image source={{ uri: item.image }} style={styles.featuredImage} />
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.featuredPrice}>{item.price}</Text>
                  <View style={styles.featuredLocationRow}>
                    <Ionicons name="location" size={14} color={COLORS.muted} />
                    <Text style={styles.featuredLocation}>{item.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* NEARBY RECOMMENDATIONS */}
        <View style={[styles.section, { marginBottom: 100 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Recommendations</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {rooms.slice(0, 3).map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.nearbyCard}
              onPress={() => handleServicePress(item.id)}
            >
              <Image source={{ uri: item.image }} style={styles.nearbyImage} />
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.nearbyPrice}>{item.price}</Text>
                <View style={styles.nearbyLocationRow}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                  <Text style={styles.nearbyLocation}>{item.location}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.heartBtn}>
                <Ionicons name="heart-outline" size={22} color="#e74c3c" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  searchBoxFocused: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: COLORS.text,
  },
  clearText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "900",
  },
  recentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  recentText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  popularList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  popularItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#DDE4FF",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  popularText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  categoriesContainer: {
    paddingRight: 20,
    gap: 15,
  },
  categoryCard: {
    alignItems: "center",
    width: 96,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 10,
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 8,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "800",
  },
  featuredListContent: {
    paddingRight: 20,
    gap: 16,
  },
  featuredCard: {
    width: 200,
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
  featuredImage: {
    width: "100%",
    height: 120,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 4,
  },
  featuredLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  featuredLocation: {
    fontSize: 12,
    color: COLORS.muted,
    marginLeft: 4,
    fontWeight: "700",
  },
  nearbyCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  nearbyImage: {
    width: 100,
    height: 100,
  },
  nearbyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.text,
  },
  nearbyPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 4,
  },
  nearbyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  nearbyLocation: {
    fontSize: 13,
    color: COLORS.muted,
    marginLeft: 4,
    fontWeight: "700",
  },
  heartBtn: {
    justifyContent: "center",
    paddingHorizontal: 15,
  },
});
