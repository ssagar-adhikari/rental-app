import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type Category = {
  id: number;
  parent_id?: number | null;
  name: string;
  title: string;
  slug?: string;
  description?: string | null;
  image: string;
  listing_type?: ListingType;
  listing_count?: number;
  children?: Category[];
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

export type ListingType = "physical" | "service" | "hybrid";

export type ListingStatus = "draft" | "pending" | "approved" | "published" | "paused" | "archived";

export type BillingUnit = "minute" | "hourly" | "daily" | "weekly" | "monthly" | "custom" | "person";

export type VendorListingCategory = {
  id: number;
  title: string;
  listingType: ListingType;
  attributes: ApiCategoryAttribute[];
};

export type ApiCategoryAttribute = {
  id: number;
  attribute: string;
  slug: string;
  value_type: "string" | "float" | "integer" | "boolean";
  unit?: string | null;
  options?: string[] | null;
  is_required: boolean;
  is_filterable: boolean;
};

export type ApiCategory = {
  id: number;
  parent_id: number | null;
  title: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  status: boolean;
  is_navbar: boolean;
  is_parent: boolean;
  listing_type: ListingType;
  listing_count?: number;
  attributes?: ApiCategoryAttribute[];
  children?: ApiCategory[];
};

export type ListingOwner = {
  id: number;
  name: string;
  email: string;
};

export type ListingCategory = {
  id: number;
  title: string;
  slug: string;
};

export type ListingMedia = {
  id?: number;
  media_type?: "image" | "video" | "file";
  url?: string | null;
  alt_text?: string | null;
  is_primary?: boolean;
};

export type ListingLocation = {
  id?: number;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_km?: number | string | null;
};

export type ListingUnit = {
  id?: number;
  name: string;
  code?: string | null;
  description?: string | null;
  unit_type?: ListingType | null;
  status?: "active" | "maintenance" | "paused" | "archived";
  quantity?: number;
  capacity?: number;
};

export type ListingPricingRule = {
  id?: number;
  rule_type?: string;
  billing_unit?: BillingUnit;
  price?: number | string;
  currency?: string | null;
};

export type ApiListing = {
  id: number;
  owner?: ListingOwner;
  category?: ListingCategory | null;
  title: string;
  slug?: string | null;
  summary?: string | null;
  description?: string | null;
  listing_type: ListingType;
  status: ListingStatus;
  currency?: string | null;
  booking_capacity?: number | null;
  rating_average?: number | string | null;
  rating_count?: number | null;
  metadata?: Record<string, unknown> | null;
  primary_media?: ListingMedia | null;
  primary_location?: ListingLocation | null;
  units?: ListingUnit[];
  media?: ListingMedia[];
  locations?: ListingLocation[];
  pricing_rules?: ListingPricingRule[];
  attributes?: Array<{
    id?: number;
    category_attribute_id: number;
    attribute?: string | null;
    slug?: string | null;
    value_type?: ApiCategoryAttribute["value_type"] | null;
    value?: string | number | boolean | null;
    display_value?: string | null;
  }>;
  created_at?: string;
  updated_at?: string;
};

export type ListingFormValues = {
  category_id: number;
  title: string;
  summary: string;
  description: string;
  listing_type: ListingType;
  currency: string;
  booking_capacity: string;
  available_quantity: string;
  price: string;
  billing_unit: BillingUnit;
  image_url: string;
  city: string;
  address: string;
  features: string;
  attribute_values: Record<number, string>;
};

export type CategoryMeta = {
  icon: IconName;
  count: string;
  accent: string;
};
