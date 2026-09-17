import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vjruwbiuczzsalugnufu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcnV3Yml1Y3p6c2FsdWdudWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzYxOTMsImV4cCI6MjEwMzYxMjE5M30.Kbd5ed1hfkHbEMBWWynX4zJWCte6fRm7OVROIhYtjbY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
