'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserDto } from '@buildlink/shared';

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserDto) => void;
  logout: () => void;
  updateUser: (user: UserDto) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api/v1';

  const logout = () => {
    try {
      localStorage.removeItem('buildlink_token');
      localStorage.removeItem('buildlink_user');
      document.cookie = 'buildlink_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch {}
    setToken(null);
    setUser(null);
  };

  const login = (newToken: string, newUser: UserDto) => {
    try {
      localStorage.setItem('buildlink_token', newToken);
      localStorage.setItem('buildlink_user', JSON.stringify(newUser));
      document.cookie = `buildlink_token=${newToken}; path=/; max-age=604800; SameSite=Lax`;
    } catch {}
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: UserDto) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('buildlink_user', JSON.stringify(updatedUser));
    } catch {}
  };

  const refreshUser = async () => {
    const savedToken = token || (typeof window !== 'undefined' ? localStorage.getItem('buildlink_token') : null);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          setUser(body.data);
          localStorage.setItem('buildlink_user', JSON.stringify(body.data));
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch {
      // In case server is offline, keep cached user from localStorage
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('buildlink_token');
      const savedUser = localStorage.getItem('buildlink_user');

      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch {}
        }
        refreshUser();
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
