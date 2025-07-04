import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpenseItem {
  description: string;
  amount: number;
  category: string;
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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { expenses, selectedMonth, sessionId, source = 'manual' } = await req.json();
    
    if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
      throw new Error('No expenses provided');
    }

    // Calculate the correct expense date based on selectedMonth
    let expenseDate: string;
    if (selectedMonth) {
      if (selectedMonth.includes('-')) {
        const [year, month] = selectedMonth.split('-');
        expenseDate = `${year}-${month}-15`;
      } else {
        const [monthName, year] = selectedMonth.split(' ');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthName);
        const targetYear = parseInt(year);
        
        if (monthIndex === -1) {
          expenseDate = new Date().toISOString().split('T')[0];
        } else {
          expenseDate = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}-15`;
        }
      }
    } else {
      expenseDate = new Date().toISOString().split('T')[0];
    }

    // Insert expenses into database
    const insertedExpenses = [];
    const insertionErrors: string[] = [];
    
    for (const expense of expenses) {
      try {
        const { data, error } = await supabase.from('expenses').insert([{
          user_id: user.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expenseDate,
          created_at: new Date().toISOString(),
          source: source,
        }]).select();

        if (error) {
          console.error('Error inserting expense:', error);
          insertionErrors.push(`Failed to save ${expense.description}: ${error.message}`);
          continue;
        }
        if (data && data.length > 0) {
          insertedExpenses.push(data[0]);
        }
      } catch (expenseError) {
        console.error('Error processing expense:', expenseError);
        insertionErrors.push(`Failed to process ${expense.description}`);
      }
    }

    // Store processing session for analytics
    try {
      await supabase.from('ai_processing_sessions').insert({
        user_id: user.id,
        session_id: sessionId || crypto.randomUUID(),
        original_transcription: 'User reviewed expenses',
        processed_expenses: expenses,
        confidence_scores: { overall: 0.95, user_reviewed: true },
        processing_metadata: {
          processing_time_ms: 0,
          selected_month: selectedMonth,
          input_type: 'user_reviewed',
          insertion_errors: insertionErrors.length
        }
      });
    } catch (sessionError) {
      console.error('Failed to store processing session:', sessionError);
    }

    // Check for budget notifications
    let notification = null;
    if (insertedExpenses.length > 0) {
      try {
        let budgetMonth: string;
        if (selectedMonth) {
          if (selectedMonth.includes('-')) {
            budgetMonth = selectedMonth;
          } else {
            const [monthName, year] = selectedMonth.split(' ');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.indexOf(monthName);
            const targetYear = parseInt(year);
            
            if (monthIndex !== -1) {
              budgetMonth = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}`;
            } else {
              const now = new Date();
              budgetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
          }
        } else {
          const now = new Date();
          budgetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const { data: budgetRow } = await supabase
          .from('user_budgets')
          .select('budget_amount')
          .eq('user_id', user.id)
          .eq('month', budgetMonth)
          .maybeSingle();
        
        if (budgetRow && budgetRow.budget_amount) {
          const { data: sumResult } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', `${budgetMonth}-01`)
            .lte('date', `${budgetMonth}-31`);
          
          const spent = sumResult ? sumResult.reduce((acc, e) => acc + (e.amount || 0), 0) : 0;
          const budget = budgetRow.budget_amount;
          const percent = Math.round((spent / budget) * 100);
          const remaining = Math.max(0, budget - spent);
          
          if (percent >= 75) {
            const monthName = new Date(budgetMonth + '-01').toLocaleString('default', { month: 'long' });
            notification = {
              title: percent >= 100 ? 'Budget Exceeded 🚨' : 'Budget Warning ⚠️',
              body: percent >= 100 
                ? `You've exceeded your ${monthName} budget!`
                : `You've used ${percent}% of your ${monthName} budget. EGP${remaining} remaining.`
            };
          }
        }
      } catch (budgetError) {
        console.error('Error checking budget notifications:', budgetError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expenses: insertedExpenses,
        total_saved: insertedExpenses.length,
        errors: insertionErrors,
        notification
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save reviewed expenses:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        expenses: [],
        total_saved: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 