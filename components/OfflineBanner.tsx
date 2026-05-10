import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, Typography } from "@/constants/theme";
import { useIsOffline } from "@/context/NetworkContext";

export function OfflineBanner() {
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();

  if (!offline) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      <Ionicons color="white" name="cloud-offline-outline" size={16} />
      <Text style={styles.text}>You're offline. Some features may be unavailable.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: Colors.light.danger,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    left: 0,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  text: {
    color: "white",
    ...Typography.label,
  },
});
