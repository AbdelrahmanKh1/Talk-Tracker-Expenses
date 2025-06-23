import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { GoogleAuth } from 'https://esm.sh/google-auth-library@9.0.0';

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

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing voice input for user:', user.id);

    // Convert base64 to binary with better error handling
    let binaryAudio;
    let mimeType = 'audio/webm';
    try {
      // Extract MIME type and base64 data from data URL
      if (audio.startsWith('data:')) {
        const match = audio.match(/^data:(.*?);base64,(.*)$/);
        if (!match) throw new Error('Invalid data URL format');
        mimeType = match[1];
        binaryAudio = Uint8Array.from(atob(match[2]), c => c.charCodeAt(0));
      } else {
        // Fallback: treat as plain base64
        binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
      }
    } catch (error) {
      throw new Error('Invalid audio data format');
    }

    console.log('Audio data size:', binaryAudio.length, 'bytes');
    console.log('Audio MIME type:', mimeType);

    // Check if Google credentials are available
    const googleCredsJson = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON');
    if (!googleCredsJson) {
      throw new Error('Google service account credentials not configured');
    }

    // Authenticate with Google
    const auth = new GoogleAuth({
      credentials: JSON.parse(googleCredsJson),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const projectId = JSON.parse(googleCredsJson).project_id;

    // Prepare audio for Google API (base64-encoded string)
    const audioContent = btoa(String.fromCharCode(...binaryAudio));

    // Call Google Speech-to-Text API
    const googleApiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${JSON.parse(googleCredsJson).private_key_id}`;
    const requestBody = {
      config: {
        encoding: mimeType.includes('webm') ? 'WEBM_OPUS' : 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: 'en-US',
      },
      audio: {
        content: audioContent,
      },
    };

    const googleResponse = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await client.getAccessToken()}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      throw new Error(`Google Speech-to-Text error: ${errorText}`);
    }

    const googleResult = await googleResponse.json();
    const transcriptText = googleResult.results?.map(r => r.alternatives[0].transcript).join(' ') || '';

    if (!transcriptText || transcriptText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          transcription: 'No speech detected',
          expenses: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Parse expenses using simple regex and keyword matching
    const text = transcriptText.toLowerCase();
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

    // Insert expenses into the database
    const insertedExpenses = [];
    for (const expense of uniqueExpenses) {
      const { data, error } = await supabase.from('expenses').insert([
        {
          user_id: user.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          // date and created_at will use defaults
        }
      ]).select();
      if (error) {
        console.error('Error inserting expense:', error);
        continue; // Skip this expense but continue with others
      }
      if (data && data.length > 0) {
        insertedExpenses.push(data[0]);
      }
    }

    return new Response(
      JSON.stringify({ 
        transcription: transcriptText,
        expenses: insertedExpenses 
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
