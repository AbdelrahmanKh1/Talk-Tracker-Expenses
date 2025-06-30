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
    const activeCurrency = settings?.active_currency || 'EGP';

    // Get budget for the month
    const { data: budgetRow, error: budgetError } = await supabase
      .from('user_budgets')
      .select('budget_amount, budget_currency')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    if (budgetError) {
      console.error('Failed to fetch budget:', budgetError);
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

    // Get all expenses for this user/month using the date field
    const startDate = `${month}-01`;
    const [year, monthNum] = month.split('-').map(Number);
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;
    
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (expensesError) {
      console.error('Failed to fetch expenses:', expensesError);
      throw new Error('Failed to fetch expenses');
    }

    // Calculate total spent
    let spent = 0;
    if (expenses && expenses.length > 0) {
      spent = expenses.reduce((total, exp) => total + exp.amount, 0);
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