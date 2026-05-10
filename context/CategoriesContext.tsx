import { createContext, PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoryApi, childCategories, mapApiCategory, mapVendorCategory } from "@/services/categoryApi";
import type { ApiCategory, Category, VendorListingCategory } from "@/types/rental";

type CategoriesContextValue = {
  categoryTree: ApiCategory[];
  categories: Category[];
  vendorCategories: VendorListingCategory[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
};

export const categoryTreeQueryKey = ["categories", "tree"] as const;

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: PropsWithChildren) {
  const query = useQuery({
    queryKey: categoryTreeQueryKey,
    queryFn: () => categoryApi.tree(),
  });

  const categoryTree = query.data ?? [];

  const childCategoryList = useMemo(() => childCategories(categoryTree), [categoryTree]);
  const categories = useMemo(() => childCategoryList.map(mapApiCategory), [childCategoryList]);
  const vendorCategories = useMemo(() => childCategoryList.map(mapVendorCategory), [childCategoryList]);

  const refreshCategories = useCallback(async () => {
    await query.refetch();
  }, [query]);

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categoryTree,
      categories,
      vendorCategories,
      loading: query.isPending || query.isFetching,
      error: query.error instanceof Error ? query.error.message : null,
      refreshCategories,
    }),
    [
      categories,
      categoryTree,
      query.error,
      query.isFetching,
      query.isPending,
      refreshCategories,
      vendorCategories,
    ],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);

  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }

  return context;
}
