import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
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
import { Colors, Radius, Shadows, Spacing, Typography } from "../constants/theme";
import { rooms } from "../data/mockData";

const { width: screenWidth } = Dimensions.get("window");
const HERO_HEIGHT = 360;
const COLORS = Colors.light;

const serviceImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1000",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000",
];

const amenities = [
  { icon: "wifi-outline", label: "WiFi" },
  { icon: "car-outline", label: "Parking" },
  { icon: "restaurant-outline", label: "Kitchen" },
  { icon: "snow-outline", label: "AC" },
  { icon: "water-outline", label: "Water" },
  { icon: "flash-outline", label: "Electricity" },
] as const;

const contactItems = [
  { icon: "call-outline", label: "+977 9800000000" },
  { icon: "mail-outline", label: "contact@example.com" },
] as const;

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  const service = rooms.find((item) => item.id.toString() === serviceId) || rooms[0];

  const [isFavorite, setIsFavorite] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [priceAmount, priceUnit] = service.price.split("/").map((value) => value.trim());

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true }
  );

  const renderImage = ({ item }: { item: string }) => (
    <View style={styles.imageSlide}>
      <Image source={{ uri: item }} style={styles.sliderImage} />
    </View>
  );

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
            <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.heroRightActions}>
              <TouchableOpacity style={styles.circleButton}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} onPress={() => setIsFavorite(!isFavorite)}>
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
              <Text style={styles.badge}>Verified rental</Text>
              <Text style={styles.title}>{service.title}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={COLORS.muted} />
                <Text style={styles.location}>{service.location}, Kathmandu, Nepal</Text>
              </View>
            </View>

            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={15} color={COLORS.warning} />
              <Text style={styles.ratingText}>{service.rating.toFixed(1)}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceAmount}>{priceAmount}</Text>
            <Text style={styles.priceUnit}>/{priceUnit || "month"}</Text>
          </View>
        </View>

        <View style={styles.factRow}>
          {service.features.map((feature, index) => (
            <View key={feature} style={styles.factItem}>
              <Ionicons
                name={index === 0 ? "bed-outline" : index === 1 ? "water-outline" : "resize-outline"}
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.factText}>{feature}</Text>
            </View>
          ))}
          <View style={styles.factItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
            <Text style={styles.factText}>Verified</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this place</Text>
          <Text style={styles.description}>
            A comfortable rental in the heart of {service.location}, ideal for families or professionals.
            The space has practical amenities, natural light, good ventilation, and quick access to
            public transportation and daily essentials.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((amenity) => (
              <View key={amenity.label} style={styles.amenityItem}>
                <Ionicons name={amenity.icon} size={20} color={COLORS.primary} />
                <Text style={styles.amenityText}>{amenity.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listed by</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Ionicons name="person" size={25} color={COLORS.primary} />
            </View>
            <View style={styles.ownerInfo}>
              <Text style={styles.ownerName}>Property Owner</Text>
              <Text style={styles.ownerMeta}>Verified seller · Usually replies fast</Text>
            </View>
            <View style={styles.ownerBadge}>
              <Ionicons name="checkmark" size={16} color="white" />
            </View>
          </View>

          <View style={styles.contactList}>
            {contactItems.map((item) => (
              <View key={item.label} style={styles.contactRow}>
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.mapHeader}>
            <View>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.mapAddress}>{service.location}, Kathmandu, Nepal</Text>
            </View>
            <TouchableOpacity style={styles.directionsBtn}>
              <Ionicons name="navigate" size={17} color={COLORS.primary} />
              <Text style={styles.directionsBtnText}>Directions</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: 27.7172,
                longitude: 85.324,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
            >
              <Marker
                coordinate={{
                  latitude: 27.7172,
                  longitude: 85.324,
                }}
                title={service.title}
                description={service.location}
              />
            </MapView>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceAmount}>{priceAmount}</Text>
          <Text style={styles.bottomPriceUnit}>/{priceUnit || "month"}</Text>
        </View>
        <TouchableOpacity style={styles.messageBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookBtn}>
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
    width: 42,
    height: 42,
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
