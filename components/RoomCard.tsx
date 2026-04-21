import { Image, StyleSheet, Text, View, ViewStyle } from "react-native";

export default function RoomCard({ item, cardStyle }: { item: any; cardStyle?: ViewStyle }) {
  return (
    <View style={[styles.card, cardStyle]}>
      <Image source={{ uri: item.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.location}>{item.location}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: "white",
    borderRadius: 15,
    marginRight: 15,
    overflow: "hidden",
    elevation: 3
  },

  image: {
    width: "100%",
    height: 120
  },

  info: {
    padding: 10
  },

  title: {
    fontWeight: "bold",
    fontSize: 16
  },

  price: {
    color: "#2563eb",
    marginTop: 3
  },

  location: {
    color: "gray",
    marginTop: 3
  }
});