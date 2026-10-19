import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface UserPersona {
  email: string;
  name: string;
  role: string;
  team: string;
  roleDescription: string;
  avatarUrl: string;
}

export const DEMO_PERSONAS: UserPersona[] = [
  {
    email: 'admin@instos.dev',
    name: 'Alice Walker',
    role: 'Super Admin',
    team: 'All Teams (Global)',
    roleDescription: 'Super Admin (All Teams)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    email: 'lead.support@instos.dev',
    name: 'Sarah Chen',
    role: 'Operations Lead',
    team: 'Customer Support',
    roleDescription: 'Lead (Customer Support)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    email: 'member.support@instos.dev',
    name: 'James Wilson',
    role: 'Tier-1 Operator',
    team: 'Customer Support',
    roleDescription: 'Member (Customer Support)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    email: 'lead.payments@instos.dev',
    name: 'Marcus Brody',
    role: 'Operations Lead',
    team: 'Payments Ops',
    roleDescription: 'Lead (Payments Ops)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    email: 'member.payments@instos.dev',
    name: 'Elena Rostova',
    role: 'Tier-1 Operator',
    team: 'Payments Ops',
    roleDescription: 'Member (Payments Ops)',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  },
  {
    email: 'viewer@instos.dev',
    name: 'Victoria Vance',
    role: 'Compliance Auditor',
    team: 'Read-Only (All Teams)',
    roleDescription: 'Viewer (Read-Only)',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  },
];

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchPersona: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('instos_token');
      if (!token) {
        setLoading(false);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch {
      localStorage.removeItem('instos_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('instos_token', res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = async (email: string) => {
    await login(email, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('instos_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchPersona, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
