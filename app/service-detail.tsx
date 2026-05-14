import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView from "react-native-maps/lib/MapView";
import Marker from "react-native-maps/lib/MapMarker";
import { PROVIDER_GOOGLE } from "react-native-maps/lib/ProviderConstants";
import { Colors, Radius, Shadows, Spacing, TouchTarget, Typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";
import { useListings } from "../context/ListingsContext";
import { useFavoriteIds, useToggleFavorite } from "../hooks/queries/favorites";
import { getListingImage, mapApiListingToRentalListing } from "../services/listingApi";
import type { ApiListing, IconName, ListingLocation, ListingStatus, ListingType } from "../types/rental";
import { lightImpactHaptic, selectionHaptic } from "../utils/haptics";

const { width: screenWidth } = Dimensions.get("window");
const HERO_HEIGHT = 360;
const COLORS = Colors.light;

const typeLabels: Record<ListingType, string> = {
  physical: "Rental",
  service: "Service",
  hybrid: "Hybrid listing",
};

const statusLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  pending: "Pending review",
  approved: "Approved",
  published: "Published",
  paused: "Paused",
  archived: "Archived",
};

const statusIcons: Record<ListingStatus, IconName> = {
  draft: "document-outline",
  pending: "time-outline",
  approved: "shield-checkmark-outline",
  published: "checkmark-circle-outline",
  paused: "pause-circle-outline",
  archived: "archive-outline",
};

function cleanText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function uniqueItems<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const itemKey = key(item).toLowerCase();

    if (!itemKey || seen.has(itemKey)) {
      return false;
    }

    seen.add(itemKey);
    return true;
  });
}

function locationLabel(location?: ListingLocation | null) {
  if (!location) {
    return "Location not provided";
  }

  return uniqueItems(
    [
      cleanText(location.label),
      cleanText(location.address),
      cleanText(location.city),
      cleanText(location.state),
      cleanText(location.country),
    ].filter(Boolean),
    (item) => item,
  ).join(", ") || "Location not provided";
}

