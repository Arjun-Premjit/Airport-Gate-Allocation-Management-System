import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

export type UserRole = 'Airport Head' | 'Gate Manager' | 'Flight Manager';

export const ROLE_ACCOUNTS: Record<UserRole, { email: string; password: string; name: string }> = {
  'Airport Head': {
    email: 'head@agams.airport',
    password: 'password123',
    name: 'Airport Head'
  },
  'Gate Manager': {
    email: 'gate.mgr@agams.airport',
    password: 'password123',
    name: 'Gate Manager'
  },
  'Flight Manager': {
    email: 'flight.mgr@agams.airport',
    password: 'password123',
    name: 'Flight Manager'
  }
};

const DEFAULT_USER: User = {
  user_id: '1',
  name: 'Airport Head',
  email: 'head@agams.airport',
  role: 'Airport Head'
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('agams_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('agams_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('agams_token');

      // 1. If stored token exists, verify validity
      if (storedToken) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          const res = await api.get('/auth/me');
          if (!cancelled && res.data) {
            setUser(res.data);
            localStorage.setItem('agams_user', JSON.stringify(res.data));
            return;
          }
        } catch (err) {
          console.warn("Stored token invalid or expired, re-authenticating...", err);
          localStorage.removeItem('agams_token');
          localStorage.removeItem('agams_user');
          delete api.defaults.headers.common['Authorization'];
        }
      }

      // 2. Auto-authenticate with canonical Airport Head credentials
      try {
        const loginRes = await api.post('/auth/login', {
          email: ROLE_ACCOUNTS['Airport Head'].email,
          password: ROLE_ACCOUNTS['Airport Head'].password
        });
        if (!cancelled && loginRes.data?.access_token) {
          const { access_token, user_id, name, role, email } = loginRes.data;
          localStorage.setItem('agams_token', access_token);
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          const authedUser: User = {
            user_id: String(user_id),
            name: name || 'Airport Head',
            email: email || ROLE_ACCOUNTS['Airport Head'].email,
            role: role || 'Airport Head'
          };
          localStorage.setItem('agams_user', JSON.stringify(authedUser));
          setToken(access_token);
          setUser(authedUser);
        }
      } catch (err) {
        console.warn("Auto-login failed:", err);
      }
    };

    void initializeAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user_id, name, role } = res.data;

      localStorage.setItem('agams_token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setToken(access_token);
      const authedUser: User = {
        user_id: String(user_id),
        name: name || role,
        email: res.data.email || email,
        role,
      };
      localStorage.setItem('agams_user', JSON.stringify(authedUser));
      setUser(authedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    const creds = ROLE_ACCOUNTS[role];
    if (!creds) return;
    try {
      await login(creds.email, creds.password);
    } catch (err) {
      console.error("Failed to switch role authentication", err);
    }
  };

  const logout = () => {
    localStorage.removeItem('agams_token');
    localStorage.removeItem('agams_user');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(DEFAULT_USER);
  };


  return (
    <AuthContext.Provider value={{ user, token, login, switchRole, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

