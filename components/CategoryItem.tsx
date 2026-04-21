import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function CategoryItem({ item }: any) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => router.push(`/service-list?categoryId=${item.id}&categoryName=${item.name}`)}
    >
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.text} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginBottom: 25
  },

  image: {
    width: 90,
    height: 90,
    borderRadius: 18
  },

  text: {
    marginTop: 6,
    fontSize: 14
  }
});