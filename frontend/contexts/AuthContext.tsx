import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ 
    data: { user: User | null; session: Session | null } | null; 
    error: AuthError | null 
  }>;
  signUp: (email: string, password: string) => Promise<{ 
    data: { user: User | null; session: Session | null } | null; 
    error: AuthError | null 
  }>;
  signOut: () => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<{ 
    data: { user: User | null; session: Session | null } | null; 
    error: AuthError | null 
  }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ data: null, error: null }),
  signUp: async () => ({ data: null, error: null }),
  signOut: async () => {},
  verifyOtp: async () => ({ data: null, error: null }),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { data: null, error };
      }

      console.log('Sign in successful:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { 
        data: null, 
        error: error as AuthError 
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Prevent redirect on web
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { data: null, error };
      }

      console.log('Sign up response:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
      });

      return { data, error: null };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { 
        data: null, 
        error: error as AuthError 
      };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup',
      });

      if (error) {
        console.error('OTP verification error:', error);
        return { data: null, error };
      }

      console.log('OTP verification successful:', data.user?.email);
      return { data, error: null };
    } catch (error) {
      console.error('OTP verification exception:', error);
      return { 
        data: null, 
        error: error as AuthError 
      };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('Sign out successful');
        setUser(null);
        setSession(null);
      }
    } catch (error) {
      console.error('Sign out exception:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    verifyOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};