# Mobile App Improvement Roadmap

## Overview

This document tracks the main improvements needed for the Rental App mobile frontend. The app already has a solid Expo Router structure, shared UI components, token-based authentication, category/listing contexts, role switching, and vendor listing screens.

The next improvements should focus on making the app feel complete as a real rental marketplace: searchable listings, accurate detail pages, booking/contact flows, stronger vendor tools, better media handling, and more reliable mobile UX.

## Priority Summary

1. Make search, filters, and sorting functional.
2. Replace hardcoded listing detail content with API-driven data.
3. Implement booking, messaging, favorites, share, and directions actions.
4. Improve listing loading with pagination, refresh, caching, and retry states.
5. Complete vendor dashboard, booking requests, and earnings features.
6. Replace image URL entry with real mobile media upload.
7. Strengthen registration, login, and location UX.
8. Improve mobile polish, accessibility, and loading states.
9. Reduce brittle map imports and centralize map behavior.
10. Add lint, typecheck, and app-flow verification.

## 1. Search, Filters, and Sorting

### Current State

- Search screens display a polished UI.
- Search text can be entered or selected from recent/popular suggestions.
- The customer listing screen has a search input and filter icon.
- Search, category, listing type, city/area, price range, rating, and sort controls now filter the loaded listing data on the client.
- Recent searches are stored locally and can be cleared from the Search screen.
- The listing API and listing context accept backend-supported query params for future server-side filtering.

### Remaining Improvements

- Move more filters server-side as the listing count grows.
- Add distance-based filtering once listing/user coordinates are consistently available.
- Add backend sorting params for price, rating, distance, and newest.
- Add debounce before server-side search requests.
- Add advanced attribute filters based on category-specific filterable attributes.

### Key Files

- `app/(tabs)/search.tsx`
- `app/service-list.tsx`
- `context/ListingsContext.tsx`
- `services/listingApi.ts`

## 2. API-Driven Listing Detail Page

### Current State

- The detail page loads a listing by ID.
- It shows listing media, price, owner name, owner email when available, map, features, attributes, status, and primary location from the API payload.
- It uses `description` or `summary` from the API for the about section.
- It renders listing-type-specific section titles for physical, service, and hybrid listings.
- It avoids fake phone numbers and placeholder contact emails.
- It uses all listing media when available and falls back to a single fallback image only when no listing media exists.

### Remaining Improvements

- Add native share behavior to the share button.
- Add real directions deep links for map navigation.
- Add backend-supported contact phone or messaging data if the product requires phone contact.
- Add richer service-specific and hybrid-specific sections once the backend exposes structured rules for them.
- Add a better media empty state if a listing has no uploaded images.

### Key Files

- `app/service-detail.tsx`
- `services/listingApi.ts`
- `types/rental.ts`

## 3. Booking, Messaging, Favorites, Share, and Directions

### Current State

- The listing detail page has `Book Now`, message, favorite, share, and directions buttons.
- Some actions are local-only or not connected to real behavior yet.
- Favorite state is currently screen-local and resets after leaving the page.

### Improvements Needed

- Add customer booking request flow.
- Add date/time, quantity, duration, and pricing confirmation before booking.
- Connect `Book Now` to backend booking endpoints.
- Add messaging or contact intent for vendors.
- Persist favorites to backend or local storage for guest users.
- Use native share for listing links.
- Open device maps for directions using listing coordinates.
- Add confirmation and error states for each action.

### Suggested Customer Flow

1. Customer opens a listing detail page.
2. Customer taps `Book Now`.
3. App opens a booking form or bottom sheet.
4. Customer selects date, duration, quantity, and notes.
5. App shows price summary.
6. Customer submits the request.
7. Vendor receives the booking request.
8. Customer can track booking status from profile.

### Key Files

- `app/service-detail.tsx`
- `app/(tabs)/profile.tsx`
- `services/listingApi.ts`
- Future booking API service and booking screens

