import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

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
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      console.log('Login successful!');
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
      
      setTokenState(access_token);
      setUserState({ id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] });
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setUserState(null);
    setTokenState(null);
    setIsAuthenticated(false);
  };

  const loadUser = async () => {
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
        // Use a shorter timeout for token verification
        const response = await api.get('/auth/me', { timeout: 10000 });
        setUserState(response.data);
        setTokenState(storedToken);
        setIsAuthenticated(true);
        console.log('loadUser: Token valid - user authenticated');
      } catch (error: any) {
        console.log('loadUser: Token verification failed -', error.message);
        
        // Only clear token on 401 (invalid/expired token)
        // For network errors, keep the token and try again later
        if (error.response?.status === 401) {
          console.log('loadUser: Token invalid (401) - clearing auth data');
          await AsyncStorage.removeItem('auth_token');
          setUserState(null);
          setTokenState(null);
          setIsAuthenticated(false);
        } else {
          // Network error or timeout - KEEP token AND keep user authenticated
          // The user can continue using the app, and we'll verify again when network is back
          console.log('loadUser: Network error - keeping token, keeping user authenticated');
          setTokenState(storedToken);
          // Try to get cached user data if available
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
            // No cached data, but keep token for retry
            setIsAuthenticated(false);
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
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        loadUser,
        setUser,
        setToken,
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
