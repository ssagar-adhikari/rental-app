# Rental App

Rental App is an Expo React Native application for browsing rental categories, room listings, service listings, listing details, search suggestions, and a profile area. The app uses Expo Router for file-based navigation and a small shared design system for consistent typography, colors, spacing, card styling, and headers.

## Current Features

- Tab navigation for Home, Category, Search, and Profile.
- Home screen with hero header, category carousel, available rooms, and trending listings.
- Category screen with searchable category grid.
- Search screen with recent searches, popular searches, category shortcuts, featured listings, and nearby recommendations.
- Service list screen with grid and row layout modes.
- Service detail screen with image carousel, description, amenities, contact information, map preview, and bottom action bar.
- Profile screen with account summary, membership card, account menu, settings menu, and logout action.
- Shared reusable components for headers, search bars, section headings, screens, category cards, and room cards.
- Typed data models for categories and rental listings.
- Centralized design tokens for colors, typography, spacing, radius, and shadows.

## Tech Stack

- Expo 54
- React 19
- React Native 0.81
- Expo Router 6
- TypeScript
- React Native Maps
- Expo Vector Icons

## Project Structure

```text
app/
  _layout.tsx              Root stack navigation
  (tabs)/                  Main tab screens
    _layout.tsx            Bottom tab configuration
    index.tsx              Home screen
    category.tsx           Category browser
    search.tsx             Search and recommendations
    profile.tsx            Profile/account screen
  service-list.tsx         Category/service listing screen
  service-detail.tsx       Listing detail screen

components/
  AppHeader.tsx            Shared top header for screens
  Header.tsx               Home hero/header
  SearchBar.tsx            Shared search input
  SectionHeader.tsx        Shared section heading/action row
  Screen.tsx               Shared screen wrapper
  CategoryCard.tsx         Horizontal category card
  CategoryItem.tsx         Grid category card
  RoomCard.tsx             Rental listing card
  themed-text.tsx          Theme-aware text helper
  themed-view.tsx          Theme-aware view helper

constants/
  theme.ts                 Design tokens
  categoryMeta.ts          Category icons, counts, accents

data/
  mockData.ts              Home/listing mock data
  categories.ts            Full category list

types/
  rental.ts                Shared app data types
```

## Design System

The refactor introduced a lightweight design-system pattern in `constants/theme.ts`.

It defines:
- `Colors`: app palette for light/dark mode keys plus app-specific tokens.
- `Spacing`: reusable spacing scale.
- `Radius`: reusable border radius scale.
- `Typography`: shared text styles for labels, body, card titles, section titles, screen titles, and hero titles.
- `Shadows`: shared shadow presets for cards and header search elements.

New UI work should prefer these tokens instead of hardcoded colors, font sizes, spacing, or shadow values.

## Data Model

Shared data types live in `types/rental.ts`.

Main types:
- `Category`: category id, name, title, and image.
- `RentalListing`: listing id, title, price, location, image, rating, and features.
- `CategoryMeta`: icon, listing count label, and accent color.

Mock data currently lives in `data/mockData.ts` and `data/categories.ts`. This keeps the app usable while backend/API integration is not yet added.

## Navigation

The app uses Expo Router.

- `app/_layout.tsx` defines the root stack.
- `app/(tabs)/_layout.tsx` defines the bottom tabs.
- `service-list` and `service-detail` are stack routes opened from category/listing cards.

The detail screen currently imports `react-native-maps` via direct internal module paths:

```ts
import MapView from "react-native-maps/lib/MapView";
import Marker from "react-native-maps/lib/MapMarker";
import { PROVIDER_GOOGLE } from "react-native-maps/lib/ProviderConstants";
```

This avoids a Metro bundling issue where the root `react-native-maps` barrel import failed to resolve `./MapCircle`.

## Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

Clear Metro cache if bundling behaves unexpectedly:

```bash
npx expo start -c
```

Run lint:

```bash
npm run lint
```

Run TypeScript check:

```bash
npx tsc --noEmit
```

## What We Have Done So Far

- Pulled the latest Git changes after resetting local refactor work.
- Fixed the Android bundling error caused by `react-native-maps` root imports.
- Refactored the app around shared design tokens and reusable UI components.
- Made typography, colors, spacing, radius, and shadows more consistent.
- Added typed rental/category models.
- Removed `any` usage from the main app/components refactor surface.
- Replaced placeholder Picsum data in active mock data with more relevant listing/category images.
- Simplified Home, Category, Search, and Profile screens by composing shared components.

## Current Notes

- The app still uses local mock data.
- `package-lock.json` has local changes that were present during the refactor session.
- In the Codex shell used for the refactor, `node`, `npm`, and `npx` were not available on PATH, so lint/typecheck/start could not be run there. Run the verification commands above from your normal development terminal.
