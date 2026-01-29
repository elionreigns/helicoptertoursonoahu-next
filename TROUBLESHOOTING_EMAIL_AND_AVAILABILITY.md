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

## Quick checklist

| Issue | Action |
|--------|--------|
| 535 email | Set **RESEND_API_KEY** in Vercel (and redeploy), or fix SMTP credentials. |
| Browserbase script failed | Verify **BROWSERBASE_API_KEY** / **BROWSERBASE_PROJECT_ID**; check session in Browserbase; confirm FareHarbor page/selectors. |
