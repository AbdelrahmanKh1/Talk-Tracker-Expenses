import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    console.log('Authenticated user:', user.id);

    const { audio, selectedMonth } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing voice input for user:', user.id, 'for month:', selectedMonth);

    // Check if AssemblyAI API key is available
    const assemblyAIKey = Deno.env.get('ASSEMBLYAI_API_KEY');
    if (!assemblyAIKey) {
      throw new Error('AssemblyAI API key not configured');
    }

    // Convert base64 to binary with better error handling
    let binaryAudio;
    try {
      // Remove data URL prefix if present
      const base64Data = audio.includes(',') ? audio.split(',')[1] : audio;
      binaryAudio = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } catch (error) {
      throw new Error('Invalid audio data format');
    }

    console.log('Audio data size:', binaryAudio.length, 'bytes');

    // Step 1: Upload audio to AssemblyAI
    const uploadFormData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    uploadFormData.append('file', blob, 'audio.webm');

    console.log('Uploading audio to AssemblyAI...');
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': assemblyAIKey,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('AssemblyAI upload error:', errorText);
      throw new Error(`Audio upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    console.log('Audio uploaded successfully:', uploadResult.upload_url);

    // Step 2: Request transcription
    console.log('Requesting transcription...');
    const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': assemblyAIKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: uploadResult.upload_url,
        speech_model: 'universal',
      }),
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('AssemblyAI transcription request error:', errorText);
      throw new Error(`Transcription request failed: ${transcriptResponse.status} - ${errorText}`);
    }

    const transcriptRequest = await transcriptResponse.json();
    console.log('Transcription requested, ID:', transcriptRequest.id);

    // Step 3: Poll for transcription completion
    let transcript;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time

    while (attempts < maxAttempts) {
      console.log(`Checking transcription status (attempt ${attempts + 1}/${maxAttempts})...`);
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptRequest.id}`, {
        headers: {
          'Authorization': assemblyAIKey,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      transcript = await statusResponse.json();
      
      if (transcript.status === 'completed') {
        console.log('Transcription completed successfully');
        break;
      } else if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    if (!transcript || transcript.status !== 'completed') {
      throw new Error('Transcription timed out or failed');
    }

    console.log('Transcribed text:', transcript.text);

    if (!transcript.text || transcript.text.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          transcription: 'No speech detected',
          expenses: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Parse expenses using simple regex and keyword matching
    const text = transcript.text.toLowerCase();
    const expenses = [];

    // Common expense patterns and categories
    const categoryKeywords = {
      'Food': ['coffee', 'lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'meal', 'snack', 'drink'],
      'Transport': ['uber', 'taxi', 'bus', 'metro', 'gas', 'fuel', 'parking', 'transport'],
      'Entertainment': ['movie', 'cinema', 'game', 'entertainment', 'show', 'concert', 'ticket'],
      'Health': ['medicine', 'doctor', 'pharmacy', 'health', 'medical', 'hospital'],
      'Shopping': ['clothes', 'shopping', 'store', 'buy', 'purchase', 'shirt', 'shoes'],
      'Bills': ['electricity', 'water', 'internet', 'phone', 'bill', 'utility'],
      'Education': ['book', 'course', 'education', 'school', 'university', 'tuition'],
      'Travel': ['hotel', 'flight', 'travel', 'vacation', 'trip', 'booking'],
    };

    // Look for expense patterns like "coffee 5", "lunch 15 dollars", etc.
    const expensePatterns = [
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d{1,2})?)\s*(?:dollars?|egp|usd|eur|pounds?)?/gi,
      /(\d+(?:\.\d{1,2})?)\s*(?:dollars?|egp|usd|eur|pounds?)?\s+(?:for\s+)?(\w+(?:\s+\w+)*)/gi
    ];

    for (const pattern of expensePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let description, amount;
        
        if (pattern.source.startsWith('(\\w+')) {
          // Pattern: "description amount"
          description = match[1].trim();
          amount = parseFloat(match[2]);
        } else {
          // Pattern: "amount description"
          amount = parseFloat(match[1]);
          description = match[2].trim();
        }

        if (amount > 0 && description && description.length > 1) {
          // Determine category based on keywords
          let category = 'Miscellaneous';
          for (const [cat, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => description.toLowerCase().includes(keyword))) {
              category = cat;
              break;
            }
          }

          expenses.push({
            description: description.charAt(0).toUpperCase() + description.slice(1),
            amount: amount,
            category: category
          });
        }
      }
    }

    // Remove duplicates based on description and amount
    const uniqueExpenses = expenses.filter((expense, index, self) => 
      index === self.findIndex(e => e.description === expense.description && e.amount === expense.amount)
    );

    console.log('Parsed expenses:', uniqueExpenses);

    // --- Voice Command Quota Enforcement ---
    // 1. Determine current month
    const now = new Date();
    const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 2. Get user plan (from user_metadata or user_settings)
    let plan = user.user_metadata?.plan;
    if (!plan) {
      // fallback: try user_settings
      const { data: settings } = await supabase
        .from('user_settings')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle();
      plan = settings?.plan || 'free';
    }

    // 3. Get voice usage for this month
    let { data: usageRow } = await supabase
      .from('voice_usage')
      .select('voice_count, limit')
      .eq('user_id', user.id)
      .eq('month_id', monthId)
      .maybeSingle();
    if (!usageRow) {
      // Insert initial row if not exists
      const limit = plan === 'pro' ? 999999 : 50;
      const { data: newRow } = await supabase
        .from('voice_usage')
        .insert({ user_id: user.id, month_id: monthId, voice_count: 0, limit })
        .select()
        .maybeSingle();
      usageRow = newRow;
    }
    // 4. Enforce quota for free users
    if (plan === 'free' && usageRow.voice_count >= 50) {
      return new Response(
        JSON.stringify({ error: 'Voice quota reached – upgrade to Pro' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // --- End Voice Command Quota Enforcement ---

    // Insert expenses into the database
    const insertedExpenses = [];
    
    // Use today's date for expenses
    const expenseDate = new Date().toISOString().split('T')[0];
    
    for (const expense of uniqueExpenses) {
      const { data, error } = await supabase.from('expenses').insert([
        {
          user_id: user.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expenseDate,
          created_at: new Date().toISOString(),
          // Optionally: currency_code: activeCurrency (if available)
        }
      ]).select();
      if (error) {
        console.error('Error inserting expense:', error);
        continue;
      }
      if (data && data.length > 0) {
        insertedExpenses.push(data[0]);
      }
    }
    // --- Increment voice usage after successful processing ---
    await supabase
      .from('voice_usage')
      .update({ voice_count: (usageRow.voice_count || 0) + 1 })
      .eq('user_id', user.id)
      .eq('month_id', monthId);

    // --- Budget Notification Logic ---
    let notification = null;
    if (insertedExpenses.length > 0) {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const { data: budgetRow } = await supabase
        .from('user_budgets')
        .select('budget_amount')
        .eq('user_id', user.id)
        .eq('month', month)
        .maybeSingle();
      if (budgetRow && budgetRow.budget_amount) {
        const { data: sumResult } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('created_at', `${month}-01`)
          .lte('created_at', `${month}-31`);
        const spent = sumResult ? sumResult.reduce((acc, e) => acc + (e.amount || 0), 0) : 0;
        const budget = budgetRow.budget_amount;
        const percent = Math.round((spent / budget) * 100);
        const remaining = Math.max(0, budget - spent);
        const thresholds = [50, 75, 100];
        let crossed = null;
        for (const t of thresholds) {
          if (percent >= t) crossed = t;
        }
        if (crossed) {
          const { data: notifExists } = await supabase
            .from('user_notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'budget')
            .gte('created_at', `${month}-01`)
            .like('title', `%${crossed}%`);
          if (!notifExists || notifExists.length === 0) {
            let title = '', body = '';
            if (crossed === 50) {
              title = 'Budget Update 📊';
              body = `You've spent 50% of your ${now.toLocaleString('default', { month: 'long' })} budget. EGP${remaining} remaining.`;
            } else if (crossed === 75) {
              title = 'Budget Warning ⚠️';
              body = `You've used 75% of your ${now.toLocaleString('default', { month: 'long' })} budget. Be cautious!`;
            } else if (crossed === 100) {
              title = 'Budget Exceeded 🚨';
              body = `You've exceeded your ${now.toLocaleString('default', { month: 'long' })} budget!`;
            }
            await supabase.from('user_notifications').insert([
              { user_id: user.id, title, body, type: 'budget' }
            ]);
            notification = { title, body };
          }
        }
      }
    }
    // --- End Budget Notification Logic ---

    return new Response(
      JSON.stringify({ 
        transcription: transcript.text,
        expenses: insertedExpenses,
        notification // may be null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing voice:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        transcription: '',
        expenses: [] 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
