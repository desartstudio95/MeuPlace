import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'agent' | 'agency';
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, type: 'agent' | 'agency') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, type: 'agent' | 'agency') => {
    // SIMULATION:
    // If email contains "admin" or "aprovado", we set isApproved = true.
    // Otherwise, isApproved = false (pending).
    const isApproved = email.includes('aprovado') || email.includes('admin');
    
    const mockUser: User = {
      id: '1',
      name: email.split('@')[0],
      email,
      type,
      isApproved,
    };
    
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
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
