# Card Handling – Secure Payment Options

**Chosen flow (implemented):** On the **booking form** we only collect optional **last 4 digits** of card, **full name**, and **billing address/ZIP**. Full card number, expiry, and CVC are **never** on the form. In the **confirmation/follow-up email** we send the customer a **secure link** to enter full card details (one-time, tied to their booking). We store that data **encrypted** in the database and **never** send it by email. When the customer confirms a time, we send the **operator** a **one-time secure link** to view the payment details (they click, see card once, then the data is marked consumed). See "Chosen Flow" section below.

---

This document also describes the original **three options** for improving security. The goal: capture payment when needed, **never** put full card number or CVC in GitHub, Vercel logs, or emails, and get payment details to the operator (Rainbow / Blue Hawaiian) only when the customer has confirmed—without paying for a payment processor if possible.

---

## Current State

- **Booking form:** Optional “Payment Information” section collects card name, number, expiry, CVC, billing address, ZIP.
- **Storage:** Only **last 4 digits** of the card and non-sensitive payment metadata are stored in Supabase (metadata). Full card number and CVC are **not** stored in the database.
- **Transmission:** When the customer provides payment and we send the booking to the operator (e.g. after they confirm a time), **full card number and CVC are included in the email** to the operator (`sendBookingRequestToOperator` in `src/lib/email.ts`). That email is:
  - Sent over the internet in plain text (unless the mail provider uses TLS, which protects in transit but not in the operator’s inbox).
  - Stored in the operator’s and possibly your email provider’s servers.
  - A risk if any email account is compromised or forwarded.
- **Logs / GitHub:** We do **not** log full card or CVC, and they are **not** committed to the repo. So GitHub and normal Vercel logs do not contain full card data. The main risk today is **email**.

So: the weak point is **sending full card details by email**. The form’s “Security Notice” says the full card number and CVC are never stored in our system—that’s true for our app/DB, but they *are* currently sent in emails to the operator, which is not secure.

---

## What We Want

1. **No full card number or CVC** in GitHub, Vercel logs, or in emails (so no “card in email”).
2. **Optional:** Capture card on the booking form or via a link in the confirmation email.
3. **Operator gets payment** only after the customer confirms (e.g. time confirmed); we already have that flow.
4. **Prefer no ongoing cost** (no paid payment service if possible).

---

## Option A – No Card on Site; Phone or Operator Payment Link (Recommended, Free)

**Idea:** Do **not** collect card number or CVC on your site at all. Customer pays by phone to the operator, or the operator sends the customer a payment link (e.g. Stripe Payment Link, Square Invoice) when they’re ready to charge.

**Implementation:**

- Remove the optional “Payment Information” fields from the booking form (or replace with: “I’ll pay by phone when you confirm” / “Send me a payment link when my time is confirmed”).
- Confirmation / follow-up emails say: “When your time is confirmed, the operator will call you for payment or send you a secure payment link. Do not send card details by email.”
- Operator gets booking details (name, date, time, contact) only; they take payment by phone or via their own Stripe/Square link.

**Pros:**

- No card data touches your app, Vercel, or email. No PCI scope for your app.
- No cost for a payment service on your side.
- Aligns with “never share CVC over the phone” by having the operator use a link or terminal instead of reading card over email.

**Cons:**

- Customer cannot “pre-fill” card on the site; payment happens later by phone or link.

---

## Option B – Payment Link Only (Card Never Touches Your Server, Low Cost)

**Idea:** You never see the card. Confirmation email (or a “confirm time” step) includes a **secure payment link** (e.g. Stripe Payment Link, Square Invoice) that goes to Stripe/Square. Customer pays there; operator gets payout or notification. No card number or CVC in your app, logs, or email.

**Implementation:**

- Keep **no** card fields on the booking form.
- When the customer confirms a time (or at a step you choose), your app creates a payment link (Stripe Payment Links API, or Square, etc.) for the booking amount and sends that link in the confirmation email: “Pay here: [link].”
- Operator receives payout through Stripe/Square (or you forward funds); no card data is ever sent by email or stored by you.

**Pros:**

- Card data never touches your server, logs, or email. PCI burden stays with Stripe/Square.
- Professional, familiar flow for customers.
- Stripe Payment Links have no monthly fee; you pay per successful transaction (e.g. ~2.9% + 30¢).

**Cons:**

- Per-transaction fee (typical for card processing).
- Requires a Stripe (or similar) account and minimal integration (create link, put link in email).

