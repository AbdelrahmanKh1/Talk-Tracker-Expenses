import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wamciuoxtdtrlqlcfodm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhbWNpdW94dGR0cmxxbGNmb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1NTQzNDksImV4cCI6MjA2NjEzMDM0OX0.ojzO7oRBv24eHkV0P59GUscSS41vEBjlDhnNmxVl5dg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 