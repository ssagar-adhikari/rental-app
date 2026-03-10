import { View, Text, StyleSheet, ImageBackground, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header() {
  return (
    <ImageBackground
      source={{ uri: "https://picsum.photos/600/400" }}
      style={styles.header}
    >
      <View style={styles.top}>
        <Text style={styles.location}>📍 Kathmandu</Text>

        <View style={{ flexDirection: "row", gap: 15 }}>
          <Ionicons name="heart-outline" size={22} color="white" />
          <Ionicons name="notifications-outline" size={22} color="white" />
        </View>
      </View>

      <Text style={styles.title}>
        <Text style={{ color: "red" }}>One Nation</Text>, Global Connection
      </Text>

      <Text style={styles.subtitle}>
        A platform that celebrates our heritage.
      </Text>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput placeholder="Search for anything" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 250,
    padding: 20,
    justifyContent: "flex-end"
  },

  top: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between"
  },

  location: { color: "white", fontSize: 16 },

  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold"
  },

  subtitle: {
    color: "white",
    marginTop: 5
  },

  search: {
    marginTop: 10,
    backgroundColor: "white",
    borderRadius: 30,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  }
});