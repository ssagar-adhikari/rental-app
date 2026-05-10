# React Query Migration Guide

This doc continues §4 of [`architectural-gaps.md`](./architectural-gaps.md). Foundation has shipped:

- `@tanstack/react-query` installed.
- [`lib/queryClient.ts`](../lib/queryClient.ts) configured (5-minute stale, 30-minute GC, smart retry that skips 4xx except 408/429).
- [`app/_layout.tsx`](../app/_layout.tsx) wraps the tree in `QueryClientProvider`, wires `focusManager` to `AppState`.
- [`context/NetworkContext.tsx`](../context/NetworkContext.tsx) wires `onlineManager` to NetInfo.
- [`context/CategoriesContext.tsx`](../context/CategoriesContext.tsx) is fully migrated and is the reference pattern.

What remains: migrate `ListingsContext` and `BookingsContext` while keeping their external API unchanged. Below is the exact pattern.

---

## Pattern: keep the context API, swap the engine

The trick is that consumers (screens) call `useListings()` and destructure fields. As long as the destructured shape stays the same, screens don't change. We just replace `useState` + manual fetching with `useQuery` / `useInfiniteQuery` / `useMutation` inside the provider.

---

## ListingsContext

The current context exposes:

```ts
listings, rentalListings, vendorListings, loading, refreshing, loadingMore,
hasMoreListings, vendorLoading, publicError, vendorError, error,
refreshListings, loadMoreListings, refreshVendorListings,
loadListing, createListing, updateListing, transitionListing
```

### Public listings (paginated)

Use `useInfiniteQuery`. The flat array is just `data.pages.flatMap(page => page.data)`.

```ts
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";

const [publicParams, setPublicParams] = useState<ListingQueryParams>({ per_page: 20 });

const publicQuery = useInfiniteQuery({
  queryKey: ["listings", "public", publicParams] as const,
  queryFn: ({ pageParam }) => listingApi.publicListings({ ...publicParams, page: pageParam }),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => {
    const current = Number(lastPage.meta?.current_page ?? 1);
    const last = Number(lastPage.meta?.last_page ?? 1);
    return current < last ? current + 1 : undefined;
  },
});

const listings = useMemo(
  () => publicQuery.data?.pages.flatMap((page) => page.data) ?? [],
  [publicQuery.data],
);

const refreshListings = useCallback(
  async (params: ListingQueryParams = {}) => {
    setPublicParams({ per_page: 20, ...params });
    // useInfiniteQuery refetches automatically when queryKey changes.
  },
  [],
);

const loadMoreListings = useCallback(async () => {
  if (publicQuery.hasNextPage && !publicQuery.isFetchingNextPage) {
    await publicQuery.fetchNextPage();
  }
}, [publicQuery]);
```

Field mapping:

| Old field | React Query equivalent |
| --- | --- |
| `loading` | `publicQuery.isPending` |
| `refreshing` | `publicQuery.isRefetching && !publicQuery.isFetchingNextPage` |
| `loadingMore` | `publicQuery.isFetchingNextPage` |
| `hasMoreListings` | `publicQuery.hasNextPage` |
| `publicError` | `publicQuery.error?.message ?? null` |

### Vendor listings

```ts
const vendorQuery = useQuery({
  queryKey: ["listings", "vendor", { token, params: vendorParams }] as const,
  queryFn: () => listingApi.vendorListings(token!, vendorParams),
  enabled: !!token && !!user?.roles.includes("vendor"),
});

const vendorListings = vendorQuery.data?.data ?? [];
```

`refreshVendorListings(params)` becomes `setVendorParams(params)` plus an optional `vendorQuery.refetch()`.

### Single listing

```ts
const queryClient = useQueryClient();

const loadListing = useCallback(
  async (id: number) => {
    const listing = await queryClient.fetchQuery({
      queryKey: ["listings", "by-id", id] as const,
      queryFn: () => listingApi.show(id, token),
    });

    // Side-effect: keep the public + vendor caches in sync
    queryClient.setQueryData<ApiListing[]>(["listings", "vendor"], (current) =>
      current?.map((entry) => (entry.id === id ? listing : entry)) ?? current,
    );

    return listing;
  },
  [queryClient, token],
);
```

