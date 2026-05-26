import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noynqninbbjhlwxqufht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5veW5xbmluYmJqaGx3eHF1Zmh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyMDE3NiwiZXhwIjoyMDk0Njk2MTc2fQ.NE9PWY7FMWBkSFPZOS2fns4MO_NJkCMKr5XzWEpx0AU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  try {
    console.log('Starting seed...');

    // 1. Create Admin User
    console.log('Creating admin user...');
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@society.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: 'Admin User', phone: '9999999999' }
    });
    
    let adminId;
    if (adminError) {
      console.log('Admin user might already exist, trying to find it...');
      // Try to find the user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existingUser = users.users.find(u => u.email === 'admin@society.com');
      if (!existingUser) throw new Error('Could not create or find admin user');
      adminId = existingUser.id;
    } else {
      adminId = adminData.user.id;
    }

    // Manually create profile to be safe
    console.log('Upserting admin profile...');
    const { error: profileError } = await supabase.from('profiles').upsert([{
      id: adminId,
      email: 'admin@society.com',
      name: 'Admin User',
      phone: '9999999999',
      role: 'admin',
      status: 'approved'
    }]);
    if (profileError) console.error('Profile upsert error:', profileError.message);

    // 2. Create Society
    console.log('Creating society...');
    const { data: societyData, error: societyError } = await supabase
      .from('societies')
      .insert([{
        name: 'Sunrise Heights',
        address: '123 Main Road, Sector 15',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380015',
        maintenance_amount: 3000,
        late_fee_per_day: 50,
        late_fee_after_days: 15,
        billing_day: 1,
        created_by: adminId,
        total_blocks: 3,
        total_flats: 60
      }])
      .select()
      .single();
    
    if (societyError) throw societyError;
    const societyId = societyData.id;

    // Update admin profile with society_id
    await supabase
      .from('profiles')
      .update({ society_id: societyId })
      .eq('id', adminId);

    // 3. Create Blocks
    console.log('Creating blocks...');
    const blockNames = ['A', 'B', 'C'];
    const blocks = [];
    for (const name of blockNames) {
      const { data, error } = await supabase
        .from('blocks')
        .insert([{
          name,
          society_id: societyId,
          total_floors: 5,
          flats_per_floor: 4
        }])
        .select()
        .single();
      if (error) throw error;
      blocks.push(data);
    }

    // 4. Create Flats
    console.log('Creating flats...');
    const ownerNames = ['Rajesh Patel', 'Amit Shah', 'Priya Sharma', 'Vikram Singh', 'Neha Gupta',
      'Suresh Mehta', 'Anjali Desai', 'Kiran Joshi', 'Ravi Kumar', 'Pooja Thakkar',
      'Manish Patel', 'Divya Rao', 'Sachin Verma', 'Komal Bhatt', 'Nitin Agarwal',
      'Swati Pandey', 'Deepak Nair', 'Meera Reddy', 'Arjun Malhotra', 'Sneha Kapoor'];

    const allFlats = [];
    let nameIdx = 0;
    for (const block of blocks) {
      for (let floor = 1; floor <= 5; floor++) {
        for (let flatNum = 1; flatNum <= 4; flatNum++) {
          const { data, error } = await supabase
            .from('flats')
            .insert([{
              number: `${block.name}-${floor}${String(flatNum).padStart(2, '0')}`,
              block_id: block.id,
              society_id: societyId,
              floor,
              owner_name: ownerNames[nameIdx % ownerNames.length],
              owner_phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
              type: ['1BHK', '2BHK', '3BHK'][Math.floor(Math.random() * 3)],
              area: [650, 950, 1200][Math.floor(Math.random() * 3)],
              is_occupied: Math.random() > 0.1,
              current_month_status: 'pending'
            }])
            .select()
            .single();
          if (error) throw error;
          allFlats.push(data);
          nameIdx++;
        }
      }
    }

    // 5. Create Payments for last 3 months
    console.log('Creating payments...');
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();

      for (const flat of allFlats) {
        if (!flat.is_occupied) continue;

        const rand = Math.random();
        let status, paidAmount;
        if (rand > 0.3) {
          status = 'paid';
          paidAmount = 3000;
        } else if (rand > 0.15) {
          status = 'partial';
          paidAmount = Math.floor(Math.random() * 2000) + 500;
        } else {
          status = 'pending';
          paidAmount = 0;
        }

        const { error } = await supabase
          .from('payments')
          .insert([{
            flat_id: flat.id,
            society_id: societyId,
            amount: 3000,
            paid_amount: paidAmount,
            month,
            year,
            status,
            paid_date: paidAmount > 0 ? new Date(year, month - 1, Math.floor(Math.random() * 15) + 1) : null,
            due_date: new Date(year, month - 1, 15),
            payment_method: ['cash', 'upi', 'bank_transfer'][Math.floor(Math.random() * 3)],
            recorded_by: adminId
          }]);
        if (error) console.error('Payment error:', error.message);
      }
    }

    // 6. Create Member Users (for first 5 flats)
    console.log('Creating member users...');
    for (let i = 0; i < 5; i++) {
      const flat = allFlats[i];
      const email = `member${i + 1}@society.com`;
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'member123',
        email_confirm: true,
        user_metadata: { name: flat.owner_name, phone: flat.owner_phone }
      });
      
      let memberId;
      if (userError) {
        console.log(`Member ${email} might already exist...`);
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;
        const existingUser = users.users.find(u => u.email === email);
        if (!existingUser) {
          console.error('Could not create or find member user');
          continue;
        }
        memberId = existingUser.id;
      } else {
        memberId = userData.user.id;
      }

      await supabase.from('profiles').upsert([{
        id: memberId,
        email: email,
        name: flat.owner_name,
        phone: flat.owner_phone,
        role: 'member',
        status: 'approved',
        society_id: societyId,
        flat_id: flat.id
      }]);
      
      await supabase
        .from('flats')
        .update({ user_id: memberId })
        .eq('id', flat.id);
    }

    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  }
}

seed();
