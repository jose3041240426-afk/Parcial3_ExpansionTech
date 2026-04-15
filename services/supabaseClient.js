import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tu URL se extrajo automáticamente de manera segura desde el token que diste
const supabaseUrl = "https://btptdsmosmsafuxejlrt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0cHRkc21vc21zYWZ1eGVqbHJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjA0OTYsImV4cCI6MjA5MTY5NjQ5Nn0.Q0FJqj0wYGKjGcq_4fs15s1VOwcF6DsAf6qQPiPo4uo";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
