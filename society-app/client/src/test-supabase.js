import supabase from './lib/supabase';

window.testSupabase = async () => {
  console.log('Testing Supabase...');
  console.log('URL:', supabase.supabaseUrl);
  
  try {
    // Try a simple query
    const { data, error } = await supabase.from('societies').select('*').limit(1);
    console.log('Result:', { data, error });
    return { data, error };
  } catch (e) {
    console.error('Error:', e.message);
    return { error: e.message };
  }
};

// Auto-run test
window.testSupabase().then(console.log);