# Screen Specifications & Implementation Details

## Shared Screens

### Login Screen (`/login`)

**Purpose:** Single entry point for both technicians and customers.

**UI Elements:**
- App logo/name at top
- Phone input with country code picker (default: +972 Israel)
- "Send Code" button (Safety Orange)
- After sending: 6-digit OTP input (auto-advance between digits)
- "Verify" button
- Loading states for both actions

**Mock OTP Behavior:**
When `OTP_MODE=mock`, after clicking "Send Code":
- API returns `{ mockCode: "123456" }`
- Display modal/toast: "Development Mode: Your code is 123456"
- User can copy/paste or type manually

**API Calls:**
```typescript
// Send OTP
POST /api/auth/send-otp
Body: { phone: "+972501234567" }
Response: { success: true, mockCode?: "123456" } // mockCode only in dev

// Verify OTP
POST /api/auth/verify-otp
Body: { phone: "+972501234567", code: "123456" }
Response: { token: "jwt...", user: { id, phone, role } }
```

**Post-Login Routing:**
```typescript
if (user.role === 'technician') → /dashboard
if (user.role === 'customer') → /home
if (user.role === null) → /onboarding
```

---

### Role Selection (`/onboarding`)

**Purpose:** First-time users select their role.

**UI Elements:**
- "Welcome! I am a..." heading
- Two large tappable cards:
  - 🔧 **Service Technician** - "I provide services to customers"
  - 👤 **Customer** - "I need to book services"
- Cards should be visually distinct, ~150px height each

**On Selection:**
- Update `user.role` in database
- Route to role-specific onboarding

---

### Technician Onboarding (`/onboarding/technician`)

**Purpose:** Collect technician profile information.

**Steps (can be single page or wizard):**

**Step 1 - Basic Info:**
- Name (text input, required)
- Contact phone (pre-filled from auth, editable)

**Step 2 - Specializations:**
- Multi-select chips from common options:
  - AC Repair, AC Installation, AC Maintenance
  - Heating, Refrigeration, Ventilation
  - Plumbing, Electrical (if expanding)
- "Other" option with text input
- Stored as `string[]` in database

**Step 3 - Working Hours:**
- Day-by-day toggles (Sun-Sat for Israel)
- For enabled days: start time + end time pickers
- Default: Sun-Thu 08:00-18:00, Fri-Sat off
- Stored as JSON:
```json
{
  "sun": { "enabled": true, "start": "08:00", "end": "18:00" },
  "mon": { "enabled": true, "start": "08:00", "end": "18:00" },
  "fri": { "enabled": false },
  ...
}
```

**On Complete:**
- Create `Technician` record linked to `User`
- Route to `/dashboard`

---

### Customer Onboarding (`/onboarding/customer`)

**Purpose:** Collect customer profile information.

**UI Elements:**
- Name (text input, required)
- Contact phone (pre-filled, editable)
- Default address:
  - Text input with Google Places autocomplete
  - Or: Map picker with draggable pin
  - Store: `address` (string), `lat`, `lng` (floats)

**On Complete:**
- Create `Customer` record linked to `User`
- Route to `/home`

---

## Technician Screens

### Dashboard / Command Center (`/dashboard`)

**Purpose:** Daily overview - "Where do I need to be?"

**Header Section:**
- Greeting: "Good Morning, {name}"
- Stats row:
  - Today's earnings (sum of completed jobs - placeholder for MVP)
  - Jobs today (count)
  - Completed (count)

**Main Content - Timeline View:**
- Vertical timeline of today's jobs
- Visual indicators:
  - Past jobs: Dimmed/grayed out, marked "Done"
  - Current/Active job: Highlighted border, expanded
  - Upcoming jobs: Normal styling

**Job Card (Collapsed):**
```
┌─────────────────────────────────────┐
│ ● 09:00 - 10:30                     │
│   AC Maintenance                    │
│   R. Cohen • Herzliya              │
│                              Done ✓ │
└─────────────────────────────────────┘
```

**Active Job Card (Expanded):**
```
┌─────────────────────────────────────┐
│ ● 10:00 - 11:30 • NOW         Active│
│   Unit Not Cooling                  │
│   Sarah M. • Ramat Gan             │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌────────┐│
│  │ Upcoming│ │En Route │ │Arrived ││
│  └─────────┘ └─────────┘ └────────┘│
│                                     │
│  ┌─────────────┐ ┌─────────────┐   │
│  │  Navigate   │ │    Call     │   │
│  │     🗺️      │ │     📞      │   │
│  └─────────────┘ └─────────────┘   │
│                                     │
│  📷 Photo   💬 WhatsApp   📋 History│
└─────────────────────────────────────┘
```

