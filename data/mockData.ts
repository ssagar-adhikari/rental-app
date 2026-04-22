import type { Category, RentalListing } from "@/types/rental";

export const categories: Category[] = [
  {
    id: 1,
    name: "Rooms",
    title: "Rooms",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=600",
  },
  {
    id: 2,
    name: "Apartments",
    title: "Apartments",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=600",
  },
  {
    id: 3,
    name: "Vehicles",
    title: "Vehicles",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=600",
  },
  {
    id: 4,
    name: "Professionals",
    title: "Professionals",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=600",
  },
];

export const rooms: RentalListing[] = [
  {
    id: 1,
    title: "Luxury Apartment",
    price: "NPR 25,000 / month",
    location: "Kathmandu",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800",
    rating: 4.8,
    features: ["2 Bed", "2 Bath", "1200 sqft"],
  },
  {
    id: 2,
    title: "Studio Room",
    price: "NPR 15,000 / month",
    location: "Lalitpur",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800",
    rating: 4.7,
    features: ["1 Bed", "1 Bath", "650 sqft"],
  },
  {
    id: 3,
    title: "Family Flat",
    price: "NPR 30,000 / month",
    location: "Bhaktapur",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800",
    rating: 4.9,
    features: ["3 Bed", "2 Bath", "1400 sqft"],
  },
];

export const trendings = [...rooms].sort((a, b) => b.rating - a.rating);
