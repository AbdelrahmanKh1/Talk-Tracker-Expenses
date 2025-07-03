import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Check if a test wallet already exists
    const { data: existing } = await supabaseClient
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'TestProvider')
      .maybeSingle();

    let walletId = existing?.id;
    if (!walletId) {
      // Create a test wallet
      const { data: wallet, error: walletError } = await supabaseClient
        .from('wallets')
        .insert({
          user_id: user.id,
          provider: 'TestProvider',
          provider_item_id: 'test-item-' + user.id,
          access_token: 'test-token',
          wallet_name: 'Test Wallet',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (walletError) throw walletError;
      walletId = wallet.id;
    }

    // Add mock transactions
    const mockTxs = [
      {
        user_id: user.id,
        wallet_id: walletId,
        provider_transaction_id: 'test-tx-1',
        amount: 19.99,
        description: 'Spotify',
        category: 'Entertainment',
        transaction_date: new Date().toISOString().slice(0, 10),
      },
      {
        user_id: user.id,
        wallet_id: walletId,
        provider_transaction_id: 'test-tx-2',
        amount: 8.50,
        description: 'Coffee Shop',
        category: 'Food',
        transaction_date: new Date().toISOString().slice(0, 10),
      },
      {
        user_id: user.id,
        wallet_id: walletId,
        provider_transaction_id: 'test-tx-3',
        amount: 120.00,
        description: 'Online Shopping',
        category: 'Shopping',
        transaction_date: new Date().toISOString().slice(0, 10),
      },
    ];
    for (const tx of mockTxs) {
      await supabaseClient
        .from('wallet_transactions')
        .upsert(tx, { onConflict: ['provider_transaction_id'] });
    }

    return new Response(JSON.stringify({ success: true, wallet_id: walletId }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}); 