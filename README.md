# Helicopter Tours on Oahu - Booking System

Production-grade helicopter tour booking/referral system for Oahu.

First, run the development server:

- **Multi-channel booking**: Web form, chatbot (Chatbase), and phone agent (Vapi) support
- **Automated workflow**: Email processing, availability checks, operator coordination
- **AI-powered**: OpenAI for email parsing, spam detection, and intent extraction
- **Browser automation**: Check operator availability via Browserbase or Playwright
- **Email integration**: Site5 SMTP/IMAP for sending and receiving emails
- **Database**: Supabase for storing bookings, operators, and availability logs
- **Automation**: n8n webhook integration for workflow automation

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase
- **AI**: OpenAI API
- **Email**: Nodemailer (SMTP)
- **Automation**: n8n webhooks
- **Browser Automation**: Browserbase or Playwright

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Then fill in all required values in `.env.local`.

3. **Set up Supabase**:
   - Create a Supabase project
   - Run the SQL schema (see `supabase-schema.sql`)
   - Add your Supabase URL and keys to `.env.local`

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Database Schema

The system uses three main tables:

- **bookings**: Stores all booking requests and their status
- **operators**: Stores operator information (Blue Hawaiian, Rainbow, etc.)
- **availability_logs**: Logs availability checks from browser automation

See `lib/database.types.ts` for full type definitions.

## API Routes

### POST `/api/new-booking-request`
Creates a new booking request from web form, chatbot, or phone agent.

**Request body**:
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "808-555-1234",
  "partySize": 2,
  "preferredDate": "2026-02-15",
  "timeWindow": "morning",
  "doorsOff": false,
  "hotel": "Hilton Hawaiian Village",
  "specialRequests": "Window seat preferred",
  "source": "web",
  "operatorPreference": "blueHawaiian"
}
```

### POST `/api/operator-reply`
Processes operator replies to booking requests.

### POST `/api/customer-reply`
Processes customer replies (email analysis, spam detection).

### POST `/api/check-availability`
Checks availability for a specific operator, date, and party size.

### POST `/api/update-booking-status`
Updates booking status and related fields.

## Email Configuration

### ⚠️ IMPORTANT: How to Update Operator Emails

**Location:** `src/lib/constants.ts`

**This is the SINGLE SOURCE OF TRUTH for all email addresses.** All email addresses used throughout the application MUST come from this file. No hard-coded emails exist outside of this file.

#### Step-by-Step Guide to Update Operator Emails:

1. **Open the file:**
   ```
   bookings/hto-next/src/lib/constants.ts
   ```

2. **Find the emails object:**
   ```typescript
   export const emails = {
     bookingsHub: "bookings@helicoptertoursonoahu.com",
     testAgent: "ericbelievesinjesus@gmail.com",
     testClient: "elionreigns@gmail.com",
     blueHawaiian: "coralcrowntechnologies@gmail.com",  // ⚠️ UPDATE THIS
     rainbow: "ashleydanielleschaefer@gmail.com",        // ⚠️ UPDATE THIS
   };
   ```

3. **Contact operators to get official booking emails:**
   - Contact Blue Hawaiian Helicopters for their official booking email
   - Contact Rainbow Helicopters for their official booking email

4. **Update the email values:**
   ```typescript
   export const emails = {
     bookingsHub: "bookings@helicoptertoursonoahu.com",
     testAgent: "ericbelievesinjesus@gmail.com",
     testClient: "elionreigns@gmail.com",
     blueHawaiian: "bookings@bluehawaiian.com",        // Real email
     rainbow: "bookings@rainbowhelicopters.com",        // Real email
   };
   ```

5. **Update the operators object (if needed):**
   The operators object references the emails object, so it will automatically use the updated emails:
   ```typescript
   export const operators = {
     blueHawaiian: {
       name: "Blue Hawaiian Helicopters",
       email: emails.blueHawaiian,  // Automatically uses updated email
       website: "https://www.bluehawaiian.com",
     },
     rainbow: {
       name: "Rainbow Helicopters",
       email: emails.rainbow,  // Automatically uses updated email
       website: "https://www.rainbowhelicopters.com",
     },
   };
   ```

6. **Save and commit:**
   ```bash
   git add src/lib/constants.ts
   git commit -m "Update operator email addresses to production emails"
   git push
   ```

7. **Vercel will auto-deploy** the changes (if connected to GitHub)

8. **Test the changes:**
   - Submit a test booking
   - Verify emails are sent to the correct operator addresses
   - Check that operator replies are processed correctly

#### How to Add a New Operator:

1. **Add email to emails object:**
   ```typescript
   export const emails = {
     // ... existing emails ...
     newOperator: "bookings@newoperator.com",
   };
   ```

2. **Add operator metadata:**
   ```typescript
   export const operators = {
     // ... existing operators ...
     newOperator: {
       name: "New Operator Name",
       email: emails.newOperator,  // References email from emails object
       website: "https://www.newoperator.com",
     },
   };
   ```

3. **The system will automatically:**
   - Use the new operator in booking flows
   - Send emails to the new operator
   - Display the new operator in UI (if configured)

#### Where Emails Are Used:

- ✅ `lib/email.ts` - Email sending functions (uses `emails.bookingsHub`, `emails.testAgent`)
- ✅ `app/api/operator-reply/route.ts` - Operator selection (uses `operators` object)
- ✅ `app/api/new-booking-request/route.ts` - Operator selection (uses `operators` object)
- ✅ All email templates reference emails from `constants.ts`

**No hard-coded emails exist outside of `constants.ts`!**

## Deployment

### Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All environment variables are set in Vercel (see below)
- [ ] Supabase database is created and schema is applied
- [ ] Operator emails are updated in `src/lib/constants.ts` (replace test emails)
- [ ] VAPI assistant ID is correct: `2ed16509-a321-4f09-84d8-bf1fcfe42438`
- [ ] n8n webhook URL is configured: `https://elionreigns.app.n8n.cloud/webhook/new-booking`
- [ ] SMTP credentials are tested and working
- [ ] Custom domain is configured in Vercel: `booking.helicoptertoursonoahu.com`
- [ ] SSL certificate is issued (automatic with Vercel)
- [ ] DNS records are configured correctly

