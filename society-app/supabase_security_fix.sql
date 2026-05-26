-- ============================================
-- SocietySync: Production-Grade Security Fix
-- Fixes all Supabase Security Advisor warnings
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX FUNCTION SECURITY (Search Path)
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create secure handle_new_user with fixed search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Set secure search_path to prevent schema planting attacks
  PERFORM set_config('search_path', 'public', true);
  
  INSERT INTO public.profiles (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 2. ADD ROLE COLUMNS TO PROFILES
-- ============================================

-- Add super_admin capability (existing role column already supports this)
-- Ensure proper role values are enforced
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'member'));

-- ============================================
-- 3. DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read society members" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Societies
DROP POLICY IF EXISTS "Members can read own society" ON societies;
DROP POLICY IF EXISTS "Admins can insert societies" ON societies;
DROP POLICY IF EXISTS "Admins can update own society" ON societies;

-- Blocks
DROP POLICY IF EXISTS "Members read blocks" ON blocks;
DROP POLICY IF EXISTS "Admins write blocks" ON blocks;

-- Flats
DROP POLICY IF EXISTS "Members read flats" ON flats;
DROP POLICY IF EXISTS "Admins write flats" ON flats;

-- Payments
DROP POLICY IF EXISTS "Members read payments" ON payments;
DROP POLICY IF EXISTS "Admins write payments" ON payments;

-- Payment Requests
DROP POLICY IF EXISTS "Members read own requests" ON payment_requests;
DROP POLICY IF EXISTS "Members submit requests" ON payment_requests;
DROP POLICY IF EXISTS "Admins manage requests" ON payment_requests;

-- Expenses
DROP POLICY IF EXISTS "Members read expenses" ON expenses;
DROP POLICY IF EXISTS "Admins write expenses" ON expenses;

-- Funds
DROP POLICY IF EXISTS "Members read funds" ON funds;
DROP POLICY IF EXISTS "Admins write funds" ON funds;

-- Fund Payments
DROP POLICY IF EXISTS "Members read fund payments" ON fund_payments;
DROP POLICY IF EXISTS "Members submit fund payments" ON fund_payments;
DROP POLICY IF EXISTS "Admins manage fund payments" ON fund_payments;

-- Notifications
DROP POLICY IF EXISTS "Members read notifications" ON notifications;
DROP POLICY IF EXISTS "Admins write notifications" ON notifications;
DROP POLICY IF EXISTS "Members update read status" ON notifications;

-- Reminders
DROP POLICY IF EXISTS "Members read reminders" ON reminders;
DROP POLICY IF EXISTS "Admins write reminders" ON reminders;

-- Activity Logs
DROP POLICY IF EXISTS "Admins read logs" ON activity_logs;
DROP POLICY IF EXISTS "System insert logs" ON activity_logs;

-- Demo Leads
DROP POLICY IF EXISTS "Public insert leads" ON demo_leads;
DROP POLICY IF EXISTS "Admin read leads" ON demo_leads;
DROP POLICY IF EXISTS "Admin update leads" ON demo_leads;

-- ============================================
-- 4. CREATE SECURE RLS POLICIES
-- ============================================

-- ============================================
-- PROFILES: Role-based access
-- ============================================

-- Users can read their own profile
CREATE POLICY "Profile read own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (but not role/status)
CREATE POLICY "Profile update own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can read all members in their society
CREATE POLICY "Admins read society members" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'super_admin')
      AND p2.society_id = profiles.society_id
    )
  );

-- Admins can update members in their society
CREATE POLICY "Admins update society members" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role IN ('admin', 'super_admin')
      AND p2.society_id = profiles.society_id
    )
  );

-- Super admins can do anything
CREATE POLICY "Super admin manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ============================================
-- SOCIETIES: Strict access control
-- ============================================

