import supabase from './supabase';

// ============================================
// AUTH HELPERS
// ============================================

export async function getCurrentProfile() {
  const { data: { session } = {} } = await supabase.auth.getSession();
  const sessionUser = session?.user;
  let user = sessionUser;

  if (!user) {
    const { data: { user: authUser } = {} } = await supabase.auth.getUser();
    user = authUser;
  }

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      society:societies(*),
      flat:flats(*, block:blocks(*))
    `)
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// SOCIETIES
// ============================================

export async function getSociety(societyId) {
  const { data, error } = await supabase
    .from('societies')
    .select('*')
    .eq('id', societyId)
    .single();
  if (error) throw error;
  return data;
}

export async function createSociety(societyData) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('societies')
    .insert({ ...societyData, created_by: user.id })
    .select()
    .single();
  if (error) throw error;

  // Update profile with society_id and admin role
  await supabase
    .from('profiles')
    .update({ society_id: data.id, role: 'admin', status: 'approved' })
    .eq('id', user.id);

  return data;
}

export async function updateSociety(societyId, updates) {
  const { data, error } = await supabase
    .from('societies')
    .update(updates)
    .eq('id', societyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findSocietyByInviteCode(code) {
  const { data, error } = await supabase
    .from('societies')
    .select('*')
    .eq('invite_code', code.toUpperCase())
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// BLOCKS
// ============================================

export async function getBlocks(societyId) {
  const { data, error } = await supabase
    .from('blocks')
    .select('*')
    .eq('society_id', societyId)
    .order('name');
  if (error) throw error;
  return data;
}

export async function createBlock(blockData) {
  const { data, error } = await supabase
    .from('blocks')
    .insert(blockData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBlock(blockId) {
  const { error } = await supabase.from('blocks').delete().eq('id', blockId);
  if (error) throw error;
}

// ============================================
// FLATS
// ============================================

export async function getFlats(societyId, blockId = null) {
  let query = supabase
    .from('flats')
    .select('*, block:blocks(name)')
    .eq('society_id', societyId)
    .order('number');
  if (blockId) query = query.eq('block_id', blockId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFlat(flatId) {
  const { data, error } = await supabase
    .from('flats')
    .select('*, block:blocks(name)')
    .eq('id', flatId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateFlat(flatId, updates) {
  const { data, error } = await supabase
    .from('flats')
    .update(updates)
    .eq('id', flatId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createFlats(flatsArray) {
  const { data, error } = await supabase
    .from('flats')
    .insert(flatsArray)
    .select();
  if (error) throw error;
  return data;
}

// ============================================
// PAYMENTS
// ============================================

export async function getPayments(societyId, filters = {}) {
  let query = supabase
    .from('payments')
    .select('*, flat:flats(number, block:blocks(name))')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false });

  if (filters.month) query = query.eq('month', filters.month);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.flatId) query = query.eq('flat_id', filters.flatId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getPaymentsByFlat(flatId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('flat_id', flatId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPayment(paymentData) {
  const receiptNumber = `RCP-${paymentData.year}${String(paymentData.month).padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`;
  const { data, error } = await supabase
    .from('payments')
    .insert({ ...paymentData, receipt_number: receiptNumber })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePayment(paymentId, updates) {
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePayment(paymentId) {
  const { error } = await supabase.from('payments').delete().eq('id', paymentId);
  if (error) throw error;
}

export async function getPayment(paymentId) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, flat:flats(number, owner_name, block:blocks(name)), society:societies(*)')
    .eq('id', paymentId)
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// PAYMENT REQUESTS
// ============================================

export async function getPaymentRequests(societyId, status = null) {
  let query = supabase
    .from('payment_requests')
    .select('*, flat:flats(number, block:blocks(name)), submitter:profiles!submitted_by(name, email)')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function submitPaymentRequest(requestData) {
  const { data, error } = await supabase
    .from('payment_requests')
    .insert(requestData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function reviewPaymentRequest(requestId, updates) {
  const { data, error } = await supabase
    .from('payment_requests')
    .update({ ...updates, reviewed_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// EXPENSES
// ============================================

export async function getExpenses(societyId, filters = {}) {
  let query = supabase
    .from('expenses')
    .select('*, block:blocks(name), added_by_user:profiles!added_by(name)')
    .eq('society_id', societyId)
    .order('date', { ascending: false });

  if (filters.category) query = query.eq('category', filters.category);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createExpense(expenseData) {
  const { data, error } = await supabase
    .from('expenses')
    .insert(expenseData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExpense(expenseId, updates) {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExpense(expenseId) {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) throw error;
}

// ============================================
// FUNDS
// ============================================

export async function getFunds(societyId) {
  const { data, error } = await supabase
    .from('funds')
    .select('*')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFund(fundData) {
  const { data, error } = await supabase
    .from('funds')
    .insert(fundData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFund(fundId, updates) {
  const { data, error } = await supabase
    .from('funds')
    .update(updates)
    .eq('id', fundId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFund(fundId) {
  const { error } = await supabase.from('funds').delete().eq('id', fundId);
  if (error) throw error;
}

// ============================================
// FUND PAYMENTS
// ============================================

export async function getFundPayments(fundId) {
  const { data, error } = await supabase
    .from('fund_payments')
    .select('*, flat:flats(number, block:blocks(name)), submitter:profiles!submitted_by(name)')
    .eq('fund_id', fundId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getFundPaymentsByFlat(flatId) {
  const { data, error } = await supabase
    .from('fund_payments')
    .select('*, fund:funds(name, category, due_date, amount_per_flat, status)')
    .eq('flat_id', flatId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createFundPayment(paymentData) {
  const { data, error } = await supabase
    .from('fund_payments')
    .insert(paymentData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFundPayment(paymentId, updates) {
  const { data, error } = await supabase
    .from('fund_payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// NOTIFICATIONS
// ============================================

export async function getNotifications(societyId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function createNotification(notifData) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markNotificationRead(notifId, userId) {
  // Append userId to the read_by array
  const { data: notif } = await supabase
    .from('notifications')
    .select('read_by')
    .eq('id', notifId)
    .single();

  const readBy = notif?.read_by || [];
  if (!readBy.includes(userId)) {
    readBy.push(userId);
    await supabase
      .from('notifications')
      .update({ read_by: readBy })
      .eq('id', notifId);
  }
}

// ============================================
// MEMBERS / PROFILES
// ============================================

export async function getMembers(societyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, flat:flats(number, block:blocks(name))')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPendingMembers(societyId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, flat:flats(number, block:blocks(name))')
    .eq('society_id', societyId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateMemberStatus(memberId, status) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', memberId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMemberRole(memberId, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', memberId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// ACTIVITY LOGS
// ============================================

export async function getActivityLogs(societyId, limit = 50) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('society_id', societyId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function createActivityLog(logData) {
  const { error } = await supabase
    .from('activity_logs')
    .insert(logData);
  if (error) console.error('Activity log error:', error);
}

// ============================================
// DEMO LEADS
// ============================================

export async function getDemoLeads() {
  const { data, error } = await supabase
    .from('demo_leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createDemoLead(leadData) {
  const { data, error } = await supabase
    .from('demo_leads')
    .insert(leadData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDemoLead(leadId, updates) {
  const { data, error } = await supabase
    .from('demo_leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(societyId) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Parallel queries for speed
  const [
    { data: allPayments },
    { data: allFundPayments },
    { data: monthPayments },
    { data: allExpenses },
    { data: flats },
    { data: members },
    { data: pendingMembers },
    { data: blocks },
    { data: activeFunds },
    { data: pendingPR },
    { data: pendingFV }
  ] = await Promise.all([
    supabase.from('payments').select('paid_amount, amount').eq('society_id', societyId),
    supabase.from('fund_payments').select('paid_amount').eq('society_id', societyId).eq('status', 'paid'),
    supabase.from('payments').select('paid_amount, amount, late_fee').eq('society_id', societyId).eq('month', currentMonth).eq('year', currentYear),
    supabase.from('expenses').select('amount').eq('society_id', societyId),
    supabase.from('flats').select('current_month_status').eq('society_id', societyId),
    supabase.from('profiles').select('id').eq('society_id', societyId).eq('status', 'approved'),
    supabase.from('profiles').select('id').eq('society_id', societyId).eq('status', 'pending'),
    supabase.from('blocks').select('id').eq('society_id', societyId),
    supabase.from('funds').select('total_target, total_collected').eq('society_id', societyId).eq('status', 'active'),
    supabase.from('payment_requests').select('id').eq('society_id', societyId).eq('status', 'pending_verification'),
    supabase.from('fund_payments').select('id').eq('society_id', societyId).eq('status', 'pending_verification')
  ]);

  const maintenanceCollection = (allPayments || []).reduce((s, p) => s + (p.paid_amount || 0), 0);
  const fundCollection = (allFundPayments || []).reduce((s, p) => s + (p.paid_amount || 0), 0);
  const totalCollection = maintenanceCollection + fundCollection;
  const totalExpenses = (allExpenses || []).reduce((s, e) => s + (e.amount || 0), 0);

  const monthCollection = (monthPayments || []).reduce((s, p) => s + (p.paid_amount || 0), 0);
  const monthDue = (monthPayments || []).reduce((s, p) => s + ((p.amount || 0) - (p.paid_amount || 0)), 0);

  const totalFlats = (flats || []).length;
  const paidFlats = (flats || []).filter(f => f.current_month_status === 'paid').length;
  const pendingFlats = (flats || []).filter(f => f.current_month_status === 'pending').length;
  const partialFlats = (flats || []).filter(f => f.current_month_status === 'partial').length;

  const totalFundTarget = (activeFunds || []).reduce((s, f) => s + (f.total_target || 0), 0);
  const totalFundCollected = (activeFunds || []).reduce((s, f) => s + (f.total_collected || 0), 0);

  return {
    totalCollection,
    totalExpenses,
    currentBalance: totalCollection - totalExpenses,
    monthCollection,
    monthDue,
    totalFlats,
    paidFlats,
    pendingFlats,
    partialFlats,
    totalMembers: (members || []).length,
    pendingMembersCount: (pendingMembers || []).length,
    totalBlocks: (blocks || []).length,
    totalFundTarget,
    totalFundCollected,
    totalFundPending: totalFundTarget - totalFundCollected,
    activeFundsCount: (activeFunds || []).length,
    pendingPaymentRequests: (pendingPR || []).length,
    pendingFundVerifications: (pendingFV || []).length
  };
}

export async function getMemberDashboardStats(flatId, userId) {
  const [
    { data: payments },
    { data: fundPayments },
    { data: pendingRequests }
  ] = await Promise.all([
    supabase.from('payments').select('*').eq('flat_id', flatId).order('created_at', { ascending: false }).limit(12),
    supabase.from('fund_payments').select('*, fund:funds(name, category, due_date, amount_per_flat, status)').eq('flat_id', flatId).order('created_at', { ascending: false }),
    supabase.from('payment_requests').select('id').eq('submitted_by', userId).eq('status', 'pending_verification')
  ]);

  const totalPaid = (payments || []).reduce((s, p) => s + (p.paid_amount || 0), 0);
  const totalDue = (payments || []).reduce((s, p) => s + Math.max(0, (p.amount || 0) + (p.late_fee || 0) - (p.paid_amount || 0)), 0);
  const totalFundPaid = (fundPayments || []).reduce((s, p) => s + (p.paid_amount || 0), 0);
  const totalFundDue = (fundPayments || []).reduce((s, p) => s + Math.max(0, (p.amount || 0) - (p.paid_amount || 0)), 0);

  return {
    payments: payments || [],
    totalPaid,
    totalDue,
    fundPayments: fundPayments || [],
    totalFundPaid,
    totalFundDue,
    pendingRequests: (pendingRequests || []).length
  };
}

// ============================================
// REMINDERS
// ============================================

export async function getReminders(societyId) {
  const { data, error } = await supabase
    .from('reminders')
    .select('*, flat:flats(number), user:profiles!user_id(name)')
    .eq('society_id', societyId)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createReminder(reminderData) {
  const { data, error } = await supabase
    .from('reminders')
    .insert(reminderData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReminder(reminderId) {
  const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
  if (error) throw error;
}

// ============================================
// REPORTS HELPERS
// ============================================

export async function getMonthlyReport(societyId, month, year) {
  const [
    { data: payments },
    { data: expenses }
  ] = await Promise.all([
    supabase.from('payments').select('amount, paid_amount, status').eq('society_id', societyId).eq('month', month).eq('year', year),
    supabase.from('expenses').select('amount, category').eq('society_id', societyId).gte('date', `${year}-${String(month).padStart(2, '0')}-01`).lte('date', `${year}-${String(month).padStart(2, '0')}-31`)
  ]);

  const totalBilled = (payments || []).reduce((s, p) => s + (p.amount || 0), 0);
  const totalCollected = (payments || []).reduce((s, p) => s + (p.paid_amount || 0), 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);

  // Expense breakdown by category
  const expenseBreakdown = {};
  (expenses || []).forEach(e => {
    expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + (e.amount || 0);
  });

  return {
    totalBilled,
    totalCollected,
    outstanding: totalBilled - totalCollected,
    totalExpenses,
    netBalance: totalCollected - totalExpenses,
    paidCount: (payments || []).filter(p => p.status === 'paid').length,
    pendingCount: (payments || []).filter(p => p.status === 'pending').length,
    expenseBreakdown: Object.entries(expenseBreakdown).map(([k, v]) => ({ _id: k, total: v }))
  };
}

// ============================================
// FILE UPLOAD HELPERS
// ============================================

export async function uploadPaymentScreenshot(file, societyId) {
  const ext = file.name.split('.').pop();
  const filePath = `${societyId}/${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('payment-screenshots')
    .upload(filePath, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from('payment-screenshots')
    .getPublicUrl(filePath);
  return publicUrl;
}

export async function uploadSocietyLogo(file, societyId) {
  const ext = file.name.split('.').pop();
  const filePath = `${societyId}/logo.${ext}`;
  const { data, error } = await supabase.storage
    .from('society-logos')
    .upload(filePath, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage
    .from('society-logos')
    .getPublicUrl(filePath);
  return publicUrl;
}
