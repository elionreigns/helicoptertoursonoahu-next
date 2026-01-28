# Helicopter Tours Booking Workflow

## Overview

This document describes how the booking system is **supposed to work** end-to-end: Blue Hawaiian vs Rainbow flows, operator emails (from `bookings@helicoptertoursonoahu.com`), follow-up emails, and when the full booking is relayed to each operator. Use this to verify behavior and debug.

---

## Who Is Who (Emails)

**File:** `src/lib/constants.ts`

- **Blue Hawaiian** and **Rainbow** emails are **fixed** (one address per operator; you’ll replace with real ones when ready). They do not change per booking.
- The **client email** is **different for each booking**: it’s whatever email the person enters in the “Email” field when they submit that booking. That address is used only for that booking (confirmation, follow-up, reply matching).
- **Bookings hub:** `bookings@helicoptertoursonoahu.com` — receives copies of operator emails and is the “from” address for all outgoing mail. It gets the initial customer booking (copy of what we send to the operator, plus our own record).

| Role | Email | When it changes |
|------|--------|------------------|
| Blue Hawaiian | `emails.blueHawaiian` (e.g. test; replace with real) | Fixed; same for all bookings |
| Rainbow | `emails.rainbow` (e.g. test; replace with real) | Fixed; same for all bookings |
| Bookings hub | `bookings@helicoptertoursonoahu.com` | Fixed |
| **Client** | Whatever they enter in the form for **this** booking | **Changes every time** a new person submits a booking |

All operator emails are sent **from** `bookings@helicoptertoursonoahu.com`. Each email to an operator is sent **to that operator only**; a **separate copy** (subject "Copy: …") is sent to `bookings@` for your records.

---

## Flow Summary

| Step | Blue Hawaiian | Rainbow |
|------|----------------|--------|
| 1. Customer submits booking | ✅ | ✅ |
| 2. Customer confirmation email | ✅ (with phone number) | ✅ (with phone number) |
| 3. Email to operator on submit | ❌ **No** | ✅ **Availability inquiry only** ("What times do you have on [date]?") |
| 4. Background: availability + follow-up | ✅ Scrape FareHarbor → follow-up with **slots** + phone | ✅ Follow-up: "We're in contact with Rainbow…" + phone |
| 5. Customer replies | Chooses a **time slot** (e.g. "2pm works") | Confirms **proposed time** (e.g. "yes" / "confirmed") |
| 6. Operator gets full booking | ✅ **Only after** customer confirms a time | ✅ **Only after** Rainbow proposed a time **and** customer confirmed |
| 7. Operator reply (email) | N/A for initial flow | Rainbow replies with a **time** → we ask customer to confirm |

---

## Detailed Workflow

### 1. Customer Submits Booking Request

- **Where:** `booking.helicoptertoursonoahu.com/bookings`
- **API:** `POST /api/new-booking-request`
- **Saved:** Supabase `bookings` (ref_code, customer, operator_name, tour, preferred_date, etc.), status `pending`

**Emails sent immediately:**

- **Customer:** Confirmation email (tour, operator, date, party size, total; "We will contact you shortly…" and **phone number**).
- **Operator:**
  - **Blue Hawaiian:** **No email** at this step. Operator is contacted only after the customer confirms a time (see step 4).
  - **Rainbow:** **Availability inquiry only** (not full booking): "We have a customer interested in [tour] on [date], [n] people. What times do you have available? We'll send full booking details once the customer confirms." Copy to `bookings@`.

**Background (async):** The app calls `POST /api/check-availability-and-followup` with the new `refCode`. If Vercel Deployment Protection is on, this request must include the bypass secret (see Configuration below).

---

### 2. Availability Check & Follow-Up Email (Background)

- **API:** `POST /api/check-availability-and-followup` (triggered by `new-booking-request`; can also be called manually or by cron with `refCode`).

**Who gets the follow-up ("Available Tour Times"):**

- The follow-up email goes **only to the client** who booked (the person whose email is on the booking). It must **never** go to the operator (Blue Hawaiian / Rainbow), the bookings hub, or the internal test agent. The app blocks sending if `booking.customer_email` is any of those addresses (`isOperatorOrInternalEmail`). If you see "Follow-up email blocked — customer_email is operator/hub/agent" in logs, the booking was created with an operator/agent email as "customer" — use the real client email when submitting the booking.

**What happens:**

