import { getListingFeatures, getListingLocation } from "@/services/listingApi";
import type { ApiListing, ListingType } from "@/types/rental";

export type ListingSortKey = "relevance" | "newest" | "price_asc" | "price_desc" | "rating_desc";

export type ListingAvailabilityFilter = "any" | "available";

export type ListingSearchFilters = {
  query?: string;
  categoryId?: number | null;
  listingType?: ListingType | "all";
  city?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  availability?: ListingAvailabilityFilter;
  sortBy?: ListingSortKey;
};

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .trim();
}

function normalizeNumber(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export function getListingBasePrice(listing: ApiListing) {
  const rule = listing.pricing_rules?.find((item) => item.rule_type === "base") ?? listing.pricing_rules?.[0];

  return normalizeNumber(rule?.price);
}

function getListingRating(listing: ApiListing) {
  return normalizeNumber(listing.rating_average) ?? 0;
}

function getListingTimestamp(listing: ApiListing) {
  const time = new Date(listing.created_at ?? listing.updated_at ?? 0).getTime();

  return Number.isFinite(time) ? time : 0;
}

function listingAttributesText(listing: ApiListing) {
  return (
    listing.attributes
      ?.flatMap((attribute) => [
        attribute.attribute,
        attribute.slug,
        attribute.display_value,
        attribute.value,
      ])
      .filter((value) => value !== null && value !== undefined)
      .join(" ") ?? ""
  );
}

function listingMetadataText(listing: ApiListing) {
  const features = getListingFeatures(listing).join(" ");
  const mobileFeatures = listing.metadata?.mobile_features;

  return Array.isArray(mobileFeatures) ? `${features} ${mobileFeatures.join(" ")}` : features;
}

function listingSearchHaystack(listing: ApiListing) {
  return normalize(
    [
      listing.title,
      listing.summary,
      listing.description,
      listing.category?.title,
      listing.category?.slug,
      listing.listing_type,
      listing.status,
      listing.owner?.name,
      getListingLocation(listing),
      listing.primary_location?.city,
      listing.primary_location?.address,
      listing.locations?.map((location) => `${location.city ?? ""} ${location.address ?? ""}`).join(" "),
      listingAttributesText(listing),
      listingMetadataText(listing),
    ].join(" "),
  );
}

function listingMatchesQuery(listing: ApiListing, query?: string) {
  const terms = normalize(query)
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) {
    return true;
  }

  const haystack = listingSearchHaystack(listing);

  return terms.every((term) => haystack.includes(term));
}

function listingMatchesCity(listing: ApiListing, city?: string) {
  const normalizedCity = normalize(city);

  if (!normalizedCity) {
    return true;
  }

  const locationText = normalize(
    [
      getListingLocation(listing),
      listing.primary_location?.city,
      listing.primary_location?.address,
      listing.locations?.map((location) => `${location.city ?? ""} ${location.address ?? ""}`).join(" "),
    ].join(" "),
  );

  return locationText.includes(normalizedCity);
}

function listingIsAvailable(listing: ApiListing) {
  if (listing.status !== "published" && listing.status !== "approved") {
    return false;
  }

  if (!listing.units?.length) {
    return true;
  }

  return listing.units.some((unit) => unit.status !== "archived" && (unit.quantity ?? 1) > 0);
}

function listingMatchesPrice(listing: ApiListing, minPrice?: number | null, maxPrice?: number | null) {
  const price = getListingBasePrice(listing);

  if (price === null) {
    return !minPrice && !maxPrice;
  }

  if (typeof minPrice === "number" && price < minPrice) {
    return false;
  }

  if (typeof maxPrice === "number" && price > maxPrice) {
    return false;
  }

  return true;
}

function relevanceScore(listing: ApiListing, query?: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return 0;
  }

  const title = normalize(listing.title);
  const category = normalize(listing.category?.title);
  const location = normalize(getListingLocation(listing));
  const haystack = listingSearchHaystack(listing);
  let score = 0;

  if (title === normalizedQuery) {
    score += 100;
  }

  if (title.startsWith(normalizedQuery)) {
    score += 60;
  }

  if (title.includes(normalizedQuery)) {
    score += 40;
  }

  if (category.includes(normalizedQuery)) {
    score += 25;
  }

  if (location.includes(normalizedQuery)) {
    score += 20;
  }

  score += normalizedQuery
    .split(/\s+/)
    .filter((term) => haystack.includes(term))
    .length;

  return score;
}

function compareNumbers(a: number | null, b: number | null, direction: "asc" | "desc") {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return direction === "asc" ? a - b : b - a;
}

export function filterAndSortListings(listings: ApiListing[], filters: ListingSearchFilters) {
  const sortBy = filters.sortBy ?? (filters.query ? "relevance" : "newest");

  return listings
    .filter((listing) => {
      if (filters.categoryId && listing.category?.id !== filters.categoryId) {
        return false;
      }

      if (filters.listingType && filters.listingType !== "all" && listing.listing_type !== filters.listingType) {
        return false;
      }

      if (!listingMatchesQuery(listing, filters.query)) {
        return false;
      }

      if (!listingMatchesCity(listing, filters.city)) {
        return false;
      }

      if (!listingMatchesPrice(listing, filters.minPrice, filters.maxPrice)) {
        return false;
      }

      if (typeof filters.minRating === "number" && getListingRating(listing) < filters.minRating) {
        return false;
      }

      if (filters.availability === "available" && !listingIsAvailable(listing)) {
        return false;
      }

      return true;
    })
    .sort((left, right) => {
      if (sortBy === "price_asc") {
        return compareNumbers(getListingBasePrice(left), getListingBasePrice(right), "asc");
      }

      if (sortBy === "price_desc") {
        return compareNumbers(getListingBasePrice(left), getListingBasePrice(right), "desc");
      }

      if (sortBy === "rating_desc") {
        return getListingRating(right) - getListingRating(left);
      }

      if (sortBy === "relevance") {
        const scoreDifference = relevanceScore(right, filters.query) - relevanceScore(left, filters.query);

        return scoreDifference || getListingTimestamp(right) - getListingTimestamp(left);
      }

      return getListingTimestamp(right) - getListingTimestamp(left);
    });
}

export function hasActiveListingFilters(filters: ListingSearchFilters) {
  return Boolean(
    normalize(filters.query) ||
      filters.categoryId ||
      (filters.listingType && filters.listingType !== "all") ||
      normalize(filters.city) ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minRating ||
      filters.availability === "available" ||
      (filters.sortBy && filters.sortBy !== "newest" && filters.sortBy !== "relevance"),
  );
}
