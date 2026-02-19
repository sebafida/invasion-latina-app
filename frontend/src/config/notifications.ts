import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
    // Get Expo push token
    const response = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // This is optional in most cases
    });
    token = response.data;
    console.log('Push token:', token);

    // Store locally
    await AsyncStorage.setItem('push_token', token);

    // Send to backend to store in user profile
    try {
      await api.put('/users/push-token', { push_token: token });
    } catch (error) {
      console.log('Failed to save push token to server:', error);
    }
  } catch (error) {
    console.log('Error getting push token:', error);
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
