# Lumyn Delivery Mobile App

A React Native mobile application built with Expo for the Lumyn Delivery platform. Supports both **Customer** and **Driver** roles with role-specific workflows.

## Features

### For Customers
- Create new delivery requests with address picker
- View delivery history and status
- Track deliveries in real-time on map
- Manage saved addresses
- Secure payment via PESAPAL (integrated)

### For Drivers
- Driver onboarding & document upload
- Accept/decline delivery assignments
- Real-time delivery tracking
- View earnings dashboard
- Toggle online/offline availability

### Common
- Email/password authentication via Clerk
- Role-based navigation
- Push notifications
- Image upload (Cloudinary)
- Location tracking
- Real-time delivery status updates via polling

## Tech Stack

- **Framework:** React Native (Expo SDK 49+)
- **Navigation:** React Navigation 6 (Native Stack)
- **Auth:** Clerk Expo v2
- **Maps:** react-native-maps (OpenStreetMap tiles – completely free, no API key required)
- **HTTP Client:** Axios with interceptors
- **Storage:** Expo SecureStore
- **Push Notifications:** Expo Notifications
- **Image Picker:** Expo Image Picker
- **Payment:** PESAPAL via WebView checkout
- **Language:** TypeScript

## Project Structure

```
mobile/
├── App.tsx                       # Root component with navigation & auth guard
├── api/                          # API layer
│   ├── client.ts                 # Axios instance with auth interceptor
│   ├── deliveries.ts             # Delivery endpoints (includes payment init)
│   ├── driver.ts                 # Driver-specific endpoints
│   └── pricing.ts                # Pricing calculation
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Auth state & token management
│   └── useSSE.ts                 # Real-time delivery updates (polling)
├── screens/                      # App screens
│   ├── Auth/
│   │   ├── Login.tsx
│   │   └── SignUp.tsx
│   ├── HomeScreen.tsx
│   ├── DeliveriesScreen.tsx
│   ├── NewDeliveryScreen.tsx
│   ├── DeliveryDetailsScreen.tsx
│   ├── DriverDashboardScreen.tsx
│   ├── DriverOnboardingScreen.tsx
│   ├── MapScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── AddressesScreen.tsx
│   └── PaymentScreen.tsx         # PESAPAL WebView checkout
├── utils/                        # Utilities
│   ├── upload.ts                 # Cloudinary image upload
│   └── notifications.ts          # Push notification setup
├── types.ts                      # Shared TypeScript interfaces
└── app.config.js                 # Expo configuration
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (for Android) or Xcode (for iOS)

### 1. Clone & Install

```bash
cd mobile
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `mobile/` directory:

```env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
EXPO_PUBLIC_APP_URL=https://lumyn-delivery.vercel.app
```

**Note:** The backend must be deployed and accessible at `EXPO_PUBLIC_APP_URL`. No Google Maps API key is required – the app uses OpenStreetMap tiles.

### 3. Clerk Setup

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Enable **Email/Password** sign-in
4. Copy your **Publishable Key** to `.env`
5. Configure user metadata fields:
   - `role` (enum: ADMIN, DRIVER, CUSTOMER)
   - `isDriverActive` (boolean)
   - `isDriverVerified` (boolean)
   - `driverRating` (number)
   - `onboardingCompleted` (boolean)

### 4. Run the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run in web browser
npm run web
```

### 5. Build for Production

```bash
# Build development preview (internal distribution)
eas build --profile development --platform all

# Build production release (Play Store / App Store)
eas build --profile production --platform all

# Submit to stores
eas submit --platform all
```

## Payment Integration

The app integrates with **PESAPAL** for secure payment processing:

1. **Customer flow:** Creates a delivery → redirected to `PaymentScreen` → PESAPAL checkout WebView
2. **Initialization:** `POST /api/payments` on backend returns a `redirectUrl` to PESAPAL
3. **Polling:** PaymentScreen polls `GET /api/deliveries/:id` every 3s until `paymentStatus` becomes `PAID` or `FAILED`
4. **Webhook:** PESAPAL IPN webhook (`/api/payments/pesapal/ipn`) updates delivery `paymentStatus` on backend
5. **Success:** Customer sees confirmation and navigates to DeliveryDetails

**No SDK required** – uses WebView checkout, fully controlled by backend.

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pricing` | GET | Get pricing config |
| `/api/deliveries` | POST | Create delivery |
| `/api/deliveries` | GET | List deliveries |
| `/api/deliveries/:id` | GET | Get delivery details (polled for payment status) |
| `/api/payments` | POST | Initialize payment (returns PESAPAL redirectUrl) |
| `/api/driver/accept/:id` | POST | Accept delivery |
| `/api/driver/earnings` | GET | Get driver earnings |
| `/api/driver/location` | POST | Update driver location |
| `/api/drivers/available` | GET | Get available drivers |
| `/api/cloudinary-upload` | POST | Upload images |
| `/api/addresses` | GET/POST | CRUD addresses |
| `/api/drivers/apply` | POST | Submit driver application |

## Navigation Structure

### Auth Flow (Not Signed In)
- Login
- SignUp

### Customer Flow (role = CUSTOMER)
- Home
  - My Deliveries
  - Create Delivery
  - Live Map
  - Profile / Addresses
  - Sign Out

### Driver Flow (role = DRIVER)
- Home
  - My Deliveries
  - Driver Dashboard
  - Live Map
  - Profile
  - Driver Onboarding (if not completed)
  - Sign Out

## Role Assignment

Users are assigned roles via Clerk metadata. Contact an admin to set your role to DRIVER.

**Driver Onboarding Flow:**
1. Customer taps "Become a Driver" on Home
2. Completes 4-step wizard:
   - Personal info (pre-filled)
   - Vehicle details
   - Experience & bio
   - Document upload (ID, license, registration, insurance)
3. Admin approves via web dashboard
4. Driver can go online and accept deliveries

## Push Notifications

The app automatically subscribes to notifications upon login. Backend must implement:

- `POST /api/notifications/subscribe` - Store Expo push token
- Server sends notifications via Expo's push service

## Maps Implementation

**OpenStreetMap (OSM)** tiles are used via `react-native-maps` `UrlTile` component:
- No API key needed
- Free for commercial use
- Covers all zoom levels globally
- No quota limits

All map screens render OSM tiles:
- `MapScreen.tsx` – live tracking view
- `DeliveryDetailsScreen.tsx` – delivery route visualization
- `NewDeliveryScreen.tsx` – pickup/dropoff preview

## Known Limitations

- **Push Notifications:** Require EAS build to get Expo push token (dev client works with Expo Notifications)
- **Offline Mode:** Not implemented yet (queued actions on next sync)
- **Form Validation:** Basic, can be enhanced with Zod

## Troubleshooting

### TypeScript errors about `process`
Ensure `@types/node` is installed: `npm i -D @types/node`

### Module resolution errors
Clear cache: `npx expo start --clear`

### Build failures
Check EAS is logged in: `eas login`
Verify project ID in `app.config.js`

### Maps not loading
OSM tiles require internet connection. No API key configuration needed.

### Push token errors
Make sure EAS build has `projectId` in `extra` config (already set in `app.config.js`)

## Development Notes

### Adding New Screens
1. Create `screens/YourScreen.tsx`
2. Add to `RootStackParamList` in `App.tsx`
3. Add to appropriate role-based navigator
4. Import and include in navigator

### Modifying API client
Edit `api/client.ts` to add interceptors or base config.

### Adding Clerk metadata
Update `clerk-extensions.d.ts` to include new fields.

## License

Proprietary - Lumyn Delivery Platform
