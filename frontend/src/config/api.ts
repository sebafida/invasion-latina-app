import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get backend URL from environment
// Try multiple sources for the backend URL
const getBackendUrl = () => {
  // 1. Try process.env (EAS Build environment variables)
  if (process.env.EXPO_PUBLIC_BACKEND_URL) {
    return process.env.EXPO_PUBLIC_BACKEND_URL;
  }
  
  // 2. Try Constants.expoConfig.extra
  if (Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL) {
    return Constants.expoConfig.extra.EXPO_PUBLIC_BACKEND_URL;
  }
  
  // 3. Fallback to hardcoded URL for production
  return 'https://invasionlatina.preview.emergentagent.com';
};

const BACKEND_URL = getBackendUrl();

console.log('API Config - Backend URL:', BACKEND_URL);

// Create axios instance
export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000, // 30 secondes au lieu de 10
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('auth_token');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;