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
    View
} from "react-native";
import MapView from "react-native-maps/lib/MapView";
import Marker from "react-native-maps/lib/MapMarker";
import { PROVIDER_GOOGLE } from "react-native-maps/lib/ProviderConstants";
import { Colors } from "../constants/theme";
import { rooms } from "../data/mockData";

const { width: screenWidth } = Dimensions.get("window");

const COLORS = Colors.light;

// Mock images for carousel
const serviceImages = [
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1000",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1000",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1000",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1000",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1000",
];

export default function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams();
  const router = useRouter();
  
  // Find the service from mock data
  const service = rooms.find((item) => item.id.toString() === serviceId) || rooms[0];
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Handle scroll to update current index
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
      {/* TINDER-STYLE IMAGE CAROUSEL */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={serviceImages}
          renderItem={renderImage}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIndex(index);
          }}
        />

        <View style={styles.heroShade} />
        
        {/* IMAGE OVERLAY BUTTONS */}
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.favoriteBtn}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#e74c3c" : "white"} 
          />
        </TouchableOpacity>

        {/* PAGINATION DOTS */}
        <View style={styles.pagination}>
          {serviceImages.map((_, index) => {
            const inputRange = [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.8, 1.2, 0.8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.5, 1, 0.5],
              extrapolate: "clamp",
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { transform: [{ scale }], opacity },
                ]}
              />
            );
          })}
        </View>

        {/* IMAGE COUNTER */}
        <View style={styles.imageCounter}>
          <Text style={styles.imageCounterText}>
            {currentIndex + 1} / {serviceImages.length}
          </Text>
        </View>

        <View style={styles.heroDetails}>
          <View style={styles.heroTitleRow}>
            <View style={styles.heroTitleText}>
              <Text style={styles.heroTitle} numberOfLines={2}>{service.title}</Text>
              <View style={styles.heroLocationRow}>
                <Ionicons name="location" size={16} color="rgba(255,255,255,0.86)" />
                <Text style={styles.heroLocationText} numberOfLines={1}>{service.location}</Text>
              </View>
            </View>
            <View style={styles.heroRatingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.heroRatingText}>{service.rating.toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.heroPrice}>{service.price}</Text>

        </View>

      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            This is a beautiful property located in the heart of {service.location}. 
            Perfect for families or professionals looking for a comfortable living space. 
            The property features modern amenities, good ventilation, and is close to 
            public transportation and essential services.
          </Text>
        </View>

        {/* AMENITIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {["WiFi", "Parking", "Kitchen", "AC", "Water", "Electricity"].map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CONTACT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>+977 9800000000</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <Text style={styles.contactText}>contact@example.com</Text>
          </View>
        </View>

        {/* MAP SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location on Map</Text>
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: 27.7172,
                longitude: 85.3240,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              }}
            >
              <Marker
                coordinate={{
                  latitude: 27.7172,
                  longitude: 85.3240,
                }}
                title={service.title}
                description={service.location}
              />
            </MapView>
          </View>
          <Text style={styles.mapAddress}>
            {service.location}, Kathmandu, Nepal
          </Text>
          <TouchableOpacity style={styles.directionsBtn}>
            <Ionicons name="navigate" size={18} color={COLORS.primary} />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* SPACER */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM ACTION BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageBtn}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
          <Text style={styles.messageBtnText}>Message</Text>
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
  carouselContainer: {
    position: "relative",
    backgroundColor: "#111827",
    marginBottom: 0,
  },
  imageSlide: {
    width: screenWidth,
    height: 540,
  },
  sliderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "46%",
    backgroundColor: "rgba(15,23,42,0.38)",
  },
  backBtn: {
    position: "absolute",
    top: 45,
    left: 15,
    backgroundColor: "rgba(17,24,39,0.46)",
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteBtn: {
    position: "absolute",
    top: 45,
    right: 15,
    backgroundColor: "rgba(17,24,39,0.46)",
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pagination: {
    position: "absolute",
    bottom: 156,
    flexDirection: "row",
    alignSelf: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "white",
    marginHorizontal: 4,
  },
  imageCounter: {
    position: "absolute",
    top: 54,
    right: 15,
    backgroundColor: "rgba(17,24,39,0.62)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  heroDetails: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 40,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  heroTitleText: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    color: "white",
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 36,
  },
  heroLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  heroLocationText: {
    flex: 1,
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    fontWeight: "800",
  },
  heroRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroRatingText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  heroPrice: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
  },
  section: {
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
    fontWeight: "500",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "47%",
    backgroundColor: "#F7F9FD",
    borderWidth: 1,
    borderColor: "#EEF1F7",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  amenityText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 8,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F7F9FD",
    borderWidth: 1,
    borderColor: "#EEF1F7",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  contactText: {
    fontSize: 15,
    color: COLORS.text,
    marginLeft: 10,
    fontWeight: "700",
  },
  mapContainer: {
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapAddress: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.muted,
    fontWeight: "600",
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 10,
  },
  directionsBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 15,
    shadowColor: "#22315F",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 12,
    gap: 8,
  },
  messageBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  bookBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
});
