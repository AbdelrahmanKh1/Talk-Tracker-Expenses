import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exponential backoff utility function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-rate-limit errors
      if (!error.message.includes('rate limit') && !error.message.includes('429')) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        // Return a user-friendly error message if all retries fail
        return new Response(
          JSON.stringify({ error: 'OpenAI API is currently busy. Please wait a moment and try again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        ) as unknown as T;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Enhanced fetch with retry logic
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      // Check for Retry-After header
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
      
      console.log(`Rate limit (429) - waiting ${retryAfterMs}ms as suggested by server`);
      await new Promise(resolve => setTimeout(resolve, retryAfterMs));
      
      throw new Error(`rate limit exceeded - retry after ${retryAfterMs}ms`);
    }
    
    return response;
  }, maxRetries);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing voice input...');
    console.log('Audio data length:', audio.length);

    // Check if OpenAI API key is available
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API key found, proceeding with processing...');

    // Convert base64 to binary with better error handling
    let binaryAudio;
    try {
      const cleanBase64 = audio.replace(/^data:audio\/[^;]+;base64,/, '');
      console.log('Cleaned base64 length:', cleanBase64.length);
      
      binaryAudio = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
      console.log('Binary audio length:', binaryAudio.length);
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error('Invalid audio data format');
    }

    // Step 1: Transcribe audio with Deepgram API
    const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
    if (!deepgramApiKey) {
      console.error('Deepgram API key not found in environment');
      throw new Error('Deepgram API key not configured');
    }

    // Send audio to Deepgram
    const deepgramResponse = await fetch('https://api.deepgram.com/v1/listen', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': 'audio/webm',
      },
      body: binaryAudio,
    });

    console.log('Deepgram transcription response status:', deepgramResponse.status);

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text();
      console.error('Deepgram transcription error:', errorText);
      throw new Error(`Deepgram transcription failed: ${deepgramResponse.status} - ${errorText}`);
    }

    const deepgramResult = await deepgramResponse.json();
    const transcriptionText = deepgramResult.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log('Transcribed text:', transcriptionText);

    if (!transcriptionText || transcriptionText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          transcription: 'No speech detected',
          expenses: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Parse expenses using GPT with retry logic
    console.log('Sending to OpenAI for expense parsing with retry logic...');
    
    const parseResponse = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expense parser. Extract expenses from text and return them as a JSON array.
            
Rules:
- Parse amounts and descriptions from natural language
- Auto-categorize based on common expense types
- Handle multiple expenses in one input
- Use these categories: Food, Transport, Entertainment, Health, Shopping, Bills, Education, Travel, Miscellaneous
- Return JSON array with format: [{"description": "Coffee", "amount": 5.50, "category": "Food"}]
- If no expenses found, return empty array: []
- Only return valid JSON, no other text
- Make sure amounts are numbers, not strings
- Ensure all objects have description, amount, and category fields
- If currency is mentioned (like EGP, USD, EUR), ignore it and just use the number
- Common expense examples: "coffee 50" = {"description": "Coffee", "amount": 50, "category": "Food"}`
          },
          {
            role: 'user',
            content: `Parse this expense text: "${transcriptionText}"`
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    }, 3); // Max 3 retries for parsing

    console.log('Parse response status:', parseResponse.status);

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('OpenAI parsing error:', errorText);
      
      if (parseResponse.status === 429) {
        throw new Error('OpenAI API rate limit exceeded during parsing. The system will automatically retry.');
      } else if (parseResponse.status === 401) {
        throw new Error('OpenAI API key is invalid during parsing. Please check your API key configuration.');
      } else {
        throw new Error(`Parsing failed: ${parseResponse.status} - ${errorText}`);
      }
    }

    const parseResult = await parseResponse.json();
    console.log('Parse result:', parseResult.choices[0].message.content);

    let expenses = [];
    try {
      const content = parseResult.choices[0].message.content.trim();
      
      // Try to extract JSON from the response if it's wrapped in text
      let jsonString = content;
      if (content.includes('[') && content.includes(']')) {
        const startIndex = content.indexOf('[');
        const endIndex = content.lastIndexOf(']') + 1;
        jsonString = content.substring(startIndex, endIndex);
      }
      
      expenses = JSON.parse(jsonString);
      
      // Validate the parsed expenses
      if (!Array.isArray(expenses)) {
        console.error('Parsed result is not an array:', expenses);
        expenses = [];
      } else {
        // Validate and clean each expense object
        expenses = expenses.filter(expense => {
          if (!expense.description || expense.amount === undefined || !expense.category) {
            console.warn('Invalid expense object missing required fields:', expense);
            return false;
          }
          
          // Convert amount to number if it's a string
          const amount = typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount;
          if (isNaN(amount) || amount <= 0) {
            console.warn('Invalid amount:', expense.amount);
            return false;
          }
          
          // Update the expense with cleaned amount
          expense.amount = amount;
          return true;
        });
      }
    } catch (error) {
      console.error('Failed to parse expenses JSON:', error);
      console.error('Raw content:', parseResult.choices[0].message.content);
      expenses = [];
    }

    console.log('Final parsed expenses:', expenses);

    return new Response(
      JSON.stringify({ 
        transcription: transcriptionText,
        expenses: expenses 
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
