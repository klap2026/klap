# Row Level Security (RLS) Setup Guide

⚠️ **CRITICAL:** This must be done before production launch!

## What is RLS?

Row Level Security ensures that users can only access their own data in the database. Without RLS enabled, anyone with your Supabase URL could potentially access all data.

## Step-by-Step Setup

### Method 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase project:**
   - Open https://app.supabase.com
   - Select your project

2. **Open the SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy the RLS migration:**
   - Open the file `supabase/migrations/enable_rls_policies.sql` in your code editor
   - Copy ALL the contents (Cmd/Ctrl + A, then Cmd/Ctrl + C)

4. **Paste and run:**
   - Paste the SQL into the Supabase SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)
   - Wait for success message

5. **Verify it worked:**
   - Run this query in the SQL Editor:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```
   - You should see `rowsecurity = true` for all your tables

### Method 2: Command Line (Advanced)

If you have `psql` installed:

```bash
# Get your database connection string from Supabase Dashboard → Settings → Database
# Look for "Connection string" under "Connection pooling"

psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]/postgres" \
  -f supabase/migrations/enable_rls_policies.sql
```

### Method 3: Supabase CLI

If you're using the Supabase CLI:

```bash
# Link to your project (first time only)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

## Verification Checklist

After applying the migration, verify:

### 1. RLS is Enabled

Run this query:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('User', 'Customer', 'Technician', 'Job', 'Session', 'OtpCode');
```

**Expected result:** All tables should show `rowsecurity = true`

### 2. Policies are Created

Run this query:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected result:** You should see multiple policies for each table (like "Users can view own profile", "Customers can view own profile", etc.)

### 3. Indexes are Created

Run this query:
```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename;
```

**Expected result:** You should see indexes like `idx_user_phone`, `idx_customer_userid`, etc.

## Test the RLS Policies

### Test 1: Users Can Only See Their Own Data

Try running this from the Supabase SQL Editor:

```sql
-- This should work (service role has full access)
SELECT * FROM "User";

-- To test as a regular user, you'd need to:
-- 1. Use the Supabase JavaScript client with the anon key
-- 2. The RLS policies would automatically filter results
```

### Test 2: API Endpoints Still Work

After enabling RLS, test your API endpoints:

1. Log in via the app
2. Try creating a customer profile
3. Try viewing the dashboard
4. Try booking a job

If everything works, RLS is properly configured!

## What if Something Goes Wrong?

### Error: "new row violates row-level security policy"

This means your API is trying to insert data but the RLS policy is blocking it.

**Solution:** Make sure your API endpoints are using `SUPABASE_SERVICE_KEY` (not the anon key). The service key bypasses RLS.

### Error: "Cannot access table"

**Solution:** Check that the service role policies are created:

```sql
SELECT * FROM pg_policies
WHERE policyname LIKE '%Service role%';
```

### Need to Rollback?

If you need to disable RLS (NOT recommended for production):

```sql
-- Disable RLS on all tables
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Technician" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OtpCode" DISABLE ROW LEVEL SECURITY;
```

## Production Checklist

Before launching:

- [ ] RLS migration applied successfully
- [ ] All tables show `rowsecurity = true`
- [ ] All policies are created
- [ ] Indexes are created
- [ ] API endpoints still work
- [ ] Users can access their own data
- [ ] Users CANNOT access other users' data
- [ ] Test with multiple user accounts

## Need Help?

If you run into issues:
1. Check the Supabase logs (Dashboard → Logs)
2. Check your API server logs
3. Review the error messages carefully
4. Contact Supabase support if needed

---

**Status:** [ ] Not Applied | [ ] Applied | [ ] Verified

**Applied By:** _______________

**Date:** _______________
