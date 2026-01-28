# Helicopter Tours Booking Workflow

## Overview

This document describes the complete booking workflow from initial inquiry through final confirmation. The system uses AI agents, automated availability checking, and email automation to streamline the booking process.

## Workflow Steps

### 1. **Customer Submits Booking Request**

**Location:** `booking.helicoptertoursonoahu.com/bookings`

**What Happens:**
- Customer fills out booking form with:
  - Personal info (name, email, phone)
  - Operator selection (Blue Hawaiian or Rainbow Helicopters)
  - Tour selection (dropdown with prices)
  - Party size (automatically calculates total price)
  - Preferred date and time window
  - Doors-off preference
  - Hotel location
  - Special requests
  - Total weight (for safety)
  - Optional payment information

**Form Features:**
- Tour prices are displayed and calculated based on party size
- Operator selection determines available tours
- Real-time price calculation: `Total = Tour Price × Party Size`

**API Endpoint:** `POST /api/new-booking-request`

**What Gets Saved:**
- Booking record in Supabase `bookings` table
- Unique reference code (e.g., `HTO-BYXUNT`)
- Status: `pending`

---

### 2. **Initial Confirmation Emails Sent**

**Immediately After Booking Submission:**

**A. Customer Confirmation Email**
- **To:** Customer's email address
- **From:** `bookings@helicoptertoursonoahu.com` (via Resend)
- **Subject:** "Your Helicopter Tour Booking - [REF_CODE]"
- **Content:**
  - Thank you message
  - Booking reference code
  - Tour details (operator, date, party size)
  - Note: "Time: To be confirmed"
  - Message: "We will contact you shortly with final confirmation and payment details"

**B. Operator Inquiry Email**
- **To:** Operator email (Blue Hawaiian or Rainbow) + `bookings@helicoptertoursonoahu.com`
- **From:** `bookings@helicoptertoursonoahu.com`
- **Subject:** "New Helicopter Tour Booking Request - [REF_CODE] - [CUSTOMER_NAME]"
- **Content:**
  - Customer information
  - Tour details
  - Availability check result (if available)
  - Payment information (if provided)
  - Request: "Please confirm availability and pricing"

---

### 3. **Background Availability Check & Follow-Up Email**

**Trigger:** After booking is created (via background job or webhook)

**API Endpoint:** `POST /api/check-availability-and-followup` (or triggered automatically)

**What Happens:**

**A. Availability Check**
- For **Blue Hawaiian:** Uses Browserbase to scrape FareHarbor calendar
  - Navigates to tour-specific FareHarbor URL
  - Extracts available time slots for the requested date
  - Gets pricing for each slot
  - Filters by preferred time window (morning/afternoon/evening)
- For **Rainbow Helicopters:** Returns "manual check required" (no live API)

**B. Follow-Up Email to Customer**
- **To:** Customer's email
- **From:** `bookings@helicoptertoursonoahu.com`
- **Subject:** "Available Tour Times for [REF_CODE] - Choose Your Time"
- **Content:**
  - Personalized greeting
  - Tour introduction and what to expect
  - Available time slots with prices:
    ```
    Available Times for [DATE]:
    • 8:00 AM - $299 per person (Total: $897 for 3 guests)
    • 10:30 AM - $299 per person (Total: $897 for 3 guests)
    • 2:00 PM - $299 per person (Total: $897 for 3 guests)
    ```
  - Instructions to reply with preferred time
  - Payment request with secure payment link
  - Phone option: "Or call us at (707) 381-2583 to book over the phone"
  - Tour highlights and what's included

**Database Update:**
- Booking status: `checking_availability` → `awaiting_payment`
- Metadata updated with available slots

---

### 4. **Customer Responds with Time Selection**

**Customer Actions:**
- Replies to email with preferred time slot
- OR clicks payment link and completes payment
- OR calls (707) 381-2583

**Email Processing:**
- **API Endpoint:** `POST /api/customer-reply`
- Uses OpenAI to parse customer email
- Extracts:
  - Preferred time slot
  - Payment confirmation
  - Any questions or changes

**Database Update:**
- Booking status: `awaiting_payment` → `awaiting_operator_response`
- Metadata updated with selected time

---

### 5. **Payment Collection**

**If Customer Provides Payment:**
- Payment details forwarded to operator (not stored in database)
- Only last 4 digits stored in metadata for reference
- Customer receives confirmation that payment info was received

**Payment Options:**
1. **Secure Payment Link** (in follow-up email)
2. **Phone:** (707) 381-2583 (VAPI AI assistant)
3. **Email Reply** with payment details

---

