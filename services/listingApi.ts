import { apiRequest } from "@/services/authApi";
import type { ApiCategoryAttribute, ApiListing, BillingUnit, ListingFormValues, ListingStatus, RentalListing } from "@/types/rental";

export type PaginatedListings = {
  data: ApiListing[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  links?: {
    next?: string | null;
    prev?: string | null;
  };
};

type ListingPayload = {
  category_id: number;
  title: string;
  summary?: string;
  description?: string;
  listing_type: ListingFormValues["listing_type"];
  status?: "draft" | "pending";
  currency: string;
  booking_capacity: number;
  metadata: {
    mobile_features: string[];
  };
  attributes?: Array<{
    category_attribute_id: number;
    value: string | number | boolean;
  }>;
  units?: Array<Record<string, unknown>>;
  media?: Array<Record<string, unknown>>;
  locations?: Array<Record<string, unknown>>;
  pricing_rules?: Array<Record<string, unknown>>;
  availability_rules?: Array<Record<string, unknown>>;
};

export type ListingQueryParams = {
  q?: string;
  category_id?: number | null;
  listing_type?: ListingFormValues["listing_type"] | "all";
  city?: string;
  page?: number;
  per_page?: number;
};

const fallbackImage = "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200";

function cleanText(value: string) {
  return value.trim();
}

function positiveNumber(value: string, fallback = 1) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function splitFeatures(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function listingMediaUrls(values: ListingFormValues) {
  const urls = values.media_urls?.length ? values.media_urls : values.image_url ? [values.image_url] : [];
  const uniqueUrls = new Set<string>();

  urls.forEach((url) => {
    const cleanUrl = cleanText(url);

    if (cleanUrl) {
      uniqueUrls.add(cleanUrl);
    }
  });

  return Array.from(uniqueUrls).slice(0, 8);
}

function buildListingQuery(params: ListingQueryParams = {}) {
  const query = Object.entries(params)
    .flatMap(([key, value]) => {
      if (value === undefined || value === null || value === "" || value === "all") {
        return [];
      }

      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");

  return query ? `?${query}` : "";
}

function castAttributeValue(attribute: ApiCategoryAttribute | undefined, value: string) {
  const trimmedValue = value.trim();

  if (attribute?.value_type === "integer") {
    return Number.parseInt(trimmedValue, 10);
  }

  if (attribute?.value_type === "float") {
    return Number.parseFloat(trimmedValue);
  }

  if (attribute?.value_type === "boolean") {
    return trimmedValue === "true" || trimmedValue === "1" || trimmedValue.toLowerCase() === "yes";
  }

  return trimmedValue;
}

function buildPayload(values: ListingFormValues, status?: "draft" | "pending", categoryAttributes: ApiCategoryAttribute[] = []): ListingPayload {
  const title = cleanText(values.title);
  const currency = cleanText(values.currency || "NPR").toUpperCase().slice(0, 3) || "NPR";
  const bookingCapacity = Math.round(positiveNumber(values.booking_capacity));
  const availableQuantity = Math.round(positiveNumber(values.available_quantity));
  const price = positiveNumber(values.price, 0);
  const features = splitFeatures(values.features);
  const mediaUrls = listingMediaUrls(values);
  const city = cleanText(values.city);
  const address = cleanText(values.address);
  const billingUnit: BillingUnit = values.billing_unit;
  const isService = values.listing_type === "service";
  const attributes = Object.entries(values.attribute_values)
    .map(([attributeId, value]) => {
      const definition = categoryAttributes.find((attribute) => attribute.id === Number(attributeId));
      const castValue = castAttributeValue(definition, value);

      return {
        category_attribute_id: Number(attributeId),
        value: castValue,
      };
    })
    .filter((attribute) => {
      if (typeof attribute.value === "number") {
        return Number.isFinite(attribute.value);
      }

      return typeof attribute.value === "boolean" || String(attribute.value).trim().length > 0;
    });

  const payload: ListingPayload = {
    category_id: values.category_id,
    title,
    summary: cleanText(values.summary),
    description: cleanText(values.description),
    listing_type: values.listing_type,
    currency,
    booking_capacity: bookingCapacity,
    metadata: {
      mobile_features: features,
    },
    attributes,
    media: mediaUrls.map((url, index) => ({
      media_type: "image",
      url,
      alt_text: title,
      is_primary: index === 0,
      sort_order: index,
    })),
    locations:
      city || address
        ? [
            {
              location_type: isService ? "service_radius" : "exact",
              label: city || address,
              address,
              city,
              country: "Nepal",
              radius_km: isService ? 10 : null,
              is_primary: true,
              sort_order: 0,
            },
          ]
        : [],
    pricing_rules: [
      {
        rule_type: "base",
        billing_unit: billingUnit,
        price,
        currency,
        is_stackable: true,
        is_active: true,
        priority: 100,
      },
    ],
    availability_rules: [
      {
        strategy: "quantity",
        is_available: true,
        available_quantity: availableQuantity,
        timezone: "Asia/Kathmandu",
        is_active: true,
        priority: 100,
      },
    ],
  };

  if (status) {
    payload.status = status;
  }

  if (!isService) {
    payload.units = [
      {
        name: title,
        unit_type: values.listing_type,
        status: "active",
        quantity: availableQuantity,
        capacity: bookingCapacity,
        sort_order: 0,
      },
    ];
  } else {
    payload.units = [];
  }

  return payload;
}

export function getListingImage(listing: ApiListing) {
  return listing.primary_media?.url ?? listing.media?.find((item) => item.url)?.url ?? fallbackImage;
}

export function getListingLocation(listing: ApiListing) {
  const location = listing.primary_location ?? listing.locations?.[0];
  const city = location?.city?.trim();
  const address = location?.address?.trim();

  return city || address || "Nepal";
}

export function getListingPrice(listing: ApiListing) {
  const rule = listing.pricing_rules?.find((item) => item.rule_type === "base") ?? listing.pricing_rules?.[0];
  const price = Number(rule?.price);
  const currency = rule?.currency ?? listing.currency ?? "NPR";
  const unit = rule?.billing_unit ?? "monthly";

  if (!Number.isFinite(price) || price <= 0) {
    return "Price on request";
  }

  return `${currency} ${Math.round(price).toLocaleString()} / ${unit}`;
}

export function getListingFeatures(listing: ApiListing) {
  const mobileFeatures = listing.metadata?.mobile_features;

  if (Array.isArray(mobileFeatures)) {
    return mobileFeatures.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 3);
  }

  const unit = listing.units?.[0];
  const features = [
    listing.category?.title,
    unit?.capacity ? `${unit.capacity} capacity` : null,
    listing.booking_capacity ? `${listing.booking_capacity} guests` : null,
  ].filter((item): item is string => Boolean(item));

  return features.length ? features.slice(0, 3) : [listing.listing_type, listing.status];
}

export function mapApiListingToRentalListing(listing: ApiListing): RentalListing {
  return {
    id: listing.id,
    title: listing.title,
    price: getListingPrice(listing),
    location: getListingLocation(listing),
    image: getListingImage(listing),
    rating: Number(listing.rating_average ?? 0),
    features: getListingFeatures(listing),
  };
}

export function listingToFormValues(listing?: ApiListing): ListingFormValues {
  const pricing = listing?.pricing_rules?.find((item) => item.rule_type === "base") ?? listing?.pricing_rules?.[0];
  const location = listing?.primary_location ?? listing?.locations?.[0];
  const quantity = listing?.units?.[0]?.quantity ?? 1;
  const features = listing ? getListingFeatures(listing).join(", ") : "";
  const attributeValues =
    listing?.attributes?.reduce<Record<number, string>>((values, attribute) => {
      if (attribute.value !== null && attribute.value !== undefined) {
        values[attribute.category_attribute_id] = String(attribute.value);
      }

      return values;
    }, {}) ?? {};
  const mediaUrls =
    listing?.media
      ?.filter((item) => item.media_type === "image" && item.url)
      .sort((first, second) => Number(first.sort_order ?? 0) - Number(second.sort_order ?? 0))
      .map((item) => item.url as string) ?? [];
  const primaryImageUrl = listing?.primary_media?.url ?? listing?.media?.find((item) => item.url)?.url ?? "";
  const imageUrls = mediaUrls.length ? mediaUrls : primaryImageUrl ? [primaryImageUrl] : [];

  return {
    category_id: listing?.category?.id ?? 2,
    title: listing?.title ?? "",
    summary: listing?.summary ?? "",
    description: listing?.description ?? "",
    listing_type: listing?.listing_type ?? "physical",
    currency: listing?.currency ?? pricing?.currency ?? "NPR",
    booking_capacity: String(listing?.booking_capacity ?? listing?.units?.[0]?.capacity ?? 1),
    available_quantity: String(quantity),
    price: pricing?.price ? String(pricing.price) : "",
    billing_unit: pricing?.billing_unit ?? "monthly",
    image_url: imageUrls[0] ?? "",
    media_urls: imageUrls,
    city: location?.city ?? "",
    address: location?.address ?? "",
    features,
    attribute_values: attributeValues,
  };
}

export const listingApi = {
  publicListings(params: ListingQueryParams = {}) {
    return apiRequest<PaginatedListings>(`/listings${buildListingQuery({ per_page: 20, ...params })}`);
  },

  show(id: number, token?: string | null) {
    return apiRequest<ApiListing>(`/listings/${id}`, { token });
  },

  showBySlug(slug: string, token?: string | null) {
    return apiRequest<ApiListing>(`/listings/by-slug/${encodeURIComponent(slug)}`, { token });
  },

  vendorListings(token: string, params: ListingQueryParams = {}) {
    return apiRequest<PaginatedListings>(`/vendor/listings${buildListingQuery({ per_page: 20, ...params })}`, { token });
  },

  create(values: ListingFormValues, status: "draft" | "pending", token: string, categoryAttributes: ApiCategoryAttribute[] = []) {
    return apiRequest<ApiListing>("/vendor/listings", {
      method: "POST",
      body: buildPayload(values, status, categoryAttributes),
      token,
    });
  },

  update(id: number, values: ListingFormValues, token: string, categoryAttributes: ApiCategoryAttribute[] = []) {
    return apiRequest<ApiListing>(`/vendor/listings/${id}`, {
      method: "PATCH",
      body: buildPayload(values, undefined, categoryAttributes),
      token,
    });
  },

  transition(id: number, status: ListingStatus, token: string) {
    return apiRequest<ApiListing>(`/vendor/listings/${id}/status`, {
      method: "POST",
      body: { status },
      token,
    });
  },

  availability(id: number, body: AvailabilityCheckBody) {
    return apiRequest<AvailabilityResult>(`/listings/${id}/availability`, {
      method: "POST",
      body,
    });
  },

  quote(id: number, body: QuoteRequestBody) {
    return apiRequest<QuoteResult>(`/listings/${id}/quote`, {
      method: "POST",
      body,
    });
  },
};

export type AvailabilityCheckBody = {
  start_at: string;
  end_at: string;
  rentable_unit_id?: number | null;
  quantity?: number;
  guest_count?: number;
};

export type AvailabilityResult = {
  available: boolean;
  reason?: string | null;
  requested_quantity?: number;
  reserved_quantity?: number;
  remaining_quantity?: number;
  capacity?: number;
};

export type QuoteRequestBody = AvailabilityCheckBody & {
  context?: Record<string, unknown>;
};

export type QuoteLine = {
  pricing_rule_id: number;
  label: string;
  rule_type: string;
  billing_unit: string | null;
  amount: number;
};

export type QuoteResult = {
  currency: string;
  duration_minutes: number;
  quantity: number;
  guest_count: number;
  subtotal_amount: number;
  total_amount: number;
  lines: QuoteLine[];
};