### Mutations

```ts
const createMutation = useMutation({
  mutationFn: ({ values, status, attrs }: { values: ListingFormValues; status: "draft" | "pending"; attrs: ApiCategoryAttribute[] }) =>
    listingApi.create(values, status, token!, attrs),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["listings", "vendor"] });
  },
});

const createListing = useCallback(
  (values: ListingFormValues, status: "draft" | "pending", attrs: ApiCategoryAttribute[] = []) =>
    createMutation.mutateAsync({ values, status, attrs }),
  [createMutation],
);
```

Same shape for `updateListing` and `transitionListing` — invalidate `["listings"]` (catches both public and vendor) on success.

### Drop the manual cache layer

Delete:
- `loadedPublicListings = useRef(false)`
- All `cacheStorage` usage (`readJsonCache`, `writeJsonCache`, `PUBLIC_LISTINGS_CACHE_KEY`)
- `paginationFromResponse`, `mergeListings`, `cacheablePublicParams` helpers

For offline-first persistence across app restarts, install `@tanstack/query-async-storage-persister` + `@tanstack/react-query-persist-client` later. Not needed for the migration to land.

---

## BookingsContext

Same pattern, smaller surface. Current API:

```ts
vendorBookings, vendorBookingsLoading, vendorBookingsRefreshing,
vendorBookingsLoadingMore, vendorBookingsError, hasMoreVendorBookings,
bookingMetrics, refreshVendorBookings, loadMoreVendorBookings,
loadVendorBooking, cancelVendorBooking
```

```ts
const [params, setParams] = useState<BookingQueryParams>({ per_page: 20 });

const bookingsQuery = useInfiniteQuery({
  queryKey: ["bookings", "vendor", params] as const,
  queryFn: ({ pageParam }) => bookingApi.vendorBookings(token!, { ...params, page: pageParam }),
  initialPageParam: 1,
  getNextPageParam: (last) => {
    const current = Number(last.meta?.current_page ?? 1);
    const lastPage = Number(last.meta?.last_page ?? 1);
    return current < lastPage ? current + 1 : undefined;
  },
  enabled: !!token && !!user?.roles.includes("vendor"),
});

const vendorBookings = useMemo(
  () => bookingsQuery.data?.pages.flatMap((p) => p.data) ?? [],
  [bookingsQuery.data],
);

const cancelMutation = useMutation({
  mutationFn: ({ id, reason }: { id: number; reason: string }) =>
    bookingApi.cancelVendorBooking(id, token!, reason),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
});
```

`bookingMetrics` is derived — `useMemo(() => buildMetrics(vendorBookings), [vendorBookings])`. No change there.

---

## Auth-on-401 handling

The contexts currently call `logout()` on 401. With the centralized `apiClient` (§5), 401-refresh-and-retry is already global. If refresh ultimately fails, `onUnauthorized` clears the session and React Query's queries naturally re-evaluate (`enabled: !!token` becomes false).

You can remove `handleAuthException` entirely — it's redundant.

---

## Testing the migration

1. **Cold start with cache:** Old behavior loaded from `cacheStorage` first. React Query alone has no persistence; first paint will show empty state until the query resolves. Acceptable trade-off, or add `persistQueryClient` later.
2. **Refetch on resume:** `focusManager` + `AppState` is wired. Background the app for >5 minutes (the `staleTime`), foreground it, and queries should refetch.
3. **Offline:** `onlineManager` + NetInfo is wired. Mutations queue while offline and fire on reconnect.
4. **Pagination:** "Load more" should call `fetchNextPage` and append.
5. **Mutation invalidation:** After `createListing`, the vendor list should reflect the new entry.

---

## File checklist

- [x] [`context/ListingsContext.tsx`](../context/ListingsContext.tsx) — replace internals; keep export shape.
- [x] [`context/BookingsContext.tsx`](../context/BookingsContext.tsx) — same.
- [x] Search the repo for `readJsonCache`/`writeJsonCache` once both contexts are migrated; if no other consumers, delete `utils/cacheStorage.ts`.
- [ ] Optional: add `@tanstack/query-async-storage-persister` for offline-first persistence.
