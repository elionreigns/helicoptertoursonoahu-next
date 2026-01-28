# VAPI Integration – Phone Bookings and Email Flow

This document explains how VAPI (voice AI) connects to the booking app so that **phone bookings use the same flow as the web form and chatbot**: confirmation email, follow-up (“Available Tour Times”), and operator handling (Rainbow availability inquiry, Blue Hawaiian after client picks a time).

---

## Overview

- **VAPI** runs your phone AI agent. Callers talk to the agent and provide booking details (name, email, date, party size, etc.).
- When the call ends (or when the agent has enough info), we need to **create a booking** and **start the same email flow** as the form:  
  - Customer gets confirmation email  
  - **Rainbow:** operator gets availability inquiry only; we send client the “We’re in contact with Rainbow…” follow-up  
  - **Blue Hawaiian:** we scrape FareHarbor and send the client the “Available Tour Times” follow-up  
  - Replies go to Resend Inbound → webhook → `customer-reply` / `operator-reply`

So: **VAPI should trigger the same booking + email pipeline as the form and chatbot.**

---

## How It Works (Recommended)

### 1. VAPI webhook URL

Your VAPI assistant is configured to send events to:

**`https://booking.helicoptertoursonoahu.com/api/vapi-webhook`**

VAPI sends events during the call (e.g. transcript updates, end-of-call).

### 2. What the app does

- **On end-of-call (or when transcript is complete):**  
  The `vapi-webhook` route:
  1. Takes the call transcript (and optional conversation array).
  2. Uses OpenAI to **extract** booking fields: name, email, phone, party_size, preferred_date, time_window, doors_off, hotel, special_requests, total_weight, and optionally operator preference (Rainbow vs Blue Hawaiian).
  3. **Calls the same API the form uses:**  
     `POST https://booking.helicoptertoursonoahu.com/api/new-booking-request`  
     with body:
     - `name`, `email`, `phone`, `party_size`, `preferred_date`, `time_window`, `doors_off`, `hotel`, `special_requests`, `total_weight`
     - `source: 'phone'`
     - `operator_preference: 'blueHawaiian' | 'rainbow'` (from transcript or default)
     - `tour_id` or `tour_name` if extracted
  4. Returns a response to VAPI (e.g. “Your reference code is HTO-XXXXXX. You’ll receive a confirmation email shortly.”).

- **new-booking-request** then:
  - Creates the booking in Supabase
  - Sends **confirmation email** to the customer
  - **Rainbow:** sends **availability inquiry only** to Rainbow (not full booking)
  - **Blue Hawaiian:** does **not** email the operator yet
  - Triggers **check-availability-and-followup** in the background (FareHarbor scrape for BH, “We’re in contact with Rainbow” for Rainbow)
  - Sends the **follow-up email** to the **client only** (Available Tour Times)

So after a phone call, the customer gets the same confirmation + follow-up as if they had submitted the form or chatbot, and replies (to the Resend inbound address) are handled by the same `customer-reply` / `operator-reply` flow.

### 3. From call to email (summary)

1. Caller talks to VAPI → provides name, email, date, party size, etc.
2. Call ends → VAPI sends event to **/api/vapi-webhook** with transcript.
3. App extracts booking data → POSTs to **/api/new-booking-request** with `source: 'phone'`.
4. **new-booking-request** creates booking, sends confirmation email, sends Rainbow inquiry (if Rainbow), and triggers **check-availability-and-followup**.
5. **check-availability-and-followup** sends the **follow-up email to the client** (slots for BH, “in contact with Rainbow” for Rainbow).
6. Client (or operator) **replies** to that email → reply goes to Resend Inbound → webhook → **customer-reply** or **operator-reply** → same flow as form/chatbot.

So **VAPI initiates the booking and the rest is email**: confirmation, follow-up, then replies drive operator/customer flow.

---

## VAPI dashboard configuration

- **Webhook URL:** `https://booking.helicoptertoursonoahu.com/api/vapi-webhook`
- **Events:** Send **end-of-call** (or equivalent) so the app receives the final transcript. Optionally send transcript updates; the app can process when it has enough data.
- **Assistant:** Configure the assistant to collect: name, email, phone, preferred date, party size, time preference, doors-off interest, hotel (optional), total weight, and optionally “Rainbow or Blue Hawaiian?” so we can set `operator_preference`.

---

## Environment variables (Vercel)

Already used by the app; ensure they’re set for the booking project:

- `OPENAI_API_KEY` – used to extract booking data from the call transcript
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` – booking is created via `new-booking-request`
- `RESEND_API_KEY`, `RESEND_FROM` – confirmation and follow-up emails
- `REPLY_TO_INBOUND` – e.g. `helicopter@goudamo.resend.app` so replies go to Resend Inbound
- `VERCEL_AUTOMATION_BYPASS_SECRET` – so the server can call `check-availability-and-followup` (if Deployment Protection is on)

No separate “VAPI API key” is required in the app; VAPI calls **our** webhook.

---

## Phone number (call button)

The **chatbot** has a **call** button (phone icon) that opens:

**`tel:+17073812583`**  
(or whatever `VAPI_PHONE_NUMBER` is set to in `src/lib/constants.ts`).

That number should be the one assigned to your VAPI assistant so callers reach the same booking flow.

---

## Optional: n8n or other middleware

If you use n8n (or similar) to process VAPI events instead of calling the app directly:

1. VAPI sends the event to n8n.
2. n8n extracts or forwards the transcript to **POST /api/vapi-webhook** (or n8n calls an internal step that POSTs to **/api/new-booking-request** with the same body shape above).
3. The rest of the flow is unchanged: booking + confirmation + follow-up + reply handling.

---

## Summary

| Step | What happens |
|------|----------------|
| Caller calls VAPI number | VAPI assistant collects booking info by voice |
| Call ends | VAPI sends transcript to **/api/vapi-webhook** |
| App | Extracts data, POSTs to **/api/new-booking-request** with `source: 'phone'` |
| new-booking-request | Creates booking, sends confirmation, Rainbow inquiry if needed, triggers follow-up |
| check-availability-and-followup | Sends **follow-up email to client** (slots or “in contact with Rainbow”) |
| Client/operator replies | Resend Inbound → webhook → **customer-reply** / **operator-reply** |

So: **VAPI triggers the booking; the rest is the same email flow as the form and chatbot.**
