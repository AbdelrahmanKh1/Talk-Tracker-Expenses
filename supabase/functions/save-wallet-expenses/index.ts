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
    const { expenses } = await req.json();
    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      return new Response(JSON.stringify({ error: 'No expenses provided' }), { status: 400 });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Filter out any expenses that already exist (by provider_transaction_id)
    const ids = expenses.map(e => e.provider_transaction_id);
    const { data: existing } = await supabaseClient
      .from('expenses')
      .select('provider_transaction_id')
      .in('provider_transaction_id', ids);
    const existingIds = new Set((existing || []).map(e => e.provider_transaction_id));
    const toInsert = expenses.filter(e => !existingIds.has(e.provider_transaction_id));

    // Insert new expenses
    const { data, error } = await supabaseClient.from('expenses').insert(
      toInsert.map(e => ({
        user_id: user.id,
        amount: e.amount,
        description: e.description,
        category: e.category,
        date: e.transaction_date,
        created_at: new Date().toISOString(),
        source: 'wallet',
        provider_transaction_id: e.provider_transaction_id,
        wallet_id: e.wallet_id,
      }))
    ).select();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, inserted: data.length }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}); 