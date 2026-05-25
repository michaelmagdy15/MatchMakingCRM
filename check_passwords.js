import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

const emails = [
  'sarah@datingcrm.com',
  'youssef@datingcrm.com',
  'matchmaker@datingcrm.com'
];

const passwords = [
  'password',
  'password123',
  '123456',
  'admin',
  'admin123',
  'purematch',
  'purematch123'
];

async function tryLogins() {
  for (const email of emails) {
    for (const password of passwords) {
      console.log(`Trying ${email} with password: ${password}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        // Keep going
      } else {
        console.log(`SUCCESS! Logged in as ${email}`);
        console.log("User:", data.user);
        
        // Try reading users
        const { data: users, error: usersErr } = await supabase.from('users').select('*');
        console.log("Users query result count:", users ? users.length : 0, usersErr || "");
        return;
      }
    }
  }
  console.log("All login attempts failed.");
}

tryLogins();
