import { apiRequest } from "@/services/authApi";
import type { ApiCategory, Category, VendorListingCategory } from "@/types/rental";

const categoryFallbackImages: Record<string, string> = {
  rooms: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600",
  apartments: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600",
  houses: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=600",
  vehicles: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600",
  cars: "https://images.unsplash.com/photo-1549924231-f129b911e442?q=80&w=600",
  bikes: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600",
  scooters: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?q=80&w=600",
  cameras: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
  cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600",
  photography: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
};

const defaultCategoryImage = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600";

function categoryImage(category: ApiCategory) {
  return category.image || categoryFallbackImages[category.slug] || defaultCategoryImage;
}

export function mapApiCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    parent_id: category.parent_id,
    name: category.name || category.title,
    title: category.title,
    slug: category.slug,
    description: category.description,
    image: categoryImage(category),
    listing_type: category.listing_type,
    listing_count: category.listing_count ?? 0,
    children: category.children?.map(mapApiCategory) ?? [],
  };
}

export function flattenCategories(categories: ApiCategory[]) {
  return categories.flatMap((category) => [category, ...(category.children ?? [])]);
}

export function childCategories(categories: ApiCategory[]) {
  return flattenCategories(categories).filter((category) => category.parent_id !== null);
}

export function mapVendorCategory(category: ApiCategory): VendorListingCategory {
  return {
    id: category.id,
    title: category.title,
    listingType: category.listing_type,
    attributes: category.attributes ?? [],
  };
}

export const categoryApi = {
  tree() {
    return apiRequest<ApiCategory[]>("/categories");
  },

  children() {
    return apiRequest<ApiCategory[]>("/categories?children_only=1");
  },

  show(id: number) {
    return apiRequest<ApiCategory>(`/categories/${id}`);
  },
};