### 6. **Operator Confirmation**

**Operator Actions:**
- Receives booking inquiry email
- Checks availability manually (for Rainbow) or reviews automated check (for Blue Hawaiian)
- Confirms or suggests alternative times
- Replies to booking email

**Email Processing:**
- **API Endpoint:** `POST /api/operator-reply`
- Uses OpenAI to parse operator email
- Extracts:
  - Confirmation status
  - Confirmation number (if provided)
  - Final time slot
  - Any special instructions

**Database Update:**
- Booking status: `awaiting_operator_response` → `confirmed`
- Confirmation number stored
- Final time slot updated

---

### 7. **Final Confirmation to Customer**

**Automatically Sent:**
- **To:** Customer
- **From:** `bookings@helicoptertoursonoahu.com`
- **Subject:** "Your Tour is Confirmed! - [REF_CODE]"
- **Content:**
  - Confirmation number
  - Final tour time
  - Meeting location and instructions
  - What to bring
  - Cancellation policy
  - Contact information

**Database Update:**
- Booking status: `confirmed`
- Final confirmation timestamp

---

## Technical Implementation

### Key Components

1. **Booking Form** (`src/components/BookingForm.tsx`)
   - Tour selection dropdown
   - Operator selection
   - Price calculation
   - Payment collection

2. **Availability Checking** (`src/lib/browserAutomation.ts`)
   - Browserbase integration
   - FareHarbor scraping
   - Time slot extraction

3. **Email System** (`src/lib/email.ts`)
   - Resend integration
   - Email templates
   - Follow-up automation

4. **Background Jobs**
   - Availability check after booking
   - Follow-up email sending
   - Status updates

### API Endpoints

- `POST /api/new-booking-request` - Create booking
- `POST /api/check-availability-and-followup` - Check availability & send follow-up
- `POST /api/customer-reply` - Process customer email replies
- `POST /api/operator-reply` - Process operator confirmations
- `POST /api/update-booking-status` - Manual status updates

### Database Schema

**bookings table:**
- `id` (UUID)
- `ref_code` (unique)
- `customer_name`, `customer_email`, `customer_phone`
- `operator_name`
- `tour_name`
- `party_size`, `preferred_date`, `time_window`
- `status` (pending → checking_availability → awaiting_payment → awaiting_operator_response → confirmed)
- `confirmation_number`
- `metadata` (JSONB - stores availability results, selected time, etc.)

---

## Configuration Required

### Environment Variables (Vercel)

**Required:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `RESEND_API_KEY` - Resend API key for emails
- `RESEND_FROM` - Email sender (e.g., "Helicopter Tours on Oahu <bookings@helicoptertoursonoahu.com>")
- `OPENAI_API_KEY` - For email parsing

**Optional:**
- `BROWSERBASE_API_KEY` - For availability checking
- `BROWSERBASE_PROJECT_ID` - Browserbase project ID
- `N8N_NEW_BOOKING_WEBHOOK_URL` - n8n workflow webhook

### Operator Email Configuration

**File:** `src/lib/constants.ts`

Update operator emails:
```typescript
export const emails = {
  blueHawaiian: "bookings@bluehawaiian.com",  // UPDATE TO REAL EMAIL
  rainbow: "bookings@rainbowhelicopters.com", // UPDATE TO REAL EMAIL
};
```

---

## Current Status & Next Steps

### ✅ Completed
- Booking form submission
- Initial confirmation emails (customer & operator)
- Database storage
- Reference code generation
- Email sending via Resend
- **Tour selection dropdown** with operator and tour options
- **Price calculation** based on party size (displays total price)
- **Follow-up email API endpoint** (`/api/check-availability-and-followup`)
- **Follow-up email template** with available time slots and payment request
- **Automatic availability check trigger** after booking creation

### 🚧 In Progress / Needs Testing
- [ ] Test tour selection and price calculation in booking form
- [ ] Test availability check API endpoint
- [ ] Test follow-up email sending
- [ ] Verify Browserbase script execution (may need debugging)
- [ ] Customer email reply parsing for time selection (exists but needs testing)
- [ ] Operator confirmation workflow (exists but needs testing)
- [ ] Final confirmation email automation

### 🔧 Known Issues to Fix
1. **Browserbase Script Error:** "Failed to execute script" 
   - The script uses Playwright syntax which may not work in Browserbase's execute endpoint
   - May need to rewrite script to use Browserbase's browser API directly
   - **Workaround:** For now, availability check will return "manual check required" and operator will handle it

