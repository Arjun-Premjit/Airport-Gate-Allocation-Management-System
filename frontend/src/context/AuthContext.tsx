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

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('agams_token')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      const storedToken = localStorage.getItem('agams_token');

      if (!storedToken) {
        if (!cancelled) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await api.get('/auth/me');

        if (!cancelled) {
          setUser(res.data);
        }
      } catch {
        localStorage.removeItem('agams_token');
        localStorage.removeItem('agams_user');

        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user_id, name, role } = res.data;

    localStorage.setItem('agams_token', access_token);
    setToken(access_token);
    setUser({
      user_id,
      name,
      email: res.data.email || email,
      role,
    });
  };
  const logout = () => {
    localStorage.removeItem('agams_token');
    localStorage.removeItem('agams_user');
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
