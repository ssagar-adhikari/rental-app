import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { listingApi, mapApiListingToRentalListing, type ListingQueryParams, type PaginatedListings } from "@/services/listingApi";
import type { ApiCategoryAttribute, ApiListing, ListingFormValues, ListingStatus, RentalListing } from "@/types/rental";

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

export const publicListingsKey = ["listings", "public"] as const;
export const vendorListingsKey = ["listings", "vendor"] as const;
export const listingByIdKey = (id: number) => ["listings", "by-id", id] as const;

const defaultPublicParams: ListingQueryParams = { per_page: 20 };
const defaultVendorParams: ListingQueryParams = { per_page: 20 };

export function ListingsProvider({ children }: PropsWithChildren) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [publicParams, setPublicParams] = useState<ListingQueryParams>(defaultPublicParams);
  const [vendorParams, setVendorParams] = useState<ListingQueryParams>(defaultVendorParams);

  const isVendor = !!token && !!user?.roles.includes("vendor");

  const publicQuery = useInfiniteQuery({
    queryKey: [...publicListingsKey, publicParams] as const,
    queryFn: ({ pageParam }) => listingApi.publicListings({ ...publicParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const current = Number(lastPage.meta?.current_page ?? 1);
      const last = Number(lastPage.meta?.last_page ?? 1);
      return current < last ? current + 1 : undefined;
    },
  });

  const vendorQuery = useQuery({
    queryKey: [...vendorListingsKey, vendorParams] as const,
    queryFn: () => listingApi.vendorListings(token!, vendorParams),
    enabled: isVendor,
  });

  const listings = useMemo(
    () => publicQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [publicQuery.data],
  );

  const vendorListings = vendorQuery.data?.data ?? [];

  const syncListingInCaches = useCallback(
    (listing: ApiListing) => {
      queryClient.setQueriesData<InfiniteData<PaginatedListings>>(
        { queryKey: publicListingsKey, exact: false },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  data: page.data.map((item) => (item.id === listing.id ? listing : item)),
                })),
              }
            : current,
      );

      queryClient.setQueriesData<PaginatedListings>(
        { queryKey: vendorListingsKey, exact: false },
        (current) =>
          current
            ? { ...current, data: current.data.map((item) => (item.id === listing.id ? listing : item)) }
            : current,
      );
    },
    [queryClient],
  );

  const refreshListings = useCallback(
    async (params: ListingQueryParams = {}) => {
      if (Object.keys(params).length > 0) {
        setPublicParams((current) => ({ ...defaultPublicParams, ...current, ...params }));
        return;
      }
      await publicQuery.refetch();
    },
    [publicQuery],
  );

  const loadMoreListings = useCallback(async () => {
    if (publicQuery.hasNextPage && !publicQuery.isFetchingNextPage) {
      await publicQuery.fetchNextPage();
    }
  }, [publicQuery]);

  const refreshVendorListings = useCallback(
    async (params: ListingQueryParams = {}) => {
      if (!isVendor) return;
      if (Object.keys(params).length > 0) {
        setVendorParams((current) => ({ ...defaultVendorParams, ...current, ...params }));
        return;
      }
      await vendorQuery.refetch();
    },
    [isVendor, vendorQuery],
  );

  const loadListing = useCallback(
    async (id: number) => {
      const listing = await queryClient.fetchQuery({
        queryKey: listingByIdKey(id),
        queryFn: () => listingApi.show(id, token),
      });
      syncListingInCaches(listing);
      return listing;
    },
    [queryClient, syncListingInCaches, token],
  );

  const createMutation = useMutation({
    mutationFn: ({
      values,
      status,
      attrs,
    }: {
      values: ListingFormValues;
      status: "draft" | "pending";
      attrs: ApiCategoryAttribute[];
    }) => {
      if (!token) {
        throw new Error("Please log in as a vendor to create a listing.");
      }
      return listingApi.create(values, status, token, attrs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vendorListingsKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      values,
      attrs,
    }: {
      id: number;
      values: ListingFormValues;
      attrs: ApiCategoryAttribute[];
    }) => {
      if (!token) {
        throw new Error("Please log in as a vendor to update a listing.");
      }
      return listingApi.update(id, values, token, attrs);
    },
    onSuccess: (listing) => {
      queryClient.setQueryData(listingByIdKey(listing.id), listing);
      syncListingInCaches(listing);
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ListingStatus }) => {
      if (!token) {
        throw new Error("Please log in as a vendor to update listing status.");
      }
      return listingApi.transition(id, status, token);
    },
    onSuccess: (listing) => {
      queryClient.setQueryData(listingByIdKey(listing.id), listing);
      queryClient.invalidateQueries({ queryKey: vendorListingsKey });
      queryClient.invalidateQueries({ queryKey: publicListingsKey });
    },
  });

  const createListing = useCallback(
    (values: ListingFormValues, status: "draft" | "pending", categoryAttributes: ApiCategoryAttribute[] = []) =>
      createMutation.mutateAsync({ values, status, attrs: categoryAttributes }),
    [createMutation],
  );

  const updateListing = useCallback(
    (id: number, values: ListingFormValues, categoryAttributes: ApiCategoryAttribute[] = []) =>
      updateMutation.mutateAsync({ id, values, attrs: categoryAttributes }),
    [updateMutation],
  );

  const transitionListing = useCallback(
    (id: number, status: ListingStatus) => transitionMutation.mutateAsync({ id, status }),
    [transitionMutation],
  );

  const rentalListings = useMemo(() => listings.map(mapApiListingToRentalListing), [listings]);
  const publicError = publicQuery.error instanceof Error ? publicQuery.error.message : null;
  const vendorError = vendorQuery.error instanceof Error ? vendorQuery.error.message : null;

  const value = useMemo<ListingsContextValue>(
    () => ({
      listings,
      rentalListings,
      vendorListings,
      loading: publicQuery.isPending,
      refreshing: publicQuery.isRefetching && !publicQuery.isFetchingNextPage,
      loadingMore: publicQuery.isFetchingNextPage,
      hasMoreListings: publicQuery.hasNextPage ?? false,
      vendorLoading: vendorQuery.isPending && isVendor,
      publicError,
      vendorError,
      error: publicError ?? vendorError,
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
      isVendor,
      listings,
      loadListing,
      loadMoreListings,
      publicError,
      publicQuery.hasNextPage,
      publicQuery.isFetchingNextPage,
      publicQuery.isPending,
      publicQuery.isRefetching,
      refreshListings,
      refreshVendorListings,
      rentalListings,
      transitionListing,
      updateListing,
      vendorError,
      vendorListings,
      vendorQuery.isPending,
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
