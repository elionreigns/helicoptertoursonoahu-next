# Error Log — Booking Workflow

Use this to track errors seen in the booking flow so we can fix kinks and keep WORKFLOW.md accurate. Check **Vercel → Logs** and **Browserbase dashboard** (session ID in error details) when debugging.

---

## Errors Seen So Far

### 1. Email: Invalid login 535 Incorrect authentication data

**When:** After new booking request; booking request email and confirmation email both failed.

**Log excerpt:**
```
Email send error: Error: Invalid login: 535 Incorrect authentication data
  code: 'EAUTH',
  response: '535 Incorrect authentication data',
  command: 'AUTH PLAIN'
Booking request email failed: Invalid login: 535 Incorrect authentication data
Confirmation email failed: Invalid login: 535 Incorrect authentication data
```

**Cause:** App was using **SMTP** (not Resend). SMTP server rejected username/password.

**Fix:** Set **RESEND_API_KEY** in Vercel so the app uses Resend for all outgoing email (no SMTP). Redeploy. See TROUBLESHOOTING_EMAIL_AND_AVAILABILITY.md.

**Status:** [ ] Fixed (set Resend and redeploy) / [ ] Still seeing it

---

### 2. Browserbase: Failed to execute script

**When:** During availability check for Blue Hawaiian (FareHarbor scrape) on 2026-01-30.

**Log excerpt:**
```
Checking availability for blueHawaiian on 2026-01-30...
Browserbase session created: 99d7cb4c-f2ab-4cc8-a95c-7d20b66d7265 for Blue Hawaiian on 2026-01-30
Browserbase execution error: Error: Failed to execute script:
Availability check result: {
  available: false,
  error: 'Failed to execute script: ',
  source: 'browserbase',
  details: { date: '2026-01-30', partySize: 3, operator: 'blueHawaiian', note: 'Manual check may be required.' }
}
```

**Cause:** Remote browser session started but the Playwright script failed (timeout, FareHarbor page/selectors changed, or CDP/Browserbase error). BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID are set.

**Fix / Next steps:**
- In **Vercel Logs**, check the full error message and stack trace (we now log them).
- In **Browserbase dashboard**, open session `99d7cb4c-f2ab-4cc8-a95c-7d20b66d7265` (or the sessionId from the latest error details) and check session logs/screenshots.
- If FareHarbor layout changed, update selectors in `src/lib/browserAutomation.ts`.
- If timeout, consider increasing timeouts in browserAutomation.ts.

**Status:** [ ] Fixed / [ ] Still seeing it / [ ] Investigating (add notes below)

---

## Further Errors (after retry and beyond)

**Add new entries below** with the same format: when it happened, log excerpt, cause (if known), fix/next steps, status.

---

### Entry: [Date] — [Short title]

**When:** e.g. "On submit booking for Blue Hawaiian, 2026-01-30"

**Log excerpt:** (paste relevant log lines)

**Cause:** (if known)

**Fix / Next steps:**

**Status:** [ ] Fixed / [ ] Still seeing it / [ ] Investigating

---

*Last updated: 2026-01-28*
