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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create Supabase client with service role key for server operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User verification failed:', userError);
      throw new Error('Invalid or expired token');
    }

    console.log('Checking budget notifications for user:', user.id);

    // Get current month
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get user's budget for this month
    const { data: budgetRow, error: budgetError } = await supabase
      .from('user_budgets')
      .select('budget_amount')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    if (budgetError) {
      console.error('Error fetching budget:', budgetError);
      throw new Error('Failed to fetch budget');
    }

    if (!budgetRow || !budgetRow.budget_amount) {
      return new Response(
        JSON.stringify({ notifications: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get total spent this month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user.id)
      .gte('created_at', `${month}-01`)
      .lte('created_at', `${month}-31`);

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      throw new Error('Failed to fetch expenses');
    }

    const spent = expenses ? expenses.reduce((acc, e) => acc + (e.amount || 0), 0) : 0;
    const budget = budgetRow.budget_amount;
    const percent = Math.round((spent / budget) * 100);
    const remaining = Math.max(0, budget - spent);

    // Check for threshold crossings
    const thresholds = [50, 75, 100];
    const notifications = [];

    for (const threshold of thresholds) {
      if (percent >= threshold) {
        // Check if notification already exists for this threshold
        const { data: existingNotif } = await supabase
          .from('user_notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'budget')
          .gte('created_at', `${month}-01`)
          .like('title', `%${threshold}%`);

        if (!existingNotif || existingNotif.length === 0) {
          let title = '', body = '';
          if (threshold === 50) {
            title = 'Budget Update 📊';
            body = `You've spent 50% of your ${now.toLocaleString('default', { month: 'long' })} budget. EGP${remaining} remaining.`;
          } else if (threshold === 75) {
            title = 'Budget Warning ⚠️';
            body = `You've used 75% of your ${now.toLocaleString('default', { month: 'long' })} budget. Be cautious!`;
          } else if (threshold === 100) {
            title = 'Budget Exceeded 🚨';
            body = `You've exceeded your ${now.toLocaleString('default', { month: 'long' })} budget!`;
          }

          // @ts-expect-error - Supabase types may not be fully accurate
          const { data: newNotif, error: notifError } = await supabase
            .from('user_notifications')
            .insert([
              { 
                user_id: user.id, 
                title, 
                body, 
                type: 'budget',
                read: false
              }
            ])
            .select();

          if (notifError) {
            console.error('Error creating notification:', notifError);
          } else if (newNotif) {
            notifications.push(newNotif[0]);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        notifications,
        budget_status: {
          budget,
          spent,
          remaining,
          percent
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking budget notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        notifications: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 