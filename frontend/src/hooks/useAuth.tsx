import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authApi, User } from '@/api/auth';

export interface AppUser extends User {
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: AppUser | null;
  session: { access_token: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const mapUser = (u: User): AppUser => ({
    ...u,
    user_metadata: {
      full_name: u.fullName || ''
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('@eventum:token');
    if (!token) {
      setLoading(false);
      return;
    }

    setSession({ access_token: token });

    authApi.getCurrentUser()
      .then((currUser) => {
        setUser(mapUser(currUser));
      })
      .catch(() => {
        localStorage.removeItem('@eventum:token');
        localStorage.removeItem('@eventum:refreshToken');
        localStorage.removeItem('@eventum:user');
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('@eventum:token', res.accessToken);
      localStorage.setItem('@eventum:refreshToken', res.refreshToken);
      localStorage.setItem('@eventum:user', JSON.stringify(res.user));

      setSession({ access_token: res.accessToken });
      setUser(mapUser(res.user));
      return { error: null };
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Falha ao efetuar login.';
      return { error: new Error(message) };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const res = await authApi.register(email, password, fullName);
      localStorage.setItem('@eventum:token', res.accessToken);
      localStorage.setItem('@eventum:refreshToken', res.refreshToken);
      localStorage.setItem('@eventum:user', JSON.stringify(res.user));

      setSession({ access_token: res.accessToken });
      setUser(mapUser(res.user));
      return { error: null };
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Falha ao cadastrar usuário.';
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    await authApi.logout();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
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
