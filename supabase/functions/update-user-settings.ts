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

    const { currency_code, plan, notifications_enabled, theme, language } = await req.json();

    const updateData: Record<string, any> = {};
    if (currency_code !== undefined) updateData.currency_code = currency_code;
    if (plan !== undefined) updateData.plan = plan;
    if (notifications_enabled !== undefined) updateData.notifications_enabled = notifications_enabled;
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;

    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        ...updateData
      }, { onConflict: ['user_id'] });

    if (error) {
      throw new Error('Failed to update user settings');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 