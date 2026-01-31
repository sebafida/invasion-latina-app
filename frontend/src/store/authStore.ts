import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  loyalty_points: number;
  badges: string[];
  profile_picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  socialLogin: (firebaseToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user_id, name, role } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      
      set({
        token: access_token,
        user: { id: user_id, email, name, role, loyalty_points: 0, badges: [] },
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Load full user profile
      await get().loadUser();
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  },
  
  register: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        role: 'user',
      });
      
      const { access_token, user_id } = response.data;
      await AsyncStorage.setItem('auth_token', access_token);
      
      set({
        token: access_token,
        user: { id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  },
  
  socialLogin: async (firebaseToken: string) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/social-login', { firebase_token: firebaseToken });
      const { access_token, user_id, email, name } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      
      set({
        token: access_token,
        user: { id: user_id, email, name, role: 'user', loyalty_points: 0, badges: [] },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(error.response?.data?.detail || 'Social login failed');
    }
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },
  
  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        set({ isAuthenticated: false, isLoading: false });
        return;
      }
      
      set({ isLoading: true });
      const response = await api.get('/auth/me');
      
      set({
        user: response.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await AsyncStorage.removeItem('auth_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  
  updateProfile: async (data: Partial<User>) => {
    try {
      await api.put('/auth/profile', data);
      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Update failed');
    }
  },
}));