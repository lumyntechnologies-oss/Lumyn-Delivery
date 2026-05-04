export default ({ config }) => ({
  ...config,
  slug: 'lumyndelivery-mobile',
  name: 'Lumyn Delivery',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#007AFF',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.lumyn.delivery',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'Lumyn Delivery needs your location to track deliveries and find nearby drivers.',
      NSLocationAlwaysUsageDescription: 'Lumyn Delivery needs your location to provide real-time delivery tracking.',
      NSCameraUsageDescription: 'Lumyn Delivery needs camera access to upload identification documents for driver verification.',
      NSPhotoLibraryUsageDescription: 'Lumyn Delivery needs photo library access to upload images for deliveries and driver verification.',
      UIBackgroundModes: ['location', 'fetch'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#007AFF',
    },
    package: 'com.lumyn.delivery',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'CAMERA',
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'RECEIVE_BOOT_COMPLETED',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location to track deliveries and find nearby drivers.',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#007AFF',
        sounds: [],
      },
    ],
  ],
  extra: {
    eas: {
      projectId: '85cbf6ae-1310-4309-bdd7-546f04902af6',
    },
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
});
