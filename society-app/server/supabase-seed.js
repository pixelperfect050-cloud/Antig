require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function seed() {
  console.log('🔄 Creating seed data...\n');

  // 1. Create Society
  const societyId = '00000000-0000-0000-0000-000000000001';
  const { data: society, error: socErr } = await supabase
    .from('societies')
    .upsert({
      id: societyId,
      name: 'Sunrise Heights',
      address: '123 Main Road, Mumbai',
      invite_code: 'SUNRISE',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      maintenance_amount: 2500,
      late_fee_per_day: 10,
      late_fee_after_days: 15,
      billing_day: 1,
      total_blocks: 2,
      total_flats: 20
    }, { onConflict: 'id' })
    .select()
    .single();

  if (socErr) {
    console.log('⚠️ Society:', socErr.message);
  } else {
    console.log('✅ Society created:', society.name);
  }

  // 2. Create Blocks
  const blockAId = '00000000-0000-0000-0000-000000000010';
  const blockBId = '00000000-0000-0000-0000-000000000011';

  await supabase.from('blocks').upsert([
    { id: blockAId, name: 'A', society_id: societyId, total_floors: 5, flats_per_floor: 5, description: 'Block A' },
    { id: blockBId, name: 'B', society_id: societyId, total_floors: 5, flats_per_floor: 5, description: 'Block B' }
  ], { onConflict: 'id' });
  console.log('✅ Blocks created');

  // 3. Create Flats
  const flats = [];
  for (let b = 0; b < 2; b++) {
    const blockId = b === 0 ? blockAId : blockBId;
    for (let f = 1; f <= 5; f++) {
      for (let fl = 1; fl <= 5; fl++) {
        const flatNum = `${f}0${fl}`;
        flats.push({
          id: `00000000-0000-0000-${b}${f}${fl}`.padEnd(36, '0').slice(0, 36),
          number: flatNum,
          block_id: blockId,
          society_id: societyId,
          floor: f,
          owner_name: `Owner ${flatNum}`,
          owner_phone: `987654${fl}${fl}${fl}${fl}${fl}`,
          type: f <= 2 ? '2BHK' : '3BHK',
          area: f <= 2 ? 1000 : 1400,
          is_occupied: true,
          current_month_status: 'pending'
        });
      }
    }
  }
  await supabase.from('flats').upsert(flats, { onConflict: 'id' });
  console.log('✅ Flats created:', flats.length);

  // 4. Create demo users via auth
  console.log('\n📝 Creating demo users...');

  // Admin user
  const { data: adminAuth, error: adminAuthErr } = await supabase.auth.admin.createUser({
    email: 'admin@society.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { name: 'Society Admin' }
  });

  if (adminAuthErr) {
    console.log('⚠️ Admin user might exist:', adminAuthErr.message);
    // Try to get the user
    const { data: adminList } = await supabase.auth.admin.listUsers();
    const adminUser = adminList.users.find(u => u.email === 'admin@society.com');
    if (adminUser) {
      await supabase.from('profiles').upsert({
        id: adminUser.id,
        name: 'Society Admin',
        email: 'admin@society.com',
        phone: '9876543210',
        role: 'admin',
        status: 'approved',
        society_id: societyId,
        is_active: true
      }, { onConflict: 'id' });
      console.log('✅ Admin profile updated');
    }
  } else {
    await supabase.from('profiles').upsert({
      id: adminAuth.user.id,
      name: 'Society Admin',
      email: 'admin@society.com',
      phone: '9876543210',
      role: 'admin',
      status: 'approved',
      society_id: societyId,
      is_active: true
    }, { onConflict: 'id' });
    console.log('✅ Admin user created: admin@society.com / admin123');
  }

  // Member user
  const { data: memberAuth, error: memberAuthErr } = await supabase.auth.admin.createUser({
    email: 'member1@society.com',
    password: 'member123',
    email_confirm: true,
    user_metadata: { name: 'John Member' }
  });

  if (memberAuthErr) {
    console.log('⚠️ Member user might exist:', memberAuthErr.message);
  } else {
    // Get first flat for member
    const { data: flatData } = await supabase.from('flats').select('id').limit(1).single();
    await supabase.from('profiles').upsert({
      id: memberAuth.user.id,
      name: 'John Member',
      email: 'member1@society.com',
      phone: '9876543211',
      role: 'member',
      status: 'approved',
      society_id: societyId,
      flat_id: flatData?.id,
      is_active: true
    }, { onConflict: 'id' });
    console.log('✅ Member user created: member1@society.com / member123');
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('📋 Login Credentials:');
  console.log('   Admin: admin@society.com / admin123');
  console.log('   Member: member1@society.com / member123');
  console.log('   Society Code: SUNRISE');

  process.exit(0);
}

seed().catch(e => {
  console.error('❌ Seed failed:', e.message);
  process.exit(1);
});