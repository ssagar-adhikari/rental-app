import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { getPostAuthRoute } from "@/utils/authRoutes";

export default function EntryScreen() {
  const { activeRole, user, loading } = useAuth();

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </Screen>
    );
  }

  return <Redirect href={user ? getPostAuthRoute(user, activeRole) : "/(tabs)"} />;
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
