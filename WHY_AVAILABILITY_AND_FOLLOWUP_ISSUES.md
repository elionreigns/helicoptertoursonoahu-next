# What Went Wrong: FareHarbor Scraping & Follow-Up Email

## What You Expected

### Blue Hawaiian
- **Scrape** the FareHarbor links for the tour/date they picked.
- **Find** actual availability (times near the time they picked).
- **Send** a follow-up email to the person who inquired with:
  - Those available times (from FareHarbor)
  - The phone number (e.g. (707) 381-2583)
  - Tour intro and payment info.

### Rainbow Helicopters
- No live availability to scrape.
- **Send** a follow-up email saying we’re in contact with Rainbow Helicopters to arrange a time close to their preferred date, plus the phone number and next steps.

---

## What Actually Happened (From Logs & Code)

### 1. Session created, then “Failed to execute script”

- We **do** create a Browserbase session successfully (e.g. `Browserbase session created: 2fc35dab-...`).
- We then tried to **run** the FareHarbor scraping by POSTing a script to:
  - `https://www.browserbase.com/v1/sessions/{sessionId}/execute`
- That request returned **401 Unauthorized** and the logs show **“Failed to execute script”**.

So: the script that would open FareHarbor, click the date, and read time slots **never ran**. No scraping happened.

### 2. Why the script never ran

- **Browserbase does not have an “execute script” API.**  
  There is no endpoint where you send a blob of Playwright/JS and they run it for you.
- Their model is:
  1. **Create** a session (we do this).
  2. **Connect** to that session from **our** server using their SDK + Playwright (we were not doing this).
  3. **Run** Playwright code **in our process** (e.g. in the Next.js API route), using a browser that is already running on Browserbase’s side.

We were effectively trying to use a non‑existent “run this script in the cloud” API. So:

- We never connected to the session.
- We never opened FareHarbor.
- We never scraped any times.

That’s why you didn’t see real availability from FareHarbor and why the follow-up didn’t contain “actual times near the time they picked.”

### 3. What was missing in the follow-up email

- **Blue Hawaiian**
  - We *intended* to fill the email with **live** times from FareHarbor. Because scraping never ran, we had **no** `availableSlots`, so the email fell back to a generic “we are checking availability and will contact you shortly” message — and no list of times or “near the time you picked.”
- **Rainbow**
  - We didn’t differentiate the copy. The email should explicitly say we’re **in contact with Rainbow Helicopters** to arrange a time close to their date and give the phone number; that wording was not there.

So:

- **Scraping:** Broken because we never ran Playwright against the Browserbase session (wrong API usage).
- **Follow-up content:**  
  - Blue Hawaiian: No real times because scraping didn’t run; generic “checking” message.  
  - Rainbow: Missing the “we’re in contact with Rainbow to arrange a time” + phone number messaging.

---

## What Is Fixed / In Place Now

1. **Explanation (this doc)**  
   - Why FareHarbor wasn’t scraped (no `/execute`; we must use SDK + Playwright and run the script ourselves).

2. **FareHarbor scraping (Blue Hawaiian) — implemented**  
   - **@browserbasehq/sdk** and **playwright-core** are used in `src/lib/browserAutomation.ts`:
     - Create session with `bb.sessions.create({ projectId })`.
     - Connect with `chromium.connectOverCDP(session.connectUrl)`.
     - Open the FareHarbor URL, wait for calendar, optionally switch to iframe, click the requested date, then scrape time-slot buttons/links.
     - Return `availableSlots` so the follow-up email can show “Available times for [date]” and list them + phone number.
   - If scraping fails (e.g. timeout, selector changes), we still send the follow-up email with “We’re checking live availability…” and the phone number.

3. **Follow-up email wording**  
   - **Rainbow:**  
     - Explicit line: we’re in contact with Rainbow Helicopters to arrange a time close to your preferred date, plus phone number and next steps.
   - **Blue Hawaiian:**  
     - If we have scraped slots: show “Available times for [date]” and list them + phone number.  
     - If we don’t (e.g. scrape failed): “We’re checking live availability for your preferred date…” and call us at (707) 381-2583.

4. **Phone number**  
   - Passed through and shown prominently in the follow-up for both operators (Rainbow and Blue Hawaiian).

---

## Summary Table

| Intended behavior                         | What happened / root cause                                      | Fix |
|------------------------------------------|------------------------------------------------------------------|-----|
| Scrape FareHarbor for Blue Hawaiian      | Script never ran; we used a non‑existent “execute” API           | Use Browserbase SDK + Playwright in our API route to connect and scrape |
| Show real times “near the time they picked” | No times because scraping never ran                             | Same: implement real scraping and pass slots into the follow-up email |
| Follow-up email with times + phone       | Email sent but with generic “checking” and no times             | Use scraped slots when present; always include phone number |
| Rainbow: “in contact with Rainbow to arrange time” | Copy was generic, not Rainbow‑specific                         | Dedicated Rainbow paragraph + phone in follow-up email |
| Share phone number in follow-up          | Already in template; made sure it’s clear in new copy            | Done in the new messaging |

---

## What Was Not Working vs What Was Missing

- **Not working:**  
  The “execute script” call to Browserbase (wrong API). So **no** FareHarbor scraping, **no** real availability, and **no** “available times near the time they picked” in the email.

- **Missing:**  
  1. Correct integration: Browserbase SDK + Playwright in our code to actually open FareHarbor and scrape.  
  2. Operator‑specific follow-up copy: Rainbow = “in contact with Rainbow to arrange a time” + phone; Blue Hawaiian = live times (when we have them) or “checking availability” + phone.

Implementing the SDK-based scraping and the updated email copy addresses both “what wasn’t working” and “what was missing” so the workflow behaves as you described.
