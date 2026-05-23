/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string, buildTimeValue: string): string => {
  const runtimeValue = (window as any).__ENV__?.[name];
  if (runtimeValue && runtimeValue !== `__${name}__` && runtimeValue !== `YOUR_${name.substring(5)}`) {
    return runtimeValue;
  }
  return buildTimeValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL || '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY || '');

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  !supabaseUrl.includes('__VITE_SUPABASE_URL__')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (isSupabaseConfigured) {
  console.log('Matchmaking CRM: Supabase Client initialized successfully.', { supabaseUrl });
} else {
  console.warn('Matchmaking CRM: Supabase is not configured. Running in Sandbox Mode with Local Browser Storage.');
}
