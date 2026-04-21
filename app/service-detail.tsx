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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { rooms } from "../data/mockData";

const { width: screenWidth } = Dimensions.get("window");

// Mock images for carousel
const serviceImages = [
  "https://picsum.photos/800/600?random=1",
  "https://picsum.photos/800/600?random=2",
  "https://picsum.photos/800/600?random=3",
  "https://picsum.photos/800/600?random=4",
  "https://picsum.photos/800/600?random=5",
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
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* TITLE & PRICE */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{service.title}</Text>
          <Text style={styles.price}>{service.price}</Text>
        </View>

        {/* LOCATION */}
        <View style={styles.locationRow}>
          <Ionicons name="location" size={18} color="#3F56A5" />
          <Text style={styles.locationText}>{service.location}</Text>
        </View>

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
                <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CONTACT INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={20} color="#3F56A5" />
            <Text style={styles.contactText}>+977 9800000000</Text>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={20} color="#3F56A5" />
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
            <Ionicons name="navigate" size={18} color="#3F56A5" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* SPACER */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTTOM ACTION BUTTON */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageBtn}>
          <Ionicons name="chatbubble-outline" size={20} color="#3F56A5" />
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
    backgroundColor: "#f5f5f5",
  },
  carouselContainer: {
    position: "relative",
  },
  imageSlide: {
    width: screenWidth,
    height: 350,
  },
  sliderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  backBtn: {
    position: "absolute",
    top: 45,
    left: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    padding: 10,
  },
  favoriteBtn: {
    position: "absolute",
    top: 45,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    padding: 10,
  },
  pagination: {
    position: "absolute",
    bottom: 60,
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
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounterText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  price: {
    fontSize: 22,
    fontWeight: "600",
    color: "#3F56A5",
    marginTop: 5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    color: "#7f8c8d",
    marginLeft: 5,
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: "#7f8c8d",
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "45%",
  },
  amenityText: {
    fontSize: 15,
    color: "#2c3e50",
    marginLeft: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  contactText: {
    fontSize: 15,
    color: "#2c3e50",
    marginLeft: 10,
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapAddress: {
    marginTop: 10,
    fontSize: 14,
    color: "#7f8c8d",
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
  },
  directionsBtnText: {
    color: "#3F56A5",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#ecf0f1",
    gap: 15,
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#3F56A5",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  messageBtnText: {
    color: "#3F56A5",
    fontSize: 16,
    fontWeight: "600",
  },
  bookBtn: {
    flex: 1,
    backgroundColor: "#3F56A5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});