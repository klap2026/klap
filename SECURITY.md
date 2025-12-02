# Security Guide

## Pre-Launch Security Checklist

### 1. Update JWT_SECRET

**⚠️ CRITICAL:** Change the JWT_SECRET before launch!

```bash
# Generate a strong random secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update in your `.env.local` and production environment:
```env
JWT_SECRET=your-generated-secret-here
```

**After updating:**
- All existing tokens will be invalidated
- Users will need to log in again
- Do this during a maintenance window if possible

### 2. Apply Row Level Security (RLS) Policies

**⚠️ CRITICAL:** Enable RLS before allowing direct Supabase client access!

```bash
# Apply the RLS migration
psql -h your-supabase-db.supabase.co -U postgres -d postgres -f supabase/migrations/enable_rls_policies.sql

# Or via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/enable_rls_policies.sql
# 3. Run the SQL
```

**Verify RLS is enabled:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 3. Secure API Keys

#### Google Places API Key Restrictions

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your Places API key
3. Add restrictions:
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** Add your production domain
     ```
     https://yourdomain.com/*
     ```
   - **API restrictions:** Select "Restrict key" and enable only:
     - Places API (New)
     - Places API

#### Supabase Keys

- **Never** expose `SUPABASE_SERVICE_KEY` to the client
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side (with RLS enabled)
- Rotate keys if compromised:
  1. Generate new key in Supabase Dashboard → Settings → API
  2. Update environment variables
  3. Deploy new version
  4. Revoke old key

### 4. Environment Variables

**Development (`.env.local`):**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-anon-key

# Auth
OTP_MODE=mock
OTP_EXPIRY_MINUTES=5
JWT_SECRET=dev-secret-key-change-in-production

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_PLACES_API_KEY=your-dev-api-key
```

**Production:**
```env
# Supabase - Use production project
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_SERVICE_KEY=your-prod-service-key

# Auth
OTP_MODE=production
OTP_EXPIRY_MINUTES=5
JWT_SECRET=<GENERATE-STRONG-SECRET-HERE>

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
GOOGLE_PLACES_API_KEY=your-prod-api-key-with-restrictions

# WhatsApp Business API (for production OTP)
WHATSAPP_BUSINESS_ID=your-business-id
WHATSAPP_API_TOKEN=your-api-token
```

### 5. Secret Rotation Schedule

Rotate secrets regularly:

| Secret | Rotation Frequency | Priority |
|--------|-------------------|----------|
| JWT_SECRET | Every 90 days | High |
| Supabase Keys | When compromised | Critical |
| Google Places API Key | Every 180 days | Medium |
| WhatsApp API Token | Every 180 days | Medium |

### 6. Rate Limiting

Rate limiting has been added to auth endpoints:
- **Send OTP:** 5 requests per phone number per hour
- **Verify OTP:** 10 requests per phone number per hour
- **Login:** 10 requests per IP per 15 minutes

Monitor rate limit violations in logs.

## Authentication Flow

### Current Implementation

1. **Login:**
   - User requests OTP → `/api/auth/send-otp`
   - User submits OTP → `/api/auth/verify-otp`
   - Server creates session and sets HTTP-only cookie

2. **Protected Routes:**
   - Middleware checks for `auth-token` cookie
   - Verifies JWT signature
   - Checks role-based access
   - Redirects unauthorized users to `/login`

3. **Logout:**
   - Client calls `/api/auth/logout`
   - Server invalidates session in database
   - Clears HTTP-only cookie

### Cookie Settings

The `auth-token` cookie has these security settings:
- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` - HTTPS only (production)
- `sameSite: 'lax'` - CSRF protection
- `maxAge: 30 days` - Auto-expires

## Common Security Issues

### XSS (Cross-Site Scripting)

**Protected by:**
- HTTP-only cookies (tokens not accessible to JavaScript)
- Input sanitization on all user inputs
- React's built-in XSS protection

**Still vulnerable if:**
- You use `dangerouslySetInnerHTML`
- Third-party scripts are compromised

### CSRF (Cross-Site Request Forgery)

**Protected by:**
- `sameSite: 'lax'` cookie setting
- Token validation on all mutations

**Best practice:**
- Add CSRF tokens for sensitive operations

### SQL Injection

**Protected by:**
- Supabase uses parameterized queries
- RLS policies enforce data isolation

**Stay safe:**
- Never build raw SQL from user input
- Always use Supabase query builders

### Session Hijacking

**Mitigated by:**
- HTTP-only cookies
- HTTPS in production
- Session expiration (30 days)
- Session invalidation on logout

**Additional protection:**
- Implement device fingerprinting
- Monitor for suspicious session activity
- Add IP address validation

## Incident Response

If a security breach occurs:

1. **Immediately:**
   - Rotate all secrets (JWT_SECRET, API keys)
   - Invalidate all sessions
   - Block affected IPs if identified

2. **Investigation:**
   - Check logs for unauthorized access
   - Identify affected users
   - Document the breach

3. **Notification:**
   - Notify affected users
   - Require password/OTP reset
   - Document compliance with data protection laws

4. **Prevention:**
   - Fix the vulnerability
   - Add monitoring/alerts
   - Update this document

## Monitoring & Alerts

Set up alerts for:
- Failed login attempts (>10 in 1 hour)
- Rate limit violations
- Database RLS policy violations
- Unusual API usage patterns
- Session hijacking attempts

## Compliance

### GDPR (if serving EU users)

- [ ] Privacy policy published
- [ ] Cookie consent implemented
- [ ] Data retention policy defined
- [ ] User data export capability
- [ ] User data deletion capability
- [ ] Data processing agreement with Supabase

### Data Retention

- **Sessions:** Auto-delete after 30 days
- **OTP codes:** Auto-delete after expiration
- **User data:** Retain indefinitely (or per your policy)
- **Logs:** Retain for 90 days

## Deployment Checklist

Before deploying to production:

- [ ] JWT_SECRET is strong and unique
- [ ] All API keys have restrictions
- [ ] RLS policies are enabled
- [ ] OTP_MODE set to 'production'
- [ ] HTTPS is enforced
- [ ] Environment variables are secure
- [ ] Rate limiting is active
- [ ] Monitoring is set up
- [ ] Backup system is tested
- [ ] Incident response plan is ready

## Contact

For security concerns, contact: [your-security-email@domain.com]
