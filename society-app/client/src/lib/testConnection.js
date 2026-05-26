import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noynqninbbjhlwxqufht.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5veW5xbmluYmJqaGx3eHF1Zmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMjAxNzYsImV4cCI6MjA5NDY5NjE3Nn0.wQuQrfH0RCEgmxWn6IPqxuOUNsGvo7jtVGC5G2Ev67c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Connection failed:', error.message);
    } else {
      console.log('✅ Connection successful! Profiles count:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
