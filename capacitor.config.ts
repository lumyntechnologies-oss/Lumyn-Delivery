import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumyn.delivery',
  appName: 'LumynDelivery',
  webDir: 'public',
  server: {
    // Production URL - change to your deployed Vercel app
    url: 'https://lumyn-delivery.vercel.app',
    cleartext: false
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Geolocation: {
      permissions: ['location']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
