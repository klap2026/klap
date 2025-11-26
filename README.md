# TechFlow - Field Technician Scheduling App

A **mobile-only** web application for field technicians (HVAC, plumbers, electricians) to manage their schedule and for customers to book services.

> **Note:** This app is designed exclusively for mobile devices (320px - 428px width). Desktop layouts are not optimized and do not need to work well.

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (PostgreSQL + JavaScript SDK)
- **Tailwind CSS**
- **TypeScript**

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/klap2026/klap.git
cd klap
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-anon-key"
OTP_MODE="mock"
JWT_SECRET="your-secret-key"
```

4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

### Authentication
- Phone-based OTP authentication
- Mock mode for development (displays OTP code in UI)
- JWT session management

### For Technicians
- Dashboard with daily schedule
- Heat map scheduler for efficient job routing
- Job details with customer history
- Status updates (En Route, Arrived, Completed)

### For Customers
- Book services with photo uploads
- Select from technician-proposed time slots
- Track job status in real-time
- View service history

## Project Structure

```
/app
  /api/auth          # Authentication endpoints
  /(auth)            # Login & onboarding pages
  /(technician)      # Technician dashboard & features
  /(customer)        # Customer booking & tracking
/components/ui       # Shared UI components
/lib
  /auth             # OTP & JWT utilities
  /db               # Supabase client
```

## Development

### Mobile-First Design

All UI components are designed for mobile devices only:
- **Viewport width:** 320px - 428px (iPhone SE to iPhone 14 Pro Max)
- **Touch targets:** Minimum 44px height for all interactive elements
- **Layout:** Single-column, portrait orientation
- **Testing:** Use browser DevTools mobile emulation or actual mobile devices

Desktop layouts are intentionally not optimized.

### Testing Authentication

The app uses mock OTP mode by default. When you request an OTP code, it will be displayed in a modal for easy testing.

To test the authentication flow:
1. Go to `/login`
2. Enter a phone number (any format with +972)
3. Click "Send Code"
4. The mock OTP will appear in a modal
5. Enter the code to log in

## Documentation

- [Product Specification](./product-spec.md) - Full product requirements
- [Screen Specifications](./screens-doc.md) - Detailed UI/UX specs

## License

ISC
