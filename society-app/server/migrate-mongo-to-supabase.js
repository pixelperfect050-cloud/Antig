require('dotenv').config();
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://noynqninbbjhlwxqufht.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5veW5xbmluYmJqaGx3eHF1Zmh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyMDE3NiwiZXhwIjoyMDk0Njk2MTc2fQ.NE9PWY7FMWBkSFPZOS2fns4MO_NJkCMKr5XzWEpx0AU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function migrate() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('./src/models/User');
    const Society = require('./src/models/Society');
    const Block = require('./src/models/Block');
    const Flat = require('./src/models/Flat');
    const Payment = require('./src/models/Payment');
    const Expense = require('./src/models/Expense');

    // Get first society
    const society = await Society.findOne();
    if (!society) {
      console.log('❌ No society found in MongoDB');
      return;
    }
    console.log(`📍 Society: ${society.name}`);

    // Create society in Supabase
    console.log('1️⃣ Creating society in Supabase...');
    const inviteCode = society.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
    
    const { data: socData, error: socError } = await supabase
      .from('societies')
      .insert([{
        name: society.name,
        address: society.address || '',
        city: society.city || '',
        state: society.state || '',
        pincode: society.pincode || '',
        maintenance_amount: society.maintenanceAmount || 0,
        late_fee_per_day: society.lateFeePerDay || 0,
        late_fee_after_days: society.lateFeeAfterDays || 15,
        billing_day: society.billingDay || 1,
        total_blocks: society.totalBlocks || 0,
        total_flats: society.totalFlats || 0,
        invite_code: inviteCode
      }])
      .select()
      .single();

    if (socError) {
      const existing = await supabase.from('societies').select('*').limit(1).single();
      if (existing.data) {
        socData.id = existing.data.id;
        console.log('   ✅ Society already exists');
      } else {
        throw socError;
      }
    } else {
      console.log('   ✅ Society created');
    }
    const societyId = socData.id;

    // Create admin user
    console.log('2️⃣ Creating admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    let adminId;

    const { data: adminAuth, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: adminUser.email,
      password: 'admin123',
      email_confirm: true,
      user_metadata: { name: adminUser.name, phone: adminUser.phone }
    });

    if (adminAuthError && adminAuthError.message.includes('already been taken')) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find(u => u.email === adminUser.email);
      if (existing) {
        adminId = existing.id;
        console.log('   ✅ Admin user found');
      } else {
        adminId = '00000000-0000-0000-0000-000000000001';
        console.log('   ⚠️ Admin not found, using placeholder');
      }
    } else if (adminAuth?.user) {
      adminId = adminAuth.user.id;
      console.log('   ✅ Admin user created');
    } else {
      adminId = '00000000-0000-0000-0000-000000000001';
      console.log('   ⚠️ No admin auth, using placeholder');
    }

    await supabase.from('profiles').upsert([{
      id: adminId,
      email: adminUser.email,
      name: adminUser.name,
      phone: adminUser.phone,
      role: 'admin',
      status: 'approved',
      society_id: societyId
    }]);
    console.log('   ✅ Admin profile set');

    // Update society with created_by
    await supabase.from('societies').update({ created_by: adminId }).eq('id', societyId);

    // Get and create blocks
    console.log('3️⃣ Creating blocks...');
    const mongoBlocks = await Block.find({ societyId: society._id });
    const blockMap = {};
    
    for (const block of mongoBlocks) {
      const { data, error } = await supabase
        .from('blocks')
        .insert([{
          name: block.name,
          society_id: societyId,
          total_floors: block.totalFloors,
          flats_per_floor: block.flatsPerFloor
        }])
        .select()
        .single();
      
      if (error) {
        const existing = await supabase.from('blocks').select('*').eq('name', block.name).eq('society_id', societyId).single();
        blockMap[block._id.toString()] = existing.data.id;
      } else {
        blockMap[block._id.toString()] = data.id;
      }
    }
    console.log(`   ✅ ${Object.keys(blockMap).length} blocks created`);

    // Get and create flats
    console.log('4️⃣ Creating flats...');
    const mongoFlats = await Flat.find({ societyId: society._id });
    const flatMap = {};
    const memberUsers = [];

    for (const flat of mongoFlats) {
      const blockId = blockMap[flat.blockId.toString()] || mongoBlocks[0]?._id;
      
      const { data, error } = await supabase
        .from('flats')
        .insert([{
          number: flat.number,
          block_id: blockId,
          society_id: societyId,
          floor: flat.floor,
          owner_name: flat.ownerName || 'Vacant',
          owner_phone: flat.ownerPhone || '',
          owner_email: flat.ownerEmail || '',
          tenant_name: flat.tenantName || '',
          tenant_phone: flat.tenantPhone || '',
          area: flat.area || 0,
          type: flat.type || '2BHK',
          is_occupied: flat.isOccupied ?? true,
          current_month_status: flat.currentMonthStatus || 'pending'
        }])
        .select()
        .single();

      if (error) {
        const existing = await supabase.from('flats').select('*').eq('number', flat.number).eq('society_id', societyId).single();
        flatMap[flat._id.toString()] = existing.data.id;
      } else {
        flatMap[flat._id.toString()] = data.id;
      }

      // Store flat for member creation
      if (flat.userId && memberUsers.length < 5) {
        memberUsers.push({ flat: data.id, flatData: flat });
      }
    }
    console.log(`   ✅ ${Object.keys(flatMap).length} flats created`);

    // Create member users
    console.log('5️⃣ Creating member users...');
    const mongoMembers = await User.find({ role: 'member', societyId: society._id }).limit(5);
    
    for (let i = 0; i < Math.min(mongoMembers.length, 5); i++) {
      const member = mongoMembers[i];
      const email = member.email || `member${i + 1}@society.com`;
      
      try {
        const { data: userAuth } = await supabase.auth.admin.createUser({
          email: email,
          password: 'member123',
          email_confirm: true,
          user_metadata: { name: member.name, phone: member.phone }
        });

        if (userAuth?.user) {
          await supabase.from('profiles').upsert([{
            id: userAuth.user.id,
            email: email,
            name: member.name,
            phone: member.phone,
            role: 'member',
            status: 'approved',
            society_id: societyId,
            flat_id: flatMap[member.flatId?.toString()] || null
          }]);

          if (member.flatId) {
            await supabase.from('flats').update({ user_id: userAuth.user.id }).eq('id', flatMap[member.flatId.toString()]);
          }
          console.log(`   ✅ Created ${email}`);
        }
      } catch (e) {
        console.log(`   ⚠️ ${email} might exist`);
      }
    }

    // Create payments
    console.log('6️⃣ Creating payments...');
    const mongoPayments = await Payment.find({ societyId: society._id }).limit(200);
    
    for (const payment of mongoPayments) {
      const flatId = flatMap[payment.flatId?.toString()];
      if (!flatId) continue;

      await supabase.from('payments').upsert([{
        flat_id: flatId,
        society_id: societyId,
        amount: payment.amount || 0,
        paid_amount: payment.paidAmount || 0,
        month: payment.month,
        year: payment.year,
        status: payment.status || 'pending',
        paid_date: payment.paidDate?.toISOString() || null,
        due_date: payment.dueDate?.toISOString() || null,
        payment_method: payment.paymentMethod || 'cash',
        transaction_id: payment.transactionId || '',
        late_fee: payment.lateFee || 0,
        notes: payment.notes || '',
        recorded_by: adminId
      }], { onConflict: 'flat_id,month,year' });
    }
    console.log(`   ✅ ${mongoPayments.length} payments created`);

    // Create expenses
    console.log('7️⃣ Creating expenses...');
    const mongoExpenses = await Expense.find({ societyId: society._id }).limit(100);
    
    for (const expense of mongoExpenses) {
      await supabase.from('expenses').insert([{
        society_id: societyId,
        category: expense.category || 'misc',
        description: expense.description || '',
        amount: expense.amount || 0,
        date: expense.date?.toISOString() || new Date().toISOString(),
        block_id: expense.blockId ? blockMap[expense.blockId.toString()] : null,
        vendor: expense.vendor || '',
        receipt: expense.receipt || '',
        added_by: adminId,
        is_recurring: expense.isRecurring || false
      }]);
    }
    console.log(`   ✅ ${mongoExpenses.length} expenses created`);

    console.log('\n🎉 MIGRATION COMPLETED!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@society.com / admin123');
    console.log('   Member: member1@society.com / member123');
    console.log(`\n📍 Invite Code: ${inviteCode}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();