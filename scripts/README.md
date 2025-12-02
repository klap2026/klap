# Development Scripts

Helper scripts for local development and testing.

## Generate Authentication Tokens

### Option 1: Direct Token Generation (Fastest) ⚡

Generate a token directly from the database without going through the OTP flow:

```bash
node scripts/generate-token.mjs <phone-number>
```

**Example:**
```bash
# If you have a user with phone +972501234567
node scripts/generate-token.mjs +972501234567

# Output:
# ✅ Found user: John Doe (technician)
# 🎉 Token generated successfully!
# 📋 Copy this token:
# ────────────────────────────────────────────────────────────────────────────────
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# ────────────────────────────────────────────────────────────────────────────────
# 🌐 Use it like this:
# http://localhost:3000/dashboard?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**When to use:**
- ✅ You already have users in your database
- ✅ You want tokens quickly without OTP flow
- ✅ Best for repeated testing

### Option 2: OTP Flow (Creates New Users) 🔐

Get a token by going through the normal OTP authentication flow:

```bash
./scripts/get-dev-token.sh <phone-number>
```

**Example:**
```bash
./scripts/get-dev-token.sh +972509876543

# Output:
# 📞 Sending OTP to +972509876543...
# ✅ Mock OTP code: 123456
# 🔐 Verifying OTP...
# 🎉 SUCCESS! Your token:
# eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**When to use:**
- ✅ Creating a new test user
- ✅ Testing the full authentication flow
- ✅ When you don't have existing users

**Requirements:**
- Server must be running (`npm run dev`)
- Must be in development mode
- `jq` must be installed (`brew install jq` on macOS)

## Finding Existing Users

### Check Database Directly

```bash
# See all users using the token script (it will list them if you provide invalid phone)
node scripts/generate-token.mjs invalid

# Or check Supabase dashboard
# Visit: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

# Or using psql if you have direct database access
psql $DATABASE_URL -c "SELECT phone, role, name FROM users;"
```

### Run the token script without arguments

```bash
node scripts/generate-token.mjs

# Will show usage and suggest checking database
```

## Quick Multi-Tab Setup Workflow

### Important: Multi-User Testing

The query string token (`?token=...`) is checked on **every request** and does NOT set a cookie. This means:
- ⚠️ You must keep `?token=...` in the URL for navigation to work
- ✅ Each tab can have its own token in the URL - true multi-user testing!
- ✅ No cookie conflicts between tabs

**For multi-user testing in the same browser:**
```bash
# 1. Generate tokens
node scripts/generate-token.mjs +972501111111  # Technician
node scripts/generate-token.mjs +972502222222  # Customer

# 2. Open tabs with different tokens
# Tab 1 - Technician
open "http://localhost:3000/dashboard?token=<TECH_TOKEN>"

# Tab 2 - Customer (same browser!)
open "http://localhost:3000/home?token=<CUSTOMER_TOKEN>"

# 3. Keep the token in the URL when navigating
# The middleware checks the query string on every request
```

**Important:** When clicking links in your app, you'll need to include the `?token=...` parameter in the URL to maintain authentication. Without it, the middleware will redirect to login.

## Troubleshooting

### "No user found with phone"
- Run the script without arguments to see available users
- Or use the OTP flow script to create a new user
- Check your Supabase dashboard to see all users

### "Command not found: tsx"
```bash
# Install tsx globally or use npx
npm install -g tsx
# OR just use npx (it will auto-install)
node scripts/generate-token.mjs
```

### "jq: command not found" (for get-dev-token.sh)
```bash
# On macOS
brew install jq

# On Ubuntu/Debian
sudo apt-get install jq
```

### Token doesn't work
- Make sure server is running in development mode
- Check that `NODE_ENV=development` (or not set, defaults to development)
- Verify the token is valid: paste it into https://jwt.io
- Make sure you're including `?token=...` in the URL

## See Also

- `DEV_AUTH_TESTING.md` - Full guide on using query string authentication
- `lib/auth/jwt.ts` - Token signing and verification logic
- `middleware.ts` - Where query string tokens are checked
