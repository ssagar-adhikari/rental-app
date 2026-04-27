# Frontend Authentication Flow

## Overview

The mobile app uses the Laravel backend API for account registration, login, logout, password reset, profile loading, email verification status, two-factor authentication, and role-aware account display.

Authentication is token-based. After successful registration or login, the backend returns a JWT access token. The frontend stores that token securely and sends it on authenticated requests using the `Authorization: Bearer <token>` header.

## Key Files

- `services/authApi.ts`: API client, API URL resolution, token storage helpers, auth API functions
- `context/AuthContext.tsx`: app-wide auth state and auth actions
- `app/_layout.tsx`: wraps the app with `AuthProvider`
- `app/login.tsx`: login and 2FA verification screen
- `app/register.tsx`: account creation screen with customer/vendor role selection
- `app/forgot-password.tsx`: password reset request screen
- `app/reset-password.tsx`: password reset completion screen
- `app/(tabs)/profile.tsx`: authenticated profile, guest state, logout, and 2FA toggle
- `.env.local`: local API URL used by Expo

## API URL Configuration

The frontend reads the backend URL from:

```env
EXPO_PUBLIC_API_URL=http://172.16.10.222:8003/api
```

This is required for physical mobile devices. A phone cannot use `127.0.0.1` to reach the Laravel server because `127.0.0.1` points to the phone itself.

For local development:

1. Start Laravel on a network-accessible host:

```bash
php artisan serve --host=0.0.0.0 --port=8003
```

2. Set the Expo API URL:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8003/api
```

3. Restart Expo after changing `.env.local`:

```bash
npx expo start
```

## Token Storage

The app stores JWT tokens in:

- Native iOS/Android: `expo-secure-store`
- Web: `localStorage`

Token helper functions live in `services/authApi.ts`:

- `getStoredToken()`
- `storeToken(token)`
- `clearStoredToken()`

## App Boot Flow

1. `app/_layout.tsx` wraps the app in `AuthProvider`.
2. `AuthProvider` checks for a stored token.
3. If no token exists, the app remains in guest mode.
4. If a token exists, the app calls:

```http
GET /api/user
Authorization: Bearer <token>
```

5. If the token is valid, the user profile is loaded into global auth state.
6. If the token is invalid or expired, the stored token is cleared and the user becomes a guest.

## Registration Flow

Screen:

```text
app/register.tsx
```

User chooses:

- `customer`
- `vendor`

Request:

```http
POST /api/register
```

Payload:

```json
{
  "name": "Jane Customer",
  "email": "jane@example.com",
  "password": "StrongPass123",
  "password_confirmation": "StrongPass123",
  "role": "customer",
  "device_name": "ios app"
}
```

Frontend sequence:

1. User fills registration form.
2. `register()` from `AuthContext` calls `authApi.register()`.
3. Backend validates input and creates the account.
4. Backend returns JWT and user profile.
5. Frontend stores the JWT.
6. Frontend saves the user in auth state.
7. User is redirected to the profile tab.

Important password rule:

```text
Minimum 8 characters, uppercase, lowercase, and a number.
```

## Login Flow

Screen:

```text
app/login.tsx
```

Request:

```http
POST /api/login
```

Payload:

```json
{
  "email": "jane@example.com",
  "password": "StrongPass123",
  "device_name": "android app"
}
```

Frontend sequence:

1. User enters email and password.
2. `login()` from `AuthContext` calls `authApi.login()`.
3. If login succeeds without 2FA:
   - JWT is stored.
   - User profile is saved in auth state.
   - User is redirected to profile.
4. If backend requires 2FA:
   - Login screen switches to code entry mode.
   - User enters the emailed code.
   - Frontend calls `/api/2fa/verify`.
   - JWT is stored after successful verification.

## Two-Factor Authentication Flow

Enable/disable entry point:

```text
app/(tabs)/profile.tsx
```

Enable:

```http
POST /api/2fa/enable
Authorization: Bearer <token>
```

Disable:

```http
POST /api/2fa/disable
Authorization: Bearer <token>
```

Login with 2FA:

1. User submits email/password.
2. Backend returns:

```json
{
  "requires_two_factor": true,
  "challenge_token": "token",
  "expires_in": 600
}
```

3. Frontend shows the code input.
4. Frontend submits:

```http
POST /api/2fa/verify
```

```json
{
  "email": "jane@example.com",
  "challenge_token": "token",
  "code": "123456"
}
```

5. Backend returns JWT and user profile.
6. Frontend stores the token and updates auth state.

## Profile Flow

Screen:

```text
app/(tabs)/profile.tsx
```

Guest state:

- Shows sign-in prompt.
- Provides buttons for Login and Register.

Authenticated state:

- Shows name and email from backend.
- Shows role: `customer` or `vendor`.
- Shows email verification status.
- Shows 2FA status.
- Provides logout action.
- Provides enable/disable 2FA action.

## Logout Flow

Triggered from:

```text
app/(tabs)/profile.tsx
```

Request:

```http
POST /api/logout
Authorization: Bearer <token>
```

Frontend sequence:

1. User taps logout.
2. Frontend calls backend logout.
3. Backend invalidates JWT and revokes device session.
4. Frontend clears stored token.
5. Frontend clears user state.
6. Profile returns to guest mode.

If the backend logout request fails because the token is already expired, the frontend still clears local auth state.

## Password Reset Flow

Request reset screen:

```text
app/forgot-password.tsx
```

Request:

```http
POST /api/password/forgot
```

Payload:

```json
{
  "email": "jane@example.com"
}
```

Reset completion screen:

```text
app/reset-password.tsx
```

The backend email link points to:

```text
/reset-password?token=...&email=...
```

Reset request:

```http
POST /api/password/reset
```

Payload:

```json
{
  "email": "jane@example.com",
  "token": "reset-token",
  "password": "NewStrongPass123",
  "password_confirmation": "NewStrongPass123"
}
```

After password reset, backend revokes existing device sessions. The user must log in again.

## Error Handling

The API client unwraps backend validation errors and displays the first concrete error message.

Examples:

- `The email has already been taken.`
- `The password field confirmation does not match.`
- `The password field must contain at least one uppercase and one lowercase letter.`
- `Cannot connect to API at http://...`

If the frontend cannot reach Laravel, check:

1. Laravel is running:

```bash
php artisan serve --host=0.0.0.0 --port=8003
```

2. `.env.local` points to the machine LAN IP:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8003/api
```

3. Expo was restarted after changing `.env.local`.
4. Phone and computer are on the same network.
5. Firewall allows port `8003`.

## Role Behavior

During registration, the frontend only allows:

- `customer`
- `vendor`

The frontend never allows public registration as `admin`.

Current role display is in the profile screen. Future role-based UI can use:

```ts
user.roles.includes("vendor")
user.roles.includes("customer")
user.permissions.includes("product.create")
```

Suggested future UI split:

- Customer: bookings, favorites, rental history
- Vendor: listing management, booking requests, provider dashboard
- Admin: keep in Laravel backend panel unless intentionally exposed to mobile

## Security Notes

- JWT is stored in SecureStore on native devices.
- API requests use bearer tokens.
- Passwords never live in frontend state longer than the current form session.
- Registration and login rely on backend validation.
- Mobile API requests do not need CSRF because they use bearer tokens, not browser cookies.
- The app should avoid logging tokens or full API responses in production.
