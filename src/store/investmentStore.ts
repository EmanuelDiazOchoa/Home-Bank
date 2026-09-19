import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Investment {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  interest_rate: number;
  term_days: number;
  maturity_date: string;
  is_closed: boolean;
  created_at: string;
}

interface InvestmentState {
  investments: Investment[];
  isLoading: boolean;
  fetchInvestments: () => Promise<void>;
  createInvestment: (accountId: string, amount: number, rate: number, termDays: number) => Promise<{ error: string | null }>;
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  investments: [],
  isLoading: false,

  fetchInvestments: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ investments: data });
    }
    set({ isLoading: false });
  },

  createInvestment: async (accountId, amount, rate, termDays) => {
    const { error } = await supabase.rpc('create_investment', {
      investing_account_id: accountId,
      investment_amount: amount,
      investment_rate: rate,
      investment_term_days: termDays,
    });

    if (error) return { error: error.message };

    await get().fetchInvestments();
    return { error: null };
  },
}));