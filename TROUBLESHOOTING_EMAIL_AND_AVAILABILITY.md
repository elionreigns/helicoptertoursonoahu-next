# Troubleshooting: Email 535 & Browserbase "Failed to execute script"

## 1. Email: "Invalid login: 535 Incorrect authentication data"

**What it means:** The app is sending email via **SMTP** (not Resend), and the SMTP server rejected the username/password.

**Fix (recommended): Use Resend**

1. In **Vercel** → your project → **Settings** → **Environment Variables**
2. Add **`RESEND_API_KEY`** with your [Resend](https://resend.com) API key (Production + Preview if you use both).
3. Optional: **`RESEND_FROM`** e.g. `Helicopter Tours <bookings@helicoptertoursonoahu.com>` (after verifying the domain in Resend).
4. **Redeploy** the app.

When `RESEND_API_KEY` is set, the app uses Resend for all outgoing email and **does not use SMTP**. That avoids 535 errors from shared-host SMTP.

**If you must use SMTP**

- Ensure **SITE5_SMTP_HOST**, **SITE5_EMAIL_USERNAME**, and **SITE5_EMAIL_PASSWORD** in Vercel are correct for your mail server.
- Use the full email as username if required (e.g. `bookings@helicoptertoursonoahu.com`).
- If the provider requires an "app password", use that instead of the normal account password.
- Port 587 (TLS) or 465 (SSL) must match what the server expects.

---

## 2. Availability: "Browserbase execution error: Failed to execute script:"

**What it means:** The Blue Hawaiian availability check uses [Browserbase](https://browserbase.com) + Playwright to open the FareHarbor calendar. The remote browser session failed to run the script (e.g. timeout, page change, or Browserbase-side error).

**Checks**

1. **Vercel env**
   - **BROWSERBASE_API_KEY** and **BROWSERBASE_PROJECT_ID** must be set (Production/Preview as needed).
   - Keys must be valid and the project allowed to run sessions.

2. **Browserbase dashboard**
   - Open the session (e.g. `99d7cb4c-f2ab-4cc8-a95c-7d20b66d7265`) and check logs/screenshots.
   - See if the page loaded, if the script timed out, or if FareHarbor’s layout changed.

3. **FareHarbor**
   - The calendar URL or DOM may have changed; selectors in `src/lib/browserAutomation.ts` might need updating.

**Current behavior:** When Browserbase fails, the flow still continues: the booking is stored, the result is `available: false` with `error: 'Failed to execute script: '`, and the follow-up email can say that availability was not checked and a manual check may be required. So bookings are not lost; only the automatic availability result is missing for that request.

---

## 3. Resend: "429 Too many requests. You can only make 2 requests per second"

**What it means:** Resend limits to 2 API calls per second. The app sends several emails in quick succession (inquiry, confirmation, follow-up, agent notification) and can hit this limit.

**Fix (done in code):**
- Delays between sends: 800 ms after Rainbow inquiry before confirmation; 1.5 s before the follow-up route sends so it doesn’t overlap with new-booking-request; 600 ms before agent notification.
- **429 retry:** Each send that gets 429 is retried up to 2 times with backoff (1.2 s, then 2 s). If you still see "Confirmation email failed: Too many requests" after deploy, contact Resend support to increase your rate limit.

---

## 4. Resend Inbound: "This API key is restricted to only send emails" (401)

**What it means:** When someone replies to an email, Resend sends a webhook. The app then fetches the full email body via `GET https://api.resend.com/emails/receiving/{id}`. That call requires an API key with **Receiving** (read) permission. If your key is restricted to "send only", you get 401.

**Fix**

1. In **Resend** → **API Keys** → create a **new** API key.
2. Give it **full access** (or at least **Sending** + **Receiving**).
3. In **Vercel** → Environment Variables, set **RESEND_API_KEY** to this new key (Production + Preview).
4. **Redeploy.** After that, the inbound webhook can fetch received emails and route them to operator-reply or customer-reply.

---

## Quick checklist

| Issue | Action |
|--------|--------|
| 535 email | Set **RESEND_API_KEY** in Vercel (and redeploy), or fix SMTP credentials. |
| 429 Resend | Delays are in place; if it persists, contact Resend or increase spacing. |
| Inbound 401 (restricted key) | Use a Resend API key with **Receiving** scope (or full access). |
| Browserbase script failed | Verify **BROWSERBASE_API_KEY** / **BROWSERBASE_PROJECT_ID**; check session in Browserbase; confirm FareHarbor page/selectors. |
