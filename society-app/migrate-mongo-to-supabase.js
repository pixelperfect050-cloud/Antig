require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MONGO_URI = process.env.MONGO_URI;

console.log('🔗 Supabase:', supabaseUrl);
console.log('🔗 MongoDB:', MONGO_URI ? 'Connected' : 'Not found');

async function migrate() {
  console.log('🔄 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB Connected');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Society = mongoose.model('Society', new mongoose.Schema({}, { strict: false }), 'societies');
  const Block = mongoose.model('Block', new mongoose.Schema({}, { strict: false }), 'blocks');
  const Flat = mongoose.model('Flat', new mongoose.Schema({}, { strict: false }), 'flats');
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }), 'payments');
  const Expense = mongoose.model('Expense', new mongoose.Schema({}, { strict: false }), 'expenses');
  const Fund = mongoose.model('Fund', new mongoose.Schema({}, { strict: false }), 'funds');
  const FundPayment = mongoose.model('FundPayment', new mongoose.Schema({}, { strict: false }), 'fundpayments');
  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }), 'notifications');

  console.log('\n📊 Migrating Data...\n');

  // 1. Users -> Profiles
  console.log('1. Migrating Users → Profiles...');
  const users = await User.find({});
  console.log(`   Found ${users.length} users`);
  
  for (const user of users) {
    try {
      await supabase.from('profiles').upsert({
        id: user._id.toString(),
        name: user.name || user.email?.split('@')[0] || 'User',
        email: user.email,
        phone: user.phone || '',
        role: user.role || 'member',
        status: user.status || 'approved',
        resident_type: user.residentType || 'none',
        society_id: user.societyId?._id?.toString() || user.societyId || null,
        flat_id: user.flatId?._id?.toString() || user.flatId || null,
        avatar: user.avatar || '',
        is_active: user.isActive !== false
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ User error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 2. Societies
  console.log('2. Migrating Societies...');
  const societies = await Society.find({});
  console.log(`   Found ${societies.length} societies`);

  for (const soc of societies) {
    try {
      await supabase.from('societies').upsert({
        id: soc._id.toString(),
        name: soc.name,
        address: soc.address || '',
        invite_code: soc.inviteCode || soc.invite_code || null,
        city: soc.city || '',
        state: soc.state || '',
        pincode: soc.pincode || '',
        maintenance_amount: soc.maintenanceAmount || soc.maintenance_amount || 0,
        late_fee_per_day: soc.lateFeePerDay || soc.late_fee_per_day || 0,
        late_fee_after_days: soc.lateFeeAfterDays || soc.late_fee_after_days || 15,
        billing_day: soc.billingDay || soc.billing_day || 1,
        logo: soc.logo || '',
        contact_number: soc.contactNumber || soc.contact_number || '',
        upi_id: soc.upiId || soc.upi_id || '',
        total_blocks: soc.totalBlocks || soc.total_blocks || 0,
        total_flats: soc.totalFlats || soc.total_flats || 0,
        google_sheet_id: soc.googleSheetId || soc.google_sheet_id || '',
        google_sheet_url: soc.googleSheetUrl || soc.google_sheet_url || ''
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Society error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 3. Blocks
  console.log('3. Migrating Blocks...');
  const blocks = await Block.find({});
  console.log(`   Found ${blocks.length} blocks`);

  for (const block of blocks) {
    try {
      await supabase.from('blocks').upsert({
        id: block._id.toString(),
        name: block.name,
        society_id: block.societyId?._id?.toString() || block.societyId || null,
        total_floors: block.totalFloors || block.total_floors || 1,
        flats_per_floor: block.flatsPerFloor || block.flats_per_floor || 1,
        description: block.description || ''
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Block error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 4. Flats
  console.log('4. Migrating Flats...');
  const flats = await Flat.find({});
  console.log(`   Found ${flats.length} flats`);

  for (const flat of flats) {
    try {
      await supabase.from('flats').upsert({
        id: flat._id.toString(),
        number: flat.number,
        block_id: flat.blockId?._id?.toString() || flat.blockId || null,
        society_id: flat.societyId?._id?.toString() || flat.societyId || null,
        floor: flat.floor || 0,
        owner_name: flat.ownerName || flat.owner_name || 'Vacant',
        owner_phone: flat.ownerPhone || flat.owner_phone || '',
        owner_email: flat.ownerEmail || flat.owner_email || '',
        tenant_name: flat.tenantName || flat.tenant_name || '',
        tenant_phone: flat.tenantPhone || flat.tenant_phone || '',
        area: flat.area || 0,
        type: flat.type || '2BHK',
        is_occupied: flat.isOccupied !== false,
        user_id: flat.userId?._id?.toString() || flat.userId || null,
        current_month_status: flat.currentMonthStatus || flat.current_month_status || 'pending'
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Flat error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 5. Payments
  console.log('5. Migrating Payments...');
  const payments = await Payment.find({});
  console.log(`   Found ${payments.length} payments`);

  for (const p of payments) {
    try {
      await supabase.from('payments').upsert({
        id: p._id.toString(),
        flat_id: p.flatId?._id?.toString() || p.flatId || null,
        society_id: p.societyId?._id?.toString() || p.societyId || null,
        amount: p.amount || 0,
        paid_amount: p.paidAmount || p.paid_amount || 0,
        month: p.month,
        year: p.year,
        status: p.status || 'pending',
        paid_date: p.paidDate || p.paid_date || null,
        payment_method: p.paymentMethod || p.payment_method || 'cash',
        transaction_id: p.transactionId || p.transaction_id || '',
        late_fee: p.lateFee || p.late_fee || 0,
        notes: p.notes || '',
        receipt_number: p.receiptNumber || p.receipt_number || null,
        recorded_by: p.recordedBy?.toString() || p.recorded_by || null
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Payment error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 6. Expenses
  console.log('6. Migrating Expenses...');
  const expenses = await Expense.find({});
  console.log(`   Found ${expenses.length} expenses`);

  for (const exp of expenses) {
    try {
      await supabase.from('expenses').upsert({
        id: exp._id.toString(),
        society_id: exp.societyId?._id?.toString() || exp.societyId || null,
        category: exp.category || 'misc',
        description: exp.description || '',
        amount: exp.amount || 0,
        date: exp.date || new Date(),
        block_id: exp.blockId?._id?.toString() || exp.blockId || null,
        vendor: exp.vendor || '',
        added_by: exp.addedBy?.toString() || exp.added_by || null,
        is_recurring: exp.isRecurring || exp.is_recurring || false
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Expense error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 7. Funds
  console.log('7. Migrating Funds...');
  const funds = await Fund.find({});
  console.log(`   Found ${funds.length} funds`);

  for (const f of funds) {
    try {
      await supabase.from('funds').upsert({
        id: f._id.toString(),
        society_id: f.societyId?._id?.toString() || f.societyId || null,
        name: f.name,
        description: f.description || '',
        category: f.category || 'other',
        amount_per_flat: f.amountPerFlat || f.amount_per_flat || 0,
        total_target: f.totalTarget || f.total_target || 0,
        total_collected: f.totalCollected || f.total_collected || 0,
        due_date: f.dueDate || f.due_date || new Date(),
        applicable_to: f.applicableTo || f.applicable_to || 'all',
        status: f.status || 'active',
        created_by: f.createdBy?.toString() || f.created_by || null
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Fund error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 8. Fund Payments
  console.log('8. Migrating Fund Payments...');
  const fundPayments = await FundPayment.find({});
  console.log(`   Found ${fundPayments.length} fund payments`);

  for (const fp of fundPayments) {
    try {
      await supabase.from('fund_payments').upsert({
        id: fp._id.toString(),
        fund_id: fp.fundId?.toString() || fp.fund_id || null,
        flat_id: fp.flatId?.toString() || fp.flat_id || null,
        society_id: fp.societyId?.toString() || fp.society_id || null,
        amount: fp.amount || 0,
        paid_amount: fp.paidAmount || fp.paid_amount || 0,
        status: fp.status || 'pending',
        payment_method: fp.paymentMethod || fp.payment_method || 'cash',
        transaction_id: fp.transactionId || fp.transaction_id || '',
        submitted_by: fp.submittedBy?.toString() || fp.submitted_by || null
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ FundPayment error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  // 9. Notifications
  console.log('9. Migrating Notifications...');
  const notifications = await Notification.find({});
  console.log(`   Found ${notifications.length} notifications`);

  for (const n of notifications) {
    try {
      await supabase.from('notifications').upsert({
        id: n._id.toString(),
        society_id: n.societyId?.toString() || n.society_id || null,
        title: n.title,
        message: n.message,
        type: n.type || 'general',
        created_by: n.createdBy?.toString() || n.created_by || null
      }, { onConflict: 'id' });
    } catch (e) {
      console.log(`   ⚠️ Notification error: ${e.message}`);
    }
  }
  console.log('   ✅ Done');

  console.log('\n🎉 Migration Complete!\n');
  process.exit(0);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});