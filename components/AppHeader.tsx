import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SearchBar } from "@/components/SearchBar";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";

type AppHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  searchFocused?: boolean;
};

export function AppHeader({
  eyebrow,
  title,
  subtitle,
  icon = "notifications-outline",
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  searchFocused,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.top}>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.8} style={styles.iconButton}>
          <Ionicons name={icon} size={21} color="white" />
        </TouchableOpacity>
      </View>

      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {searchPlaceholder ? (
        <SearchBar
          value={searchValue}
          onChangeText={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          focused={searchFocused}
          placeholder={searchPlaceholder}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 45,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    gap: Spacing.md,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.lg,
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.72)",
    marginBottom: Spacing.xs,
    ...Typography.label,
  },
  title: {
    color: "white",
    ...Typography.screenTitle,
  },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
    ...Typography.body,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
