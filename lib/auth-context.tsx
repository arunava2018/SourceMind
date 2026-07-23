'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
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

  const fetchUser = async (token: string) => {
    try {
      const res = await axios.get('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data.user);
    } catch (e) {
      console.error('Failed to fetch user', e);
      // Token might be invalid or expired
      localStorage.removeItem('chaibooklm_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('chaibooklm_token');
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      
      localStorage.setItem('chaibooklm_token', res.data.token);
      setUser(res.data.user);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Login failed');
      }
      throw error;
    }
  };

  const signup = async (name: string, email: string, password?: string) => {
    try {
      const res = await axios.post('/api/auth/signup', { name, email, password });
      
      localStorage.setItem('chaibooklm_token', res.data.token);
      setUser(res.data.user);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // In a real app we might want to handle validation errors more cleanly (e.g., error.response.data.errors)
        throw new Error(error.response?.data?.error || 'Signup failed');
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chaibooklm_token');
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
