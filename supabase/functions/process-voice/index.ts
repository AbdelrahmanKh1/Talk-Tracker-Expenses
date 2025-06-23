
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

    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing voice input for user:', user.id);

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

    return new Response(
      JSON.stringify({ 
        transcription: transcript.text,
        expenses: uniqueExpenses 
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