**Button Actions:**
- Navigate: Deep link to Waze/Google Maps with job address
- Call: `tel:` link to customer phone
- Status toggle: Updates `job.status`, triggers push to customer
- Photo/WhatsApp/History: Secondary actions row

**Data Query:**
```typescript
// Get today's jobs for technician
const jobs = await prisma.job.findMany({
  where: {
    technicianId: techId,
    scheduledStart: {
      gte: startOfDay(today),
      lte: endOfDay(today)
    },
    status: { not: 'cancelled' }
  },
  include: { customer: true },
  orderBy: { scheduledStart: 'asc' }
});
```

**Floating Action / Badge:**
- If pending booking requests exist, show notification badge
- Tapping goes to `/schedule` with requests tab active

---

### Heat Map Scheduler (`/schedule`)

**Purpose:** Respond to booking requests with efficient time slots.

**Header:**
- "New Request" or "Schedule" title
- If viewing specific request: Customer name, service type, location

**Request Info Card:**
```
┌─────────────────────────────────────┐
│ 📍 New Booking Request              │
│    AC Repair • Modi'in              │
│    ~25 min from your current area   │
│                                     │
│ "Unit making loud noise, error E4"  │
└─────────────────────────────────────┘
```

**Efficiency Legend:**
```
🟢 High (<10 min)  🟡 Medium (20-30)  🔴 Low (>30)  ⬜ Blocked
```

**Calendar Grid:**
- Week view (scrollable)
- Rows: Time slots (08:00, 10:00, 12:00, etc.)
- Columns: Days (Sun, Mon, Tue, Wed, Thu)
- Cell coloring based on efficiency score:

**Efficiency Calculation:**
```typescript
function calculateEfficiency(slot: TimeSlot, jobLocation: LatLng, existingJobs: Job[]): 'gold' | 'silver' | 'red' | 'blocked' {
  // Find jobs adjacent to this slot
  const adjacentJobs = existingJobs.filter(j => 
    isAdjacent(slot, j.scheduledStart, j.scheduledEnd)
  );
  
  if (adjacentJobs.length === 0) return 'red'; // No nearby context
  
  // Calculate drive time from nearest adjacent job
  const nearestJob = findNearest(adjacentJobs, slot);
  const driveMinutes = calculateDriveTime(nearestJob.location, jobLocation);
  
  if (driveMinutes <= 10) return 'gold';
  if (driveMinutes <= 30) return 'silver';
  return 'red';
}
```

**Interaction:**
- Tap slot to toggle selection (max 5)
- Selected slots show checkmark overlay
- Counter: "3 of 5 slots selected"

**Action Button:**
```
┌─────────────────────────────────────┐
│  💬 Send 3 Options to Customer      │
└─────────────────────────────────────┘
```

**On Send:**
```typescript
await prisma.job.update({
  where: { id: jobId },
  data: {
    status: 'slots_proposed',
    proposedSlots: selectedSlots, // [{ start, end }, ...]
    technicianId: currentTechId
  }
});
// Trigger push notification to customer
```

---

### Job Details (`/jobs/[id]`)

**Purpose:** Full context for a specific job.

**Header:**
- Back button
- Customer name
- Job status badge

**Map Section:**
- Static map image or embedded map
- Address displayed
- "Navigate" button

**AI Summary Card (highlighted):**
```
┌─────────────────────────────────────┐
│ ⚠️ AI Summary                       │
│                                     │
│ Unit not cooling. Customer reports  │
│ Error Code E4 on display. Mentioned │
│ unusual noise from outdoor unit.    │
│                                     │
│ 📎 2 photos attached                │
│                                     │
│ View Full Description →             │
└─────────────────────────────────────┘
```
- Yellow/amber background to stand out
- "View Full Description" expands to show `job.description`

**Customer Info:**
```
┌─────────────────────────────────────┐
│ 👤 Sarah Mizrachi                   │
│    Customer since 2021 • 8 jobs     │
│                           📞 Call   │
└─────────────────────────────────────┘
```

