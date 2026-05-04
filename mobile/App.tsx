import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClerkProvider } from '@clerk/clerk-expo';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Text } from 'react-native';
import Constants from 'expo-constants';
import { useRNMobileAuth } from './hooks/useAuth';
import { subscribeToNotifications } from './utils/notifications';
import HomeScreen from './screens/HomeScreen';
import DeliveriesScreen from './screens/DeliveriesScreen';
import DriverDashboardScreen from './screens/DriverDashboardScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoginScreen from './screens/Auth/Login';
import SignUpScreen from './screens/Auth/SignUp';
import NewDeliveryScreen from './screens/NewDeliveryScreen';
import DeliveryDetailsScreen from './screens/DeliveryDetailsScreen';
import DriverOnboardingScreen from './screens/DriverOnboardingScreen';
import AddressesScreen from './screens/AddressesScreen';
import PaymentScreen from './screens/PaymentScreen';

const tokenCache = {
  getToken: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  saveToken: (key: string, token: string): Promise<void> => {
    return SecureStore.setItemAsync(key, token);
  },
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  Deliveries: undefined;
  DriverDashboard: undefined;
  Map: undefined;
  Profile: undefined;
  NewDelivery: undefined;
  DeliveryDetails: { deliveryId: string };
  DriverOnboarding: undefined;
  Addresses: undefined;
  Payment: { deliveryId: string; tipAmount: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainApp() {
  const { isSignedIn, isLoaded, user } = useRNMobileAuth();

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  useEffect(() => {
    if (isSignedIn && user) {
      subscribeToNotifications(user.id);
    }
  }, [isSignedIn, user]);

  async function registerForPushNotificationsAsync() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Failed to get push token!');
    }
  }

  if (!isLoaded) {
    return <Text>Loading...</Text>;
  }

  // Role-based navigation configuration
  const customerScreens = (
    <>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} />
      <Stack.Screen name="NewDelivery" component={NewDeliveryScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Addresses" component={AddressesScreen} />
    </>
  );

  const driverScreens = (
    <>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} />
      <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} />
      <Stack.Screen name="DeliveryDetails" component={DeliveryDetailsScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      {user?.onboardingCompleted ? null : (
        <Stack.Screen name="DriverOnboarding" component={DriverOnboardingScreen} />
      )}
    </>
  );

  const authScreens = (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </>
  );

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
        {!isSignedIn ? (
          authScreens
        ) : user?.role === 'DRIVER' ? (
          driverScreens
        ) : (
          customerScreens
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const PUBLISHABLE_KEY = Constants.expoConfig?.extra?.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder';

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <MainApp />
    </ClerkProvider>
  );
}

