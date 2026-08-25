import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Card {
  id: string;
  account_id: string;
  user_id: string;
  card_type: string;
  card_number: string;
  card_holder: string;
  expiry_date: string;
  cvv: string;
  credit_limit: number;
  is_blocked: boolean;
  created_at: string;
}

interface CardState {
  cards: Card[];
  isLoading: boolean;
  fetchCards: () => Promise<void>;
  toggleBlockCard: (cardId: string, block: boolean) => Promise<{ error: string | null }>;
}

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: false,

  fetchCards: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      set({ cards: data });
    }
    set({ isLoading: false });
  },

  toggleBlockCard: async (cardId, block) => {
    const { error } = await supabase
      .from('cards')
      .update({ is_blocked: block })
      .eq('id', cardId);

    if (error) return { error: error.message };

    // Actualiza el estado local sin tener que refetchear todo
    set({
      cards: get().cards.map((card) =>
        card.id === cardId ? { ...card, is_blocked: block } : card
      ),
    });

    return { error: null };
  },
}));