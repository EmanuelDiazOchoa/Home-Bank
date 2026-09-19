import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Bill {
  id: string;
  user_id: string;
  account_id: string;
  company_name: string;
  category: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
}

interface BillState {
  bills: Bill[];
  isLoading: boolean;
  fetchBills: () => Promise<void>;
  payBill: (billId: string, accountId: string) => Promise<{ error: string | null }>;
}

export const useBillStore = create<BillState>((set, get) => ({
  bills: [],
  isLoading: false,

  fetchBills: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('due_date', { ascending: true });

    if (!error && data) {
      set({ bills: data });
    }
    set({ isLoading: false });
  },

  payBill: async (billId, accountId) => {
    const { error } = await supabase.rpc('pay_bill', {
      bill_id: billId,
      paying_account_id: accountId,
    });

    if (error) return { error: error.message };

    await get().fetchBills();

    return { error: null };
  },
}));