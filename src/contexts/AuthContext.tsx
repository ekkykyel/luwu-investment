import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  UserProfile,
  validateActiveSession,
  fetchUserProfileById,
  signInWithEmailPassword,
  signInMasyarakatWithNikPassword,
  signInWithWhatsAppOtp,
  signUpInvestor,
  signUpMasyarakat,
  signOutUser,
  AuthResult,
  InvestorSignUpPayload,
  MasyarakatSignUpPayload
} from '../services/authService';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<AuthResult>;
  signInWithNikPassword: (nik: string, pass: string) => Promise<AuthResult>;
  signInWithOtp: (nik: string, otp: string) => Promise<AuthResult>;
  signUpInvestor: (payload: InvestorSignUpPayload) => Promise<AuthResult>;
  signUpMasyarakat: (payload: MasyarakatSignUpPayload) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: authUser, error } = await validateActiveSession();
      if (error || !authUser) {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setUser(authUser);
      const prof = await fetchUserProfileById(authUser.id);
      setProfile(prof || null);
    } catch (err) {
      console.warn('[AuthContext] refreshAuth error:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    // Dengarkan event perubahan sesi Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        refreshAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [refreshAuth]);

  const handleSignInWithPassword = async (email: string, pass: string): Promise<AuthResult> => {
    const result = await signInWithEmailPassword(email, pass);
    if (result.success && result.user) {
      setUser(result.user);
      setProfile(result.profile || null);
    }
    return result;
  };

  const handleSignInWithNikPassword = async (nik: string, pass: string): Promise<AuthResult> => {
    const result = await signInMasyarakatWithNikPassword(nik, pass);
    if (result.success && result.user) {
      setUser(result.user);
      setProfile(result.profile || null);
    }
    return result;
  };

  const handleSignInWithOtp = async (nik: string, otp: string): Promise<AuthResult> => {
    const result = await signInWithWhatsAppOtp(nik, otp);
    if (result.success) {
      await refreshAuth();
    }
    return result;
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setProfile(null);
  };

  const currentRole = profile?.role || user?.user_metadata?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: currentRole,
        isAuthenticated: Boolean(user),
        isLoading,
        signInWithPassword: handleSignInWithPassword,
        signInWithNikPassword: handleSignInWithNikPassword,
        signInWithOtp: handleSignInWithOtp,
        signUpInvestor,
        signUpMasyarakat,
        signOut: handleSignOut,
        refreshAuth
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
