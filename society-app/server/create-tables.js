const { Client } = require('pg');

const client = new Client({
  host: 'db.sasldvwxuegvuwlwolmu.supabase.co',
  user: 'postgres',
  password: 'SocietySync@2026#Admin',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase');

    // Enable uuid-ossp
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ uuid-ossp enabled');

    // Create tables
    const sql = `
      -- Profiles
      CREATE TABLE IF NOT EXISTS profiles (
        id uuid PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL,
        phone text DEFAULT '', role text DEFAULT 'member', status text DEFAULT 'approved',
        resident_type text DEFAULT 'none', society_id uuid, flat_id uuid,
        avatar text DEFAULT '', is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Societies
      CREATE TABLE IF NOT EXISTS societies (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text NOT NULL,
        address text NOT NULL, invite_code text, city text DEFAULT '',
        state text DEFAULT '', pincode text DEFAULT '', maintenance_amount numeric DEFAULT 0,
        late_fee_per_day numeric DEFAULT 0, late_fee_after_days integer DEFAULT 15,
        billing_day integer DEFAULT 1, logo text DEFAULT '', contact_number text DEFAULT '',
        upi_id text DEFAULT '', total_blocks integer DEFAULT 0, total_flats integer DEFAULT 0,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Blocks
      CREATE TABLE IF NOT EXISTS blocks (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text NOT NULL,
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        total_floors integer NOT NULL, flats_per_floor integer NOT NULL,
        description text DEFAULT '', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Flats
      CREATE TABLE IF NOT EXISTS flats (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), number text NOT NULL,
        block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE, floor integer NOT NULL,
        owner_name text DEFAULT 'Vacant', owner_phone text DEFAULT '', owner_email text DEFAULT '',
        tenant_name text DEFAULT '', tenant_phone text DEFAULT '', area numeric DEFAULT 0,
        type text DEFAULT '2BHK', is_occupied boolean DEFAULT true, user_id uuid,
        current_month_status text DEFAULT 'pending',
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Payments
      CREATE TABLE IF NOT EXISTS payments (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE, amount numeric NOT NULL,
        paid_amount numeric DEFAULT 0, month integer NOT NULL, year integer NOT NULL,
        status text DEFAULT 'pending', paid_date timestamptz, payment_method text DEFAULT 'cash',
        transaction_id text DEFAULT '', late_fee numeric DEFAULT 0, notes text DEFAULT '',
        receipt_number text, recorded_by uuid,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Payment Requests
      CREATE TABLE IF NOT EXISTS payment_requests (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        submitted_by uuid NOT NULL, payment_id uuid, amount numeric NOT NULL,
        month integer NOT NULL, year integer NOT NULL, payment_method text NOT NULL,
        transaction_id text DEFAULT '', screenshot_url text DEFAULT '', notes text DEFAULT '',
        status text DEFAULT 'pending_verification', admin_notes text DEFAULT '',
        reviewed_by uuid, reviewed_at timestamptz,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Expenses
      CREATE TABLE IF NOT EXISTS expenses (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        category text NOT NULL, description text NOT NULL, amount numeric NOT NULL,
        date timestamptz DEFAULT now(), block_id uuid, vendor text DEFAULT '',
        receipt text DEFAULT '', added_by uuid NOT NULL, is_recurring boolean DEFAULT false,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Funds
      CREATE TABLE IF NOT EXISTS funds (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        name text NOT NULL, description text DEFAULT '', category text DEFAULT 'other',
        amount_per_flat numeric NOT NULL, total_target numeric DEFAULT 0, total_collected numeric DEFAULT 0,
        due_date timestamptz NOT NULL, applicable_to text DEFAULT 'all',
        applicable_blocks uuid[] DEFAULT '{}', status text DEFAULT 'active',
        created_by uuid NOT NULL, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Fund Payments
      CREATE TABLE IF NOT EXISTS fund_payments (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        fund_id uuid REFERENCES funds(id) ON DELETE CASCADE,
        flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        amount numeric NOT NULL, paid_amount numeric DEFAULT 0,
        status text DEFAULT 'pending', payment_method text DEFAULT 'cash',
        transaction_id text DEFAULT '', screenshot_url text DEFAULT '', notes text DEFAULT '',
        submitted_by uuid, recorded_by uuid, paid_date timestamptz,
        reviewed_by uuid, admin_notes text DEFAULT '',
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Notifications
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        title text NOT NULL, message text NOT NULL, type text DEFAULT 'general',
        target_users uuid[] DEFAULT '{}', target_all boolean DEFAULT false,
        read_by uuid[] DEFAULT '{}', created_by uuid,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Reminders
      CREATE TABLE IF NOT EXISTS reminders (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        flat_id uuid REFERENCES flats(id) ON DELETE CASCADE,
        user_id uuid NOT NULL, type text NOT NULL, title text NOT NULL, message text NOT NULL,
        scheduled_date timestamptz NOT NULL, sent_date timestamptz,
        status text DEFAULT 'pending', channel text DEFAULT 'in_app',
        metadata jsonb DEFAULT '{}', retry_count integer DEFAULT 0,
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );

      -- Activity Logs
      CREATE TABLE IF NOT EXISTS activity_logs (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        society_id uuid REFERENCES societies(id) ON DELETE CASCADE,
        admin_id uuid NOT NULL, admin_name text NOT NULL, admin_email text DEFAULT '',
        action_type text NOT NULL, description text NOT NULL, target_type text DEFAULT 'other',
        target_id uuid, metadata jsonb DEFAULT '{}', created_at timestamptz DEFAULT now()
      );

      -- Demo Leads
      CREATE TABLE IF NOT EXISTS demo_leads (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name text NOT NULL, mobile text NOT NULL, society_name text DEFAULT '',
        number_of_flats integer DEFAULT 0, city text DEFAULT '',
        preferred_demo_time text DEFAULT '', status text DEFAULT 'new',
        notes text DEFAULT '', source text DEFAULT 'ai_chat',
        created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
      );
    `;

    await client.query(sql);
    console.log('✅ Tables created');

    // Add foreign keys
    await client.query(`
      ALTER TABLE profiles ADD CONSTRAINT fk_profiles_society FOREIGN KEY (society_id) REFERENCES societies(id);
      ALTER TABLE profiles ADD CONSTRAINT fk_profiles_flat FOREIGN KEY (flat_id) REFERENCES flats(id);
    `);
    console.log('✅ Foreign keys added');

    // Enable RLS
    await client.query(`
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
      ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
      ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
      ALTER TABLE fund_payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✅ RLS enabled');

    // Create policies
    await client.query(`
      CREATE POLICY "service_full" ON profiles FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON societies FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON blocks FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON flats FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON payments FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON payment_requests FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON expenses FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON funds FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON fund_payments FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON notifications FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON reminders FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "service_full" ON demo_leads FOR ALL USING (true) WITH CHECK (true);
    `);
    console.log('✅ RLS Policies created');

    // Create trigger for new user signup
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, name, phone)
        VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    console.log('✅ User trigger created');

    console.log('\n🎉 All done! Database ready.');
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log('❌ Error:', e.message);
    await client.end();
    process.exit(1);
  }
}

createTables();