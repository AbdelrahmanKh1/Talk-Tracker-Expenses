import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to fetch and cache live FX rate from exchangenerate.host
async function fetchAndCacheRate(supabase, from, to) {
  if (from === to) return 1;
  const API_KEY = '6701dd6425629aff301ad15009566294'; // exchangenerate.host key
  const url = `https://api.exchangenerate.host/latest?base=${from}&symbols=${to}`;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (!res.ok) throw new Error('Failed to fetch live FX rate');
    const data = await res.json();
    const rate = data.rates?.[to];
    if (!rate) throw new Error('No rate in response');
    // Upsert into fx_rates
    const now = new Date().toISOString();
    await supabase.from('fx_rates').upsert({
      base_code: from,
      quote_code: to,
      rate,
      last_updated: now
    }, { onConflict: ['base_code', 'quote_code'] });
    return rate;
  } catch (error) {
    console.warn(`Live FX fetch failed for ${from}->${to}:`, error);
    return null;
  }
}

// Helper to get a valid FX rate (cached or live)
async function getFxRate(supabase, from, to) {
  if (from === to) return 1;
  // Try cached first (within 24h)
  const { data: rateRow } = await supabase
    .from('fx_rates')
    .select('rate, last_updated')
    .eq('base_code', from)
    .eq('quote_code', to)
    .maybeSingle();
  if (rateRow && rateRow.rate && rateRow.last_updated) {
    const updated = new Date(rateRow.last_updated);
    const now = new Date();
    const hours = (now - updated) / 36e5;
    if (hours < 24) return rateRow.rate;
  }
  // Try live fetch
  const liveRate = await fetchAndCacheRate(supabase, from, to);
  if (liveRate) return liveRate;
  // Fallback to cached even if outdated
  if (rateRow && rateRow.rate) return rateRow.rate;
  // Try inverse
  const { data: invRow } = await supabase
    .from('fx_rates')
    .select('rate, last_updated')
    .eq('base_code', to)
    .eq('quote_code', from)
    .maybeSingle();
  if (invRow && invRow.rate) return 1 / invRow.rate;
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header provided');
    }

    // @ts-expect-error - Deno environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-expect-error - Deno environment variables
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Invalid or expired token');
    }

    const body = await req.json();
    console.log('get-budget-status request body:', body);
    console.log('Authenticated user:', user);

    const { month } = body;
    if (!month) {
      console.error('Month is required');
      throw new Error('Month is required');
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Month must be in YYYY-MM format');
    }

    // Get user's active currency
    const { data: settings } = await supabase
      .from('user_settings')
      .select('active_currency')
      .eq('user_id', user.id)
      .maybeSingle();
    const preferredCurrency = settings?.active_currency || 'EGP';

    // Get budget for the month
    const { data: budgetRow, error: budgetError } = await supabase
      .from('user_budgets')
      .select('amount, budget_currency')
      .eq('user_id', user.id)
      .eq('month_id', month)
      .maybeSingle();

    if (budgetError) {
      console.error('Failed to fetch budget:', budgetError);
      throw new Error('Failed to fetch budget');
    }

    if (!budgetRow || !budgetRow.amount) {
      return new Response(
        JSON.stringify({ 
          budget: 0,
          spent: 0,
          remaining: 0,
          percent: 0,
          currency: preferredCurrency,
          original: {
            budget: 0,
            spent: 0,
            remaining: 0,
            percent: 0,
            currency: budgetRow?.budget_currency || preferredCurrency
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all expenses for this user/month using the date field
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, currency_code')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expensesError) {
      console.error('Failed to fetch expenses:', expensesError);
      throw new Error('Failed to fetch expenses');
    }

    // Calculate total spent in budget currency
    let spent = 0;
    for (const exp of expenses || []) {
      const from = exp.currency_code || budgetRow.budget_currency || preferredCurrency;
      if (from === budgetRow.budget_currency) {
        spent += exp.amount;
      } else {
        // Convert to budget currency for original calculation
        const rate = await getFxRate(supabase, from, budgetRow.budget_currency);
        spent += rate ? exp.amount * rate : exp.amount;
      }
    }
    const budget = budgetRow.amount;
    const percent = Math.round((spent / budget) * 100);
    const remaining = Math.max(0, budget - spent);

    // Now, convert all values to preferred currency if needed
    let converted = { budget, spent, remaining, percent, currency: budgetRow.budget_currency };
    if (preferredCurrency !== budgetRow.budget_currency) {
      const fx = await getFxRate(supabase, budgetRow.budget_currency, preferredCurrency);
      if (!fx) {
        // Fallback: return original, but add error
        return new Response(
          JSON.stringify({
            ...converted,
            currency: preferredCurrency,
            error: `Could not fetch FX rate for ${budgetRow.budget_currency}->${preferredCurrency}`,
            original: { budget, spent, remaining, percent, currency: budgetRow.budget_currency }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      converted = {
        budget: Math.round(budget * fx * 100) / 100,
        spent: Math.round(spent * fx * 100) / 100,
        remaining: Math.round(remaining * fx * 100) / 100,
        percent,
        currency: preferredCurrency
      };
    }

    // Return both converted and original for tooltips
    return new Response(
      JSON.stringify({
        ...converted,
        original: { budget, spent, remaining, percent, currency: budgetRow.budget_currency }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('get-budget-status error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 