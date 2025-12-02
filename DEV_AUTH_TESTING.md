# Development Authentication Testing Guide

This guide explains how to use query string authentication for local development testing.

## Overview

In development mode, you can authenticate by passing a JWT token via the `?token=...` query parameter. This allows you to:
- Open multiple browser tabs with different user sessions
- Quickly switch between user roles (technician/customer)
- Test multi-user scenarios in the same browser

## How It Works

The middleware checks for a `token` query parameter in development mode:
1. If `?token=...` is present → Uses that token
2. Otherwise → Falls back to normal cookie-based auth

## Getting a Token

### Option 1: Extract from Browser Cookies

1. Log in normally via the UI (`http://localhost:3000/login`)
2. Open browser DevTools → Application → Cookies
3. Copy the value of the `auth-token` cookie
4. Use this token in the URL

### Option 2: Extract from DevTools Network Tab

1. Log in normally via the UI
2. Open DevTools → Network tab
3. Find the `/api/auth/verify-otp` request
4. Look at the Response → Copy the `token` field

### Option 3: Check Terminal Logs (if logging is enabled)

Some API responses may log tokens to the terminal during development.

## Usage Examples

### Single Tab Testing

```bash
# Open as technician
http://localhost:3000/dashboard?token=YOUR_TECH_TOKEN_HERE

# Open as customer
http://localhost:3000/home?token=YOUR_CUSTOMER_TOKEN_HERE
```

### Multi-Tab Testing

```bash
# Tab 1: Open as technician
# 1. Get technician token (log in as technician, extract token)
# 2. Open: http://localhost:3000/dashboard?token=TECH_TOKEN

# Tab 2: Open as customer in the SAME browser
# 1. Get customer token (log in as customer in incognito or extract from DB)
# 2. Open: http://localhost:3000/home?token=CUSTOMER_TOKEN

# Now both tabs are authenticated as different users!
```

## Important Notes

### Token Persistence
- The token stays in the URL as you navigate
- Next.js automatically preserves query parameters during navigation
- If you navigate to a URL without the `?token=...`, it will fall back to cookie auth

### Development Only
- This feature ONLY works when `NODE_ENV=development`
- In production, query string tokens are completely ignored
- Always uses secure cookie-based auth in production

### Security
- Never commit real tokens to git
- Tokens expire after 30 days (see `lib/auth/jwt.ts`)
- Invalid tokens redirect to login page

## Troubleshooting

### Token redirects to login
- Token may be expired (30 day limit)
- Token may be invalid (check JWT format)
- Verify the token works: Check that it's a valid JWT at jwt.io

### Still using old session
- Make sure `?token=...` is in the URL
- Check browser DevTools → Network → Request Headers → Cookie to see what's being sent
- Try opening in an incognito window to avoid cookie conflicts

### Token not working in production
- This is expected behavior - feature is development-only
- Use normal cookie-based login in production

## Creating Test Users

If you need to create test users with specific roles:

```sql
-- Connect to your database and run:

-- Create a technician user
INSERT INTO users (id, phone, role)
VALUES ('test-tech-id', '+1234567890', 'technician');

-- Create a customer user
INSERT INTO users (id, phone, role)
VALUES ('test-customer-id', '+9876543210', 'customer');
```

Then log in via the UI to get valid tokens for these users.

## Quick Reference

| What | How |
|------|-----|
| **Enable feature** | Already enabled in development mode |
| **Get token** | Log in via UI → DevTools → Application → Cookies → `auth-token` |
| **Use token** | Add `?token=YOUR_TOKEN` to any URL |
| **Multiple tabs** | Use different tokens in different tab URLs |
| **Reset to cookie auth** | Remove `?token=...` from URL |
| **Production** | Feature automatically disabled |

## Example Workflow

1. **Get Technician Token**
   ```bash
   # Log in as technician via UI
   # DevTools → Application → Cookies → Copy auth-token value
   # Let's say you get: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Get Customer Token**
   ```bash
   # Option A: Log in as customer in incognito window, extract token
   # Option B: Use a different browser, log in as customer, extract token
   # Option C: Clear cookies, log in as customer, extract token
   ```

3. **Open Multi-Tab Setup**
   ```bash
   # Tab 1 (Technician Dashboard)
   http://localhost:3000/dashboard?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TECH_PAYLOAD.SIGNATURE

   # Tab 2 (Customer Home)
   http://localhost:3000/home?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.CUSTOMER_PAYLOAD.SIGNATURE
   ```

4. **Navigate Freely**
   - Both tabs maintain their respective authentication
   - Click any links - the token stays in the URL automatically
   - You can now test technician ↔ customer interactions!

## Technical Details

- **Implementation**: `middleware.ts` lines 31-45
- **Token Format**: JWT with HS256 algorithm
- **Token Payload**: `{ userId, phone, role }`
- **Token Expiry**: 30 days (configured in `lib/auth/jwt.ts`)
- **Environment Check**: `process.env.NODE_ENV === 'development'`
