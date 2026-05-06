import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
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

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

export function CategoriesProvider({ children }: PropsWithChildren) {
  const [categoryTree, setCategoryTree] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoryApi.tree();
      setCategoryTree(response);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Unable to load categories.");
      setCategoryTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const childCategoryList = useMemo(() => childCategories(categoryTree), [categoryTree]);
  const categories = useMemo(() => childCategoryList.map(mapApiCategory), [childCategoryList]);
  const vendorCategories = useMemo(() => childCategoryList.map(mapVendorCategory), [childCategoryList]);

  const value = useMemo<CategoriesContextValue>(
    () => ({
      categoryTree,
      categories,
      vendorCategories,
      loading,
      error,
      refreshCategories,
    }),
    [categories, categoryTree, error, loading, refreshCategories, vendorCategories],
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
