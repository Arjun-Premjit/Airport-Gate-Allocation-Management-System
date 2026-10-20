import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUser: User = {
  user_id: 'EMP001',
  name: 'Airport Head',
  email: 'head@agams.airport',
  role: 'Airport Head'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultUser);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agams_token') || 'session-active');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If token exists, optionally sync profile, but default user ensures immediate full access
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('agams_token');
      if (!storedToken) return;
      try {
        const res = await api.get('/auth/me');
        if (res.data) setUser(res.data);
      } catch (err) {
        // Fallback gracefully to default operator
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user_id, name, role } = res.data;
    localStorage.setItem('agams_token', access_token);
    setToken(access_token);
    setUser({ user_id, name, email, role });
  };

  const logout = () => {
    localStorage.removeItem('agams_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
