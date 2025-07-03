import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, PlaidApi, PlaidEnvironments, Transaction } from 'https://esm.sh/plaid@14.2.0';
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
    const { item_id } = await req.json();

    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the wallet to find the user_id and access_token
    const { data: wallet, error: walletError } = await supabaseAdminClient
      .from('wallets')
      .select('user_id, access_token, last_sync_cursor')
      .eq('provider_item_id', item_id)
      .single();

    if (walletError || !wallet) {
      throw new Error(`Wallet not found for item_id: ${item_id}`);
    }

    // Decrypt the access_token before using it
    const access_token = await decrypt(wallet.access_token);

    let cursor = wallet.last_sync_cursor;
    let added: Transaction[] = [];
    let modified: Transaction[] = [];
    let removed: { transaction_id?: string }[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: access_token,
        cursor: cursor,
      });

      const data = response.data;
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    // Process added transactions
    const newExpenses = added
      .filter(tx => tx.amount > 0) // Only process inflows as expenses for simplicity for now
      .map(tx => ({
        user_id: wallet.user_id,
        amount: tx.amount,
        description: tx.name,
        category: tx.category ? tx.category[0] : 'Miscellaneous',
        date: tx.date,
        source: 'wallet', // Critical for filtering
        provider_transaction_id: tx.transaction_id, // Custom column, assumes you add it
        wallet_id: wallet.id // Assumes you pass wallet id or fetch it
    }));

    if (newExpenses.length > 0) {
        // Here, you should insert into 'wallet_transactions' and 'expenses'
        // This is a simplified version. A robust implementation would use a transaction
        // and handle potential duplicates.
        const { error: insertError } = await supabaseAdminClient
            .from('expenses')
            .insert(newExpenses.map(({ provider_transaction_id, wallet_id, ...rest }) => rest)); // Adjust to match schema
        
        if (insertError) throw new Error(`Error inserting new expenses: ${insertError.message}`);
    }

    // Update the cursor and last_synced_at for the next sync
    await supabaseAdminClient
      .from('wallets')
      .update({ last_sync_cursor: cursor, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('provider_item_id', item_id);

    return new Response(JSON.stringify({
      added: added.length,
      modified: modified.length,
      removed: removed.length,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    console.error('Error syncing transactions:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

// Note: For this to work completely, you would need to add
// 'last_sync_cursor' and 'provider_transaction_id' columns to your
// 'wallets' and 'expenses' tables respectively via a new migration. 