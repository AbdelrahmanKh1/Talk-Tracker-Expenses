
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Exponential backoff utility function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
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
        throw error;
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

    // Step 1: Transcribe audio with retry logic
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending to OpenAI for transcription with retry logic...');
    console.log('Blob size:', blob.size);

    const transcriptionResponse = await fetchWithRetry('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    }, 3); // Max 3 retries for transcription

    console.log('Transcription response status:', transcriptionResponse.status);

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI transcription error:', errorText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { error: { message: errorText } };
      }
      
      if (transcriptionResponse.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. The system will automatically retry. Please wait a moment.');
      } else if (transcriptionResponse.status === 401) {
        throw new Error('OpenAI API key is invalid. Please check your API key configuration.');
      } else if (transcriptionResponse.status === 413) {
        throw new Error('Audio file is too large. Please record a shorter message.');
      } else if (transcriptionResponse.status === 400) {
        const message = errorDetails?.error?.message || 'Bad request to OpenAI API';
        throw new Error(`OpenAI API error: ${message}`);
      } else {
        throw new Error(`Transcription failed: ${transcriptionResponse.status} - ${errorDetails?.error?.message || errorText}`);
      }
    }

    const transcription = await transcriptionResponse.json();
    console.log('Transcribed text:', transcription.text);

    if (!transcription.text || transcription.text.trim().length === 0) {
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
        model: 'gpt-4o-mini',
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
            content: `Parse this expense text: "${transcription.text}"`
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
        transcription: transcription.text,
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
