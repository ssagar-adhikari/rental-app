import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import CategoryCard from "@/components/CategoryCard";
import Header from "@/components/Header";
import RoomCard from "@/components/RoomCard";
import { Screen } from "@/components/Screen";
import { SectionHeader } from "@/components/SectionHeader";
import { Spacing } from "@/constants/theme";
import { categories, rooms, trendings } from "@/data/mockData";
import type { RentalListing } from "@/types/rental";

export default function HomeScreen() {
  const renderHorizontalRoomCard = ({ item }: { item: RentalListing }) => (
    <RoomCard item={item} cardStyle={styles.horizontalRoomCard} />
  );

  return (
    <Screen>
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

        <View style={styles.section}>
          <SectionHeader eyebrow="Popular" title="Trending now" actionLabel="" />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 110,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  categoryListContent: {
    paddingRight: Spacing.lg,
  },
  horizontalListContent: {
    paddingRight: Spacing.lg,
    gap: Spacing.lg,
  },
  horizontalRoomCard: {
    width: 280,
  },
});