### Required Environment Variables (Vercel)

Set these in Vercel Dashboard → Project Settings → Environment Variables:

**Database:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)

**AI & Automation:**
- `OPENAI_API_KEY` - OpenAI API key for email parsing and spam detection
- `VAPI_API_KEY` - Vapi API key for phone agent
- `VAPI_ASSISTANT_ID` - Vapi assistant ID: `2ed16509-a321-4f09-84d8-bf1fcfe42438`

**Email – use one of:**

*Option A – Resend (recommended if SMTP gives 535 auth errors):*
- `RESEND_API_KEY` - API key from [resend.com](https://resend.com). When set, all booking/confirmation emails send via Resend instead of SMTP.
- `RESEND_FROM` (optional) - e.g. `Helicopter Tours <bookings@helicoptertoursonoahu.com>`. Set after verifying your domain in Resend; omit to use `onboarding@resend.dev` for testing.

*Option B – Site5 SMTP/IMAP:*
- `SITE5_SMTP_HOST` - SMTP host (e.g. `shared11.accountservergroup.com`)
- `SITE5_SMTP_PORT` - SMTP port (`587` or `465`)
- `SITE5_EMAIL_USERNAME` - Full email (e.g. `bookings@helicoptertoursonoahu.com`)
- `SITE5_EMAIL_PASSWORD` - Mailbox password
- `SITE5_IMAP_HOST` - IMAP host (for receiving via n8n)
- `SITE5_IMAP_PORT` - IMAP port (usually `993`)

**Browser Automation (Optional):**
- `BROWSERBASE_API_KEY` - Browserbase API key for availability checking
- `BROWSERBASE_PROJECT_ID` - Browserbase project ID

**Workflow Automation:**
- `N8N_NEW_BOOKING_WEBHOOK_URL` - n8n webhook URL: `https://elionreigns.app.n8n.cloud/webhook/new-booking`

**Feature Flags (Optional):**
- `CHECK_AVAILABILITY_ON_BOOKING` - Set to `true` to enable availability checking on booking (default: `false`)

### Vercel Deployment Steps

1. **Connect GitHub Repository:**
   - Go to Vercel dashboard
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `bookings/hto-next` folder as root directory

2. **Configure Build Settings:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `bookings/hto-next`
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Set for Production, Preview, and Development environments

4. **Configure Custom Domain:**
   - Go to Project Settings → Domains
   - Add custom domain: `booking.helicoptertoursonoahu.com`
   - Follow DNS configuration instructions
   - Wait for SSL certificate to be issued (automatic)

5. **Deploy:**
   - Push to GitHub (Vercel auto-deploys)
   - Or click "Redeploy" in Vercel dashboard
   - Monitor deployment logs for errors

6. **Post-Deployment Verification:**
   - Visit `https://booking.helicoptertoursonoahu.com`
   - Test booking form submission
   - Check Supabase for new bookings
   - Verify emails are being sent
   - Test phone agent: +1 (707) 381-2583
   - Check Vercel function logs for errors

The app will be available at `booking.helicoptertoursonoahu.com` once DNS and SSL are configured.

## Testing

### Test Emails (from constants.ts):
- **Client**: elionreigns@gmail.com
- **Agent**: ericbelievesinjesus@gmail.com
- **Operators**: 
  - Blue Hawaiian: coralcrowntechnologies@gmail.com (test email - update to real)
  - Rainbow: ashleydanielleschaefer@gmail.com (test email - update to real)

### Complete Testing Guide

#### 1. Test Web Booking Form:
1. **Visit the booking site:** `https://booking.helicoptertoursonoahu.com` (or `http://localhost:3000` for local)
2. **Fill out the form:**
   - Name: Test User
   - Email: elionreigns@gmail.com
   - Phone: (808) 555-1234
   - Party Size: 2
   - Preferred Date: Select a future date (e.g., 2026-02-15)
   - Time Window: Morning
   - Total Weight: 320 lbs (required, minimum 100)
   - Doors-off: Yes (optional)
   - Hotel: Test Hotel (optional)
3. **Submit the form**
4. **Verify:**
   - Success page shows with reference code (format: HTO-XXXXXX)
   - Check Supabase `bookings` table for new record
   - Verify `total_weight` is saved correctly
   - Check email inboxes:
     - Operator receives booking request email (includes total_weight)
     - Customer receives confirmation email with ref_code
   - Check n8n webhook was called (if configured)
   - Check Vercel logs for any errors

#### 2. Test Phone Agent (Vapi):
1. **Call the number:** +1 (707) 381-2583
2. **Provide test information during the call:**
   - Name: Test User
   - Email: elionreigns@gmail.com
   - Phone: Your phone number
   - Party Size: 2
   - Preferred Date: 2026-02-15 (or any future date)
   - Time Window: morning
   - Doors-off: yes
   - Hotel: Test Hotel
   - Total Weight: 320 lbs (minimum 100)
3. **After call ends:**
   - Check Supabase `bookings` table
   - Verify booking has `source='phone'`
   - Verify `total_weight` is saved
   - Check email for confirmation (should include ref_code)
   - Verify ref_code was generated (format: HTO-XXXXXX)
   - Check Vercel logs for VAPI webhook events

#### 3. Test Chatbot:
1. **Visit booking site** and click chatbot button (bottom-right)
2. **Enter email** to start chat (e.g., elionreigns@gmail.com)
3. **Ask questions:**
   - "What tours do you offer?"
   - "How much does a tour cost?"
   - "I want to book a tour"
4. **Complete a booking through chatbot:**
   - Provide all required information when prompted
   - Include total weight (minimum 100 lbs)
5. **Verify:**
   - Booking appears in Supabase
   - Source is 'chatbot'
   - Emails are sent (operator and customer)
   - Ref_code is generated

#### 4. Test API Endpoints Directly:

**Test new-booking-request:**
```bash
curl -X POST https://booking.helicoptertoursonoahu.com/api/new-booking-request \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "elionreigns@gmail.com",
    "phone": "808-555-1234",
    "party_size": 2,
    "preferred_date": "2026-02-15",
    "time_window": "morning",
    "total_weight": 320,
    "source": "web"
  }'
```

**Test check-availability:**
```bash
curl -X POST https://booking.helicoptertoursonoahu.com/api/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "operator": "blueHawaiian",
    "date": "2026-02-15",
    "partySize": 2
  }'
```

**Test VAPI webhook (admin page):**
- Visit `/admin/vapi-test`
- Click "Test Webhook with Sample Data"
- Review the response
- Check Supabase for test booking

#### 5. Test Email Sending:
1. **Submit a booking** (via web form, phone, or chatbot)
2. **Check email inboxes:**
   - Operator email (from constants.ts) should receive booking request
   - Customer email should receive confirmation
   - Verify `total_weight` appears in operator email
3. **Check email logs:**
   - Review Site5 email logs (if available)
   - Check Vercel logs for email sending errors

#### 6. Test n8n Integration:
1. **Verify webhook URL is set:**
   - Check `N8N_NEW_BOOKING_WEBHOOK_URL` in Vercel environment variables
   - Should be: `https://elionreigns.app.n8n.cloud/webhook/new-booking`
2. **Submit a test booking**
3. **Check n8n workflow:**
   - Verify webhook received the booking data
   - Check that workflow processes the data correctly
   - Verify any downstream actions (email, database updates, etc.)

#### 7. Test Availability Checking:
1. **Enable availability checking:**
   - Set `CHECK_AVAILABILITY_ON_BOOKING=true` in Vercel (optional)
   - Ensure `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` are set
2. **Submit a booking with availability check enabled**
3. **Check results:**
   - Review `availability_logs` table in Supabase
   - Check Vercel logs for Browserbase session creation
   - Note: Availability checking may require manual configuration of Browserbase API

## Architecture

```
/app
  /api              # API routes
    /new-booking-request
    /operator-reply
    /customer-reply
    /check-availability
    /update-booking-status
  /page.tsx         # Main booking page

/lib
  constants.ts      # Email config and constants
  supabaseClient.ts # Supabase client
  database.types.ts # Database types
  openai.ts         # OpenAI integration
  email.ts          # Email sending
  browserAutomation.ts # Browser automation
  fareharborTours.ts  # FareHarbor calendar URLs

/components
  BookingForm.tsx   # Booking form component
```

## Booking Workflow

### Complete Booking Flow

```
1. Customer submits booking form (web/chatbot/phone)
   ↓
2. System validates data (name, email, party_size, date, total_weight, etc.)
   ↓
3. Availability Check:
   - Blue Hawaiian: Scrape FareHarbor calendar via Browserbase
     * Navigate to FareHarbor URL (from fareharborTours.ts)
     * Click requested date in calendar
     * Extract available time slots and prices
     * Return available slots or "unavailable"
   - Rainbow: Manual check required (email operator with all details)
   ↓
4. Payment Handling (if provided):
   - Extract last 4 digits of card number
   - Store only last4 in metadata (for reference)
   - Keep full payment details temporarily for email forwarding
   - NEVER store full card number, CVC, or expiry in database
   ↓
5. Create booking in Supabase:
   - Generate unique ref_code (HTO-XXXXXX)
   - Store booking data (including last4 of card if payment provided)
   - Store availability results in metadata
   - Clear payment details from memory after email sent
   ↓
6. Send emails:
   - Operator: Booking request + availability results + payment details (if provided)
     * Payment details include full card info (forwarded securely via email)
     * Operator MUST call customer to confirm before charging
   - Customer: Confirmation with ref_code
   ↓
7. Call n8n webhook with booking data (includes availability results, excludes full payment details)
   ↓
8. Operator receives email with:
   - All booking details (name, email, phone, date, party size, total weight, etc.)
   - Availability check results (available slots for Blue Hawaiian)
   - Payment details (if provided) - operator must call customer to confirm before charging
   ↓
9. Operator confirms availability and processes payment (after calling customer)
   ↓
10. Operator updates booking status in Supabase (via email reply or n8n workflow)
   ↓
11. Customer receives final confirmation email
```

### Payment Security

**IMPORTANT SECURITY NOTES:**

1. **Payment Data Handling:**
   - Full payment details (card number, CVC, expiry) are NEVER stored in the database
   - Only last 4 digits of card number are stored in metadata (for reference)
   - Full payment details are forwarded to operator via email ONLY
   - Payment details are cleared from memory after email is sent

2. **Payment Processing:**
   - Operator receives payment details in email
   - Operator MUST call customer to confirm before charging
   - CVC should NEVER be shared over phone
   - Payment details are sent in email for operator to process directly

3. **Security Best Practices:**
   - All payment fields are optional in the booking form
   - Security warning displayed to users
   - Payment information is encrypted in transit (HTTPS)
   - No payment data is logged or stored in application logs

### Availability Checking

**Blue Hawaiian Helicopters:**
- Uses Browserbase to scrape FareHarbor calendar pages
- FareHarbor URLs are configured in `src/lib/fareharborTours.ts`
- Calendar URLs are updated dynamically based on requested date (year/month)
- Returns available time slots with prices (if available)
- If unavailable, returns "manual check required"

**Rainbow Helicopters:**
- No live availability API
- System emails operator with customer's preferred date/time
- Operator confirms availability via email reply
- Booking status updated when operator responds

**FareHarbor Calendar URLs:**

All Blue Hawaiian tour calendar URLs are configured in `src/lib/fareharborTours.ts`. URLs are automatically updated with the correct year/month based on the requested booking date.

**How It Works:**
1. System receives booking request with `tour_name` and `preferred_date`
2. Looks up FareHarbor URL for the tour in `fareharborTours.ts`
3. Updates URL year/month to match `preferred_date` (e.g., `calendar/2026/01/` → `calendar/2026/02/`)
4. Browserbase navigates directly to the FareHarbor calendar URL
5. Script handles iframes, clicks the date, and scrapes available time slots
6. Returns available slots with times and prices (if available)

**Supported Tours (All FareHarbor URLs Configured):**

**Big Island:**
- Big Island Spectacular (Waikoloa)
- Kona Coast Hualalai
- Discover Hilo
- Hilo Waterfall Experience
- Waterfalls and Volcano by Air and Land
- Private Charters Big Island

**Maui:**
- Waterfalls of West Maui and Molokai
- Maui and Molokai Spectacular
- Majestic Maui
- Hana Rainforest
- Maui Nui

**Oahu:**
- Blue Skies of Oahu
- Complete Island Oahu
- Oahu Air Adventure
- Discover North Shore
- Laukiha'a Farm - Landing Experience
- Laukiha'a Farm - Landing Adventure

**Kauai:**
- Discover Kauai
- Kauai Eco Adventure

**To Add New Tours:**
1. Get the FareHarbor calendar URL for the tour
2. Add entry to `fareharborTours` object in `src/lib/fareharborTours.ts`
3. Format: `'Tour Name': { name: 'Tour Name', url: 'https://fareharbor.com/...', operator: 'blueHawaiian', island: 'Island Name' }`
4. The system will automatically use it for availability checking

## Error Handling & Logging

All API routes include comprehensive error handling:

- **Validation errors:** Return 400 status with detailed error messages
- **Database errors:** Logged to console, return 500 status with user-friendly message
- **External API errors:** Logged, don't fail the request if non-critical
- **All errors:** Logged to Vercel function logs for debugging

### Logging:
- Use `console.error()` for errors
- Use `console.log()` for important events
- All logs visible in Vercel dashboard
- Error messages are user-friendly (no sensitive data exposed)

## Security

- ✅ All secrets in environment variables (no hard-coded values)
- ✅ Input validation using Zod schemas
- ✅ SQL injection protection (Supabase handles this)
- ✅ Email addresses centralized in constants.ts
- ✅ API routes validate all inputs
- ✅ Error messages don't expose sensitive information
- ✅ **Payment Security:**
  - Full card numbers and CVC are NEVER stored in database
  - Only last 4 digits stored for reference
  - Payment details forwarded to operator via email only
  - Payment data cleared from memory after email sent
  - HTTPS encryption for all data in transit
  - Security warnings displayed to users
  - Operator must call customer to confirm before charging

## Troubleshooting

### Common Issues:

#### 1. Booking Not Appearing in Supabase:
**Symptoms:** Booking form submits successfully but no record in database

**Solutions:**
- Check Supabase connection:
  - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel
  - Test connection in Supabase dashboard
- Check Vercel function logs:
  - Go to Vercel Dashboard → Project → Functions
  - Look for errors in `/api/new-booking-request` logs
  - Check for database connection errors
- Verify database schema:
  - Ensure `bookings` table exists
  - Verify `total_weight` column is `int4` and `NOT NULL`
  - Check that all required columns match `database.types.ts`
- Check Row Level Security (RLS):
  - RLS should be enabled but policies should allow service role access
  - Service role key bypasses RLS, so this shouldn't block inserts

#### 2. Emails Not Sending:
**Symptoms:** Booking created but no emails received

**Solutions:**
- Verify SMTP credentials in Vercel:
  - Check `SITE5_SMTP_HOST`, `SITE5_SMTP_PORT`, `SITE5_EMAIL_USERNAME`, `SITE5_EMAIL_PASSWORD`
  - Ensure port matches (587 for TLS, 465 for SSL)
- Test SMTP connection:
  - Use Site5 email control panel to test SMTP settings
  - Verify email account `bookings@helicoptertoursonoahu.com` is active
- Check Vercel logs:
  - Look for email sending errors in function logs
  - Check for authentication failures
- Review email logs:
  - Check Site5 email logs (if available)
  - Verify emails aren't being marked as spam
- Test email function directly:
  - Use `/admin/test` page to test email sending
  - Or call email API directly

#### 3. n8n Webhook Not Triggering:
**Symptoms:** Booking created but n8n workflow doesn't receive data

**Solutions:**
- Verify webhook URL:
  - Check `N8N_NEW_BOOKING_WEBHOOK_URL` in Vercel
  - Should be: `https://elionreigns.app.n8n.cloud/webhook/new-booking`
- Test webhook manually:
  ```bash
  curl -X POST https://elionreigns.app.n8n.cloud/webhook/new-booking \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}'
  ```
- Check n8n workflow:
  - Verify workflow is active (not paused)
  - Check webhook node is configured correctly
  - Review n8n execution logs
- Check Vercel logs:
  - Look for webhook call errors
  - Verify webhook is being called (check logs for "n8n webhook called successfully")

#### 4. Phone Agent (Vapi) Not Working:
**Symptoms:** Calls don't create bookings or webhook not receiving data

**Solutions:**
- Verify VAPI configuration:
  - Check `VAPI_API_KEY` and `VAPI_ASSISTANT_ID` in Vercel
  - Assistant ID should be: `2ed16509-a321-4f09-84d8-bf1fcfe42438`
- Check VAPI webhook URL:
  - In VAPI dashboard, verify webhook URL is: `https://booking.helicoptertoursonoahu.com/api/vapi-webhook`
- Test webhook directly:
  - Visit `/admin/vapi-test` page
  - Click "Test Webhook with Sample Data"
  - Verify response and check Supabase
- Check Vercel logs:
  - Look for VAPI webhook events in function logs
  - Check for errors in `/api/vapi-webhook` route
- Verify phone number:
  - Phone number: +1 (707) 381-2583
  - Ensure it's connected to correct VAPI assistant

#### 5. Chatbot Not Working:
**Symptoms:** Chatbot doesn't appear or doesn't respond

**Solutions:**
- Verify OpenAI API key:
  - Check `OPENAI_API_KEY` is set in Vercel
  - Test API key is valid and has credits
- Check chatbot component:
  - Verify `BookingChatbot` is imported in `layout.tsx`
  - Check browser console for JavaScript errors
- Check API route:
  - Verify `/api/chatbot` route exists and is working
  - Check Vercel logs for chatbot API errors
- Test chatbot API:
  ```bash
  curl -X POST https://booking.helicoptertoursonoahu.com/api/chatbot \
    -H "Content-Type: application/json" \
    -d '{"message": "Hello", "email": "test@example.com"}'
  ```

#### 6. Availability Checking Not Working:
**Symptoms:** Availability check returns errors or doesn't run

**Solutions:**
- Verify Browserbase credentials:
  - Check `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` in Vercel
  - Test Browserbase API connection
- Check feature flag:
  - Set `CHECK_AVAILABILITY_ON_BOOKING=true` to enable (optional)
  - If not set, availability checking is skipped
- Review Browserbase API:
  - Browserbase API may need SDK integration
  - Current implementation may require manual configuration
  - Check Browserbase documentation for latest API
- Check logs:
  - Review `availability_logs` table in Supabase
  - Check Vercel logs for Browserbase errors
- Manual fallback:
  - If Browserbase fails, system logs "manual check required"
  - Operator can check availability manually

#### 7. DNS/SSL Issues:
**Symptoms:** Site not accessible or SSL certificate errors

**Solutions:**
- Verify DNS configuration:
  - Check DNS records point to Vercel
  - CNAME record: `booking.helicoptertoursonoahu.com` → `cname.vercel-dns.com`
  - Wait for DNS propagation (can take up to 48 hours)
- Check SSL certificate:
  - Vercel automatically issues SSL certificates
  - Wait for certificate to be issued (usually within minutes)
  - Check Vercel dashboard → Domains for certificate status
- Test DNS:
  ```bash
  nslookup booking.helicoptertoursonoahu.com
  dig booking.helicoptertoursonoahu.com
  ```

#### 8. Reference Code Collisions (Very Rare):
**Symptoms:** Booking fails with database unique constraint error

**Solutions:**
- Current implementation uses random generation
- Collision chance: ~1 in 2 billion (36^6 possible combinations)
- If collision occurs:
  - Booking will fail with database error
  - User can retry (new ref_code will be generated)
  - Consider adding retry logic in future if this becomes an issue

#### 9. Total Weight Validation Errors:
**Symptoms:** Form submission fails with "Total weight must be at least 100 lbs"

**Solutions:**
- Verify form validation:
  - Minimum weight is 100 lbs (safety requirement)
  - Check that user is entering combined weight of all passengers
- Check database:
  - Ensure `total_weight` column accepts integers
  - Verify column is `NOT NULL` (required field)
- Test with valid weight:
  - Try submitting with weight >= 100 lbs
  - Check that weight is saved correctly in database

#### 10. Mobile Responsiveness Issues:
**Symptoms:** Site doesn't look good on mobile devices

**Solutions:**
- Verify Tailwind CSS:
  - Ensure Tailwind is properly configured
  - Check that responsive classes are used (e.g., `md:`, `lg:`)
- Test on real devices:
  - Use browser dev tools mobile emulator
  - Test on actual mobile devices
- Check layout components:
  - Verify `Header.tsx` has mobile menu
  - Check `BookingForm.tsx` is mobile-optimized
  - Ensure fixed "Home" button works on mobile

## Additional Resources

- **FINAL_REPORT.md** - Comprehensive project documentation
- **vital_information.php** - Complete tour pricing and details (on main site)
- **vapi.md** - VAPI assistant training database (on main site)
- **.env.example** - Example environment variables

## License

Private - Helicopter Tours on Oahu
