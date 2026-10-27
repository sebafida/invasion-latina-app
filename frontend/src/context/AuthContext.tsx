import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';
import { registerForPushNotifications } from '../config/notifications';
import { apiErrorMessage } from '../utils/apiError';
import logger from '../config/logger';
import { useLanguage } from './LanguageContext';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  loyalty_points: number;
  badges: string[];
  auth_provider?: string;
}

interface LoginResponse extends User {
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  /** Initial session restoration only; submitting a form must not unmount it. */
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => Promise<void>;
  completeLogin: (response: LoginResponse) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsAuthenticating: (value: boolean) => void;
}

const AUTH_VERSION = 'supabase_v3';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(data: User): User {
  if (!data || typeof data.id !== 'string' || !data.id) {
    throw new Error('Invalid user response');
  }
  // Never cache access_token inside the profile object returned by social login.
  return {
    id: data.id, email: data.email, name: data.name, role: data.role,
    loyalty_points: data.loyalty_points ?? 0, badges: data.badges ?? [],
    auth_provider: data.auth_provider,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const [user, setUserState] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setAuthenticatingState] = useState(false);
  const authenticating = useRef(false);
  const sessionRevision = useRef(0);
  const refreshRevision = useRef(0);
  const storageQueue = useRef<Promise<void>>(Promise.resolve());

  // Keep logout's storage removal after any already-started cache write.
  const writeStorage = useCallback((action: () => Promise<void>) => {
    const next = storageQueue.current.catch(() => {}).then(action);
    storageQueue.current = next;
    return next;
  }, []);

  const clearState = useCallback(() => {
    setUserState(null);
    setTokenState(null);
  }, []);

  const setIsAuthenticating = useCallback((value: boolean) => {
    if (value && !authenticating.current) sessionRevision.current++;
    authenticating.current = value;
    setAuthenticatingState(value);
  }, []);

  const completeLogin = useCallback(async (response: LoginResponse) => {
    if (!authenticating.current) return;
    const nextUser = normalizeUser(response);
    if (typeof response.access_token !== 'string' || !response.access_token) {
      throw new Error('Invalid authentication response');
    }
    const revision = ++sessionRevision.current;
    await writeStorage(async () => {
      if (revision !== sessionRevision.current) return;
      await AsyncStorage.multiSet([
        ['auth_token', response.access_token],
        ['auth_version', AUTH_VERSION],
        ['cached_user_data', JSON.stringify(nextUser)],
      ]);
    });
    if (revision !== sessionRevision.current) return;
    setTokenState(response.access_token);
    setUserState(nextUser);
  }, [writeStorage]);

  const login = async (email: string, password: string) => {
    setIsAuthenticating(true);
    const revision = sessionRevision.current;
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password }, { timeout: 20000 });
      if (revision === sessionRevision.current) await completeLogin(response.data);
    } catch (error) {
      throw new Error(apiErrorMessage(error, t('connectionError')));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string, acceptMarketing?: boolean) => {
    setIsAuthenticating(true);
    const revision = sessionRevision.current;
    try {
      const response = await api.post('/auth/register', {
        name: name.trim(), email: email.trim(), password,
        phone: phone?.trim() || '', accept_marketing: acceptMarketing || false,
      });
      // Registration returns `id`, just like login and /auth/me.
      if (revision === sessionRevision.current) await completeLogin(response.data);
    } catch (error) {
      throw new Error(apiErrorMessage(error, t('registrationFailed')));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = useCallback(async () => {
    sessionRevision.current++;
    setIsAuthenticating(false);
    clearState();
    try {
      await writeStorage(() => AsyncStorage.multiRemove(['auth_token', 'cached_user_data']));
    } catch (error) {
      logger.error('Error clearing auth storage:', error);
    }
  }, [clearState, setIsAuthenticating, writeStorage]);

  const loadUser = useCallback(async () => {
    if (authenticating.current) return;
    const revision = sessionRevision.current;
    const refresh = ++refreshRevision.current;
    const isCurrent = () => revision === sessionRevision.current && refresh === refreshRevision.current;
    try {
      await storageQueue.current.catch(() => {});
      const storedVersion = await AsyncStorage.getItem('auth_version');
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (!isCurrent()) return;
      if (storedVersion !== AUTH_VERSION || !storedToken) {
        clearState();
        await writeStorage(async () => {
          if (!isCurrent()) return;
          await AsyncStorage.multiRemove(['auth_token', 'cached_user_data']);
          await AsyncStorage.setItem('auth_version', AUTH_VERSION);
        });
        return;
      }
      try {
        const response = await api.get('/auth/me', { timeout: 20000 });
        if (!isCurrent()) return;
        const nextUser = normalizeUser(response.data);
        setUserState(nextUser);
        setTokenState(storedToken);
        await writeStorage(async () => {
          if (isCurrent()) await AsyncStorage.setItem('cached_user_data', JSON.stringify(nextUser));
        });
      } catch (error) {
        if (!isCurrent()) return;
        if ((error as { response?: { status?: number } }).response?.status === 401) {
          await logout();
        } else {
          // Keep an existing session through temporary outages. A 401 always clears it.
          const cached = await AsyncStorage.getItem('cached_user_data');
          if (!isCurrent()) return;
          if (cached) {
            try {
              setUserState(normalizeUser(JSON.parse(cached)));
              setTokenState(storedToken);
            } catch {
              clearState();
            }
          }
        }
      }
    } catch (error) {
      logger.error('Session restoration failed:', error);
      if (isCurrent()) clearState();
    } finally {
      setIsLoading(false);
    }
  }, [clearState, logout, writeStorage]);

  const setUser = useCallback((nextUser: User | null) => {
    const normalized = nextUser ? normalizeUser(nextUser) : null;
    setUserState(normalized);
    const revision = sessionRevision.current;
    void writeStorage(async () => {
      if (revision !== sessionRevision.current) return;
      if (normalized) await AsyncStorage.setItem('cached_user_data', JSON.stringify(normalized));
      else await AsyncStorage.removeItem('cached_user_data');
    }).catch(error => logger.error('Profile cache failed:', error));
  }, [writeStorage]);

  useEffect(() => { void loadUser(); }, [loadUser]);

  const isAuthenticated = !!user && !!token;
  const userId = user?.id;
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      registerForPushNotifications().catch(error => logger.error('Push registration failed:', error));
    }
  }, [isAuthenticated, userId, isLoading]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, isAuthenticating,
      login, register, completeLogin, logout, loadUser, setUser, setIsAuthenticating }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