**Service History Feed:**
```
┌─────────────────────────────────────┐
│ 📋 Service History                  │
├─────────────────────────────────────┤
│ 🔧 Mar 15, 2024                     │
│    AC Repair - Replaced capacitor   │
│    [thumbnail]                      │
├─────────────────────────────────────┤
│ 🧹 Nov 8, 2023                      │
│    Maintenance - Annual service     │
├─────────────────────────────────────┤
│ ❄️ Jul 22, 2023                     │
│    Installation - New Electra unit  │
│    [thumbnail]                      │
└─────────────────────────────────────┘
```

**Data Query:**
```typescript
// Get job with customer and history
const job = await prisma.job.findUnique({
  where: { id: jobId },
  include: { customer: true }
});

const history = await prisma.job.findMany({
  where: {
    customerId: job.customerId,
    status: 'completed',
    id: { not: jobId }
  },
  orderBy: { scheduledStart: 'desc' },
  take: 10
});
```

---

### Technician Settings (`/settings`)

**Sections:**
- **Profile:** Name, phone, photo
- **Specializations:** Edit service types
- **Working Hours:** Edit schedule
- **Calendar Sync:** Connect Google Calendar (1-way)
- **Notifications:** Push notification preferences
- **Logout**

---

## Customer Screens

### Customer Home (`/home`)

**Purpose:** Overview of bookings and quick access to new booking.

**Header:**
- Greeting: "Hello, {name}"

**Upcoming Jobs Section:**
```
┌─────────────────────────────────────┐
│ 📅 Upcoming                         │
├─────────────────────────────────────┤
│ Tomorrow, 10:00 AM                  │
│ AC Repair                           │
│ David C. • Confirmed ✓              │
│                        View Details │
└─────────────────────────────────────┘
```
- Show next 2-3 upcoming jobs
- Status badges: Pending, Confirmed, Tech En Route

**Book Service CTA:**
```
┌─────────────────────────────────────┐
│  + Book a Service                   │
│                                     │
│  Schedule a technician visit        │
└─────────────────────────────────────┘
```
- Large, prominent button (Safety Orange)

**Recent History:**
- Last 2-3 completed jobs as smaller cards
- "View All History" link

---

### Book a Service (`/book`)

**Purpose:** Create a new service request.

**Step 1 - Describe the Issue:**
```
┌─────────────────────────────────────┐
│ What do you need help with?         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Describe the issue...           │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 📷 Add Photos (optional)            │
│ [+] [+] [+]                         │
└─────────────────────────────────────┘
```
- Large text area for description
- Photo upload (up to 5)

**Step 2 - Location:**
```
┌─────────────────────────────────────┐
│ Where is the service needed?        │
│                                     │
│ ◉ My default address               │
│   123 Herzl St, Tel Aviv            │
│                                     │
│ ○ Different address                 │
│   [Address input field]             │
└─────────────────────────────────────┘
```

**Step 3 - Preferences (Optional):**
```
┌─────────────────────────────────────┐
│ Any time preferences? (optional)    │
│                                     │
│ ○ As soon as possible               │
│ ○ This week                         │
│ ○ Specific days:                    │
│   [ ] Sun  [ ] Mon  [✓] Tue        │
│   [ ] Wed  [✓] Thu  [ ] Fri        │
└─────────────────────────────────────┘
```

**Submit Button:**
- "Submit Request" (Safety Orange)

**On Submit:**
```typescript
// LLM classifies the description
const category = await classifyJob(description); // "ac_repair"
const summary = await generateSummary(description); // AI summary

const job = await prisma.job.create({
  data: {
    status: 'request_received',
    category,
    description,
    chatSummary: summary,
    address,
    lat,
    lng,
    photos: uploadedPhotoUrls,
    customerId: currentCustomerId
    // technicianId: null - assigned later
  }
});

// Find matching technicians and notify them
const techs = await prisma.technician.findMany({
  where: { specializations: { has: category } }
});
// Send push notifications to matching techs
```

**Confirmation Screen:**
```
┌─────────────────────────────────────┐
│           ✓ Request Sent            │
│                                     │
│ We're finding the best technician   │
│ for you. You'll receive time        │
│ options shortly.                    │
│                                     │
│ [View Request Status]               │
└─────────────────────────────────────┘
```

---

### Slot Selection (`/jobs/[id]/select-slot`)

**Purpose:** Customer picks from technician-proposed slots.

**Trigger:** Push notification "Tech proposed times for your request"

**Header:**
- "Select a Time"
- Service type + address

