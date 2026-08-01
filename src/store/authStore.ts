import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,

  setSession: (session) => set({ session }),

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    set({ session: data.session });
    return { error: null };
  },

  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) return { error: error.message };
    set({ session: data.session });
    return { error: null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },

  initialize: async () => {
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, isLoading: false });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },
}));