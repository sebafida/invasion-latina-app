import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from './api';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification listeners
let notificationListener: any = null;
let responseListener: any = null;

export const setupNotificationListeners = (onNotificationReceived?: (notification: any) => void, onNotificationResponse?: (response: any) => void) => {
  // Clean up existing listeners
  if (notificationListener) {
    Notifications.removeNotificationSubscription(notificationListener);
  }
  if (responseListener) {
    Notifications.removeNotificationSubscription(responseListener);
  }

  // Listener for notifications received while app is in foreground
  notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('📬 Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user taps on notification
  responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  return () => {
    if (notificationListener) {
      Notifications.removeNotificationSubscription(notificationListener);
    }
    if (responseListener) {
      Notifications.removeNotificationSubscription(responseListener);
    }
  };
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  let token = null;

  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  try {
    // Get project ID from app config (EAS builds)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // Get Expo push token
    const response = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = response.data;
    console.log('✅ Push token obtained:', token);

    // Store locally
    await AsyncStorage.setItem('push_token', token);

    // Send to backend to store in user profile
    try {
      await api.put('/users/push-token', { push_token: token });
      console.log('✅ Push token saved to server');
    } catch (error) {
      console.log('❌ Failed to save push token to server:', error);
      // Retry once after 2 seconds
      setTimeout(async () => {
        try {
          await api.put('/users/push-token', { push_token: token });
          console.log('✅ Push token saved to server (retry)');
        } catch (retryError) {
          console.log('❌ Push token retry failed:', retryError);
        }
      }, 2000);
    }
  } catch (error) {
    console.log('❌ Error getting push token:', error);
  }

  // Configure for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
};

export const sendLocalNotification = async (title: string, body: string, data?: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediate
  });
};

export const getPushToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('push_token');
};

export default {
  registerForPushNotifications,
  sendLocalNotification,
  getPushToken,
};
