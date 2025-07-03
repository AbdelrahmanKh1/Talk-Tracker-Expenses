import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

// Mock category detection
function detectCategory(merchant: string, mcc?: number): string {
  if (merchant.toLowerCase().includes('uber') || mcc === 4121) return 'Transport';
  if (merchant.toLowerCase().includes('starbucks')) return 'Food';
  if (merchant.includes('Netflix')) return 'Subscriptions';
  return 'Uncategorized';
}

serve(async (req) => {
  const { user_token, wallet_id } = await req.json();
  if (!user_token || !wallet_id) {
    return new Response(JSON.stringify({ error: 'Missing user_token or wallet_id' }), { status: 400 });
  }

  // Initialize Supabase client (Edge runtime)
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // TODO: Replace with real wallet API integration
  // Mock transactions
  const transactions = [
    {
      amount: 12.99,
      merchant_name: 'Starbucks',
      date: '2024-07-01T10:00:00Z',
      location: 'New York',
      mcc: 5814,
      description: 'Coffee at Starbucks',
      external_id: 'txn_001',
    },
    {
      amount: 25.0,
      merchant_name: 'Uber',
      date: '2024-07-02T12:00:00Z',
      location: 'San Francisco',
      mcc: 4121,
      description: 'Uber ride',
      external_id: 'txn_002',
    },
  ];

  // Get user_id from token (mocked for now)
  // In production, validate token and extract user_id
  const user_id = 'mock-user-id';

  let upserted = 0;
  let updated = 0;

  for (const tx of transactions) {
    const category = detectCategory(tx.merchant_name, tx.mcc);
    // Check if expense already exists for this user, wallet, and external_id
    const { data: existing, error } = await supabase
      .from('expenses')
      .select('id')
      .eq('user_id', user_id)
      .eq('wallet_id', wallet_id)
      .eq('external_id', tx.external_id)
      .maybeSingle();

    if (existing && existing.id) {
      // Update the existing expense
      await supabase.from('expenses').update({
        amount: tx.amount,
        description: tx.description,
        category,
        occurred_at: tx.date,
        merchant_name: tx.merchant_name,
        mcc: tx.mcc,
        location: tx.location,
      }).eq('id', existing.id);
      updated++;
    } else {
      // Insert new expense
      await supabase.from('expenses').insert({
        user_id,
        amount: tx.amount,
        description: tx.description,
        category,
        occurred_at: tx.date,
        source: 'wallet',
        wallet_id,
        merchant_name: tx.merchant_name,
        mcc: tx.mcc,
        location: tx.location,
        external_id: tx.external_id,
      });
      upserted++;
    }
  }

  return new Response(JSON.stringify({ status: 'success', inserted: upserted, updated }), { status: 200 });
}); 