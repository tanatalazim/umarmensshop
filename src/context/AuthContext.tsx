import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('umar_auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check current session from server
  const fetchCurrentUser = async (authToken?: string) => {
    const activeToken = authToken || token;
    if (!activeToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token expired or invalid
        localStorage.removeItem('umar_auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to verify session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Ошибка авторизации' };
      }

      localStorage.setItem('umar_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const register = async (regData: { email: string; password: string; fullName: string; phone: string }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Ошибка регистрации' };
      }

      localStorage.setItem('umar_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    const currentToken = token;
    // Immediately invalidate state to eliminate race conditions
    localStorage.removeItem('umar_auth_token');
    setToken(null);
    setUser(null);

    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
      } catch {
        // ignore network error
      }
    }
  };

  // Helper for quick role persona switcher in dev
  const switchDemoRole = async (role: UserRole) => {
    const roleEmails: Record<UserRole, string> = {
      OWNER: 'owner@umarmens.kz',
      MANAGER: 'manager@umarmens.kz',
      WAREHOUSE: 'warehouse@umarmens.kz',
      CUSTOMER: 'customer@gmail.com'
    };

    const targetEmail = roleEmails[role];
    await login(targetEmail, 'UmarShop2026!Secure');
  };

  const hasRole = (role: UserRole) => {
    return Boolean(user && user.roles.includes(role));
  };

  const hasPermission = (perm: string) => {
    return Boolean(user && user.permissions.includes(perm));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        hasRole,
        hasPermission
      }}
    >
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
