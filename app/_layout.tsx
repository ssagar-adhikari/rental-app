import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { ListingsProvider } from "@/context/ListingsContext";
import { LocationProvider } from "@/context/LocationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CategoriesProvider>
        <ListingsProvider>
          <LocationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="service-list" />
              <Stack.Screen name="service-detail" />
              <Stack.Screen name="location-picker" />
              <Stack.Screen name="role-switch" />
              <Stack.Screen name="vendor-dashboard" />
              <Stack.Screen name="vendor-listings" />
              <Stack.Screen name="vendor-listing-form" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="reset-password" />
            </Stack>
          </LocationProvider>
        </ListingsProvider>
      </CategoriesProvider>
    </AuthProvider>
  );
}