---

## Option C – Server-Side Encrypted File, No Email of Card (Possible but Not Recommended)

**Idea:** If the customer does enter card details on the site, we **never** put them in email or in the DB. Instead we write them to a single **encrypted file per booking** in a location that is **not** web-accessible (e.g. above `public_html` or in a private directory on the server). Only when the customer has “confirmed” do we give the operator a **one-time, secure way** to retrieve that payment (e.g. a short-lived link that calls your backend, decrypts the file, shows the details once, then deletes the file).

**Important caveats:**

- **PCI scope:** As soon as you store or process full card numbers, your environment is in scope for PCI DSS. Doing it “in a file above public_html” does not remove that; you would be responsible for compliance (secure storage, access control, auditing, etc.). Card brands and banks do **not** recommend storing raw card data yourself.
- **Risk:** If the server or app is ever compromised, all stored card data could be exposed. Encryption helps only if the key is not on the same server and access is tightly limited.
- **No email:** In this option, card data would **never** be sent in emails; only a “retrieve payment” link or one-time view would be used for the operator.

**Implementation outline (if you still want this after the risks):**

1. **Form:** Customer optionally enters card (name, number, expiry, CVC, billing). Submit goes only to your API over HTTPS.
2. **API (e.g. `/api/secure-payment`):**  
   - Receives card data; **never** logs it; **never** stores it in Supabase.  
   - Generates a unique token (e.g. `refCode` + random id).  
   - Encrypts the card payload (e.g. AES-256) with a key from an env var (key not in GitHub).  
   - Writes **one file** per booking, e.g. `payments/<refCode>.enc` in a directory **outside** the subdomain’s public root (e.g. above `public_html`), with strict OS permissions (e.g. 600).  
   - Stores in DB only: `has_payment: true`, `ref_code`, and **no** card number or CVC.
3. **When customer confirms time:**  
   - Instead of putting card data in the email, we send the operator an email that says: “Customer has provided payment for booking HTO-XXXXXX. Retrieve it once (secure, one-time): [link].”  
   - The link points to your backend (e.g. `GET /api/operator-payment?ref=HTO-XXXXXX&token=one-time-secret`).  
   - That route: verifies the token, reads the encrypted file, decrypts, shows the card details **once** in a minimal page (or returns JSON for a trusted operator tool), then **deletes** the file.  
   - No card data in email; no card data in GitHub or logs if implemented carefully.
4. **Vercel limitation:** Vercel is serverless; there is no persistent “directory above public_html” that survives between requests. So the “encrypted file on disk” approach would require a **different host** (e.g. a VPS or server where you can write to a private directory) or a **secure blob store** (e.g. S3 with encryption and strict IAM) plus a backend that only writes/reads with the one-time token. So “CSV/file above public_html” fits a traditional server, not Vercel.

**Pros:**

- Card never sent in email; never in GitHub or logs if done correctly.
- Operator gets payment only after customer confirms, via a one-time retrieval.

**Cons:**

- You are still storing raw card data (encrypted), so PCI and liability remain.
- On Vercel, you must use something other than “local file above public_html” (e.g. encrypted blob in S3 or a small backend on a VPS).
- More code and operational burden; easy to get wrong (key management, deletion, access control).

---

## Comparison

| Criteria                 | Option A (No card / phone or link) | Option B (Payment link only) | Option C (Encrypted file, no email) |
|-------------------------|------------------------------------|------------------------------|--------------------------------------|
| Card in emails          | No                                 | No                           | No                                   |
| Card in GitHub / logs   | No                                 | No                           | No (if implemented correctly)        |
| Cost                    | Free                               | Per-transaction fee          | Free (but server/blob cost if not Vercel) |
| PCI scope for you       | Minimal / none                     | Minimal (Stripe handles)    | Full (you store card data)          |
| Operator gets payment   | Phone or their link                | Via Stripe/Square            | One-time retrieval from your system |
| Recommended             | Yes                                | Yes, if you want online pay  | No                                   |

---

## Recommendation

1. **Preferred:** **Option A** – Stop collecting card on the site; have customers pay by phone or via a payment link the operator sends. Update the Security Notice to say we do not collect or transmit card details by email; payment is by phone or operator’s secure link. No card in emails, logs, or GitHub; no extra cost.
2. **If you want “pay online”:** **Option B** – Add a Stripe (or Square) Payment Link in the confirmation email when the customer confirms. Card never touches your app or email.
3. **Option C** is possible in theory (encrypted storage, no email, one-time retrieval) but not recommended because of PCI scope, liability, and the need for a non-Vercel storage (or encrypted blob) and careful key and access management.

