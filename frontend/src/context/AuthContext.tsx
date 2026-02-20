import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
      
      await AsyncStorage.setItem('auth_token', access_token);
      
      setToken(access_token);
      setUser({ 
        id, 
        email: userEmail, 
        name, 
        role, 
        loyalty_points: loyalty_points || 0, 
        badges: badges || [] 
      });
      
      // After fresh login - go directly to app, NO Face ID
      setAuthState('authenticated');
      console.log('Login successful - going to app');
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
      
      setToken(access_token);
      setUser({ id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] });
      
      // After fresh registration - go directly to app, NO Face ID
      setAuthState('authenticated');
    } catch (error: any) {
      setAuthState('unauthenticated');
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    setAuthState('unauthenticated');
  };

  const unlock = () => {
    // Called after successful Face ID
    setAuthState('authenticated');
  };

  // Called at app startup to check if user was previously logged in
  const loadUser = async () => {
    try {
      console.log('loadUser: Checking for stored token...');
      const storedToken = await AsyncStorage.getItem('auth_token');
      
      // No token = never logged in or logged out
      if (!storedToken) {
        console.log('loadUser: No token found - show login page');
        setAuthState('unauthenticated');
        return;
      }
      
      console.log('loadUser: Token found - verifying with server...');
      
      // Verify token is still valid
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        setToken(storedToken);
        
        // Check if biometrics are available
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          // RETURNING USER with biometrics - show Face ID lock
          console.log('loadUser: Returning user - show Face ID');
          setAuthState('locked');
        } else {
          // No biometrics - go directly to app
          console.log('loadUser: No biometrics - go to app');
          setAuthState('authenticated');
        }
      } catch (error) {
        // Token invalid - clear and show login
        console.log('loadUser: Token invalid - show login');
        await AsyncStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
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
        setUser: (newUser: User | null) => {
          setUser(newUser);
          if (newUser) {
            setAuthState('authenticated');
          } else {
            setAuthState('unauthenticated');
          }
        },
        setToken: async (newToken: string | null) => {
          setToken(newToken);
          if (newToken) {
            await AsyncStorage.setItem('auth_token', newToken);
          } else {
            await AsyncStorage.removeItem('auth_token');
          }
        },
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
