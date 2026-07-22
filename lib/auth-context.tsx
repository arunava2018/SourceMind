'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  signup: (name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('chaibooklm_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: Math.random().toString(36).substring(7),
          name: email.split('@')[0],
          email,
        };
        setUser(newUser);
        localStorage.setItem('chaibooklm_user', JSON.stringify(newUser));
        resolve();
      }, 1000);
    });
  };

  const signup = async (name: string, email: string, password?: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: Math.random().toString(36).substring(7),
          name,
          email,
        };
        setUser(newUser);
        localStorage.setItem('chaibooklm_user', JSON.stringify(newUser));
        resolve();
      }, 1200);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chaibooklm_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
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
