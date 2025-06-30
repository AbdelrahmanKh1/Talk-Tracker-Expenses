import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const FX_API_URL = 'https://open.er-api.com/v6/latest/'; // Free, no key required
const BASE_CURRENCIES = ['USD', 'EGP', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // @ts-expect-error - Deno environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    // @ts-expect-error - Deno environment variables
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let upserted = 0;
    for (const base of BASE_CURRENCIES) {
      const res = await fetch(`${FX_API_URL}${base}`);
      if (!res.ok) continue;
      const data = await res.json();
      if (!data.rates) continue;
      const now = new Date().toISOString();
      for (const quote of BASE_CURRENCIES) {
        if (quote === base) continue;
        const rate = data.rates[quote];
        if (!rate) continue;
        // Upsert into fx_rates
        const { error } = await supabase.from('fx_rates').upsert({
          base_code: base,
          quote_code: quote,
          rate,
          last_updated: now
        }, { onConflict: ['base_code', 'quote_code'] });
        if (!error) upserted++;
      }
    }
    return new Response(JSON.stringify({ success: true, upserted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 