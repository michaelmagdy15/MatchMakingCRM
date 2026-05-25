import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Connecting to:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function run() {
  const email = `admin_${Date.now()}@datingcrm.com`;
  const password = 'SuperSecurePassword123!';

  console.log(`Signing up new user: ${email}`);
  const result = await supabase.auth.signUp({
    email,
    password
  });

  console.log("Sign up result:", JSON.stringify(result, null, 2));
}

run();