- **Blue Hawaiian:** Browserbase scrapes FareHarbor for **that specific tour** and date (using FareHarbor links for that tour). It returns available time slots near the client’s requested time; if none that day, the scrape can show the next closest availability. The follow-up email to the **client only** lists those slots and asks them to reply with their chosen time; includes phone number. Only after the client replies with a chosen time do we send the full booking to Blue Hawaiian.
- **Rainbow:** No live scrape; result is "manual check required." The follow-up email to the **client only** says we're in contact with Rainbow Helicopters to arrange a time close to their date and gives the phone number. A **separate** internal email goes to the agent (e.g. testAgent) to arrange with Rainbow; that is not the same as the client follow-up.

**Important:** This endpoint runs on your Vercel deployment. If the deployment is protected (password/Vercel Auth), the server-side call from `new-booking-request` will get **401** unless you use **Protection Bypass for Automation**. The app sends the header `x-vercel-protection-bypass` with `VERCEL_AUTOMATION_BYPASS_SECRET` when that env var is set.

**Database:** Status → `checking_availability`, then after follow-up email is sent → `awaiting_payment`; metadata stores availability result and follow-up sent flag.

---

### 3. Blue Hawaiian: Customer Replies with Chosen Time

- **Trigger:** Customer replies to the follow-up email (e.g. "2pm works", "I'll take the morning slot").
- **API:** Incoming email should be sent to `POST /api/customer-reply` (e.g. via n8n from `bookings@` inbox) with `emailContent`, `fromEmail`, optional `subject`.

**What happens:**

- App finds the latest booking for that customer email.
- `analyzeCustomerAvailabilityReply()` detects a **chosen time slot**.
- If operator is Blue Hawaiian and we have **not** yet sent the full booking to the operator (`metadata.operator_email_sent_at` is null), the app sends the **full booking email** to Blue Hawaiian (from `bookings@`) with all client details and the **confirmed time**. Then it sets `metadata.operator_email_sent_at` and `metadata.confirmed_time`.

**Result:** Blue Hawaiian receives one email with full booking details only **after** the customer has chosen a time.

---

### 4. Rainbow: Operator Replies with a Time

- **Trigger:** Someone replies to the Rainbow **availability inquiry** email (e.g. "We have 2pm and 4pm available").
- **API:** That reply must be forwarded to `POST /api/operator-reply` (e.g. via n8n) with `emailContent`, `fromEmail`, and optionally `refCode` or `subject` so the booking can be found.

**What happens:**

- App finds the booking (by refCode in subject/body or by operator email + latest booking).
- `parseOperatorReply()` extracts a **proposed time** (from `notes` or `availableDates`).
- If operator is Rainbow and a proposed time is present (and it’s not a full confirmation/rejection), the app:
  - Stores `metadata.operator_proposed_time` and updates status to `awaiting_payment`.
  - Sends the **client** an email with the available times and asks them to (a) reply with which time they want and (b) provide payment information if they haven't already (so we can forward everything to Rainbow in one go).

**Result:** Client is asked to confirm a time and provide payment info before we relay the full booking to Rainbow.

---

### 5. Rainbow: Customer Confirms Proposed Time

- **Trigger:** Customer replies (e.g. "yes", "that works", "confirmed").
- **API:** Same as step 3: `POST /api/customer-reply` with the customer’s reply.

**What happens:**

- `analyzeCustomerAvailabilityReply()` sets **confirmsProposedTime**.
- If operator is Rainbow and we have `metadata.operator_proposed_time` and **not** yet `metadata.operator_email_sent_at`, the app sends the **full booking email** to Rainbow (from `bookings@`) with all client details and the confirmed time, then sets `metadata.operator_email_sent_at` and `metadata.confirmed_time`.

**Result:** Rainbow receives full booking details only **after** they proposed a time and the customer confirmed it.

---

### 6. Operator Reply: Other Cases (Confirmation, Rejection, Alternatives)

- **API:** `POST /api/operator-reply` (same as step 4).

**Parsed outcomes:**