**Slot Options:**
```
┌─────────────────────────────────────┐
│ David Cohen has proposed these      │
│ times for your AC Repair:           │
├─────────────────────────────────────┤
│ ○ Monday, Jan 15                    │
│   10:00 AM - 11:30 AM               │
├─────────────────────────────────────┤
│ ○ Monday, Jan 15                    │
│   2:00 PM - 3:30 PM                 │
├─────────────────────────────────────┤
│ ○ Tuesday, Jan 16                   │
│   9:00 AM - 10:30 AM                │
└─────────────────────────────────────┘

[Confirm Selected Time]

None of these work? Request different times
```

**On Confirm:**
```typescript
const selectedSlot = proposedSlots[selectedIndex];

await prisma.job.update({
  where: { id: jobId },
  data: {
    status: 'confirmed',
    scheduledStart: selectedSlot.start,
    scheduledEnd: selectedSlot.end
  }
});
// Notify technician
```

---

### Customer Job Status (`/jobs/[id]`)

**Purpose:** Track status of a job.

**Status Tracker (visual):**
```
┌─────────────────────────────────────┐
│  ✓ ──── ✓ ──── ◉ ──── ○ ──── ○    │
│ Booked  Conf  EnRoute Arrived Done │
└─────────────────────────────────────┘
```

**Technician Card:**
```
┌─────────────────────────────────────┐
│ 👤 David Cohen                      │
│    AC Specialist                    │
│    ⭐ 4.8 (placeholder)             │
│                                     │
│    📞 Call    💬 Message            │
└─────────────────────────────────────┘
```

**Job Details:**
- Date/time
- Address
- Service type
- Original description

**Actions (based on status):**
- If `confirmed`: "Cancel Booking" option
- If `completed`: "Book Again" shortcut

---

### Customer History (`/history`)

**Purpose:** View all past jobs.

**List View:**
```
┌─────────────────────────────────────┐
│ March 2024                          │
├─────────────────────────────────────┤
│ Mar 15 • AC Repair                  │
│ David C. • Completed ✓              │
├─────────────────────────────────────┤
│ Mar 2 • Maintenance                 │
│ David C. • Completed ✓              │
├─────────────────────────────────────┤
│ February 2024                       │
├─────────────────────────────────────┤
│ Feb 10 • Installation               │
│ Sarah L. • Completed ✓              │
└─────────────────────────────────────┘
```

**Tap to expand → show details + "Book Again" button**

---

## API Endpoints Summary

### Auth
- `POST /api/auth/send-otp` - Send OTP to phone
- `POST /api/auth/verify-otp` - Verify OTP, return token
- `GET /api/auth/me` - Get current user

### Jobs
- `GET /api/jobs` - List jobs (filtered by role)
- `POST /api/jobs` - Create job (customers)
- `GET /api/jobs/[id]` - Get job details
- `PATCH /api/jobs/[id]` - Update job (status, slots, etc.)
- `POST /api/jobs/[id]/propose-slots` - Tech proposes slots
- `POST /api/jobs/[id]/confirm-slot` - Customer confirms slot

### Technicians
- `GET /api/technicians/me` - Get current tech profile
- `PATCH /api/technicians/me` - Update profile
- `GET /api/technicians/me/jobs` - Get tech's jobs
- `GET /api/technicians/me/schedule` - Get schedule with efficiency data

### Customers
- `GET /api/customers/me` - Get current customer profile
- `PATCH /api/customers/me` - Update profile
- `GET /api/customers/me/jobs` - Get customer's jobs

---

## Push Notification Triggers

| Event | Recipient | Message |
|-------|-----------|---------|
| New job request (matching specialization) | Technician | "New AC Repair request in Modi'in" |
| Slots proposed | Customer | "David proposed 3 time options" |
| Slot confirmed | Technician | "Sarah confirmed Monday 10:00 AM" |
| Tech status → en_route | Customer | "David is on the way" |
| Tech status → arrived | Customer | "David has arrived" |
| Job completed | Customer | "Job completed. How was your experience?" |
| Job cancelled | Both | "Booking cancelled" |

---

## Component Library Needs

### Shared Components
- `Button` (primary/secondary/ghost variants)
- `Input` (text, phone, OTP)
- `Card` (standard container)
- `Badge` (status indicators)
- `Modal` (confirmations, OTP display)
- `Toast` (notifications)
- `BottomNav` (mobile navigation)

### Technician-Specific
- `TimelineView` (daily job list)
- `JobCard` (collapsed/expanded states)
- `HeatMapGrid` (calendar with efficiency colors)
- `StatusToggle` (job status progression)

### Customer-Specific
- `SlotPicker` (radio list of time options)
- `StatusTracker` (visual progress bar)
- `ServiceCard` (booking summary)
