
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Check if OpenAI API key is available
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Convert base64 to binary
    let binaryAudio;
    try {
      binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    } catch (error) {
      throw new Error('Invalid audio data format');
    }

    // Step 1: Transcribe audio
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    console.log('Sending to OpenAI for transcription...');
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI transcription error:', errorText);
      throw new Error(`Transcription failed: ${transcriptionResponse.status} - ${errorText}`);
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

    // Step 2: Parse expenses using GPT
    console.log('Sending to OpenAI for expense parsing...');
    const parseResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are an expense parser. Extract expenses from text and return them as JSON array.
            
Rules:
- Parse amounts and descriptions from natural language
- Auto-categorize based on common expense types
- Handle multiple expenses in one input
- Use these categories: Food, Transport, Entertainment, Health, Shopping, Bills, Education, Travel, Miscellaneous
- Return JSON array with format: [{"description": "Coffee", "amount": 5.50, "category": "Food"}]
- If no expenses found, return empty array: []
- Only return valid JSON, no other text
- Make sure amounts are numbers, not strings
- Ensure all objects have description, amount, and category fields`
          },
          {
            role: 'user',
            content: transcription.text
          }
        ],
        temperature: 0.1,
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error('OpenAI parsing error:', errorText);
      throw new Error(`Parsing failed: ${parseResponse.status} - ${errorText}`);
    }

    const parseResult = await parseResponse.json();
    console.log('Parse result:', parseResult.choices[0].message.content);

    let expenses = [];
    try {
      const content = parseResult.choices[0].message.content.trim();
      expenses = JSON.parse(content);
      
      // Validate the parsed expenses
      if (!Array.isArray(expenses)) {
        console.error('Parsed result is not an array:', expenses);
        expenses = [];
      } else {
        // Validate each expense object
        expenses = expenses.filter(expense => {
          if (!expense.description || !expense.amount || !expense.category) {
            console.warn('Invalid expense object:', expense);
            return false;
          }
          if (typeof expense.amount !== 'number' || expense.amount <= 0) {
            console.warn('Invalid amount:', expense.amount);
            return false;
          }
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