- **Confirmation / "It's a go":** Operator confirms the booking (e.g. with confirmation number or says it's booked). → Status `confirmed`. We send the **client** a final confirmation email with: when to show up, time scheduled, where to park, address, and any other details they need — booking confirmed.
- **Will handle directly:** Operator says they’ll contact the customer. → Status `awaiting_operator_response`, customer gets “operator will contact you” email.
- **Rejection:** Not available. → Customer gets “alternative options” message.
- **Alternative dates:** Operator lists other dates. → Customer gets email listing those dates.

These apply to both operators; the **Rainbow “proposed time”** branch (step 4) is evaluated first when the reply is from Rainbow and contains a time.

---

### 7. Full Flow (End-to-End)

**bookings@** gets the initial customer booking (copy of any operator email + our record). The **client** (the email they entered for this booking) gets the follow-up and all later emails. The **helicopter company** (Blue Hawaiian or Rainbow — whichever they chose) is the same fixed address; only the client changes per booking.

---

#### Blue Hawaiian flow

1. **Submit:** Client submits → **bookings@** has the booking; **client** gets confirmation + phone. We do **not** email Blue Hawaiian yet.
2. **Scrape then contact client:** We scrape FareHarbor for that tour/date and get available times (near their preference or next closest). We send a **follow-up to the client only** with those times and ask them to reply with which slot they want.
3. **Client picks time:** Client replies with chosen time (and payment/missing info if we asked). We then send **Blue Hawaiian** the full client information and the chosen time (availability question answered by client choice).
4. **Blue Hawaiian confirms:** When they confirm, we email the **client** that it’s a go and ask for anything we’re still missing (payment, weight, anything they didn’t fill out) and confirm the time.
5. **Client sends missing info:** When the client replies with payment or other info, we forward **everything** to Blue Hawaiian; they book it on their end with the client’s information.
6. **Operator says it’s a go:** When Blue Hawaiian responds to us that it’s booked, we send the **client** a final confirmation email with: when to show up, time scheduled, where to park, address, and any other details they need — booking confirmed.

---

#### Rainbow flow

1. **Submit:** Client submits → **bookings@** has the booking; **client** gets confirmation + phone. We send **Rainbow** an availability inquiry with **all initial customer information** and ask: what times do you have?
2. **Follow-up to client:** We send the **client** a follow-up: “We’re in contact with Rainbow…” + phone (no specific times yet). A separate internal email goes to the agent to arrange with Rainbow.
3. **Rainbow replies with times:** Rainbow replies with when they can do it. We message the **client** with those available times and ask them to (a) pick a time and (b) provide payment information (we ask for both in that email).
4. **Client confirms + payment:** Client replies with which time and payment info. We send **Rainbow** the full client information, chosen time, and payment details.
5. **Rainbow confirms:** When Rainbow confirms the booking is done, we send the **client** a final confirmation email with: where to park, when to show up, address, what they need to know, and that it’s confirmed.

---

## Technical Implementation

### API Endpoints

| Endpoint | Purpose |
|----------|--------|
| `POST /api/new-booking-request` | Create booking; send customer confirmation; Rainbow → availability inquiry only; Blue Hawaiian → no operator email; trigger check-availability-and-followup |
| `POST /api/check-availability-and-followup` | Load booking by refCode; check availability (scrape BH / manual Rainbow); send follow-up email to customer; update status |
| `POST /api/customer-reply` | Match customer by email; store message; if chosen time (BH) or confirm (Rainbow) → send full booking to operator |
| `POST /api/operator-reply` | Match booking by refCode/operator; parse reply; Rainbow proposed time → email customer to confirm; else confirmation/rejection/alternatives |

### Key Files

- **Operator emails & flow:** `src/lib/email.ts` (`sendBookingRequestToOperator`, `sendRainbowAvailabilityInquiry`; operator email to single recipient + copy to hub)
- **New booking:** `src/app/api/new-booking-request/route.ts` (Rainbow inquiry only; Blue Hawaiian no operator email; triggers follow-up API with bypass header)
- **Follow-up:** `src/app/api/check-availability-and-followup/route.ts` (availability + follow-up email **to client only**; uses `isOperatorOrInternalEmail` to block sending to operator/hub/agent)
- **Customer reply:** `src/app/api/customer-reply/route.ts` (`analyzeCustomerAvailabilityReply`; send full booking to operator when time chosen/confirmed)
- **Operator reply:** `src/app/api/operator-reply/route.ts` (Rainbow proposed time → customer confirm; other outcomes as above)
- **Addresses:** `src/lib/constants.ts` (emails, operators, VAPI_PHONE_NUMBER, `isOperatorOrInternalEmail`)

### Metadata (bookings.metadata)

- `operator_email_sent_at` – When we sent the **full** booking to the operator (so we don’t send twice).
- `operator_proposed_time` – (Rainbow) Time proposed by Rainbow; we ask customer to confirm.
- `availability_check` – Result of scrape or manual check.
- `follow_up_email_sent`, `follow_up_email_sent_at` – Follow-up email tracking.
- `confirmed_time` – Time we sent to the operator after customer confirmation.

---

## Configuration Required

### Environment Variables (Vercel)

**Required:**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (or SMTP vars if not using Resend)
- `RESEND_FROM` or SMTP from = `bookings@helicoptertoursonoahu.com`
- `OPENAI_API_KEY` (customer/operator reply parsing)

**Follow-up API (avoid 401):**

- **Vercel Deployment Protection:** If enabled, enable **Protection Bypass for Automation** in the project (Settings → Deployment Protection). Vercel then sets `VERCEL_AUTOMATION_BYPASS_SECRET` automatically. The app uses it to call `/api/check-availability-and-followup` from the server.
- Or set **`VERCEL_AUTOMATION_BYPASS_SECRET`** manually in Vercel env vars to the bypass token value (keep secret; do not commit).

**Optional:**

- `NEXT_PUBLIC_APP_URL` – Base URL used when triggering check-availability-and-followup (defaults to Vercel URL or `https://booking.helicoptertoursonoahu.com`)
- `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` – For Blue Hawaiian FareHarbor scraping
- `N8N_NEW_BOOKING_WEBHOOK_URL` – Webhook called when a new booking is created
- n8n (or similar) to forward emails from `bookings@` to `customer-reply` and `operator-reply` — **see `emailworkflow.md` for step-by-step n8n setup**

### Operator Emails

Edit **`src/lib/constants.ts`**: update `emails.blueHawaiian` and `emails.rainbow` when you have real addresses. The same flow applies; only the recipient changes.

---

## How to Verify It Works

1. **Operator receives mail from bookings@**
   - Submit a **Rainbow** booking → Rainbow test address should get the **availability inquiry** (and bookings@ gets "Copy: …").
   - Submit a **Blue Hawaiian** booking → Blue Hawaiian test address should get **no** email until the customer confirms a time.
2. **Follow-up email and no 401**
   - After submit, check Vercel logs for "Triggering availability check for HTO-…" and "Availability check triggered successfully" (or follow-up email sent). If you see 401, add or check `VERCEL_AUTOMATION_BYPASS_SECRET` and redeploy.
3. **Blue Hawaiian: full booking only after time chosen**
   - Send a customer-reply that clearly chooses a time (e.g. "2pm works") for a Blue Hawaiian booking that hasn’t had `operator_email_sent_at` set. Blue Hawaiian should receive the full booking email; metadata should have `operator_email_sent_at` and `confirmed_time`.
4. **Rainbow: propose time → customer confirm → full booking**
   - Send an operator-reply as Rainbow with a time (e.g. "We have 2pm available"). Customer should get "Rainbow has 2pm available. Reply to confirm."
   - Send a customer-reply confirming (e.g. "yes"). Rainbow should receive the full booking email; metadata should have `operator_email_sent_at` and `confirmed_time`.

---

## Troubleshooting

| Symptom | Check |
|--------|--------|
| No follow-up email | Vercel logs for 401 on check-availability-and-followup; set `VERCEL_AUTOMATION_BYPASS_SECRET` and redeploy. |
| Follow-up went to wrong email (e.g. operator) | Follow-up goes **only to the client**. If `customer_email` on the booking is an operator/hub/agent address, the app blocks sending (see "Follow-up email blocked" in logs). Use the **real client email** when creating the booking. |
| Operator never gets email | Rainbow: did you send the **availability inquiry** on booking? Blue Hawaiian: did the customer reply with a **chosen time**? Check `metadata.operator_email_sent_at`. |
| 401 on follow-up API | Deployment Protection on + no bypass. Enable Protection Bypass for Automation or set `VERCEL_AUTOMATION_BYPASS_SECRET`. |
| Customer didn’t get "confirm your time" (Rainbow) | Operator reply must be sent to `POST /api/operator-reply` with body containing the proposed time; refCode or subject helps match the booking. |

Manual trigger for follow-up (e.g. for testing):

```bash
curl -X POST https://booking.helicoptertoursonoahu.com/api/check-availability-and-followup \
  -H "Content-Type: application/json" \
  -d '{"refCode": "HTO-XXXXXX"}'
```

If the deployment is protected, add the bypass header (or use a URL with the bypass query param per Vercel docs).

---

## Summary Table: Who Gets What and When

| Event | Client (email for this booking) | Blue Hawaiian | Rainbow | bookings@ |
|-------|----------------------------------|----------------|---------|-----------|
| Booking submitted | Confirmation + phone | Nothing | Availability inquiry + all initial client info | Copy of inquiry + record |
| Follow-up (background) | Slots (BH) or "in contact with Rainbow" + phone | Nothing | Nothing | — |
| Client says "2pm" (BH) | — | **Full booking** (client info + time) | — | Copy |
| Rainbow replies "2pm available" | Available times + ask for payment | — | — | — |
| Client says "yes" + payment (Rainbow) | — | — | **Full booking** (client info + time + payment) | Copy |
| Operator says "it's a go" | **Final confirmation:** when to show up, time, where to park, address, confirmed | — | — | — |

**Emails:** Rainbow and Blue Hawaiian addresses are fixed (same for all bookings). The **client** email is whatever they entered in the form for **this** booking and changes every time a new person books. **bookings@** gets copies and holds the record.

This is how the system is designed to work; use this doc to confirm behavior and fix any mismatches.
