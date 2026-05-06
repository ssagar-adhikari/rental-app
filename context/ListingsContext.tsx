import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { listingApi, mapApiListingToRentalListing } from "@/services/listingApi";
import type { ApiCategoryAttribute, ApiListing, ListingFormValues, ListingStatus, RentalListing } from "@/types/rental";
import { useAuth } from "@/context/AuthContext";

type ListingsContextValue = {
  listings: ApiListing[];
  rentalListings: RentalListing[];
  vendorListings: ApiListing[];
  loading: boolean;
  vendorLoading: boolean;
  error: string | null;
  refreshListings: () => Promise<void>;
  refreshVendorListings: () => Promise<void>;
  loadListing: (id: number) => Promise<ApiListing>;
  createListing: (values: ListingFormValues, status: "draft" | "pending", categoryAttributes?: ApiCategoryAttribute[]) => Promise<ApiListing>;
  updateListing: (id: number, values: ListingFormValues, categoryAttributes?: ApiCategoryAttribute[]) => Promise<ApiListing>;
  transitionListing: (id: number, status: ListingStatus) => Promise<ApiListing>;
};

const ListingsContext = createContext<ListingsContextValue | null>(null);

export function ListingsProvider({ children }: PropsWithChildren) {
  const { token, user } = useAuth();
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [vendorListings, setVendorListings] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listingApi.publicListings();
      setListings(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load listings.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshVendorListings = useCallback(async () => {
    if (!token || !user?.roles.includes("vendor")) {
      setVendorListings([]);
      return;
    }

    setVendorLoading(true);
    setError(null);

    try {
      const response = await listingApi.vendorListings(token);
      setVendorListings(response.data);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load vendor listings.");
    } finally {
      setVendorLoading(false);
    }
  }, [token, user?.roles]);

  const loadListing = useCallback(
    async (id: number) => {
      const listing = await listingApi.show(id, token);

      setListings((current) => {
        const exists = current.some((item) => item.id === listing.id);
        return exists ? current.map((item) => (item.id === listing.id ? listing : item)) : [listing, ...current];
      });

      setVendorListings((current) => current.map((item) => (item.id === listing.id ? listing : item)));

      return listing;
    },
    [token],
  );

  const createListing = useCallback(
    async (values: ListingFormValues, status: "draft" | "pending", categoryAttributes: ApiCategoryAttribute[] = []) => {
      if (!token) {
        throw new Error("Please log in as a vendor to create a listing.");
      }

      const listing = await listingApi.create(values, status, token, categoryAttributes);
      setVendorListings((current) => [listing, ...current]);
      return listing;
    },
    [token],
  );

  const updateListing = useCallback(
    async (id: number, values: ListingFormValues, categoryAttributes: ApiCategoryAttribute[] = []) => {
      if (!token) {
        throw new Error("Please log in as a vendor to update a listing.");
      }

      const listing = await listingApi.update(id, values, token, categoryAttributes);
      setVendorListings((current) => current.map((item) => (item.id === id ? listing : item)));
      setListings((current) => current.map((item) => (item.id === id ? listing : item)));
      return listing;
    },
    [token],
  );

  const transitionListing = useCallback(
    async (id: number, status: ListingStatus) => {
      if (!token) {
        throw new Error("Please log in as a vendor to update listing status.");
      }

      const listing = await listingApi.transition(id, status, token);
      setVendorListings((current) => current.map((item) => (item.id === id ? listing : item)));
      setListings((current) => current.filter((item) => item.id !== id || listing.status === "published").map((item) => (item.id === id ? listing : item)));
      return listing;
    },
    [token],
  );

  useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  useEffect(() => {
    refreshVendorListings();
  }, [refreshVendorListings]);

  const rentalListings = useMemo(() => listings.map(mapApiListingToRentalListing), [listings]);

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      rentalListings,
      vendorListings,
      loading,
      vendorLoading,
      error,
      refreshListings,
      refreshVendorListings,
      loadListing,
      createListing,
      updateListing,
      transitionListing,
    }),
    [
      createListing,
      error,
      listings,
      loadListing,
      loading,
      refreshListings,
      refreshVendorListings,
      rentalListings,
      transitionListing,
      updateListing,
      vendorListings,
      vendorLoading,
    ],
  );

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
}

export function useListings() {
  const context = useContext(ListingsContext);

  if (!context) {
    throw new Error("useListings must be used within ListingsProvider");
  }

  return context;
}
