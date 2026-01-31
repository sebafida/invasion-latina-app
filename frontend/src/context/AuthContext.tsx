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
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user_id, name, role } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      
      setToken(access_token);
      setUser({ id: user_id, email, name, role, loyalty_points: 0, badges: [] });
      setIsAuthenticated(true);
      
      await loadUser();
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role: 'user',
      });
      
      const { access_token, user_id } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      
      setToken(access_token);
      setUser({ id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] });
      setIsAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const loadUser = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (!storedToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const response = await api.get('/auth/me');
      
      setUser(response.data);
      setToken(storedToken);
      setIsAuthenticated(true);
    } catch (error) {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
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