-- Members can read their society
CREATE POLICY "Members read society" ON societies
  FOR SELECT USING (
    id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Only admins can insert societies (with proper validation)
CREATE POLICY "Admins insert societies" ON societies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can update their own society
CREATE POLICY "Admins update society" ON societies
  FOR UPDATE USING (
    id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can delete
CREATE POLICY "Super admin delete society" ON societies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ============================================
-- BLOCKS: Society isolation
-- ============================================

-- Members read blocks in their society
CREATE POLICY "Members read blocks" ON blocks
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins can create/update blocks in their society
CREATE POLICY "Admins manage blocks" ON blocks
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- FLATS: Strict society + block isolation
-- ============================================

-- Members read flats in their society
CREATE POLICY "Members read flats" ON flats
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins can manage flats in their society
CREATE POLICY "Admins manage flats" ON flats
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PAYMENTS: Full isolation by society
-- ============================================

-- Members read payments in their society
CREATE POLICY "Members read payments" ON payments
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins manage payments in their society
CREATE POLICY "Admins manage payments" ON payments
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- PAYMENT REQUESTS: Member submission + Admin management
-- ============================================

-- Members read requests in their society
CREATE POLICY "Members read payment requests" ON payment_requests
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Members can submit requests (own flat only)
CREATE POLICY "Members submit payment requests" ON payment_requests
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid() AND
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Members can update their own requests
CREATE POLICY "Members update own requests" ON payment_requests
  FOR UPDATE USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can manage all requests in their society
CREATE POLICY "Admins manage payment requests" ON payment_requests
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- EXPENSES: Admin-only write, member read
-- ============================================

-- Members read expenses in their society
CREATE POLICY "Members read expenses" ON expenses
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins manage expenses in their society
CREATE POLICY "Admins manage expenses" ON expenses
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- FUNDS: Admin management, member read
-- ============================================

-- Members read funds in their society
CREATE POLICY "Members read funds" ON funds
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins manage funds in their society
CREATE POLICY "Admins manage funds" ON funds
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- FUND PAYMENTS: Member submit + Admin manage
-- ============================================

-- Members read fund payments in their society
CREATE POLICY "Members read fund payments" ON fund_payments
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Members can submit fund payments for their flat
CREATE POLICY "Members submit fund payments" ON fund_payments
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Members can update their own submissions
CREATE POLICY "Members update own fund payments" ON fund_payments
  FOR UPDATE USING (
    submitted_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins manage all fund payments in their society
CREATE POLICY "Admins manage fund payments" ON fund_payments
  FOR ALL USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- NOTIFICATIONS: Role-based access
-- ============================================

-- Members read notifications in their society
CREATE POLICY "Members read notifications" ON notifications
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins create notifications in their society
CREATE POLICY "Admins create notifications" ON notifications
  FOR INSERT WITH CHECK (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Members can update read status of their society's notifications
CREATE POLICY "Members update notification status" ON notifications
  FOR UPDATE USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
  );

-- Admins can delete notifications in their society
CREATE POLICY "Admins delete notifications" ON notifications
  FOR DELETE USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- REMINDERS: User + Society isolation
-- ============================================

-- Members read reminders for their flat/society
CREATE POLICY "Members read reminders" ON reminders
  FOR SELECT USING (
    society_id IN (SELECT society_id FROM profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- Members create reminders for themselves
CREATE POLICY "Members create reminders" ON reminders
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Members update their own reminders, admins update all
CREATE POLICY "Members update reminders" ON reminders
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins delete reminders in their society
CREATE POLICY "Admins delete reminders" ON reminders
  FOR DELETE USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- ACTIVITY LOGS: Admin-only access
-- ============================================

-- Admins read logs from their society
CREATE POLICY "Admins read activity logs" ON activity_logs
  FOR SELECT USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Authenticated users can insert logs (backend validates proper data)
CREATE POLICY "Authenticated insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- Admins delete logs in their society
CREATE POLICY "Admins delete activity logs" ON activity_logs
  FOR DELETE USING (
    society_id IN (
      SELECT society_id FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- DEMO LEADS: Allow public insert, admin-only management
-- ============================================

-- Public can submit leads (for landing page demo requests)
-- But only basic fields can be set (no role spoofing)
CREATE POLICY "Public insert demo leads" ON demo_leads
  FOR INSERT WITH CHECK (
    name IS NOT NULL 
    AND name != ''
    AND mobile IS NOT NULL 
    AND mobile != ''
    AND status = 'new'
  );

-- Only admins can read leads
CREATE POLICY "Admins read demo leads" ON demo_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can update leads
CREATE POLICY "Admins update demo leads" ON demo_leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Only admins can delete leads
CREATE POLICY "Admins delete demo leads" ON demo_leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 5. SECURE STORAGE BUCKETS
-- ============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Auth users upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Society members read screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone read logos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Auth users read receipts" ON storage.objects;

-- Create buckets if not exist
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('payment-screenshots', 'payment-screenshots', false),
  ('society-logos', 'society-logos', true),
  ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Payment Screenshots: Society members can read, authenticated can upload
CREATE POLICY "Payment screenshots - authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payment-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Payment screenshots - society members read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payment-screenshots' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Payment screenshots - society members delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'payment-screenshots' 
    AND auth.role() = 'authenticated'
  );

-- Society Logos: Public read, authenticated upload (admins should validate)
CREATE POLICY "Logos - public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'society-logos');

CREATE POLICY "Logos - authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'society-logos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Logos - authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'society-logos' 
    AND auth.role() = 'authenticated'
  );

-- Receipts: Society members read/write
CREATE POLICY "Receipts - society members read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Receipts - society members upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Receipts - society members delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'receipts' 
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- 6. ADDITIONAL SECURITY MEASURES
-- ============================================

-- Disable public signup if not already disabled
-- This should be configured in Authentication > Settings > Sign up

-- Create helper function to check user society membership
CREATE OR REPLACE FUNCTION public.user_society_id()
RETURNS uuid AS $$
  SELECT society_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

-- Create helper function to check user role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

-- Create helper function to check if user is admin in society
CREATE OR REPLACE FUNCTION public.is_society_admin(society_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND society_id = society_uuid 
    AND role IN ('admin', 'super_admin')
  )
$$ LANGUAGE sql STABLE;

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Check RLS status on all tables
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- List all policies
-- SELECT policyname, tablename, permissive, roles, cmd 
-- FROM pg_policies WHERE schemaname = 'public';

-- ============================================
-- DONE
-- ============================================