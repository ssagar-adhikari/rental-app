import { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Edge } from "react-native-safe-area-context";
import { Colors } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, edges = ["left", "right", "bottom"], style }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
});
