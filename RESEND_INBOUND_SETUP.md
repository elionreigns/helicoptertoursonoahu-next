# Resend Inbound Setup – Receive Replies and Route to App

Resend is already used for **sending** (confirmations, operator emails, follow-ups). To **receive** replies (customers and operators) and have the app process them automatically, you need to turn on **Resend Inbound** and point it at this app.

---

## What This Does

1. **Replies go to bookings@** – All outgoing emails now use **Reply-To: bookings@helicoptertoursonoahu.com**, so when someone hits “Reply,” the reply goes to bookings@.
2. **Resend receives at bookings@** – You set up Resend to **receive** mail for that address (or a subdomain). Resend gets the email and POSTs a webhook to your app.
3. **App routes the email** – The app fetches the email body from Resend, then:
   - If the sender is **Blue Hawaiian** or **Rainbow** (operator) → `POST /api/operator-reply` (e.g. Rainbow proposes a time → we email customer to confirm).
   - Otherwise (customer) → `POST /api/customer-reply` (e.g. customer confirms a time → we send full booking to operator).

No n8n email workflow is required if you use Resend Inbound.

---

## What You Need to Do

### 1. Resend Dashboard – Receiving (Inbound)

1. Go to [Resend → Emails → Receiving](https://resend.com/emails/receiving).
2. Choose one:
   - **Option A – Resend-managed domain**  
     Use the address Resend gives you (e.g. `something@your-id.resend.app`). Then you must **forward** `bookings@helicoptertoursonoahu.com` to that address (via your current email host’s “forward to” rule), **or** change your app to send from that Resend address (not ideal for branding).
   - **Option B – Custom domain (recommended)**  
     Add **helicoptertoursonoahu.com** (or a subdomain like **inbound.helicoptertoursonoahu.com**) as a **receiving** domain in Resend. Resend will show MX records. You add those MX records in your DNS so that mail to `bookings@helicoptertoursonoahu.com` (or `bookings@inbound.helicoptertoursonoahu.com`) is delivered to Resend.

3. If your **root** domain already has MX records for another provider (e.g. Google or your host), use a **subdomain** for receiving (e.g. `inbound.helicoptertoursonoahu.com`) and set MX only for that subdomain. Then either:
   - Use `bookings@inbound.helicoptertoursonoahu.com` as the address that receives replies, **and** in the app set `emails.bookingsHub` to that address, **or**
   - Keep `bookings@helicoptertoursonoahu.com` and in your **current** email host create a rule: “Forward all mail to bookings@helicoptertoursonoahu.com” → forward to `bookings@inbound.helicoptertoursonoahu.com` (so Resend receives it).  
   Resend’s docs: [Receiving – Custom Domains](https://resend.com/docs/dashboard/receiving/custom-domains).

### 2. Resend Dashboard – Webhook for Inbound

1. Go to [Resend → Webhooks](https://resend.com/webhooks).
2. Click **Add Webhook**.
3. **Endpoint URL:**  
   `https://booking.helicoptertoursonoahu.com/api/webhooks/resend-inbound`  
   (Use your real booking app URL if different.)
4. **Events:** Select **email.received** (only that one is needed for inbound).
5. Save. Resend will show a **Signing secret** (optional but recommended). If you use it, add it in Vercel as `RESEND_WEBHOOK_SECRET` and we can add verification in the route later.

### 3. Environment Variables (Vercel)

You already have:

- **RESEND_API_KEY** – Used for sending and for the webhook to fetch the received email body.
- **RESEND_FROM** – e.g. `Helicopter Tours <bookings@helicoptertoursonoahu.com>`.

No new env vars are **required** for the webhook to work. Optional:

- **RESEND_WEBHOOK_SECRET** – If you set a signing secret on the webhook, add it here so we can verify requests (recommended for production).
- **VERCEL_AUTOMATION_BYPASS_SECRET** – If Vercel Deployment Protection is on, the webhook route calls your own APIs; that internal call uses this so it doesn’t get 401.

### 4. Reply-To Is Already Set

The app now uses **Reply-To: bookings@helicoptertoursonoahu.com** (from `emails.bookingsHub`) on all outgoing emails. So customer and operator replies go to bookings@. As long as that address is received by Resend (via Option A or B above), Resend will POST to your webhook and the app will route to operator-reply or customer-reply.

---

## Flow Summary

| Step | What happens |
|------|----------------|
| 1 | Customer or operator hits **Reply** on an email from your app. |
| 2 | Reply goes to **bookings@helicoptertoursonoahu.com** (Reply-To). |
| 3 | That mailbox is received by Resend (MX or forward). |
| 4 | Resend POSTs **email.received** to `/api/webhooks/resend-inbound`. |
| 5 | App fetches the email body from Resend API, then POSTs to `/api/operator-reply` or `/api/customer-reply`. |
| 6 | Operator-reply: e.g. Rainbow proposed time → we email customer to confirm. Customer-reply: e.g. customer confirmed time → we send full booking to operator. |

---

## Testing

1. **Send yourself a test** – From the booking app, trigger an email that uses bookings@ (e.g. submit a test booking so you get a confirmation).
2. **Reply** from your personal email (or from the operator test address) to that email.
3. **Check** that the reply is received by Resend (Resend dashboard → Receiving / Emails if available).
4. **Check** Vercel logs for the `resend-inbound` route: you should see the webhook run and the internal call to `customer-reply` or `operator-reply`.
5. **Check** that the app did the right thing (e.g. customer got “Rainbow has X available, confirm?” or operator got the full booking after customer confirmed).

---

## If You Don’t Set Up Resend Inbound

Replies will still go to **bookings@helicoptertoursonoahu.com** (or whatever mailbox currently receives that address). The app will **not** see them unless something else forwards those emails to the app (e.g. n8n with IMAP → POST to `/api/customer-reply` and `/api/operator-reply` as in **emailworkflow.md**).

So you have two options:

- **Resend Inbound** – Set up receiving + webhook as above; no n8n email workflow needed.
- **n8n** – Keep replies going to your current inbox, use n8n to watch that inbox and POST to the same two APIs (see **emailworkflow.md**).