2. **Background Job URL:** The automatic availability check uses `NEXT_PUBLIC_APP_URL`
   - **Action Required:** Set `NEXT_PUBLIC_APP_URL=https://booking.helicoptertoursonoahu.com` in Vercel env vars
   - Or the background check won't trigger automatically

3. **Tour Prices:** Current prices in `src/lib/tours.ts` are estimates
   - **Action Required:** Verify and update prices with actual operator rates
   - Prices are used for display and total calculation

### 📋 Configuration Checklist

**Required Environment Variables (Vercel):**
- ✅ `SUPABASE_URL` - Already set
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Already set
- ✅ `RESEND_API_KEY` - Already set
- ✅ `RESEND_FROM` - Already set
- ⚠️ `NEXT_PUBLIC_APP_URL` - **NEEDS TO BE SET** = `https://booking.helicoptertoursonoahu.com`
- ⚠️ `BROWSERBASE_API_KEY` - Set if you want automated availability checking
- ⚠️ `BROWSERBASE_PROJECT_ID` - Set if you want automated availability checking
- ✅ `OPENAI_API_KEY` - Already set (for email parsing)

**Files to Update:**
- `src/lib/tours.ts` - Verify and update tour prices
- `src/lib/constants.ts` - Update operator emails when you have real ones

---

## Testing the Workflow

### 1. Submit Test Booking
- Go to `booking.helicoptertoursonoahu.com/bookings`
- Fill out form with test data (select operator and tour)
- Submit and note the reference code (e.g., HTO-BYXUNT)

### 2. Check Initial Emails
- **Customer:** Should receive confirmation email immediately
- **Operator:** Should receive inquiry email (to test email address)
- **You:** Check `bookings@helicoptertoursonoahu.com` inbox for copy

### 3. Test Operator Reply

**Option A: Use Test Page (Easiest)**

1. Go to `booking.helicoptertoursonoahu.com/admin/test-operator-reply`
2. Paste the operator's email reply content
3. Enter the reference code (or it will be extracted from email)
4. Click "Test Operator Reply"
5. Check result - customer should receive appropriate email

**Option B: Reply to Email (Requires n8n Setup)**

For production, set up n8n workflow:
1. Create n8n workflow with IMAP Email trigger
2. Monitor `bookings@helicoptertoursonoahu.com` inbox
3. Filter emails from operator addresses (Blue Hawaiian, Rainbow)
4. Forward to `/api/operator-reply` endpoint with email content

**Option C: Use API directly (for testing)**

```bash
curl -X POST https://booking.helicoptertoursonoahu.com/api/operator-reply \
  -H "Content-Type: application/json" \
  -d '{
    "emailContent": "Confirmed! Booking #12345. Tour confirmed for 8:00 AM on 2026-01-30. Total: $897.",
    "fromEmail": "coralcrowntechnologies@gmail.com",
    "subject": "Re: New Helicopter Tour Booking Request - HTO-BYXUNT",
    "refCode": "HTO-BYXUNT"
  }'
```

1. Create n8n workflow with IMAP Email trigger
2. Monitor `bookings@helicoptertoursonoahu.com` inbox
3. Filter emails from operator addresses
4. Forward to `/api/operator-reply` endpoint

**Test Scenarios:**

**Scenario 1: Operator Confirms**
- Reply email: "Confirmed! Booking #12345. Tour at 8:00 AM on 2026-01-30."
- **Expected:** Customer receives confirmation email with booking details

**Scenario 2: Operator Says "We'll Handle It"**
- Reply email: "We'll contact the customer directly to confirm."
- **Expected:** Customer receives email saying operator will contact them directly

**Scenario 3: Operator Rejects**
- Reply email: "Not available on that date. Available: 2026-02-01, 2026-02-02"
- **Expected:** Customer receives email with alternative dates

### 4. Verify Database Updates
- Check Supabase `bookings` table
- Verify status changed (pending → confirmed/awaiting_operator_response)
- Check metadata for operator response

### 5. Test Availability Check
- Should trigger automatically after booking
- Or manually: `POST /api/check-availability-and-followup` with `{ "refCode": "HTO-XXXXXX" }`
- Verify follow-up email sent with time slots

---

## Support & Troubleshooting

**Email Issues:**
- Check Vercel logs for "Email send error"
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for delivery status

**Availability Check Issues:**
- Verify `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are set
- Check Browserbase dashboard for session status
- Review logs for script execution errors

**Database Issues:**
- Verify Supabase connection
- Check table schema matches expected structure
- Review migration files if columns missing

---

## Future Enhancements

- Real-time availability updates
- SMS notifications
- Calendar integration
- Automated payment processing
- Customer portal for booking management
- Operator dashboard
