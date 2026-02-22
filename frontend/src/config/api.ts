import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from './logger';

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
  return 'https://invasion-latina-app-production.up.railway.app';
};

const BACKEND_URL = getBackendUrl();

logger.log('API Config - Backend URL:', BACKEND_URL);

// Create axios instance
export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ WARMUP BACKEND (Cold Start Fix) ============
let lastWarmupTime = 0;
const WARMUP_COOLDOWN = 30000; // Don't warmup more than once per 30 seconds

export const warmupBackend = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - lastWarmupTime < WARMUP_COOLDOWN) {
    console.log('Warmup: Skipped (warmed up recently)');
    return true;
  }

  console.log('Warmup: Waking up backend...');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      // Use /api/ping first (no DB), then /api/health to warm up DB
      await axios.get(`${BACKEND_URL}/api/ping`, { timeout: 10000 });
      console.log(`Warmup: Server awake (attempt ${attempt}), warming DB...`);
      await axios.get(`${BACKEND_URL}/api/health`, { timeout: 20000 });
      lastWarmupTime = Date.now();
      console.log(`Warmup: Backend + DB ready`);
      return true;
    } catch (error: any) {
      console.log(`Warmup: Attempt ${attempt}/3 failed -`, error.message);
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
  console.log('Warmup: Backend not responding after 3 attempts');
  return false;
};

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

// Handle response errors - DO NOT remove token here, let AuthContext handle it
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('API: Received 401 - token may be invalid');
      // Do NOT remove token here - let AuthContext.loadUser() handle it
      // This prevents race conditions with multiple simultaneous requests
    } else if (error.response?.status === 503) {
      console.log('API: Server temporarily unavailable (503)');
    } else if (!error.response) {
      console.log('API: Network error or timeout -', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;