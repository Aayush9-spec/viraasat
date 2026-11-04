import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  currentRole: 'buyer' | 'artisan';
  switchRole: (role: 'buyer' | 'artisan') => void;
  loginAsCustomer: () => void;
  loginAsArtisan: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const DEMO_CUSTOMER: User = {
  id: 'usr-patron-01',
  name: 'Shreyansh Singh',
  email: 'patron@virrasat.in',
  role: 'buyer',
  phone: '+91 98765 43210',
  addresses: [
    {
      id: 'addr-1',
      street: '14/B Heritage Enclave, Civil Lines',
      city: 'Kanpur',
      state: 'Uttar Pradesh',
      pincode: '208001',
      isDefault: true,
    },
  ],
};

const DEMO_ARTISAN: User = {
  id: 'usr-artisan-01',
  name: 'Master Ansari',
  email: 'ansari.weavers@virrasat.in',
  role: 'artisan',
  artisanId: 'art-1',
  phone: '+91 94150 12345',
};

const AuthContext = createContext<AuthContextType>({
  user: DEMO_CUSTOMER,
  currentRole: 'buyer',
  switchRole: () => {},
  loginAsCustomer: () => {},
  loginAsArtisan: () => {},
  logout: () => {},
  isAuthenticated: true,
});

export function AuthProvider({ children }: { children?: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_CUSTOMER);
  const [currentRole, setCurrentRole] = useState<'buyer' | 'artisan'>('buyer');

  const switchRole = (role: 'buyer' | 'artisan') => {
    setCurrentRole(role);
    if (role === 'artisan') {
      setUser(DEMO_ARTISAN);
    } else {
      setUser(DEMO_CUSTOMER);
    }
  };

  const loginAsCustomer = () => {
    setUser(DEMO_CUSTOMER);
    setCurrentRole('buyer');
  };

  const loginAsArtisan = () => {
    setUser(DEMO_ARTISAN);
    setCurrentRole('artisan');
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        switchRole,
        loginAsCustomer,
        loginAsArtisan,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

