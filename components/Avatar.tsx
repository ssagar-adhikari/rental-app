import { useMemo, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { Colors, Radius, Typography } from "@/constants/theme";

type AvatarSize = "sm" | "md" | "lg" | "xl" | number;

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
};

const sizeMap: Record<Exclude<AvatarSize, number>, number> = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
};

function getInitials(name: string | null | undefined): string {
  if (!name) {
    return "?";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }

  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

export function Avatar({
  uri,
  name,
  size = "md",
  backgroundColor = Colors.light.surfaceMuted,
  textColor = Colors.light.primary,
  style,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = typeof size === "number" ? size : sizeMap[size];
  const initials = useMemo(() => getInitials(name), [name]);
  const fontSize = Math.max(11, Math.round(dimension * 0.4));
  const containerStyle = {
    backgroundColor,
    borderRadius: dimension / 2,
    height: dimension,
    width: dimension,
  };

  const showImage = !!uri && !imageFailed;

  return (
    <View style={[styles.container, containerStyle, style]}>
      {showImage ? (
        <Image
          accessibilityIgnoresInvertColors
          onError={() => setImageFailed(true)}
          source={{ uri }}
          style={[styles.image, { borderRadius: dimension / 2 }]}
        />
      ) : (
        <Text style={[styles.initials, { color: textColor, fontSize }]} numberOfLines={1}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  initials: {
    ...Typography.label,
    fontWeight: "900",
  },
});
