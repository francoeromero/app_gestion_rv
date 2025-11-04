import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srkkhadypryfcselzfhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNya2toYWR5cHJ5ZmNzZWx6ZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTg5MjMsImV4cCI6MjA3NzgzNDkyM30.i7n0rv7c9cMZZDKyKif0CLuedA-YhrNSSxBWlWVnGDc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);