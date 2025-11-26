# TechFlow - Field Technician Scheduling App

## Overview

A mobile-first web application that offloads secretarial work from field technicians (HVAC, plumbers, electricians). Two user types access the same system:

- **Technicians** - Manage schedule, respond to bookings, track jobs
- **Customers** - Book services, track job status, view history

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Database Client:** Supabase JavaScript SDK
- **Styling:** Tailwind CSS
- **Auth:** Custom Phone OTP (mock mode for development)
- **Notifications:** Push notifications (web)

## MVP Scope

### V1 (Current)
- Phone OTP authentication (mock mode shows code in UI)
- Technician app: Dashboard, Heat Map scheduler, Job details, Customer history
- Customer app: Book service, Select slots, Track status, History
- Job lifecycle: request → slots_proposed → confirmed → en_route → arrived → completed

### V2 (Future)
- WhatsApp bot for customer booking
- Production OTP via WhatsApp Business API
- Invoicing & payments

---

## User Personas

### Technicians
- Excellent at their trade, not tech-savvy
- Work in varied environments (bright/dark, mobile)
- Skeptical of technology - need control, not automation
- Need quick, glanceable information

### Customers
- Booking home services
- Want simple, clear communication
- Need visibility into job status

---

## Design System

### Mobile-First Philosophy

**IMPORTANT:** This app is designed exclusively for mobile devices. Desktop layouts are not a priority and do not need to work well. All UI components should be optimized for:
- Touch interactions (minimum 44px tap targets)
- Portrait orientation on phones (320px - 428px width)
- Single-column layouts
- Bottom-sheet modals and mobile navigation patterns

### Visual Style: "Refined Industrial"

```
Colors:
- Background: White (#FFFFFF)
- Headers/Primary: Navy Blue (#1a365d)
- CTA/Actions: Safety Orange (#dd6b20)
- Success/Efficient: Green (#38a169)
- Warning/Medium: Yellow/Amber (#d69e2e)
- Danger/Inefficient: Red (#e53e3e)
- Blocked/Disabled: Gray (#a0aec0)
```

### UX Principles
- **Mobile-only design** - No desktop optimization required
- Minimal typing - large thumb-friendly buttons (min 44px height)
- Visual data over dense text
- Progressive disclosure - summaries first, details on demand
- High contrast for outdoor/varied lighting readability
- Bottom-aligned primary actions for easy thumb reach

---

## Data Model

See database schema in Supabase dashboard or migration files for complete schema.

### Core Entities
- **User** - Auth record (phone + role)
- **Technician** - Profile with specializations & working hours
- **Customer** - Profile with default address
- **Job** - Full lifecycle from request to completion
- **OtpCode** - Authentication codes (temporary)

### Job Status Flow
```
request_received → slots_proposed → confirmed → en_route → arrived → completed
                                 ↘ cancelled
```

---

## Key Features

### Heat Map Scheduling
When a booking request comes in, technicians see a calendar with efficiency-scored time slots:
- 🟢 **Gold/Green:** <10 min from existing job (High efficiency)
- 🟡 **Yellow:** 20-30 min drive (Medium efficiency)
- 🔴 **Red:** >30 min drive (Low efficiency)  
- ⚫ **Gray:** Blocked (personal calendar)

Technician taps 3-5 preferred slots → sent to customer for selection.

### AI Job Classification
Customer descriptions are classified by LLM into categories (e.g., "ac_repair", "installation") that match against `technician.specializations` for smart routing.

### Google Calendar Sync (1-Way)
Read-only import of personal events displayed as "Busy" blocks to prevent double-booking.

---

## Authentication

### Mock OTP (Development)
```typescript
// When OTP_MODE=mock, code is returned in API response
// and displayed in a UI modal for easy testing
POST /api/auth/send-otp { phone } → { mockCode: "123456" }
POST /api/auth/verify-otp { phone, code } → { token, user }
```

### Production OTP (Future)
Same API, but code sent via WhatsApp Business API. Toggle via `OTP_MODE` env var.

---

## Project Structure

```
/app
  /api
    /auth
      /send-otp
      /verify-otp
      /me
    /jobs
    /technicians
    /customers
  /(auth)
    /login
    /onboarding
  /(technician)
    /dashboard
    /jobs/[id]
    /schedule
    /customers/[id]
  /(customer)
    /home
    /book
    /jobs/[id]
    /history
/components
  /ui (shared components)
  /technician (tech-specific)
  /customer (customer-specific)
/lib
  /auth
  /db
  /utils
/prisma
  schema.prisma
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=  # Use anon key for development
OTP_MODE=mock  # 'mock' | 'production'
OTP_EXPIRY_MINUTES=5
JWT_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

See `README.md` for detailed setup instructions.

---

## Implementation Files

- `screens-doc.md` - Detailed screen specifications and component breakdown
- `README.md` - Setup and development guide
