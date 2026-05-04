import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { LocationProvider } from "@/context/LocationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="service-list" />
          <Stack.Screen name="service-detail" />
          <Stack.Screen name="location-picker" />
          <Stack.Screen name="role-switch" />
          <Stack.Screen name="vendor-dashboard" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
        </Stack>
      </LocationProvider>
    </AuthProvider>
  );
}
