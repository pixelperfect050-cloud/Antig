const { createClient } = require('@supabase/supabase-js');

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
    console.log('🔄 Starting seed...');

    // 1. Create or get Admin User
    console.log('1️⃣ Creating admin user...');
    let adminId;
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@society.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: 'Admin User', phone: '9999999999' }
    });

    if (adminError) {
      if (adminError.message.includes('already been taken')) {
        console.log('   Admin user already exists, finding...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const existing = users.users.find(u => u.email === 'admin@society.com');
        if (!existing) throw new Error('Admin user not found');
        adminId = existing.id;
        console.log('   ✅ Admin user found');
      } else {
        throw adminError;
      }
    } else {
      adminId = adminData.user.id;
      console.log('   ✅ Admin user created');
    }

    // Create society
    console.log('2️⃣ Creating society...');
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
        total_flats: 60,
        invite_code: 'SUNRISE'
      }])
      .select()
      .single();

    if (societyError) {
      if (societyError.message.includes('duplicate')) {
        console.log('   Society already exists, fetching...');
        const { data: existing } = await supabase.from('societies').select('*').eq('name', 'Sunrise Heights').single();
        if (!existing) throw new Error('Society not found');
        societyData.id = existing.id;
        console.log('   ✅ Society found');
      } else {
        throw societyError;
      }
    } else {
      console.log('   ✅ Society created');
    }
    const societyId = societyData.id;

    // Update admin profile
    console.log('3️⃣ Setting up admin profile...');
    await supabase.from('profiles').upsert([{
      id: adminId,
      email: 'admin@society.com',
      name: 'Admin User',
      phone: '9999999999',
      role: 'admin',
      status: 'approved',
      society_id: societyId
    }]);
    console.log('   ✅ Admin profile set');

    // Create blocks
    console.log('4️⃣ Creating blocks...');
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
      if (error) {
        const existing = await supabase.from('blocks').select('*').eq('name', name).eq('society_id', societyId).single();
        blocks.push(existing.data);
      } else {
        blocks.push(data);
      }
    }
    console.log('   ✅ Blocks created');

    // Create flats
    console.log('5️⃣ Creating flats...');
    const ownerNames = [
      'Rajesh Patel', 'Amit Shah', 'Priya Sharma', 'Vikram Singh', 'Neha Gupta',
      'Suresh Mehta', 'Anjali Desai', 'Kiran Joshi', 'Ravi Kumar', 'Pooja Thakkar',
      'Manish Patel', 'Divya Rao', 'Sachin Verma', 'Komal Bhatt', 'Nitin Agarwal',
      'Swati Pandey', 'Deepak Nair', 'Meera Reddy', 'Arjun Malhotra', 'Sneha Kapoor'
    ];

    const allFlats = [];
    let nameIdx = 0;
    for (const block of blocks) {
      for (let floor = 1; floor <= 5; floor++) {
        for (let flatNum = 1; flatNum <= 4; flatNum++) {
          const flatNumStr = `${floor}${String(flatNum).padStart(2, '0')}`;
          const { data, error } = await supabase
            .from('flats')
            .insert([{
              number: `${block.name}-${flatNumStr}`,
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
          if (error) {
            const existing = await supabase.from('flats').select('*').eq('number', `${block.name}-${flatNumStr}`).single();
            allFlats.push(existing.data);
          } else {
            allFlats.push(data);
          }
          nameIdx++;
        }
      }
    }
    console.log(`   ✅ ${allFlats.length} flats created`);

    // Create payments for last 3 months
    console.log('6️⃣ Creating payments...');
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

        await supabase.from('payments').upsert([{
          flat_id: flat.id,
          society_id: societyId,
          amount: 3000,
          paid_amount: paidAmount,
          month,
          year,
          status,
          paid_date: paidAmount > 0 ? new Date(year, month - 1, Math.floor(Math.random() * 15) + 1).toISOString() : null,
          due_date: new Date(year, month - 1, 15).toISOString(),
          payment_method: ['cash', 'upi', 'bank_transfer'][Math.floor(Math.random() * 3)],
          recorded_by: adminId
        }], { onConflict: 'flat_id,month,year' });
      }
    }
    console.log('   ✅ Payments created');

    // Create member users
    console.log('7️⃣ Creating member users...');
    for (let i = 0; i < 5; i++) {
      const flat = allFlats[i];
      const email = `member${i + 1}@society.com`;
      
      let memberId;
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'member123',
        email_confirm: true,
        user_metadata: { name: flat.owner_name, phone: flat.owner_phone }
      });

      if (userError) {
        if (userError.message.includes('already been taken')) {
          const { data: users } = await supabase.auth.admin.listUsers();
          const existing = users.users.find(u => u.email === email);
          if (!existing) {
            console.log(`   ⚠️ Member ${email} not found, skipping`);
            continue;
          }
          memberId = existing.id;
        } else {
          console.log(`   ⚠️ Error creating ${email}: ${userError.message}`);
          continue;
        }
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

      await supabase.from('flats').update({ user_id: memberId }).eq('id', flat.id);
      console.log(`   ✅ Created ${email}`);
    }

    console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@society.com / admin123');
    console.log('   Member: member1@society.com / member123');
    console.log('\n📍 Society: Sunrise Heights (Invite Code: SUNRISE)');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err);
  }
}

seed();