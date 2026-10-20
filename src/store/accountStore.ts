import { create } from 'zustand';
import { supabase } from '../services/supabase';

export interface Account {
  id: string;
  user_id: string;
  account_type: string;
  currency: string;
  balance: number;
  alias: string;
  cbu: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

interface AccountState {
  accounts: Account[];
  transactions: Transaction[];
  analyticsTransactions: Transaction[];
  isLoading: boolean;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (accountId: string) => Promise<void>;
  fetchAnalyticsTransactions: (accountId: string, months?: number) => Promise<void>;
  transferMoney: (
    originAccountId: string,
    destinationAlias: string,
    amount: number,
    description?: string
  ) => Promise<{ error: string | null }>;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  transactions: [],
  analyticsTransactions: [],
  isLoading: false,

  fetchAccounts: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      set({ accounts: data });
    }
    set({ isLoading: false });
  },

  fetchTransactions: async (accountId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      set({ transactions: data });
    }
  },

  fetchAnalyticsTransactions: async (accountId: string, months = 6) => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(1);
    since.setMonth(since.getMonth() - (months - 1));

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!error && data) {
      set({ analyticsTransactions: data });
    }
  },

  transferMoney: async (originAccountId, destinationAlias, amount, description = "Transferencia") => {
    const { error } = await supabase.rpc('transfer_money', {
      origin_account_id: originAccountId,
      destination_alias: destinationAlias,
      transfer_amount: amount,
      transfer_description: description,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  },
}));