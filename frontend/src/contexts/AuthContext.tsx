import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { User, LoginRequest, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: (partial?: Partial<User>) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSalesOfficer: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password } as LoginRequest);
    const loggedInUser: User = {
      id: response.userId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role,
      profilePicture: response.profilePicture,
      designation: response.designation,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const refreshUser = (partial: Partial<User> = {}) => {
    if (!user) return;
    const updated = { ...user, ...partial };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'Administrator';
  const isManager = user?.role === 'Manager';
  const isSalesOfficer = user?.role === 'SalesOfficer';

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, isAuthenticated, isAdmin, isManager, isSalesOfficer, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
