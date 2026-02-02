import { createClient } from "@supabase/supabase-js";

// Directly configure Supabase client (anon key is safe to expose in client apps)
const supabaseUrl = "https://ifjilxskaobevayyvmjh.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmamlseHNrYW9iZXZheXl2bWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwMjkzNTUsImV4cCI6MjA4NTYwNTM1NX0.5loJfJpYyTbNjdtqGlE8EhS6cUdddDVrp-QPAlXVwpg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