## 4. Listing Loading, Pagination, and Reliability

### Current State

- Public and vendor listings are loaded with paginated API requests.
- Public listings use `per_page=20` and support loading additional pages.
- Listings and categories are stored in context.
- Public listing errors and vendor listing errors are tracked separately.
- Public listings and category trees are cached after successful loads for faster startup/fallback.
- Home, search, category, and service list screens support pull-to-refresh.
- Home, category, service list, and detail screens include lightweight skeleton placeholders.
- Service list and search screens include retry/load-more UI.
- Authenticated listing actions handle expired tokens by clearing the session consistently.

### Remaining Improvements

- Add true server-side filtering/sorting pagination once search/filter requests are debounced.
- Add offline stale-data indicators so cached data is visibly marked as cached.
- Add stronger cache expiration and invalidation rules.
- Add retry UI to any remaining vendor dashboard/error surfaces.
- Add automated tests around pagination merge behavior and expired-token handling.

### Key Files

- `context/ListingsContext.tsx`
- `context/CategoriesContext.tsx`
- `services/listingApi.ts`
- `services/categoryApi.ts`
- `app/(tabs)/index.tsx`
- `app/service-list.tsx`

## 5. Vendor Dashboard and Booking Management

### Current State

- Vendor dashboard shows listing counts.
- Pending listings are counted from vendor listings.
- Vendor dashboard now loads backend bookings and derives booking count, pending count, and expected revenue from booking totals.
- `Manage Bookings` opens a backend-driven vendor booking screen.
- Vendor bookings support status filtering, pull-to-refresh, pagination, empty states, retry messaging, and cancellation through the current API.
- Vendors can create, edit, submit, and archive listings.

### Improvements Needed

- Add a dedicated backend vendor metrics endpoint when dashboard analytics become more complex.
- Show rejected bookings after the backend adds a rejected booking status.
- Add booking status actions for accept, reject, and complete after matching backend endpoints are added.
- Add listing availability/calendar management.
- Add vendor notifications for new booking requests and listing approval changes.
- Add performance insights such as views, saves, inquiries, and bookings per listing.

### Key Files

- `app/vendor-dashboard.tsx`
- `app/vendor-bookings.tsx`
- `app/vendor-listings.tsx`
- `app/vendor-listing-form.tsx`
- `context/BookingsContext.tsx`
- `services/bookingApi.ts`
- `types/rental.ts`

## 6. Mobile Media Upload

### Current State

- Vendor listing form asks for an image URL.
- Listing creation sends media URL metadata to the backend.

### Improvements Needed

- Allow vendors to pick images from the gallery.
- Allow vendors to capture photos from the camera.
- Support multiple listing images.
- Show upload progress.
- Allow image reorder and delete.
- Compress images before upload if needed.
- Validate file type and size.
- Use uploaded media IDs or backend-returned URLs in listing creation.

### Key Files

- `app/vendor-listing-form.tsx`
- `services/listingApi.ts`
- Future media upload service

## 7. Registration, Login, and Location UX

### Current State

- Login supports email/password and two-factor verification.
- Registration supports customer/vendor role selection.
- Registration requires a manually selected map location.
- Tokens are stored securely on native devices.

### Improvements Needed

- Add inline validation before submitting forms.
- Disable submit until required fields are valid.
- Add password rule hints and password strength feedback.
- Add better handling for location permission denial.
- Allow current GPS location to satisfy registration when appropriate, or explain why manual confirmation is required.
- Add email verification prompts after registration.
- Add resend email verification action if supported by the backend.
- Improve two-factor UX with resend code, countdown, and code expiry messaging.
- Add consistent success states after login, registration, password reset, and 2FA changes.

### Key Files

- `app/login.tsx`
- `app/register.tsx`
- `app/location-picker.tsx`
- `app/forgot-password.tsx`
- `app/reset-password.tsx`
- `context/AuthContext.tsx`
- `context/LocationContext.tsx`

