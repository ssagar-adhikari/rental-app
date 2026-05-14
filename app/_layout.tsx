import { useEffect } from "react";
import { Stack, router, type Href } from "expo-router";
import { AppState, StyleSheet } from "react-native";
import type { AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { focusManager, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { AuthProvider } from "@/context/AuthContext";
import { BookingsProvider } from "@/context/BookingsContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { ListingsProvider } from "@/context/ListingsContext";
import { LocationProvider } from "@/context/LocationContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { queryClient } from "@/lib/queryClient";
import { configureForegroundHandler, registerPushResponseListener } from "@/utils/pushNotifications";
import { initSentry } from "@/utils/sentry";

initSentry();

function onAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === "active");
}

function resolveDeepLink(data: Record<string, unknown> | undefined): Href | null {
  if (!data) {
    return null;
  }

  if (typeof data.path === "string" && data.path.startsWith("/")) {
    return data.path as Href;
  }

  if (typeof data.listing_id === "number" || typeof data.listing_id === "string") {
    return `/service-detail?id=${data.listing_id}` as Href;
  }

  if (typeof data.booking_id === "number" || typeof data.booking_id === "string") {
    return `/vendor-bookings?id=${data.booking_id}` as Href;
  }

  return null;
}

function usePushTapHandler() {
  useEffect(() => {
    configureForegroundHandler();

    return registerPushResponseListener((data) => {
      const target = resolveDeepLink(data);

      if (target) {
        router.push(target);
      }
    });
  }, []);
}

export default function RootLayout() {
  usePushTapHandler();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <NetworkProvider>
              <AuthProvider>
                <CategoriesProvider>
                  <ListingsProvider>
                    <BookingsProvider>
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
                          <Stack.Screen name="vendor-bookings" />
                          <Stack.Screen name="login" />
                          <Stack.Screen name="register" />
                          <Stack.Screen name="forgot-password" />
                          <Stack.Screen name="reset-password" />
                          <Stack.Screen name="favorites" />
                          <Stack.Screen name="saved-searches" />
                          <Stack.Screen name="book" />
                          <Stack.Screen name="inbox" />
                          <Stack.Screen name="conversations/[id]" />
                          <Stack.Screen name="devices" />
                          <Stack.Screen name="notifications" />
                          <Stack.Screen name="my-bookings" />
                          <Stack.Screen name="listings/[slug]" />
                          <Stack.Screen name="bookings/[number]" />
                          <Stack.Screen name="email/verify/[id]/[hash]" />
                        </Stack>
                        <OfflineBanner />
                      </LocationProvider>
                    </BookingsProvider>
                  </ListingsProvider>
                </CategoriesProvider>
              </AuthProvider>
            </NetworkProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
