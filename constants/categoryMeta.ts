import { Colors } from "@/constants/theme";
import type { CategoryMeta } from "@/types/rental";

export const CATEGORY_META: Record<string, CategoryMeta> = {
  Rooms: { icon: "bed-outline", count: "128 stays", accent: "#FF8A5B" },
  Apartments: { icon: "business-outline", count: "94 homes", accent: Colors.light.primary },
  Apartment: { icon: "business-outline", count: "94 homes", accent: Colors.light.primary },
  Vehicles: { icon: "car-sport-outline", count: "72 rides", accent: Colors.light.success },
  Professionals: { icon: "briefcase-outline", count: "56 experts", accent: "#8B5CF6" },
  Shop: { icon: "storefront-outline", count: "41 stores", accent: Colors.light.warning },
  Gadgets: { icon: "phone-portrait-outline", count: "63 items", accent: "#0891B2" },
};

export const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: "apps-outline",
  count: "Browse now",
  accent: Colors.light.primary,
};
