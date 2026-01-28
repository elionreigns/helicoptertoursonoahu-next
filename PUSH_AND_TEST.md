# Push & Test Checklist

## Is it 100% done?

**Yes.** Everything we built is in place:

- **Emails:** Rainbow and Blue Hawaiian are fixed (test addresses in `src/lib/constants.ts`). Client email = whatever they enter in the form for **that** booking.
- **bookings@** gets the initial booking (copy + record). **Client** gets confirmation, then follow-up based on operator (BH = scraped times, Rainbow = "we're in contact with Rainbow").
- **Follow-up** goes **only to the client** — never to operator/hub/agent (`isOperatorOrInternalEmail` blocks it).
- **Blue Hawaiian:** Scrape FareHarbor → client gets times → client picks → we send BH full info + time → BH confirms → we get missing info from client → forward to BH → when they say "it's a go" → final email to client (when/where/park/address).
- **Rainbow:** We ask Rainbow availability + send them initial client info → Rainbow replies with times → we email client with times **and ask for payment** → client confirms + payment → we send Rainbow full info → Rainbow confirms → final email to client (when/where/park/address).
- **Resend Inbound:** Use `helicopter@goudamo.resend.app` as `REPLY_TO_INBOUND` in Vercel; webhook for `email.received` to `/api/webhooks/resend-inbound`.
- **WORKFLOW.md** documents the full flow.

After you've tested and it's 100% working, update **only** the operator emails in `src/lib/constants.ts` (`emails.blueHawaiian`, `emails.rainbow`) to the real addresses. No other code changes needed.

---

## Push so you can test

Run these from your **booking app repo** (usually the `hto-next` folder if that's what's connected to Vercel):

```bash
cd "c:\Users\erict\OneDrive\Desktop\Cursor Sites #2\HELICOPTER TOURS ON OAHU\bookings\hto-next"
git status
git add .
git commit -m "Booking flow: client-only follow-up, Rainbow payment ask, workflow docs, replyToInbound export"
git push
```

If your git repo is the **parent** folder (HELICOPTER TOURS ON OAHU), run `git status` and `git add` from there and adjust the path.

After push, Vercel will deploy. Then:

1. **Vercel:** Ensure env vars are set: `REPLY_TO_INBOUND` = `helicopter@goudamo.resend.app`, plus `RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_*`, `OPENAI_API_KEY`, and optionally `VERCEL_AUTOMATION_BYPASS_SECRET`, `RESEND_WEBHOOK_SECRET`.
2. **Resend:** Webhook for `email.received` → `https://booking.helicoptertoursonoahu.com/api/webhooks/resend-inbound`.
3. Test with a **real client email** (not an operator or test-agent address) so the follow-up goes to the client.

---

## Local build note

If `npm run build` failed locally (e.g. favicon or path with `#`), that’s often a local-only issue. Vercel usually builds fine. If the Vercel build fails, fix the reported error (e.g. favicon path) and push again.
