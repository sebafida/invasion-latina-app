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

interface AuthContextType {
  user: User | null;
  token: string | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Flag to track if user just logged in (to skip Face ID after fresh login)
  const justLoggedIn = useRef(false);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Login attempt - API URL:', api.defaults.baseURL);
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response received:', response.status);
      
      const { access_token, id, email: userEmail, name, role, loyalty_points, badges } = response.data;
      
      if (!access_token || !id) {
        throw new Error('Invalid response from server');
      }
      
      await AsyncStorage.setItem('auth_token', access_token);
      
      // Mark that user just logged in - NO Face ID needed
      justLoggedIn.current = true;
      
      setToken(access_token);
      setUser({ 
        id, 
        email: userEmail, 
        name, 
        role, 
        loyalty_points: loyalty_points || 0, 
        badges: badges || [] 
      });
      setIsAuthenticated(true);
      setIsLocked(false); // NOT locked after fresh login
      console.log('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
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
      
      // Mark that user just registered - NO Face ID needed
      justLoggedIn.current = true;
      
      setToken(access_token);
      setUser({ id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] });
      setIsAuthenticated(true);
      setIsLocked(false); // NOT locked after fresh registration
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    justLoggedIn.current = false;
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsLocked(false);
  };

  // This is called ONLY at app startup to check if user was previously logged in
  const loadUser = async () => {
    try {
      setIsLoading(true);
      
      // If user just logged in, don't reload and don't lock
      if (justLoggedIn.current) {
        setIsLoading(false);
        return;
      }
      
      const storedToken = await AsyncStorage.getItem('auth_token');
      
      // No token = user never logged in or logged out
      if (!storedToken) {
        setIsAuthenticated(false);
        setIsLocked(false);
        setIsLoading(false);
        return;
      }
      
      // Token exists = user was previously logged in, verify it's still valid
      try {
        const response = await api.get('/auth/me');
        
        setUser(response.data);
        setToken(storedToken);
        setIsAuthenticated(true);
        
        // RETURNING USER: Check if biometrics are available and LOCK the app
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          // Lock the app - user must use Face ID to enter
          setIsLocked(true);
        } else {
          // No biometrics available - let them in
          setIsLocked(false);
        }
      } catch (error) {
        // Token invalid - clear everything
        await AsyncStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setIsLocked(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsLocked(false);
        return true;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Déverrouiller Invasion Latina',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
        fallbackLabel: 'Utiliser le code',
      });

      if (result.success) {
        setIsLocked(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric auth error:', error);
      setIsLocked(false);
      return true;
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
        isLocked,
        login,
        register,
        logout,
        loadUser,
        unlockWithBiometrics,
        setIsLocked,
        setUser: (newUser: User | null) => {
          setUser(newUser);
          setIsAuthenticated(!!newUser);
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
