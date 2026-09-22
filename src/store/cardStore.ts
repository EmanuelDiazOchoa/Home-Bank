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
  addCard: (accountId: string, userId: string, cardType: 'debit' | 'credit') => Promise<{ error: string | null }>;
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

    set({
      cards: get().cards.map((card) =>
        card.id === cardId ? { ...card, is_blocked: block } : card
      ),
    });

    return { error: null };
  },

  addCard: async (accountId, userId, cardType) => {
    const prefix = cardType === "debit" ? "4" : "5";
    const cardNumber = prefix + Math.floor(Math.random() * 1e15).toString().padStart(15, "0");
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 4);
    const expiryStr = `${String(expiry.getMonth() + 1).padStart(2, "0")}/${String(expiry.getFullYear()).slice(-2)}`;
    const cvv = String(Math.floor(Math.random() * 900) + 100);

    const { error } = await supabase.from("cards").insert({
      account_id: accountId,
      user_id: userId,
      card_type: cardType,
      card_number: cardNumber,
      card_holder: "TITULAR",
      expiry_date: expiryStr,
      cvv,
      credit_limit: cardType === "credit" ? 100000 : 0,
    });

    if (error) return { error: error.message };
    await get().fetchCards();
    return { error: null };
  },
}));