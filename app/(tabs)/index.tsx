import { Ionicons } from "@expo/vector-icons";
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CategoryCard from "../../components/CategoryCard";
import Header from "../../components/Header";
import RoomCard from "../../components/RoomCard";
import { categories, rooms, trendings } from "../../data/mockData";

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <TouchableOpacity activeOpacity={0.8} style={styles.seeAllBtn}>
        <Text style={styles.seeAllText}>See all</Text>
        <Ionicons name="chevron-forward" size={14} color="#3F56A5" />
      </TouchableOpacity>
    </View>
  );
}

export default function HomeScreen() {
  const renderHorizontalRoomCard = ({ item }: { item: any }) => (
    <RoomCard item={item} cardStyle={styles.horizontalRoomCard} />
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Header />

        <View style={styles.section}>
          <SectionHeader eyebrow="Explore" title="Popular categories" />

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CategoryCard item={item} />}
            contentContainerStyle={styles.categoryListContent}
          />
        </View>

        {/* ROOM SECTION */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Nearby" title="Available rooms" />

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={rooms}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHorizontalRoomCard}
            contentContainerStyle={styles.horizontalListContent}
          />
        </View>

        {/* TRENDING SECTION */}
        <View style={styles.section}>
          <SectionHeader eyebrow="Popular" title="Trending now" />

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={trendings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderHorizontalRoomCard}
            contentContainerStyle={styles.horizontalListContent}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },

  scrollContent: {
    paddingBottom: 110,
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionEyebrow: {
    color: "#3F56A5",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 3,
  },

  title: {
    color: "#172033",
    fontSize: 21,
    fontWeight: "900",
  },

  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 3,
  },

  seeAllText: {
    color: "#3F56A5",
    fontSize: 12,
    fontWeight: "900",
  },

  categoryListContent: {
    paddingRight: 16,
  },

  horizontalListContent: {
    paddingRight: 16,
    gap: 16,
  },

  horizontalRoomCard: {
    width: 280,
  },
});
