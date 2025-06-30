import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert an amount from one currency to another using fx_rates
async function convertCurrency(supabase, amount, from, to) {
  if (from === to) return amount;
  
  try {
  // Try direct rate
  let { data: rateRow } = await supabase
    .from('fx_rates')
    .select('rate')
    .eq('base_code', from)
    .eq('quote_code', to)
    .maybeSingle();
    
  if (rateRow && rateRow.rate) return amount * rateRow.rate;
    
  // Try inverse
  ({ data: rateRow } = await supabase
    .from('fx_rates')
    .select('rate')
    .eq('base_code', to)
    .eq('quote_code', from)
    .maybeSingle());
    
  if (rateRow && rateRow.rate) return amount / rateRow.rate;
    
  // Fallback: no conversion
  return amount;
  } catch (error) {
    console.warn(`Currency conversion failed for ${from} to ${to}:`, error);
    return amount;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      throw new Error('Invalid or expired token');
    }

    const { month } = await req.json();
    if (!month) {
      throw new Error('Month is required');
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Month must be in YYYY-MM format');
    }

    // Get user's active currency
    const { data: settings } = await supabase
      .from('user_settings')
      .select('currency_code')
      .eq('user_id', user.id)
      .maybeSingle();
    const activeCurrency = settings?.currency_code || 'EGP';

    // Get budget for the month
    const { data: budgetRow, error: budgetError } = await supabase
      .from('user_budgets')
      .select('budget_amount, budget_currency')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    if (budgetError) {
      throw new Error('Failed to fetch budget');
    }

    if (!budgetRow || !budgetRow.budget_amount) {
      return new Response(
        JSON.stringify({ 
          budget: 0,
          spent: 0,
          remaining: 0,
          percent: 0,
          currency: activeCurrency
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all expenses for this user/month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, currency_code')
      .eq('user_id', user.id)
      .gte('created_at', `${month}-01`)
      .lte('created_at', `${month}-31`);

    if (expensesError) {
      throw new Error('Failed to fetch expenses');
    }

    // Calculate total spent (convert to budget currency if needed)
    let spent = 0;
    if (expenses && expenses.length > 0) {
      for (const exp of expenses) {
        const from = exp.currency_code || 'EGP';
        const to = budgetRow.budget_currency || 'EGP';
        
        if (from === to) {
          spent += exp.amount;
        } else {
          // For now, assume 1:1 conversion if currencies differ
          // In a real app, you'd use an exchange rate API
          spent += exp.amount;
        }
      }
    }

    const budget = budgetRow.budget_amount;
    const percent = Math.round((spent / budget) * 100);
    const remaining = Math.max(0, budget - spent);

    return new Response(
      JSON.stringify({
        budget,
        spent,
        remaining,
        percent,
        currency: budgetRow.budget_currency || activeCurrency
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 