import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/services/authApi";
import { listingApi, mapApiListingToRentalListing, type ListingQueryParams, type PaginatedListings } from "@/services/listingApi";
import type { ApiCategoryAttribute, ApiListing, ListingFormValues, ListingStatus, RentalListing } from "@/types/rental";
import { useAuth } from "@/context/AuthContext";
import { readJsonCache, writeJsonCache } from "@/utils/cacheStorage";

type ListingPagination = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

type ListingsContextValue = {
  listings: ApiListing[];
  rentalListings: RentalListing[];
  vendorListings: ApiListing[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMoreListings: boolean;
  vendorLoading: boolean;
  publicError: string | null;
  vendorError: string | null;
  error: string | null;
  refreshListings: (params?: ListingQueryParams) => Promise<void>;
  loadMoreListings: () => Promise<void>;
  refreshVendorListings: (params?: ListingQueryParams) => Promise<void>;
  loadListing: (id: number) => Promise<ApiListing>;
  createListing: (values: ListingFormValues, status: "draft" | "pending", categoryAttributes?: ApiCategoryAttribute[]) => Promise<ApiListing>;
  updateListing: (id: number, values: ListingFormValues, categoryAttributes?: ApiCategoryAttribute[]) => Promise<ApiListing>;
  transitionListing: (id: number, status: ListingStatus) => Promise<ApiListing>;
};

const ListingsContext = createContext<ListingsContextValue | null>(null);
const PUBLIC_LISTINGS_CACHE_KEY = "rental_marketplace_public_listings_cache";

function paginationFromResponse(response: PaginatedListings): ListingPagination {
  return {
    currentPage: Number(response.meta?.current_page ?? 1),
    lastPage: Number(response.meta?.last_page ?? 1),
    perPage: Number(response.meta?.per_page ?? response.data.length),
    total: Number(response.meta?.total ?? response.data.length),
  };
}

function mergeListings(current: ApiListing[], next: ApiListing[]) {
  const byId = new Map<number, ApiListing>();

  [...current, ...next].forEach((listing) => {
    byId.set(listing.id, listing);
  });

  return Array.from(byId.values());
}

function cacheablePublicParams(params: ListingQueryParams) {
  return !params.q && !params.category_id && !params.city && !params.listing_type && (!params.page || params.page === 1);
}

export function ListingsProvider({ children }: PropsWithChildren) {
  const { logout, token, user } = useAuth();
  const [listings, setListings] = useState<ApiListing[]>([]);
  const [vendorListings, setVendorListings] = useState<ApiListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ListingPagination>({
    currentPage: 1,
    lastPage: 1,
    perPage: 20,
    total: 0,
  });
  const [lastPublicParams, setLastPublicParams] = useState<ListingQueryParams>({ per_page: 20 });
  const loadedPublicListings = useRef(false);

  const handleAuthException = useCallback(
    async (exception: unknown) => {
      if (exception instanceof ApiError && exception.status === 401) {
        await logout();
      }
    },
    [logout],
  );

  const refreshListings = useCallback(async (params: ListingQueryParams = {}) => {
    const nextParams = { per_page: 20, ...params, page: params.page ?? 1 };
    const initialLoad = !loadedPublicListings.current;
    setLastPublicParams(nextParams);
    setLoading(initialLoad);
    setRefreshing(!initialLoad);
    setPublicError(null);

    try {
      const response = await listingApi.publicListings(nextParams);
      setListings(response.data);
      setPagination(paginationFromResponse(response));

      if (cacheablePublicParams(nextParams)) {
        await writeJsonCache(PUBLIC_LISTINGS_CACHE_KEY, {
          data: response.data,
          pagination: paginationFromResponse(response),
        });
      }
    } catch (exception) {
      setPublicError(exception instanceof Error ? exception.message : "Unable to load listings.");
    } finally {
      loadedPublicListings.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMoreListings = useCallback(async () => {
    if (loadingMore || loading || pagination.currentPage >= pagination.lastPage) {
      return;
    }

    setLoadingMore(true);
    setPublicError(null);

    try {
      const response = await listingApi.publicListings({
        ...lastPublicParams,
        page: pagination.currentPage + 1,
      });
      setListings((current) => mergeListings(current, response.data));
      setPagination(paginationFromResponse(response));
    } catch (exception) {
      setPublicError(exception instanceof Error ? exception.message : "Unable to load more listings.");
    } finally {
      setLoadingMore(false);
    }
  }, [lastPublicParams, loading, loadingMore, pagination.currentPage, pagination.lastPage]);

  const refreshVendorListings = useCallback(async (params: ListingQueryParams = {}) => {
    if (!token || !user?.roles.includes("vendor")) {
      setVendorListings([]);
      return;
    }

    setVendorLoading(true);
    setVendorError(null);

    try {
      const response = await listingApi.vendorListings(token, params);
      setVendorListings(response.data);
    } catch (exception) {
      await handleAuthException(exception);
      setVendorError(exception instanceof Error ? exception.message : "Unable to load vendor listings.");
    } finally {
      setVendorLoading(false);
    }
  }, [handleAuthException, token, user?.roles]);

  const loadListing = useCallback(
    async (id: number) => {
      let listing: ApiListing;

      try {
        listing = await listingApi.show(id, token);
      } catch (exception) {
        await handleAuthException(exception);
        throw exception;
      }

      setListings((current) => {
        const exists = current.some((item) => item.id === listing.id);
        return exists ? current.map((item) => (item.id === listing.id ? listing : item)) : [listing, ...current];
      });

      setVendorListings((current) => current.map((item) => (item.id === listing.id ? listing : item)));

      return listing;
    },
    [handleAuthException, token],
  );

  const createListing = useCallback(
    async (values: ListingFormValues, status: "draft" | "pending", categoryAttributes: ApiCategoryAttribute[] = []) => {
      if (!token) {
        throw new Error("Please log in as a vendor to create a listing.");
      }

      let listing: ApiListing;

      try {
        listing = await listingApi.create(values, status, token, categoryAttributes);
      } catch (exception) {
        await handleAuthException(exception);
        throw exception;
      }

      setVendorListings((current) => [listing, ...current]);
      return listing;
    },
    [handleAuthException, token],
  );

  const updateListing = useCallback(
    async (id: number, values: ListingFormValues, categoryAttributes: ApiCategoryAttribute[] = []) => {
      if (!token) {
        throw new Error("Please log in as a vendor to update a listing.");
      }

      let listing: ApiListing;

      try {
        listing = await listingApi.update(id, values, token, categoryAttributes);
      } catch (exception) {
        await handleAuthException(exception);
        throw exception;
      }

      setVendorListings((current) => current.map((item) => (item.id === id ? listing : item)));
      setListings((current) => current.map((item) => (item.id === id ? listing : item)));
      return listing;
    },
    [handleAuthException, token],
  );

  const transitionListing = useCallback(
    async (id: number, status: ListingStatus) => {
      if (!token) {
        throw new Error("Please log in as a vendor to update listing status.");
      }

      let listing: ApiListing;

      try {
        listing = await listingApi.transition(id, status, token);
      } catch (exception) {
        await handleAuthException(exception);
        throw exception;
      }

      setVendorListings((current) => current.map((item) => (item.id === id ? listing : item)));
      setListings((current) => current.filter((item) => item.id !== id || listing.status === "published").map((item) => (item.id === id ? listing : item)));
      return listing;
    },
    [handleAuthException, token],
  );

  useEffect(() => {
    let mounted = true;

    async function bootListings() {
      const cached = await readJsonCache<{
        data: ApiListing[];
        pagination: ListingPagination;
      }>(PUBLIC_LISTINGS_CACHE_KEY);

      if (mounted && cached?.data?.length) {
        loadedPublicListings.current = true;
        setListings(cached.data);
        setPagination(cached.pagination);
      }

      await refreshListings();
    }

    bootListings();

    return () => {
      mounted = false;
    };
  }, [refreshListings]);

  useEffect(() => {
    refreshVendorListings();
  }, [refreshVendorListings]);

  const rentalListings = useMemo(() => listings.map(mapApiListingToRentalListing), [listings]);
  const hasMoreListings = pagination.currentPage < pagination.lastPage;
  const error = publicError ?? vendorError;

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      rentalListings,
      vendorListings,
      loading,
      refreshing,
      loadingMore,
      hasMoreListings,
      vendorLoading,
      publicError,
      vendorError,
      error,
      refreshListings,
      loadMoreListings,
      refreshVendorListings,
      loadListing,
      createListing,
      updateListing,
      transitionListing,
    }),
    [
      createListing,
      error,
      hasMoreListings,
      listings,
      loadListing,
      loadingMore,
      loading,
      loadMoreListings,
      publicError,
      refreshListings,
      refreshVendorListings,
      refreshing,
      rentalListings,
      transitionListing,
      updateListing,
      vendorError,
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
