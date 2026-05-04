import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import Constants from 'expo-constants';

// Set up notification handler (called on receipt while app is foregrounded)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notifications!');
    return undefined;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ? Constants.expoConfig.extra.eas.projectId : undefined;
  
  if (Platform.OS === 'android' && !projectId) {
    alert('Failed to get project ID for push notifications!');
    return undefined;
  }

  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  return token;
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: { seconds: 1 } as any, // TS workaround – acceptable for local notifications
  });
}

export async function subscribeToNotifications(userId: string): Promise<void> {
  try {
    const token = await registerForPushNotificationsAsync();
    if (!token) return;

    const baseUrl = __DEV__ ? 'http://localhost:3000' : 'https://lumyn-delivery.vercel.app';
    await fetch(`${baseUrl}/api/notifications/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, expoPushToken: token }),
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
  }
}

export function useNotificationListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped:', data);
      // Handle navigation based on notification data
      if (data.type === 'new_delivery' && data.deliveryId) {
        // Navigate to delivery details
      }
    });

    return () => subscription.remove();
  }, []);
}
