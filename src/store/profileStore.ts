import { create } from 'zustand';
import { supabase } from '../services/supabase';

interface ProfileState {
  fullName: string | null;
  fetchProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  fullName: null,
  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    if (data) set({ fullName: data.full_name });
  },
}));