import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import CategoryItem from "../../components/CategoryItem";
import { categories } from "../../data/categories";

export default function CategoryScreen() {
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.location}>📍 Kathmandu</Text>

          <View style={{ flexDirection: "row", gap: 15 }}>
            <Ionicons name="heart-outline" size={22} color="white" />
            <Ionicons name="notifications-outline" size={22} color="white" />
          </View>
        </View>
      </View>
      {/* SEARCH BAR */}
       <View style={styles.search}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput placeholder="Search" style={{ flex: 1 }} />
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </View>
</View>

      {/* TITLE */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.bigTitle}>Categories</Text>
        </View>
      </View>

      {/* CATEGORY GRID */}
      <FlatList
        data={categories}
        numColumns={3}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <CategoryItem item={item} />}
        contentContainerStyle={{ paddingHorizontal: 15, marginTop: 10 }}
      />
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
    paddingBottom: 20,
  },

  headerTop: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  location: {
    color: "white",
    fontSize: 16,
  },
    search: {
    backgroundColor: "#e5e7ee",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginTop: 0,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 15,
    marginTop: 20,
  },

  smallTitle: {
    fontSize: 16,
  },

  bigTitle: {
    fontSize: 26,
    fontWeight: "bold",
  },

  explore: {
    color: "#3F56A5",
  },
});
