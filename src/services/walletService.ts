import { supabase } from '@/integrations/supabase/client';

export interface Wallet {
  id: string;
  provider: string;
  wallet_name: string;
  created_at: string;
  last_sync_cursor?: string;
}

export interface WalletApiResponse<T = any> {
  data?: T;
  error?: any;
}

export interface WalletTransactionForReview {
  id: string;
  provider_transaction_id: string;
  amount: number;
  description: string;
  category: string;
  transaction_date: string;
}

export async function fetchWallets(): Promise<WalletApiResponse<Wallet[]>> {
  const { data, error } = await supabase.functions.invoke('list-wallets');
  return { data: data?.wallets || [], error };
}

export async function createLinkToken(): Promise<WalletApiResponse<{ link_token: string }>> {
  const { data, error } = await supabase.functions.invoke('plaid-create-link-token');
  return { data, error };
}

export async function exchangePublicToken(publicToken: string): Promise<WalletApiResponse<{ wallet_name: string }>> {
  const { data, error } = await supabase.functions.invoke('plaid-exchange-public-token', {
    body: { public_token: publicToken },
  });
  return { data, error };
}

export async function syncWalletTransactions(itemId: string): Promise<WalletApiResponse<{ added: number; modified: number; removed: number }>> {
  const { data, error } = await supabase.functions.invoke('plaid-sync-transactions', {
    body: { item_id: itemId },
  });
  return { data, error };
}

export async function disconnectWallet(walletId: string): Promise<WalletApiResponse<{ success: boolean }>> {
  const { error, data } = await supabase.functions.invoke('plaid-disconnect-wallet', {
    body: { wallet_id: walletId },
  });
  return { data, error };
}

export async function renameWallet(walletId: string, walletName: string): Promise<WalletApiResponse<{ success: boolean }>> {
  const { data, error } = await supabase.functions.invoke('update-wallet-name', {
    body: { wallet_id: walletId, wallet_name: walletName },
  });
  return { data, error };
}

export async function getWalletMonthlyTotals(month: string): Promise<WalletApiResponse<Record<string, number>>> {
  const { data, error } = await supabase.functions.invoke('get-wallet-monthly-totals', {
    body: { month },
  });
  // data.totals is an array of { wallet_id, total_amount }
  const totals: Record<string, number> = {};
  if (data && data.totals) {
    for (const row of data.totals) {
      totals[row.wallet_id] = Number(row.total_amount);
    }
  }
  return { data: totals, error };
}

export async function getWalletTransactionsForReview(walletId: string): Promise<WalletApiResponse<WalletTransactionForReview[]>> {
  const { data, error } = await supabase.functions.invoke('list-wallet-transactions-for-review', {
    body: { wallet_id: walletId },
  });
  return { data: data?.transactions || [], error };
}

export async function saveWalletExpenses(expenses: WalletTransactionForReview[] & { wallet_id: string }[]): Promise<WalletApiResponse<{ inserted: number }>> {
  const { data, error } = await supabase.functions.invoke('save-wallet-expenses', {
    body: { expenses },
  });
  return { data, error };
}

export async function addTestWallet(): Promise<WalletApiResponse<{ wallet_id: string }>> {
  const { data, error } = await supabase.functions.invoke('add-test-wallet');
  return { data, error };
} 