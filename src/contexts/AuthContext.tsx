import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      return { error: error.message };
    }

    // If signup was successful and we have a name, store it in user_settings
    if (data.user && name) {
      try {
        // Use upsert to handle cases where the table might not exist or the record might already exist
        const { error: settingsError } = await supabase
          .from('user_settings')
          .upsert([
            {
              user_id: data.user.id,
              full_name: name,
              active_currency: 'EGP' // Default currency
            }
          ], {
            onConflict: 'user_id'
          });

        if (settingsError) {
          console.error('Error saving user name:', settingsError);
          // Don't fail the signup if name saving fails
        }
      } catch (err) {
        console.error('Error saving user name:', err);
        // Don't fail the signup if name saving fails
      }
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error: error?.message || null };
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
  };

  const signInWithOAuth = async (provider: 'google' | 'apple'): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl
      }
    });
    return { error: error?.message || null };
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
