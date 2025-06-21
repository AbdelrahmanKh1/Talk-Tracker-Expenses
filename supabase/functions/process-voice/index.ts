
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
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

    // Step 1: Transcribe audio
    const binaryAudio = processBase64Chunks(audio);
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`OpenAI transcription error: ${await transcriptionResponse.text()}`);
    }

    const transcription = await transcriptionResponse.json();
    console.log('Transcribed text:', transcription.text);

    // Step 2: Parse expenses using GPT
    const parseResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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
- If no expenses found, return empty array
- Only return valid JSON, no other text`
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
      throw new Error(`OpenAI parsing error: ${await parseResponse.text()}`);
    }

    const parseResult = await parseResponse.json();
    console.log('Parse result:', parseResult.choices[0].message.content);

    let expenses;
    try {
      expenses = JSON.parse(parseResult.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse expenses JSON:', error);
      expenses = [];
    }

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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
