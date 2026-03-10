import { View, Text, Image, StyleSheet } from "react-native";

export default function CategoryCard({ item }: any) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.text}>{item.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: 15,
    alignItems: "center"
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 20
  },

  text: {
    marginTop: 5
  }
});