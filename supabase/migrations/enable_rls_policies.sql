-- =====================================================
-- CRITICAL SECURITY: Row Level Security (RLS) Policies
-- =====================================================
-- This migration enables RLS on all tables and creates
-- policies for service role access only.
--
-- Your app uses custom JWT auth + service role key,
-- so all API operations bypass RLS (as intended).
-- RLS prevents direct database access via anon key.
--
-- Run this BEFORE production launch!
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Technician" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OtpCode" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Service Role Access Policies
-- =====================================================
-- These policies allow your API (using service role key)
-- to access all data, while blocking direct anon key access

-- User table - service role only
CREATE POLICY "Service role has full access to User"
ON "User" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Customer table - service role only
CREATE POLICY "Service role has full access to Customer"
ON "Customer" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Technician table - service role only
CREATE POLICY "Service role has full access to Technician"
ON "Technician" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Job table - service role only
CREATE POLICY "Service role has full access to Job"
ON "Job" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Session table - service role only
CREATE POLICY "Service role has full access to Session"
ON "Session" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- OtpCode table - service role only
CREATE POLICY "Service role has full access to OtpCode"
ON "OtpCode" FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Create indexes for performance
-- =====================================================

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_phone ON "User"(phone);

-- Customer table indexes
CREATE INDEX IF NOT EXISTS idx_customer_userid ON "Customer"("userId");

-- Technician table indexes
CREATE INDEX IF NOT EXISTS idx_technician_userid ON "Technician"("userId");

-- Job table indexes
CREATE INDEX IF NOT EXISTS idx_job_customerid ON "Job"("customerId");
CREATE INDEX IF NOT EXISTS idx_job_technicianid ON "Job"("technicianId");
CREATE INDEX IF NOT EXISTS idx_job_status ON "Job"(status);
CREATE INDEX IF NOT EXISTS idx_job_scheduled_start ON "Job"("scheduledStart");

-- Session table indexes
CREATE INDEX IF NOT EXISTS idx_session_userid ON "Session"("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON "Session"(token);
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON "Session"("expiresAt");

-- OtpCode table indexes
CREATE INDEX IF NOT EXISTS idx_otpcode_phone ON "OtpCode"(phone);
CREATE INDEX IF NOT EXISTS idx_otpcode_expires_at ON "OtpCode"("expiresAt");

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
--
-- 1. RLS is ENABLED on all tables, blocking direct access
--    via the anon key (NEXT_PUBLIC_SUPABASE_URL + anon key)
--
-- 2. Your API endpoints use SUPABASE_SERVICE_KEY which has
--    service_role privileges, so they bypass RLS completely
--
-- 3. This architecture means:
--    ✓ Direct database access is blocked (security)
--    ✓ API endpoints work normally (no changes needed)
--    ✓ Authorization is handled in your API layer
--
-- 4. Your API endpoints MUST verify:
--    - User is authenticated (check JWT)
--    - User owns the data they're accessing
--    - User has permission for the operation
--
-- 5. To apply this migration:
--    - Option 1: Run via Supabase Dashboard SQL Editor
--    - Option 2: Use Supabase CLI: supabase db push
--    - Option 3: Use psql: psql -h your-db -U postgres -f this_file.sql
--
-- 6. To verify RLS is enabled:
--    SELECT tablename, rowsecurity
--    FROM pg_tables
--    WHERE schemaname = 'public';
--
--    All tables should show rowsecurity = true
-- =====================================================