---

## Next Step

Please choose one of:

- **A** – No card on site; payment by phone or operator’s link. (We can update the form and Security Notice, and remove card from operator emails.)
- **B** – Payment link only (e.g. Stripe) in confirmation email; no card fields on form. (We can add a single “Pay here” link step and document Stripe setup.)
- **C** – Encrypted server-side storage and one-time retrieval for operator; no card in email. (We can outline the exact API and storage design for your host, with strong caveats.)

Once you pick A, B, or C, we can implement the corresponding flow and update the form text and Security Notice accordingly.

---

## Chosen Flow – Implementation Summary

### 1. Booking form (initial request)
- **Optional:** Last 4 digits of card, name on card, billing address, billing ZIP only.
- **Not collected on form:** Full card number, expiry, CVC (those are collected only via the secure link in the confirmation email).
- Security notice updated: we’ll send a secure link in the confirmation email to enter full payment details when they’re ready.

### 2. Confirmation / follow-up emails (Rainbow and Blue Hawaiian)
- **Rainbow:** First email (“we’re working on a time”) includes a **secure payment link** so the customer can enter full card details right away. When Rainbow replies with times, we tell the customer either “We have your card on file” or “Please complete the secure payment link so Rainbow can process.”
- **Blue Hawaiian:** When we send FareHarbor availabilities we include the same **secure payment link**. Customer picks a time and (if not already done) enters payment via the link. We then send Blue Hawaiian the booking + chosen time + a **one-time link** to view payment details (no card data in the email).

### 3. Secure payment link (customer)
- URL format: `https://booking.helicoptertoursonoahu.com/secure-payment?ref=HTO-XXXXXX&token=...`
- Token is a signed token (HMAC) so only someone with the link can submit; expires after a set period (e.g. 7 days).
- Page shows a form: name on card, full card number, expiry, CVC, billing address, ZIP. Submit goes to `POST /api/secure-payment`.
- API verifies token, encrypts payload (AES-256-GCM) with `PAYMENT_ENCRYPTION_KEY` (env), stores in `secure_payments` table (Supabase). Sets `metadata.secure_payment_received_at` on the booking. **Never** logs or emails card data.

### 4. Getting payment to the operator
- We **never** put full card number or CVC in any email.
- When we send the booking to the operator (after the customer confirms a time), we attach a **one-time link** in the email: “Payment details for HTO-XXX: view once (secure): [link].”
- Link: `GET /api/operator-payment?ref=HTO-XXX&token=one-time-secret`. That API fetches the encrypted payload, decrypts it, shows the card details **once** in a minimal HTML page, then marks the record as consumed (so the link cannot be used again).

### 5. Environment and database
- **PAYMENT_ENCRYPTION_KEY:** 32-byte hex or base64 key (e.g. `openssl rand -hex 32`) in Vercel env. Used only to encrypt/decrypt card payloads; never in GitHub.
- **Supabase:** New table `secure_payments` (see `supabase-secure-payments.sql`): `ref_code`, `encrypted_payload`, `created_at`, `consumed_at`, `operator_token`. Run the migration once in Supabase.

### 6. Email copy
- If `metadata.secure_payment_received_at` is set: “We have your payment information on file.”
- If not: “Please enter your payment details here: [secure link] so we can confirm your booking when we have a time / when you pick a time.”
- Rainbow “times available” email: “We have your card on file” or “Please complete the secure payment link so Rainbow can process.”
- Operator email: never contains card number or CVC; only the one-time “View payment details” link.

### 7. Setup (Vercel + Supabase)
1. **Supabase:** Run `supabase-secure-payments.sql` once in the Supabase SQL Editor (Dashboard → SQL Editor) to create the `secure_payments` table.
2. **Vercel env:**
   - **PAYMENT_LINK_SECRET:** A secret string (e.g. 32+ chars, or run `openssl rand -hex 32`). Used to sign the customer secure-payment link token. Do not commit to GitHub.
   - **PAYMENT_ENCRYPTION_KEY:** 32-byte key in hex (64 hex chars). Run `openssl rand -hex 32` and set the value. Used to encrypt card payloads in `secure_payments`. Do not commit to GitHub.
3. If these env vars are not set, the confirmation email will not include a secure payment link, and the secure payment page/API will fail (customer and operator flows will still work without full card capture).
