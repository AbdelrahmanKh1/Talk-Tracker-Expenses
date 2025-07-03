import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const body = await req.json();
    const month = body.month;
    const budgetAmount = body.budgetAmount ?? body.budget_amount;
    let budgetCurrency = body.budgetCurrency ?? body.budget_currency;
    
    if (!month || !budgetAmount) {
      throw new Error('Month and budgetAmount are required');
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Month must be in YYYY-MM format');
    }

    // Validate budget amount
    if (typeof budgetAmount !== 'number' || budgetAmount <= 0) {
      throw new Error('Budget amount must be a positive number');
    }

    // Get user's active currency if not provided
    if (!budgetCurrency) {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('active_currency')
        .eq('user_id', user.id)
        .maybeSingle();
      budgetCurrency = settings?.active_currency || 'EGP';
    }

    // First, try to update existing budget
    const { data: existingBudget, error: updateError } = await supabase
      .from('user_budgets')
      .update({
        amount: budgetAmount,
        budget_currency: budgetCurrency,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('month_id', month)
      .select();

    // If no rows were updated, insert a new budget
    if (!existingBudget || existingBudget.length === 0) {
      const { error: insertError } = await supabase
        .from('user_budgets')
        .insert({
          user_id: user.id,
          month_id: month,
          amount: budgetAmount,
          budget_currency: budgetCurrency,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to create budget: ' + insertError.message);
      }
    } else if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update budget: ' + updateError.message);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Set budget error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 