## 8. Mobile Polish and Accessibility

### Current State

- The app has a shared design system and reusable components.
- Shared screen layout uses safe-area context.
- Main shared cards and headers have stronger accessibility labels for icon-only actions.
- Shared listing/category cards handle image load failures with placeholders.
- Skeleton loading exists on listing-heavy screens.
- Important navigation/card actions use light haptic feedback.
- Some feature-specific screens still use hardcoded colors and one-off layout styles.

### Improvements Needed

- Continue replacing remaining plain spinners with skeleton states on smaller auth/vendor flows where useful.
- Continue auditing icon-only buttons in newly added screens.
- Continue checking tap targets while new controls are added.
- Add image fallback handling to any future custom image components.
- Validate safe-area behavior on physical Android and iOS devices.
- Continue normalizing older hardcoded colors into `constants/theme.ts`.
- Ensure long text, large prices, and long category names do not overflow.
- Review dark mode support and decide whether to fully support system color scheme or stay light-only.

### Key Files

- `constants/theme.ts`
- `components/AppHeader.tsx`
- `components/RoomCard.tsx`
- `components/CategoryCard.tsx`
- `components/CategoryItem.tsx`
- `components/Header.tsx`
- `components/Screen.tsx`
- `utils/haptics.ts`
- All main screens under `app/`

## 9. Map Integration Stability

### Current State

- The app imports `react-native-maps` through internal paths because the root import previously caused bundling issues.
- Map usage exists in the detail screen and location picker.

### Improvements Needed

- Centralize map imports in one wrapper module.
- Keep platform-specific provider behavior in one place.
- Add fallback UI when maps fail to render.
- Avoid repeating default Kathmandu coordinates across screens.
- Add map deep links for directions.
- Revisit the root `react-native-maps` import issue after dependency updates.

### Key Files

- `app/service-detail.tsx`
- `app/location-picker.tsx`
- Future shared map component or utility

## 10. Verification and Development Quality

### Current State

- The project defines `npm run lint`.
- TypeScript is configured.
- In the current Codex shell, `npm` and `npx` were not available on PATH, so lint/typecheck could not be run from that shell.

### Improvements Needed

- Run lint and TypeScript checks from a terminal where Node is available.
- Add focused tests for API mapping helpers.
- Add tests for auth context boot/session behavior where practical.
- Add app-flow tests for login, listing browse, detail view, and vendor listing creation.
- Add manual QA checklist for Android physical device, Android emulator, iOS simulator, and web if web remains supported.
- Add a release checklist covering environment variables, API URL, permissions, icons, splash screen, and production logging.

### Verification Commands

```bash
npm run lint
npx tsc --noEmit
npx expo start
```

## Suggested Implementation Order

### Phase 1: Customer Marketplace Core

- Functional search, filters, and sorting.
- Dynamic detail page content.
- Favorites persistence.
- Share and directions actions.
- Better listing empty/loading/error states.

### Phase 2: Booking and Contact

- Booking request API integration.
- Booking form and price summary.
- Customer booking history.
- Vendor booking request management.
- Basic vendor/customer messaging or contact flow.

### Phase 3: Vendor Completeness

- Real vendor dashboard metrics.
- Media upload for listings.
- Availability/calendar management.
- Listing performance insights.
- Notifications for booking and listing status changes.

### Phase 4: Production Readiness

- Accessibility pass.
- Skeleton loading and offline-friendly states.
- Map wrapper/fallback cleanup.
- Lint/typecheck/test coverage.
- Release QA checklist.

## Definition of Done

An improvement should be considered complete when:

- It uses real backend data or a clearly documented temporary mock.
- It has loading, empty, success, and error states.
- It works for both guest and authenticated users where relevant.
- It handles poor network conditions gracefully.
- It has basic verification through lint, typecheck, manual QA, or tests.
- It follows existing design tokens and component patterns.
