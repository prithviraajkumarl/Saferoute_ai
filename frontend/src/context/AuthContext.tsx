import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: 'tourist' | 'responder' | 'administrator';
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchPersona: (role: 'tourist' | 'responder' | 'administrator') => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo-tourist-id',
    email: 'tourist@saferoute.ai',
    full_name: 'Arun Kumar (Tourist)',
    role: 'tourist',
    is_active: true,
    created_at: new Date().toISOString(),
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('saferoute_token'));
  const [role, setRole] = useState<'tourist' | 'responder' | 'administrator'>('tourist');
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        localStorage.setItem('saferoute_token', data.access_token);
        setRole(data.role);
        setUser({
          id: data.user_id,
          email,
          full_name: data.full_name,
          role: data.role,
          is_active: true,
          created_at: new Date().toISOString(),
        });
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const switchPersona = async (newRole: 'tourist' | 'responder' | 'administrator') => {
    const creds = {
      tourist: { email: 'tourist@saferoute.ai', pass: 'TouristPass2026!', name: 'Arun Kumar (Tourist)' },
      responder: { email: 'responder@saferoute.ai', pass: 'ResponderPass2026!', name: 'Inspector S. Meenakshi (TNDRF)' },
      administrator: { email: 'admin@saferoute.ai', pass: 'AdminPass2026!', name: 'Dr. K. Ramanathan (Disaster Commander)' },
    }[newRole];

    const success = await login(creds.email, creds.pass);
    if (!success) {
      // Fallback local switch for immediate testing
      setRole(newRole);
      setUser({
        id: `mock-${newRole}-id`,
        email: creds.email,
        full_name: creds.name,
        role: newRole,
        is_active: true,
        created_at: new Date().toISOString(),
      });
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('saferoute_token');
    switchPersona('tourist');
  };

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, switchPersona, isLoading }}>
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
