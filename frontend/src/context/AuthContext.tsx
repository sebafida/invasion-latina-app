import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  loyalty_points: number;
  badges: string[];
}

// Auth states:
// 'loading' - checking stored token
// 'unauthenticated' - no token or token invalid, show login page
// 'locked' - has valid token, need Face ID to unlock
// 'authenticated' - fully authenticated, show app
type AuthState = 'loading' | 'unauthenticated' | 'locked' | 'authenticated';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authState: AuthState;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  unlockWithBiometrics: () => Promise<boolean>;
  setIsLocked: (locked: boolean) => void;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key to track if user just logged in (persisted briefly)
const JUST_LOGGED_IN_KEY = 'just_logged_in';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');

  // Computed values for backward compatibility
  const isLoading = authState === 'loading';
  const isAuthenticated = authState === 'locked' || authState === 'authenticated';
  const isLocked = authState === 'locked';

  const login = async (email: string, password: string) => {
    try {
      setAuthState('loading');
      console.log('Login attempt...');
      const response = await api.post('/auth/login', { email, password });
      
      const { access_token, id, email: userEmail, name, role, loyalty_points, badges } = response.data;
      
      if (!access_token || !id) {
        throw new Error('Invalid response from server');
      }
      
      // Save token
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Mark that user just logged in - this prevents Face ID on next app open
      await AsyncStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
      
      setTokenState(access_token);
      setUserState({ 
        id, 
        email: userEmail, 
        name, 
        role, 
        loyalty_points: loyalty_points || 0, 
        badges: badges || [] 
      });
      
      // After fresh login - go directly to app, NO Face ID
      setAuthState('authenticated');
      console.log('Login successful - authState set to authenticated');
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState('unauthenticated');
      throw new Error(error.response?.data?.detail || error.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => {
    try {
      setAuthState('loading');
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
      
      // Mark that user just registered - this prevents Face ID on next app open
      await AsyncStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
      
      setTokenState(access_token);
      setUserState({ id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] });
      
      // After fresh registration - go directly to app, NO Face ID
      setAuthState('authenticated');
    } catch (error: any) {
      setAuthState('unauthenticated');
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem(JUST_LOGGED_IN_KEY);
    setUserState(null);
    setTokenState(null);
    setAuthState('unauthenticated');
  };

  const unlock = () => {
    // Called after successful Face ID
    setAuthState('authenticated');
  };

  // Called at app startup to check if user was previously logged in
  const loadUser = async () => {
    try {
      console.log('loadUser: Starting...');
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      const justLoggedIn = await AsyncStorage.getItem(JUST_LOGGED_IN_KEY);
      
      console.log('loadUser: Token exists:', !!storedToken, 'Just logged in:', justLoggedIn);
      
      // No token = never logged in or logged out
      if (!storedToken) {
        console.log('loadUser: No token - show login page');
        setAuthState('unauthenticated');
        return;
      }
      
      // If user just logged in, clear the flag and go directly to app
      if (justLoggedIn === 'true') {
        console.log('loadUser: Just logged in flag found - skip Face ID');
        await AsyncStorage.removeItem(JUST_LOGGED_IN_KEY);
        
        // Verify token and go to app
        try {
          const response = await api.get('/auth/me');
          setUserState(response.data);
          setTokenState(storedToken);
          setAuthState('authenticated');
          console.log('loadUser: Token valid - going directly to app');
        } catch (error) {
          console.log('loadUser: Token invalid after login - show login');
          await AsyncStorage.removeItem('auth_token');
          setAuthState('unauthenticated');
        }
        return;
      }
      
      // RETURNING USER (app was closed and reopened)
      console.log('loadUser: Returning user - verifying token...');
      
      try {
        const response = await api.get('/auth/me');
        setUserState(response.data);
        setTokenState(storedToken);
        
        // Check if biometrics are available
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        console.log('loadUser: Biometrics available:', hasHardware && isEnrolled);
        
        if (hasHardware && isEnrolled) {
          // RETURNING USER with biometrics - show Face ID lock
          console.log('loadUser: Showing Face ID screen');
          setAuthState('locked');
        } else {
          // No biometrics - go directly to app
          console.log('loadUser: No biometrics - going to app');
          setAuthState('authenticated');
        }
      } catch (error) {
        // Token invalid - clear and show login
        console.log('loadUser: Token invalid - show login');
        await AsyncStorage.removeItem('auth_token');
        setUserState(null);
        setTokenState(null);
        setAuthState('unauthenticated');
      }
    } catch (error) {
      console.error('loadUser error:', error);
      setAuthState('unauthenticated');
    }
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouiller Invasion Latina',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
        fallbackLabel: 'Utiliser le code',
      });

      if (result.success) {
        setAuthState('authenticated');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric auth error:', error);
      setAuthState('authenticated');
      return true;
    }
  };

  // For backward compatibility
  const setIsLocked = (locked: boolean) => {
    if (locked) {
      setAuthState('locked');
    } else {
      setAuthState('authenticated');
    }
  };

  // Custom setUser that also updates auth state
  const setUser = (newUser: User | null) => {
    setUserState(newUser);
    if (newUser && authState !== 'authenticated') {
      setAuthState('authenticated');
    } else if (!newUser) {
      setAuthState('unauthenticated');
    }
  };

  // Custom setToken that also persists to storage
  const setToken = async (newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) {
      await AsyncStorage.setItem('auth_token', newToken);
      // Also mark as just logged in
      await AsyncStorage.setItem(JUST_LOGGED_IN_KEY, 'true');
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
        authState,
        isLoading,
        isAuthenticated,
        isLocked,
        login,
        register,
        logout,
        loadUser,
        unlockWithBiometrics,
        setIsLocked,
        unlock,
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
