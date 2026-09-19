import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Loan {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  interest_rate: number;
  installments: number;
  installment_amount: number;
  status: string;
  created_at: string;
}

interface LoanState {
  loans: Loan[];
  isLoading: boolean;
  fetchLoans: () => Promise<void>;
  requestLoan: (accountId: string, amount: number, rate: number, installments: number) => Promise<{ error: string | null }>;
}

export const useLoanStore = create<LoanState>((set, get) => ({
  loans: [],
  isLoading: false,

  fetchLoans: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ loans: data });
    }
    set({ isLoading: false });
  },

  requestLoan: async (accountId, amount, rate, installments) => {
    const { error } = await supabase.rpc('request_loan', {
      loan_account_id: accountId,
      loan_amount: amount,
      loan_rate: rate,
      loan_installments: installments,
    });

    if (error) return { error: error.message };

    await get().fetchLoans();
    return { error: null };
  },
}));