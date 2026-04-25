# Lumyn Delivery - Android Mobile App Setup

## 📱 APK Location

**Debug APK**: `LumynDelivery-debug.apk` (9.8 MB) - Ready to install

**Source**: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🚀 Quick Install

1. Transfer the APK to your Android device
2. Enable "Install from unknown sources" in Settings > Security
3. Open the APK file and install
4. Launch the app - it will load `https://lumyn-delivery.vercel.app`

## 🔧 Configuration

### Current Setup

The app is configured to load your production Vercel deployment:
- **URL**: `https://lumyn-delivery.vercel.app`
- **App ID**: `com.lumyn.delivery`
- **App Name**: `LumynDelivery`

### Native Features Enabled

- 📷 **Camera** - For document upload (driver onboarding)
  - Permissions: `CAMERA`, `WRITE_EXTERNAL_STORAGE` (Android 28-), `READ_EXTERNAL_STORAGE` (Android 32-)
  - Used in: `/driver-onboarding` page for license, ID, and vehicle documents
  
- 📍 **Geolocation** - For real-time driver tracking
  - Permissions: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
  - Used in: `LiveMap` component, driver location updates via WebSocket
  
- 🔔 **Push Notifications** - Delivery updates
  - Permissions: `POST_NOTIFICATIONS` (Android 13+)
  - Uses Capacitor Push Notifications plugin (native)
  - No service worker required (PWA removed)

**Note**: PWA (progressive web app) features have been removed since the native Android app provides a better experience. Web users can still access the fully functional web app and install the native APK via the "Download App" page.

## 🔄 Building from Source

### Prerequisites
- Node.js 18+
- Java JDK 21
- Android SDK (automatically downloaded by Gradle)

### Build Commands

```bash
# Install dependencies
npm install

# Sync Capacitor (copy web assets to Android project)
npx cap sync android

# Build debug APK
cd android && ./gradlew assembleDebug

# Build release APK (for Play Store)
cd android && ./gradlew assembleRelease
```

### Output Locations

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 📋 Release Build (Google Play Store)

To publish to Google Play, you need:

1. **Generate a signing key**:
```bash
keytool -genkey -v -keystore lumyn-delivery.keystore -alias lumyn-delivery -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing in `android/gradle.properties`**:
```
MYAPP_RELEASE_STORE_FILE=lumyn-delivery.keystore
MYAPP_RELEASE_KEY_ALIAS=lumyn-delivery
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

3. **Update `android/app/build.gradle`** signing configs

4. **Build release APK**:
```bash
cd android && ./gradlew assembleRelease
```

## 🔔 Push Notifications Setup

The app uses web push notifications. Ensure your Vercel deployment has:

1. **VAPID keys** in environment variables:
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

2. **Service Worker** - Already configured via `@ducanh2912/next-pwa`

3. **User permission** - Users must grant notification permission in the app

## 🔄 Updating the App

When you deploy updates to `https://lumyn-delivery.vercel.app`:

1. Re-sync Capacitor:
```bash
npx cap sync android
```

2. Rebuild the APK

3. Users need to install the new version

**Note**: Since the app loads from a remote URL, web updates are instantly available without app updates. Only native code changes require new APK builds.

## 🐛 Troubleshooting

### APK won't install
- Enable "Unknown sources" in Android settings
- Check `Settings > Apps > Special access > Install unknown apps`

### App shows blank screen
- Ensure `https://lumyn-delivery.vercel.app` is accessible
- Check Android manifest has INTERNET permission (`android/app/src/main/AndroidManifest.xml`)
A?
### Camera/GPS not working
- GraAnt permissions when prompted
- Check app permissions in Android Settings > Apps > LumynDelivery

### Push notifications not arriving
- Verify VAPID keys are set in Vercel environment
- User must accept notification permission
- Check browser console for service worker errors

## 📱 App Icon & Branding

- App icons are in `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Replace with your branded icons (512x512 recommended)
- If your app icon appears as a default Android icon, run:
```bash
npx cap sync android
```

## 🔐 Security Notes

- **Debug APK** is for testing only
- **Release APK** must be signed before Play Store submission
- The app uses HTTPS to connect to your backend
- All authentication is handled by Clerk (same as web app)
- API keys are stored server-side (Next.js API routes)

## 📞 Support

For issues, check:
- Capacitor docs: https://capacitorjs.com/docs
- Next.js PWA: https://github.com/ducanh2912/next-pwa
- Your web app logs in Vercel dashboard

---

## 📱 Access the Mobile App Page

Users can access the mobile app download page from the web app:

1. Visit the **"Download App"** link in the top navigation bar
2. Or go directly to: `https://lumyn-delivery.vercel.app/mobile-app`

The page includes:
- Direct APK download button (13 MB)
- QR code for scanning with phone
- Step-by-step installation instructions
- Feature highlights (Camera, GPS, Push Notifications, Offline, Security)
- Link back to the web app

**Note**: The PWA (Progressive Web App) has been removed in favor of the native Android APK. Web users should use the regular web app or install the native mobile app for full device integration.

---

**Version**: 1.0.0-debug  
**Built**: 2026-04-26  
**Framework**: Capacitor 8 (Android)  
**Web Engine**: Next.js 16 + React 19  
**PWA Status**: Removed (native mobile app only)
