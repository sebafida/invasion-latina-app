import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { warmupBackend } from '../config/api';
import { registerForPushNotifications } from '../config/notifications';
import logger from '../config/logger';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  loyalty_points: number;
  badges: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean; // BUG 4 FIX: Flag to prevent race condition
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticating: (value: boolean) => void; // BUG 4 FIX
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false); // BUG 4 FIX: Flag to prevent race condition

  const login = async (email: string, password: string, retryCount = 0) => {
    try {
      setIsLoading(true);
      console.log(`Login attempt... (try ${retryCount + 1})`);
      const response = await api.post('/auth/login', { email, password }, { timeout: 15000 });
      
      const { access_token, id, email: userEmail, name, role, loyalty_points, badges } = response.data;
      
      if (!access_token || !id) {
        throw new Error('Invalid response from server');
      }
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('auth_version', 'supabase_v3');
      
      setTokenState(access_token);
      setUserState({ 
        id, 
        email: userEmail, 
        name, 
        role, 
        loyalty_points: loyalty_points || 0, 
        badges: badges || [] 
      });
      setIsAuthenticated(true);
      logger.log('Login successful!');
      
      // 2.2 - Activer les notifications push après login
      registerForPushNotifications().catch(err => {
        logger.error('Push notification registration failed:', err);
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Retry on network errors (not on 401/403)
      if (!error.response && retryCount < 2) {
        console.log(`Login: Network error, retrying in 1 second...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return login(email, password, retryCount + 1);
      }
      
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        phone: phone || '',
        accept_marketing: acceptMarketing || false,
        role: 'user',
      });
      
      const { access_token, user_id } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('auth_version', 'supabase_v3'); // BUG 3 FIX
      
      setTokenState(access_token);
      setUserState({ id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] });
      setIsAuthenticated(true);
      logger.log('Registration successful!');
      
      // 2.2 - Activer les notifications push après register
      registerForPushNotifications().catch(err => {
        logger.error('Push notification registration failed:', err);
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('cached_user_data');
    setUserState(null);
    setTokenState(null);
    setIsAuthenticated(false);
  };

  const loadUser = async () => {
    // BUG 4 FIX: Skip loadUser if currently authenticating (social login in progress)
    if (isAuthenticating) {
      console.log('loadUser: Skipped - authentication in progress');
      return;
    }
    
    try {
      console.log('loadUser: Checking for stored token...');
      
      // Check if we need to clear old tokens (after database migration)
      const AUTH_VERSION = 'supabase_v3'; // Incremented to force re-login for all users
      const storedAuthVersion = await AsyncStorage.getItem('auth_version');
      
      if (storedAuthVersion !== AUTH_VERSION) {
        console.log('loadUser: Auth version changed - clearing old token');
        await AsyncStorage.removeItem('auth_token');
        await AsyncStorage.setItem('auth_version', AUTH_VERSION);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      
      if (!storedToken) {
        console.log('loadUser: No token - show login page');
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      console.log('loadUser: Token found - verifying...');
      
      try {
        // Use a longer timeout for token verification (cold start can take 10-15s)
        const response = await api.get('/auth/me', { timeout: 20000 });
        setUserState(response.data);
        setTokenState(storedToken);
        setIsAuthenticated(true);
        // Cache user data for offline use
        await AsyncStorage.setItem('cached_user_data', JSON.stringify(response.data));
        console.log('loadUser: Token valid - user authenticated');
      } catch (error: any) {
        console.log('loadUser: Token verification failed -', error.message);
        
        // Only clear token on 401 (truly invalid/expired token)
        // 503 = server temporarily down, network error = connectivity issue
        // Both should keep the token for retry
        if (error.response?.status === 401) {
          console.log('loadUser: Token invalid (401) - clearing auth data');
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('cached_user_data');
          setUserState(null);
          setTokenState(null);
          setIsAuthenticated(false);
        } else {
          // Network error, timeout, OR 503 - KEEP token and try cached data
          console.log('loadUser: Temporary error (not 401) - keeping token');
          setTokenState(storedToken);
          const cachedUserData = await AsyncStorage.getItem('cached_user_data');
          if (cachedUserData) {
            try {
              setUserState(JSON.parse(cachedUserData));
              setIsAuthenticated(true);
              console.log('loadUser: Using cached user data');
            } catch {
              setIsAuthenticated(false);
            }
          } else {
            // No cache - still keep token, set not authenticated but DON'T delete token
            // Next foreground event will retry
            setIsAuthenticated(false);
            console.log('loadUser: No cache available, will retry on next foreground');
          }
        }
      }
    } catch (error) {
      console.error('loadUser error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  };

  const setToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem('auth_token', newToken);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const { warmupBackend } = require('../config/api');
        await warmupBackend();
      } catch (e) {
        console.log('Initial warmup failed, continuing anyway');
      }
      loadUser();
    };
    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAuthenticating,
        login,
        register,
        logout,
        loadUser,
        setUser,
        setToken,
        setIsAuthenticating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
