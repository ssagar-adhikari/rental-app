import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const categories = [
  { id: 1, title: "Room", image: "https://picsum.photos/200/200" },
  { id: 2, title: "Apartment", image: "https://picsum.photos/201/200" },
  { id: 3, title: "Vehicle", image: "https://picsum.photos/202/200" },
  { id: 4, title: "Professional", image: "https://picsum.photos/203/200" }
];

const gifts = [
  {
    id: 1,
    title: "1 BHK Room in Baneshwor",
    price: "NPR 9,999",
    image: "https://picsum.photos/400/300"
  },
  {
    id: 2,
    title: "2 BHK Apartment in Thamel",
    price: "NPR 15,000",
    image: "https://picsum.photos/401/300"
  }
];

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView>

        {/* HEADER */}
        <ImageBackground
          source={{ uri: "https://picsum.photos/600/400" }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Text style={styles.location}>📍 Kathmandu</Text>
            <View style={styles.icons}>
              <Ionicons name="heart-outline" size={22} color="white" />
              <Ionicons name="notifications-outline" size={22} color="white" />
            </View>
          </View>

          <Text style={styles.title}>
            <Text style={{ color: "red" }}>One Nation</Text>, Global Connection
          </Text>

          <Text style={styles.subtitle}>
            A platform that celebrates our heritage and meets every need.
          </Text>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="gray" />
            <TextInput placeholder="Search for anything" />
          </View>
        </ImageBackground>

        {/* CATEGORIES */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Explore by Categories</Text>
            <Text style={styles.link}>Explore all</Text>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.categoryCard}>
                <Image source={{ uri: item.image }} style={styles.categoryImg} />
                <Text style={styles.categoryText}>{item.title}</Text>
              </View>
            )}
          />
        </View>

        {/* GIFTS */}
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Explore Rooms</Text>
            <Text style={styles.link}>Explore all</Text>
          </View>

          {gifts.map((item) => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImg} />
              <View style={{ padding: 10 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.price}>{item.price}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* FLOAT BUTTON */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="create-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },

  header: {
    height: 260,
    padding: 20,
    justifyContent: "flex-end"
  },

  headerTop: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between"
  },

  location: { color: "white", fontSize: 16 },

  icons: {
    flexDirection: "row",
    gap: 15
  },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold"
  },

  subtitle: {
    color: "white",
    marginTop: 5
  },

  searchBox: {
    marginTop: 15,
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 15
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold"
  },

  link: {
    color: "#2563eb"
  },

  categoryCard: {
    marginRight: 15,
    alignItems: "center"
  },

  categoryImg: {
    width: 90,
    height: 90,
    borderRadius: 20
  },

  categoryText: {
    marginTop: 5
  },

  card: {
    backgroundColor: "white",
    borderRadius: 15,
    marginBottom: 15,
    overflow: "hidden"
  },

  cardImg: {
    width: "100%",
    height: 160
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "bold"
  },

  price: {
    color: "#2563eb",
    marginTop: 5
  },

  fab: {
    position: "absolute",
    bottom: 70,
    alignSelf: "center",
    backgroundColor: "#3b5998",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5
  }
});