# Mobile App — Architectural Gaps

Companion to [`mobile-app-improvement-roadmap.md`](./mobile-app-improvement-roadmap.md). The roadmap is feature-focused; this doc is **structural** — what scaffolding is missing that will hurt as the app grows.

Items are ordered by leverage: things that make every later change easier should land first.

---

## 1. Tests & CI (P0 — foundational)

**State:** No `__tests__/`, no Jest config, no `@testing-library/react-native`, no `.github/workflows/`.

**Add:**
- `jest.config.js` + `jest.setup.js` with `jest-expo` preset.
- `@testing-library/react-native` + `@testing-library/jest-native`.
- A first batch of tests:
  - `utils/formValidation.test.ts` — pure functions, easiest start.
  - `utils/listingFilters.test.ts`
  - `context/AuthContext.test.tsx` — login → token storage → role resolution.
  - `services/authApi.test.ts` — mocked fetch, ApiError shape.
- `.github/workflows/mobile-ci.yml` running `npm ci`, `npm run lint`, `tsc --noEmit`, `npm test`.

**Why first:** every refactor below is safer with a green check.

---

## 2. Environment configuration (P0)

**State:** API URL appears to be hardcoded; no `app.config.ts`, no `.env` strategy.

**Add:**
- Convert `app.json` → `app.config.ts`.
- Read API base URL, Sentry DSN, Maps key from `process.env.EXPO_PUBLIC_*`.
- `.env.development`, `.env.staging`, `.env.production` (gitignored), `.env.example` (committed).
- Surface config via `Constants.expoConfig.extra` in a single `config.ts`.

---

## 3. Error & loading primitives (P0)

**State:** `components/` has UI primitives but no shared error/empty/loading states. Each screen reinvents them.

**Add:**
- `components/ErrorBoundary.tsx` — wrap `_layout.tsx` so a render error doesn't blank the app.
- `components/EmptyState.tsx`, `components/ErrorState.tsx`, `components/LoadingState.tsx`.
- `components/Avatar.tsx`, `components/PriceTag.tsx`, `components/RatingStars.tsx`, `components/Stepper.tsx`.
- `components/BottomSheet.tsx` (use `@gorhom/bottom-sheet`).

---

## 4. Server state management (P1)

**State:** Four contexts (`Listings`, `Categories`, `Bookings`, `Auth`) own server data manually — refetching, caching, loading flags reimplemented per context.

**Add:**
- `@tanstack/react-query` for all server data (listings, categories, bookings).
- Keep `AuthContext` and `LocationContext` as React context — they own client state.
- Benefits: dedup, stale-while-revalidate, background refresh, retries, pagination hooks.

---

## 5. Networking & offline (P1)

**State:** No network detection, no retry strategy, no queue.

**Add:**
- `@react-native-community/netinfo` + a top-level offline banner.
- React Query's `onlineManager` integration so mutations queue while offline.
- Standardize all API calls through one `apiClient.ts` with:
  - Auth header injection.
  - 401 → token refresh → retry.
  - Centralized `ApiError` parsing.

---

## 6. Push notifications (P1)

**State:** `expo-notifications` not installed.

**Add:**
- `expo-notifications` + permissions flow on first launch.
- Register device token with backend (`POST /devices` endpoint needed on backend).
- Notification categories: booking updates, vendor inbox, marketing (opt-in).
- Foreground handler + tap-to-deeplink.

---

## 7. Image upload pipeline (P1)

**State:** Vendor listing form accepts URL strings only.

**Add:**
- `expo-image-picker` (camera + library).
- `expo-image-manipulator` for client-side resize.
- Upload to backend `POST /vendor/listings/{id}/media` (multipart).
- Progress UI + retry on failure.
- Optimistic preview while uploading.

---

## 8. Deep linking (P1)

**State:** `expo-linking` installed but no scheme/universal-link config.

**Add:**
- Scheme + Apple Universal Links + Android App Links in `app.config.ts`.
- Handle these paths:
  - `/email/verify/{id}/{hash}` (email verification redirect)
  - `/password/reset?token=…` (password reset)
  - `/listings/{slug}` (share links)
  - `/bookings/{number}` (notification taps)
- Test matrix: cold start, warm start, in-app navigation.

---

## 9. Missing screens (P1 / P2)

Domain features that have no route file yet:

| Screen | Route | Priority |
| --- | --- | --- |
| Booking detail | `/bookings/[id].tsx` | P1 |
| Checkout / payment | `/checkout/[bookingId].tsx` | P1 |
| Favorites / wishlist | `/(tabs)/favorites.tsx` | P1 |
| Notifications inbox | `/notifications.tsx` | P1 |
| Chat list | `/messages/index.tsx` | P2 |
| Chat thread | `/messages/[conversationId].tsx` | P2 |
| Reviews on listing | section on `service-detail.tsx` | P2 |
| Write review | `/reviews/new.tsx` | P2 |
| Vendor earnings | `/vendor-earnings.tsx` | P2 |
| Support / dispute | `/support.tsx` | P3 |

Backend schema for chat, favorites, notifications is also missing — see backend gaps doc.

---

## 10. Observability (P1)

**State:** No analytics, no crash reporting, no logging strategy.

**Add:**
- `sentry-expo` for crash + performance.
- A small analytics wrapper (`utils/analytics.ts`) that fans out to PostHog or Firebase. Track:
  - Auth events (login, register, logout, 2FA challenge).
  - Booking funnel (view listing → book → confirm → pay).
  - Search (query, filter applied, result clicked).
  - Errors (with category).
- A debug log sink behind `__DEV__` so logs don't ship to prod.

---

## 11. Accessibility & polish (P2)

**State:** Some screens have `accessibilityLabel` (login back button, password toggle), but inconsistent.

**Add:**
- Audit all `TouchableOpacity` for `accessibilityLabel` + `accessibilityRole`.
- Verify color contrast against WCAG AA (theme.ts colors).
- `Dynamic Type` / `Allow Font Scaling` honored across `Typography`.
- Reduced-motion support on Reanimated animations.
- A simple `eslint-plugin-react-native-a11y` to catch the obvious cases.

---

## 12. i18n (P2)

**State:** All strings inline.

**Add:**
- `expo-localization` + `i18next` (or `react-intl`).
- Extract one screen at a time into `locales/en.json`.
- Even staying English-only, this kills "magic strings" and makes copy review easy.

---

## 13. Type contracts with backend (P2)

**State:** `types/rental.ts` is hand-written and will drift from API.

**Add:**
- Once backend ships an OpenAPI spec, run `openapi-typescript` to generate `types/api.d.ts`.
- Wrap each endpoint with the generated types in `services/*.ts`.

---

## 14. Smaller cleanups (P3)

- `app/(tabs)/profile.tsx` — currently thin; should host devices/sessions, 2FA settings, role switcher.
- `services/` files duplicate fetch boilerplate — extract `apiClient.ts`.
- `components/ui/` (referenced) — audit what's there vs above primitives list.
- Move screen-local types out of route files into `types/` once shared.

---

## Suggested order

**Sprint 1 (foundation):** 1, 2, 3, 5, 10
**Sprint 2 (revenue + retention):** 7, 6, 8, screens for booking detail + checkout + notifications
**Sprint 3 (engagement):** 4 (React Query migration), favorites + reviews screens, messaging
**Sprint 4 (polish):** 11, 12, 13, 14

Each sprint should land green CI (#1) before moving to the next.
