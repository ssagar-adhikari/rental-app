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
  rentable_unit_id?: number | null;
  media_type?: "image" | "video" | "file";
  disk?: string | null;
  path?: string | null;
  url?: string | null;
  alt_text?: string | null;
  mime_type?: string | null;
  size_bytes?: number | string | null;
  sort_order?: number | null;
  is_primary?: boolean;
  metadata?: Record<string, unknown> | null;
};

export type ListingLocation = {
  id?: number;
  location_type?: string | null;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  radius_km?: number | string | null;
  delivery_fee?: number | string | null;
  currency?: string | null;
  is_primary?: boolean;
  sort_order?: number | null;
  metadata?: Record<string, unknown> | null;
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
  sort_order?: number | null;
  metadata?: Record<string, unknown> | null;
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
  approved_at?: string | null;
  published_at?: string | null;
  metadata?: Record<string, unknown> | null;
  primary_media?: ListingMedia | null;
  primary_location?: ListingLocation | null;
  units?: ListingUnit[];
  media?: ListingMedia[];
  locations?: ListingLocation[];
  pricing_rules?: ListingPricingRule[];
  availability_rules?: Array<Record<string, unknown>>;
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
  media_urls: string[];
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

export type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled" | (string & {});

export type BookingItem = {
  id: number;
  booking_id?: number;
  rentable_unit_id?: number | null;
  unit?: ListingUnit | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ApiBooking = {
  id: number;
  booking_number: string;
  status: BookingStatus;
  customer_id: number;
  owner_id: number;
  listing_id: number;
  listing?: ApiListing | null;
  start_at?: string | null;
  end_at?: string | null;
  quantity?: number | string | null;
  guest_count?: number | string | null;
  subtotal_amount?: number | string | null;
  deposit_amount?: number | string | null;
  penalty_amount?: number | string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  pricing_snapshot?: Record<string, unknown> | null;
  rules_snapshot?: Record<string, unknown> | null;
  items?: BookingItem[];
  notes?: string | null;
  cancellation_reason?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type BookingStatusCounts = {
  total: number;
  pending: number;
  confirmed: number;
  active: number;
  completed: number;
  cancelled: number;
};
