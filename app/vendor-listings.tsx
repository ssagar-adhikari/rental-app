import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { Screen } from "@/components/Screen";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useListings } from "@/context/ListingsContext";
import { getListingImage, getListingLocation, getListingPrice } from "@/services/listingApi";
import type { ApiListing, ListingStatus } from "@/types/rental";

const statusTone: Record<ListingStatus, { background: string; color: string; label: string }> = {
  draft: { background: "#EEF2FF", color: Colors.light.primary, label: "Draft" },
  pending: { background: "#FEF3C7", color: "#B45309", label: "Pending" },
  approved: { background: "#DCFCE7", color: Colors.light.success, label: "Approved" },
  published: { background: "#DCFCE7", color: Colors.light.success, label: "Published" },
  paused: { background: "#F3F4F6", color: Colors.light.muted, label: "Paused" },
  archived: { background: "#FEE2E2", color: Colors.light.danger, label: "Archived" },
};

function VendorListingCard({
  item,
  busy,
  onArchive,
  onSubmit,
}: {
  item: ApiListing;
  busy: boolean;
  onArchive: (listing: ApiListing) => void;
  onSubmit: (listing: ApiListing) => void;
}) {
  const tone = statusTone[item.status];
  const canSubmit = item.status === "draft" || item.status === "paused";
  const canArchive = item.status !== "archived";

  return (
    <View style={styles.listingCard}>
      <Image source={{ uri: getListingImage(item) }} style={styles.listingImage} />

      <View style={styles.listingBody}>
        <View style={styles.listingTopRow}>
          <View style={styles.listingTitleBlock}>
            <Text style={styles.listingTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.listingMeta} numberOfLines={1}>
              {item.category?.title ?? "Listing"} - {getListingLocation(item)}
            </Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
            <Text style={[styles.statusText, { color: tone.color }]}>{tone.label}</Text>
          </View>
        </View>

        <Text style={styles.priceText}>{getListingPrice(item)}</Text>
        <Text style={styles.summaryText} numberOfLines={2}>
          {item.summary || item.description || "No description added yet."}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.secondaryButton}
            onPress={() => router.push(`/vendor-listing-form?id=${item.id}` as Href)}
          >
            <Ionicons name="create-outline" size={16} color={Colors.light.primary} />
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>

          {canSubmit ? (
            <TouchableOpacity activeOpacity={0.85} disabled={busy} style={styles.secondaryButton} onPress={() => onSubmit(item)}>
              <Ionicons name="send-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.secondaryButtonText}>Submit</Text>
            </TouchableOpacity>
          ) : null}

          {canArchive ? (
            <TouchableOpacity activeOpacity={0.85} disabled={busy} style={styles.dangerButton} onPress={() => onArchive(item)}>
              <Ionicons name="trash-outline" size={16} color={Colors.light.danger} />
              <Text style={styles.dangerButtonText}>{busy ? "..." : "Delete"}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function VendorListingsScreen() {
  const { loading, user } = useAuth();
  const { refreshVendorListings, transitionListing, vendorError, vendorListings, vendorLoading } = useListings();
  const [busyId, setBusyId] = useState<number | null>(null);
  const activeListings = vendorListings.filter((listing) => listing.status !== "archived");

  useEffect(() => {
    refreshVendorListings();
  }, [refreshVendorListings]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!user.roles.includes("vendor")) {
    return <Redirect href="/(tabs)/profile" />;
  }

  async function changeStatus(listing: ApiListing, status: ListingStatus) {
    setBusyId(listing.id);

    try {
      await transitionListing(listing.id, status);
    } catch (exception) {
      Alert.alert("Listing update failed", exception instanceof Error ? exception.message : "Unable to update listing.");
    } finally {
      setBusyId(null);
    }
  }

  function archiveListing(listing: ApiListing) {
    Alert.alert("Delete listing?", "This will archive the listing so customers cannot book it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => changeStatus(listing, "archived") },
    ]);
  }

  return (
    <Screen>
      <AppHeader
        eyebrow="Vendor"
        title="Your Listings"
        subtitle="Create, edit, submit, and delete listings from one place."
        icon="home-outline"
      />

      <View style={styles.toolbar}>
        <TouchableOpacity activeOpacity={0.88} style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={Colors.light.primary} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.88} style={styles.addButton} onPress={() => router.push("/vendor-listing-form" as Href)}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Listing</Text>
        </TouchableOpacity>
      </View>

      {vendorError ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={Colors.light.danger} />
          <Text style={styles.errorText}>{vendorError}</Text>
        </View>
      ) : null}

      <FlatList
        data={activeListings}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={activeListings.length ? styles.listContent : styles.emptyContent}
        refreshControl={<RefreshControl refreshing={vendorLoading} tintColor={Colors.light.primary} onRefresh={refreshVendorListings} />}
        renderItem={({ item }) => (
          <VendorListingCard
            busy={busyId === item.id}
            item={item}
            onArchive={archiveListing}
            onSubmit={(listing) => changeStatus(listing, "pending")}
          />
        )}
        ListEmptyComponent={
          vendorLoading ? (
            <ActivityIndicator color={Colors.light.primary} />
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="home-outline" size={28} color={Colors.light.primary} />
              </View>
              <Text style={styles.emptyTitle}>No listings yet</Text>
              <Text style={styles.emptyText}>Add your first room, service, vehicle, or rental item for review.</Text>
              <TouchableOpacity activeOpacity={0.88} style={styles.emptyButton} onPress={() => router.push("/vendor-listing-form" as Href)}>
                <Ionicons name="add-circle-outline" size={19} color="white" />
                <Text style={styles.emptyButtonText}>Create Listing</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
  },
  addButtonText: {
    color: "white",
    ...Typography.label,
    fontWeight: "900",
  },
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.light.danger,
    flex: 1,
    ...Typography.label,
  },
  listContent: {
    gap: Spacing.lg,
    padding: Spacing.xl,
    paddingBottom: 110,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
    paddingBottom: 110,
  },
  listingCard: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadows.card,
  },
  listingImage: {
    backgroundColor: Colors.light.border,
    height: 150,
    width: "100%",
  },
  listingBody: {
    padding: Spacing.lg,
  },
  listingTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  listingTitleBlock: {
    flex: 1,
  },
  listingTitle: {
    color: Colors.light.text,
    ...Typography.cardTitle,
    fontWeight: "900",
  },
  listingMeta: {
    color: Colors.light.muted,
    marginTop: 2,
    ...Typography.label,
  },
  statusPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  statusText: {
    ...Typography.eyebrow,
    fontWeight: "900",
  },
  priceText: {
    color: Colors.light.primary,
    marginTop: Spacing.md,
    ...Typography.bodyStrong,
    fontWeight: "900",
  },
  summaryText: {
    color: Colors.light.muted,
    marginTop: Spacing.xs,
    ...Typography.body,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xs,
    minHeight: 38,
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonText: {
    color: Colors.light.primary,
    ...Typography.label,
    fontWeight: "900",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: Spacing.xs,
    minHeight: 38,
    paddingHorizontal: Spacing.md,
  },
  dangerButtonText: {
    color: Colors.light.danger,
    ...Typography.label,
    fontWeight: "900",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: Colors.light.surfaceMuted,
    borderRadius: Radius.lg,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  emptyTitle: {
    color: Colors.light.text,
    marginTop: Spacing.lg,
    ...Typography.sectionTitle,
  },
  emptyText: {
    color: Colors.light.muted,
    marginTop: Spacing.sm,
    textAlign: "center",
    ...Typography.body,
  },
  emptyButton: {
    alignItems: "center",
    backgroundColor: Colors.light.primary,
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
});
