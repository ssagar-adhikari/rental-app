import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import CategoryCard from "../../components/CategoryCard";
import Header from "../../components/Header";
import RoomCard from "../../components/RoomCard";
import { categories, rooms, trendings } from "../../data/mockData";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView>

        <Header />

        <View style={styles.section}>
          <Text style={styles.title}>Explore by Categories</Text>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CategoryCard item={item} />}
          />
        </View>

        {/* ROOM SECTION */}
        <View style={styles.section}>
          <Text style={styles.title}>Available Rooms</Text>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RoomCard item={item} />}
          />
        </View>

        {/* TRENDING SECTION */}
        <View style={styles.section}>
          <Text style={styles.title}>Trending</Text>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={trendings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <RoomCard item={item} />}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },

  section: {
    paddingHorizontal: 15,
    marginTop: 20
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10
  }
});