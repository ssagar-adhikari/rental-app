/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#3F56A5";
const tintColorDark = "#AFC0FF";

export const Colors = {
  light: {
    primary: tintColorLight,
    primaryDark: "#263E8A",
    background: "#F4F6FB",
    surface: "#FFFFFF",
    surfaceMuted: "#EEF2FF",
    text: "#172033",
    muted: "#6D7587",
    border: "#E5E9F4",
    success: "#1B9A5A",
    green: "#1B9A5A",
    warning: "#F59E0B",
    danger: "#E74C3C",
    shadow: "#22315F",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    primary: tintColorDark,
    primaryDark: "#DDE4FF",
    background: "#151718",
    surface: "#1E2429",
    surfaceMuted: "#28313A",
    text: "#ECEDEE",
    muted: "#A7B0B8",
    border: "#303940",
    success: "#45C486",
    green: "#45C486",
    warning: "#FBBF24",
    danger: "#F87171",
    shadow: "#000000",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 12,
  md: 16,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const Typography = {
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800" as const,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700" as const,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500" as const,
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700" as const,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "800" as const,
  },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900" as const,
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900" as const,
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900" as const,
  },
};

export const Shadows = {
  card: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    shadowColor: "#172554",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 7,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
