import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type Category = {
  id: number;
  name: string;
  title: string;
  image: string;
};

export type RentalListing = {
  id: number;
  title: string;
  price: string;
  location: string;
  image: string;
  rating: number;
  features: string[];
};

export type CategoryMeta = {
  icon: IconName;
  count: string;
  accent: string;
};
