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

// Handle response errors with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Retry once on timeout or network error (backend might be waking up)
    if (!error.response && !originalRequest._retry) {
      originalRequest._retry = true;
      logger.log('API: Retrying request after network error...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
      return api(originalRequest);
    }
    
    // Only clear auth on 401 (invalid/expired token)
    // NOT on network errors or timeouts
    if (error.response?.status === 401) {
      logger.log('API: Token invalid (401) - clearing auth data');
      await AsyncStorage.removeItem('auth_token');
      // Don't remove auth_version here - let loadUser handle it
    } else if (!error.response) {
      // Network error or timeout
      logger.log('API: Network error or timeout -', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;