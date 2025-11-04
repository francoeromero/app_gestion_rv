
import { createClient } from '@supabase/supabase-js';

// Las variables de entorno se cargarán aquí cuando se configure la integración.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
    supabaseUrl || "https://srkkhadypryfcselzfhr.supabase.co", 
    supabaseAnonKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNya2toYWR5cHJ5ZmNzZWx6ZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTg5MjMsImV4cCI6MjA3NzgzNDkyM30.i7n0rv7c9cMZZDKyKif0CLuedA-YhrNSSxBWlWVnGDc"
);
