import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const storedUser = localStorage.getItem('forensic_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('forensic_user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('forensic_users') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        return { error: 'User with this email already exists' };
      }

      // Create new user
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        username,
      };

      // Store password separately (in real app, this would be hashed on backend)
      const userWithPassword = { ...newUser, password };
      users.push(userWithPassword);
      localStorage.setItem('forensic_users', JSON.stringify(users));

      // Set current user
      localStorage.setItem('forensic_user', JSON.stringify(newUser));
      setUser(newUser);

      return { error: null };
    } catch (error) {
      return { error: 'Failed to create account' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const users = JSON.parse(localStorage.getItem('forensic_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        return { error: 'Invalid email or password' };
      }

      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('forensic_user', JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);

      return { error: null };
    } catch (error) {
      return { error: 'Failed to sign in' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('forensic_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
