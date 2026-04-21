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
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, isFocused && styles.searchBoxFocused]}>
          <Ionicons name="search" size={20} color={isFocused ? "#3F56A5" : "gray"} />
          <TextInput 
            placeholder="Search for rooms, apartments..." 
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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
                <Ionicons name="time-outline" size={18} color="#7f8c8d" />
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
                <Ionicons name="trending-up" size={16} color="#3F56A5" />
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
            contentContainerStyle={{ paddingHorizontal: 15 }}
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
                    <Ionicons name="location" size={14} color="#7f8c8d" />
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
                  <Ionicons name="location" size={14} color="#3F56A5" />
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
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#3F56A5",
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    backgroundColor: "#3F56A5",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchBoxFocused: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#2c3e50",
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  clearText: {
    color: "#3F56A5",
    fontSize: 14,
  },
  seeAllText: {
    color: "#3F56A5",
    fontSize: 14,
    fontWeight: "600",
  },
  recentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  recentText: {
    color: "#7f8c8d",
    fontSize: 14,
  },
  popularList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  popularItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f4fd",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  popularText: {
    color: "#3F56A5",
    fontSize: 14,
    fontWeight: "500",
  },
  categoriesContainer: {
    paddingRight: 20,
    gap: 15,
  },
  categoryCard: {
    alignItems: "center",
    width: 80,
  },
  categoryImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    marginBottom: 8,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryName: {
    fontSize: 13,
    color: "#2c3e50",
    fontWeight: "500",
  },
  featuredCard: {
    width: 200,
    backgroundColor: "white",
    borderRadius: 15,
    marginRight: 15,
    overflow: "hidden",
    elevation: 3,
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
    fontWeight: "600",
    color: "#2c3e50",
  },
  featuredPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3F56A5",
    marginTop: 4,
  },
  featuredLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  featuredLocation: {
    fontSize: 12,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  nearbyCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 12,
    overflow: "hidden",
    elevation: 2,
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
    fontWeight: "600",
    color: "#2c3e50",
  },
  nearbyPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3F56A5",
    marginTop: 4,
  },
  nearbyLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  nearbyLocation: {
    fontSize: 13,
    color: "#7f8c8d",
    marginLeft: 4,
  },
  heartBtn: {
    justifyContent: "center",
    paddingHorizontal: 15,
  },
});