function numericCoordinate(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function listingDescription(listing: ApiListing, location: string) {
  return (
    cleanText(listing.description) ||
    cleanText(listing.summary) ||
    `Details for this ${typeLabels[listing.listing_type].toLowerCase()} in ${location} will be updated soon.`
  );
}

function attributeDisplayValue(attribute: NonNullable<ApiListing["attributes"]>[number]) {
  if (attribute.display_value) {
    return cleanText(attribute.display_value);
  }

  if (typeof attribute.value === "boolean") {
    return attribute.value ? "Yes" : "No";
  }

  return cleanText(attribute.value);
}

function listingDetailItems(listing: ApiListing) {
  const unit = listing.units?.[0];
  const attributeItems =
    listing.attributes
      ?.map((attribute) => {
        const value = attributeDisplayValue(attribute);
        const label = cleanText(attribute.attribute ?? attribute.slug);

        return label && value ? `${label}: ${value}` : value || label;
      })
      .filter(Boolean) ?? [];

  return uniqueItems(
    [
      listing.category?.title ? `${listing.category.title}` : null,
      `${typeLabels[listing.listing_type]}`,
      listing.booking_capacity ? `${listing.booking_capacity} guest capacity` : null,
      unit?.capacity ? `${unit.capacity} unit capacity` : null,
      unit?.quantity ? `${unit.quantity} available` : null,
      ...attributeItems,
    ].filter((item): item is string => Boolean(item)),
    (item) => item,
  ).slice(0, 8);
}

function listingAmenityItems(listing: ApiListing) {
  const attributeAmenities =
    listing.attributes
      ?.map((attribute) => {
        const value = attributeDisplayValue(attribute);
        const label = cleanText(attribute.attribute ?? attribute.slug);

        if (!label) {
          return value;
        }

        if (attribute.value_type === "boolean") {
          return value === "Yes" ? label : "";
        }

        return value ? `${label}: ${value}` : label;
      })
      .filter(Boolean) ?? [];
  const mobileFeatures = Array.isArray(listing.metadata?.mobile_features)
    ? listing.metadata.mobile_features.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  return uniqueItems([...mobileFeatures, ...attributeAmenities], (item) => item).slice(0, 10);
}

function sectionTitleForType(type: ListingType) {
  if (type === "service") {
    return "About this service";
  }

  if (type === "hybrid") {
    return "About this listing";
  }

  return "About this place";
}

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const { listings, loadListing } = useListings();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const selectedId = Number(Array.isArray(serviceId) ? serviceId[0] : serviceId);
  const cachedListing = listings.find((item) => item.id === selectedId);
  const [detailListing, setDetailListing] = useState<ApiListing | null>(cachedListing ?? null);
  const [loadingListing, setLoadingListing] = useState(!cachedListing && Number.isFinite(selectedId) && selectedId > 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const service = detailListing ? mapApiListingToRentalListing(detailListing) : null;
  const serviceImages = useMemo(() => {
    if (!detailListing) {
      return [];
    }

    const mediaUrls = detailListing?.media?.map((item) => item.url).filter((url): url is string => Boolean(url)) ?? [];

    return mediaUrls.length ? mediaUrls : [getListingImage(detailListing)];
  }, [detailListing]);

  const isFavorite = detailListing ? favoriteIds.has(detailListing.id) : false;
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [priceAmount, priceUnit] = (service?.price ?? "").split("/").map((value) => value.trim());
  const ownerName = detailListing?.owner?.name ?? "Listing owner";
  const ownerEmail = cleanText(detailListing?.owner?.email);
  const listingLocation = detailListing?.primary_location ?? detailListing?.locations?.[0];
  const latitude = numericCoordinate(listingLocation?.latitude);
  const longitude = numericCoordinate(listingLocation?.longitude);
  const mapRegion =
    latitude !== null && longitude !== null
      ? {
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }
      : null;
  const displayLocation = locationLabel(listingLocation);
  const description = detailListing ? listingDescription(detailListing, displayLocation) : "";
  const detailItems = detailListing ? listingDetailItems(detailListing) : [];
  const amenityItems = detailListing ? listingAmenityItems(detailListing) : [];
  const statusLabel = detailListing ? statusLabels[detailListing.status] : "";
  const isVerified = detailListing?.status === "approved" || detailListing?.status === "published" || Boolean(detailListing?.approved_at);
  const badgeLabel = detailListing && isVerified ? `${statusLabel} ${typeLabels[detailListing.listing_type].toLowerCase()}` : statusLabel;

  useEffect(() => {
    if (!Number.isFinite(selectedId) || selectedId <= 0) {
      setLoadingListing(false);
      setLoadError("Invalid listing.");
      return;
    }

    let mounted = true;
    setLoadingListing(true);
    setLoadError(null);

    loadListing(selectedId)
      .then((listing) => {
        if (mounted) {
          setDetailListing(listing);
        }
      })
      .catch((exception) => {
        if (mounted) {
          setLoadError(exception instanceof Error ? exception.message : "Unable to load listing.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingListing(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [loadListing, selectedId]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const renderImage = ({ item }: { item: string }) => (
    <View style={styles.imageSlide}>
      {failedImages[item] ? (
        <View style={[styles.sliderImage, styles.heroImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={COLORS.muted} />
        </View>
      ) : (
        <Image source={{ uri: item }} style={styles.sliderImage} onError={() => setFailedImages((current) => ({ ...current, [item]: true }))} />
      )}
    </View>
  );

  if (!service || !detailListing) {
    return (
      <View style={[styles.container, styles.center]}>
        {loadingListing ? (
          <View style={styles.detailSkeletonWrap}>
            <View style={styles.detailHeroSkeleton} />
            <View style={styles.detailLineSkeleton} />
            <View style={[styles.detailLineSkeleton, styles.shortLineSkeleton]} />
          </View>
        ) : (
          <>
            <Ionicons name="alert-circle-outline" size={32} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>Listing unavailable</Text>
            <Text style={styles.emptyText}>{loadError ?? "This listing could not be found."}</Text>
            <TouchableOpacity
              accessibilityLabel="Go back"
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.emptyButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={18} color="white" />
              <Text style={styles.emptyButtonText}>Go Back</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.hero}>
          <Animated.FlatList
            data={serviceImages}
            renderItem={renderImage}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setCurrentIndex(index);
            }}
          />

          <View style={styles.heroActions}>
            <TouchableOpacity
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={styles.circleButton}
              onPress={() => {
                lightImpactHaptic();
                router.back();
              }}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.heroRightActions}>
              <TouchableOpacity accessibilityLabel="Share listing" accessibilityRole="button" style={styles.circleButton} onPress={selectionHaptic}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel={isFavorite ? "Remove from saved listings" : "Save listing"}
                accessibilityRole="button"
                accessibilityState={{ selected: isFavorite }}
                style={styles.circleButton}
                onPress={() => {
                  if (!detailListing) {
                    return;
                  }
                  if (!token) {
                    router.push("/login" as Href);
                    return;
                  }
                  selectionHaptic();
                  toggleFavorite.mutate({ listingId: detailListing.id, currentlyFavorited: isFavorite });
                }}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={21}
                  color={isFavorite ? COLORS.danger : COLORS.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.imageCounter}>
            <Ionicons name="images-outline" size={14} color="white" />
            <Text style={styles.imageCounterText}>
              {currentIndex + 1} / {serviceImages.length}
            </Text>
          </View>

          <View style={styles.pagination}>
            {serviceImages.map((_, index) => {
              const inputRange = [
                (index - 1) * screenWidth,
                index * screenWidth,
                (index + 1) * screenWidth,
              ];
              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.75, 1.25, 0.75],
                extrapolate: "clamp",
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.45, 1, 0.45],
                extrapolate: "clamp",
              });

              return <Animated.View key={index} style={[styles.dot, { opacity, transform: [{ scale }] }]} />;
            })}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.badge}>{badgeLabel}</Text>
              <Text style={styles.title}>{service.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.muted} />
                <Text style={styles.location}>{displayLocation}</Text>
              </View>
            </View>

            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={15} color={COLORS.warning} />
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{priceAmount}</Text>
            <Text style={styles.priceUnit}>{priceUnit ? `/${priceUnit}` : ""}</Text>
          </View>
        </View>

        <View style={styles.factRow}>
          {detailItems.map((feature, index) => (
            <View key={feature} style={styles.factItem}>
              <Ionicons
                name={index === 0 ? "pricetag-outline" : index === 1 ? statusIcons[detailListing.status] : "options-outline"}
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.factText}>{feature}</Text>
            </View>
          ))}
          <View style={styles.factItem}>
            <Ionicons name={statusIcons[detailListing.status]} size={20} color={isVerified ? COLORS.success : COLORS.warning} />
            <Text style={styles.factText}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionTitleForType(detailListing.listing_type)}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {amenityItems.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details and amenities</Text>
            <View style={styles.amenitiesGrid}>
              {amenityItems.map((amenity) => (
                <View key={amenity} style={styles.amenityItem}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listed by</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Ionicons name="person" size={25} color={COLORS.primary} />
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>{ownerName}</Text>
              <Text style={styles.ownerMeta}>
                {isVerified ? "Verified listing owner" : `${typeLabels[detailListing.listing_type]} owner`}
              </Text>
            </View>
            {isVerified ? (
              <View style={styles.ownerBadge}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
            ) : null}
          </View>

          {ownerEmail ? (
            <View style={styles.contactList}>
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{ownerEmail}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.mapAddress}>{displayLocation}</Text>
            </View>
            {mapRegion ? (
              <TouchableOpacity accessibilityLabel="Get directions" accessibilityRole="button" style={styles.directionsBtn} onPress={selectionHaptic}>
                <Ionicons name="navigate" size={17} color={COLORS.primary} />
                <Text style={styles.directionsBtnText}>Directions</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {mapRegion ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
              >
                <Marker
                  coordinate={{
                    latitude: mapRegion.latitude,
                    longitude: mapRegion.longitude,
                  }}
                  title={service.title}
                  description={displayLocation}
                />
              </MapView>
            </View>
          ) : (
            <View style={styles.noMapBox}>
              <Ionicons name="map-outline" size={22} color={COLORS.primary} />
              <Text style={styles.noMapText}>Map coordinates are not available for this listing.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceAmount}>{priceAmount}</Text>
          <Text style={styles.bottomPriceUnit}>{priceUnit ? `/${priceUnit}` : ""}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Message listing owner" accessibilityRole="button" style={styles.messageBtn} onPress={selectionHaptic}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Book this listing" accessibilityRole="button" style={styles.bookBtn} onPress={lightImpactHaptic}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyTitle: {
    color: COLORS.text,
    marginTop: Spacing.md,
    ...Typography.sectionTitle,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: Spacing.sm,
    textAlign: "center",
    ...Typography.body,
  },
  emptyButton: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    minHeight: 46,
    paddingHorizontal: Spacing.lg,
  },
  emptyButtonText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  detailSkeletonWrap: {
    width: "100%",
    gap: Spacing.md,
  },
  detailHeroSkeleton: {
    backgroundColor: COLORS.border,
    borderRadius: Radius.lg,
    height: 220,
    width: "100%",
  },
  detailLineSkeleton: {
    backgroundColor: COLORS.border,
    borderRadius: Radius.pill,
    height: 18,
    width: "86%",
  },
  shortLineSkeleton: {
    width: "56%",
  },
  contentContainer: {
    paddingBottom: 126,
  },
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: "#111827",
  },
  imageSlide: {
    width: screenWidth,
    height: HERO_HEIGHT,
  },
  sliderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroImagePlaceholder: {
    alignItems: "center",
    backgroundColor: COLORS.imagePlaceholder,
    justifyContent: "center",
  },
  heroActions: {
    position: "absolute",
    top: 46,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroRightActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  circleButton: {
    width: TouchTarget.min,
    height: TouchTarget.min,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  imageCounter: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(17,24,39,0.68)",
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  imageCounterText: {
    color: "white",
    ...Typography.label,
  },
  pagination: {
    position: "absolute",
    bottom: Spacing.xl,
    alignSelf: "center",
    flexDirection: "row",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: "white",
    marginHorizontal: 4,
  },
  summaryCard: {
    marginTop: -28,
    marginHorizontal: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Shadows.card,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  badge: {
    alignSelf: "flex-start",
    color: COLORS.success,
    backgroundColor: "#EAF8F1",
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    marginBottom: Spacing.sm,
    ...Typography.eyebrow,
  },
  title: {
    color: COLORS.text,
    ...Typography.sectionTitle,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  location: {
    flex: 1,
    color: COLORS.muted,
    ...Typography.body,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  ratingText: {
    color: COLORS.text,
    ...Typography.label,
    fontWeight: "900",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: Spacing.lg,
  },
  priceAmount: {
    color: COLORS.primary,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
  },
  priceUnit: {
    color: COLORS.muted,
    marginLeft: Spacing.xs,
    ...Typography.bodyStrong,
  },
  factRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },
  factItem: {
    flexGrow: 1,
    minWidth: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: COLORS.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  factText: {
    color: COLORS.text,
    ...Typography.label,
  },
  section: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    color: COLORS.text,
    marginBottom: Spacing.md,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  description: {
    color: COLORS.muted,
    ...Typography.bodyStrong,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  amenityItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#F7F9FD",
    borderWidth: 1,
    borderColor: "#EEF1F7",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  amenityText: {
    color: COLORS.text,
    ...Typography.bodyStrong,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  ownerAvatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceMuted,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    color: COLORS.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  ownerMeta: {
    color: COLORS.muted,
    marginTop: 2,
    ...Typography.label,
  },
  ownerBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.success,
  },
  contactList: {
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#F7F9FD",
    borderWidth: 1,
    borderColor: "#EEF1F7",
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 11,
  },
  contactText: {
    color: COLORS.text,
    ...Typography.bodyStrong,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  mapAddress: {
    color: COLORS.muted,
    ...Typography.label,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    backgroundColor: COLORS.surfaceMuted,
  },
  directionsBtnText: {
    color: COLORS.primary,
    ...Typography.label,
  },
  mapContainer: {
    height: 176,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  noMapBox: {
    alignItems: "center",
    backgroundColor: "#F7F9FD",
    borderColor: "#EEF1F7",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  noMapText: {
    color: COLORS.muted,
    flex: 1,
    ...Typography.label,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomPrice: {
    flex: 1,
    minWidth: 0,
  },
  bottomPriceAmount: {
    color: COLORS.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  bottomPriceUnit: {
    color: COLORS.muted,
    ...Typography.eyebrow,
  },
  messageBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  bookBtn: {
    minWidth: 126,
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  bookBtnText: {
    color: "white",
    ...Typography.cardTitle,
    fontWeight: "900",
  },
});
