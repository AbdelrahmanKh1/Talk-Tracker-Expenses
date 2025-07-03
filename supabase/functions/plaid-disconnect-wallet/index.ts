import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments } from 'https://esm.sh/plaid@14.2.0';
import { decrypt } from '../shared/crypto.ts';

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
      'PLAID-SECRET': PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

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
    const { wallet_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Use Supabase Admin client for elevated privileges to delete data
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // First, get the access token for the wallet
    const { data: wallet, error: walletError } = await supabaseAdminClient
      .from('wallets')
      .select('access_token')
      .eq('id', wallet_id)
      .eq('user_id', user.id) // Ensure user owns the wallet
      .single();

    if (walletError || !wallet) {
      throw new Error(`Wallet not found or user does not have permission.`);
    }

    // Decrypt the access_token before using it
    const access_token = await decrypt(wallet.access_token);

    // Call Plaid to invalidate the access token
    await plaidClient.itemRemove({ access_token });

    // Delete the wallet from our database. 
    // Cascading delete should handle associated wallet_transactions.
    const { error: deleteError } = await supabaseAdminClient
        .from('wallets')
        .delete()
        .eq('id', wallet_id);

    if (deleteError) {
        throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}); 