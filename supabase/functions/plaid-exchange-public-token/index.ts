import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments } from 'https://esm.sh/plaid@14.2.0';
import { encrypt } from '../shared/crypto.ts';

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
    const { public_token } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = tokenResponse.data;

    // Get account details to create a wallet name
    const accountsResponse = await plaidClient.accountsGet({ access_token });
    const account = accountsResponse.data.accounts[0];
    const wallet_name = `${account.name} (${account.mask})`;

    // Encrypt the access_token before storing
    const encryptedAccessToken = await encrypt(access_token);

    const { error: insertError } = await supabaseClient
      .from('wallets')
      .insert({
        user_id: user.id,
        provider: 'Plaid',
        provider_item_id: item_id,
        access_token: encryptedAccessToken, // Store encrypted
        wallet_name: wallet_name,
      });

    if (insertError) {
      throw insertError;
    }

    // Optional: Trigger an initial transaction sync in the background
    // await supabaseClient.functions.invoke('plaid-sync-transactions', {
    //   body: { item_id },
    // });

    return new Response(JSON.stringify({ success: true, wallet_name }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Error exchanging public token:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}); 