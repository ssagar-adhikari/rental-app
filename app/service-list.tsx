import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import RoomCard from "../components/RoomCard";
import { rooms } from "../data/mockData";

export default function ServiceListScreen() {
  const { categoryId, categoryName } = useLocalSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "row" | "horizontal">("row");

  // Filter services based on category (for now showing all rooms)
  const services = rooms;

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    if (viewMode === "grid") {
      return (
        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => router.push(`/service-detail?serviceId=${item.id}`)}
        >
          <RoomCard item={item} cardStyle={styles.gridCard} />
        </TouchableOpacity>
      );
    }
    if (viewMode === "horizontal") {
      return (
        <TouchableOpacity 
          style={styles.horizontalItem}
          onPress={() => router.push(`/service-detail?serviceId=${item.id}`)}
        >
          <RoomCard item={item} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity 
        onPress={() => router.push(`/service-detail?serviceId=${item.id}`)}
      >
        <RoomCard item={item} cardStyle={styles.rowCard} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{categoryName || "Services"}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* SEARCH BOX */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="gray" />
          <TextInput placeholder="Search services..." style={styles.searchInput} />
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </View>
      </View>

      {/* TOGGLE BUTTONS */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}
          onPress={() => setViewMode("grid")}
        >
          <Ionicons name="grid-outline" size={20} color={viewMode === "grid" ? "white" : "#3F56A5"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "row" && styles.toggleBtnActive]}
          onPress={() => setViewMode("row")}
        >
          <Ionicons name="list-outline" size={20} color={viewMode === "row" ? "white" : "#3F56A5"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === "horizontal" && styles.toggleBtnActive]}
          onPress={() => setViewMode("horizontal")}
        >
          <Ionicons name="swap-horizontal" size={20} color={viewMode === "horizontal" ? "white" : "#3F56A5"} />
        </TouchableOpacity>
      </View>

      {/* SERVICE LIST */}
      <FlatList
        data={services}
        horizontal={viewMode === "horizontal"}
        key={`${viewMode}`}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        numColumns={viewMode === "grid" ? 2 : 1}
        contentContainerStyle={[
          viewMode === "horizontal" ? styles.horizontalContent : 
          viewMode === "grid" ? styles.gridContent : styles.listContent,
        ]}
        showsHorizontalScrollIndicator={viewMode === "horizontal"}
        showsVerticalScrollIndicator={viewMode !== "horizontal"}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },
  searchContainer: {
    backgroundColor: "#e5e7ee",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  toggleBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#3F56A5",
  },
  toggleBtnActive: {
    backgroundColor: "#3F56A5",
  },
  listContent: {
    padding: 15,
  },
  horizontalContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  gridContent: {
    paddingHorizontal: 10,
  },
  gridItem: {
    flex: 1,
    padding: 5,
  },
  horizontalItem: {
    width: 280,
    marginRight: 15,
  },
  gridCard: {
    width: "100%",
  },
  rowCard: {
    width: "100%",
    marginRight: 0,
  },
});