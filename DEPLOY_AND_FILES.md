# Deployment & Files – What You Need to Do

## You're seeing the OLD chatbot

If you see **"Book Your Tour" / "Online"** and **"Please enter your email address to get started"**, that's the **old** flow. The **new** code has:

- **Header:** "Helicopter Tours on Oahu" and "Chat & book" (not "Book Your Tour" / "Online")
- **Phone icon:** Top-right of the chat header, **next to the X** – a phone icon that opens your VAPI number when clicked
- **First message:** "Aloha! Welcome to Helicopter Tours on Oahu. We service the island of Oahu as well as some of the other islands. Which island would you like to know more about?" with **island buttons** (Oahu, Big Island, Maui, Kauai) – **no email first**

So the new UI is in the repo; you need the **latest deploy** and a **hard refresh** to see it.

---

## Where is the phone icon?

In **`src/components/BookingChatbot.tsx`** (around lines 448–458):

- There is an `<a href={phoneHref}>` with a **phone SVG icon** in the header, next to the close (×) button.
- `phoneHref` is your VAPI number from **`src/lib/constants.ts`** (`VAPI_PHONE_NUMBER`, e.g. `+1 (707) 381-2583` → `tel:+17073812583`).

No image upload is needed; it’s an inline SVG. If you don’t see it, you’re still on the old build or cached page.

---

## Files that were edited (all in repo)

| File | What changed |
|------|----------------|
| **src/components/BookingChatbot.tsx** | New flow: island → operator → tour → book/chat; call button in header; booking via new-booking-request |
| **src/lib/tours.ts** | Added `getUniqueIslands()`, `getToursByIslandAndOperator()` |
| **src/app/api/vapi-webhook/route.ts** | Calls `/api/new-booking-request` instead of duplicating insert/email (phone = same flow as form) |
| **vapi_integration.md** | New doc: how VAPI triggers booking and email flow |
| **RESEND_INBOUND_CHECKLIST.md** | Resend inbound setup (free .resend.app, REPLY_TO_INBOUND) |
| **WORKFLOW.md** | Full flow, who gets what, follow-up to client only |
| **src/lib/constants.ts** | `isOperatorOrInternalEmail`, follow-up safeguard |
| **src/lib/email.ts** | `replyToInbound` exported |
| **src/app/api/check-availability-and-followup/route.ts** | Block follow-up to operator/hub/agent |
| **src/app/api/operator-reply/route.ts** | Rainbow “confirm time” email asks for payment; `replyToInbound` |
| **src/app/api/new-booking-request/route.ts** | Comment: client email per booking |
| **src/components/BookingForm.tsx** | Label: "Email * (your contact for this booking)" |
| **PUSH_AND_TEST.md**, **DEPLOY_AND_FILES.md** | Checklists |

All of these are in your **GitHub repo** (helicoptertoursonoahu-next). No separate “upload” of these files is required if the app is deployed from GitHub.

---

## What you need to do (no upload to your server if app is on Vercel)

### 1. Booking app is on **Vercel** (e.g. booking.helicoptertoursonoahu.com)

- **You do not upload files to your own server** for the Next.js app. Pushing to GitHub is enough; Vercel builds and deploys from the repo.
- After you **push** (or after Vercel auto-deploys):
  - Open **https://booking.helicoptertoursonoahu.com** (or your Vercel URL).
  - Do a **hard refresh** (Ctrl+Shift+R or Cmd+Shift+R) or clear cache so you don’t see the old chatbot.
- You should then see:
  - Header: **"Helicopter Tours on Oahu"** and **"Chat & book"**
  - **Phone icon** next to the X in the top-right of the chat
  - First message: **island question** with **island buttons** (no email first)

### 2. Main site (e.g. helicoptertoursonoahu.com) on **your own server** (e.g. Site5)

- You do **not** need to upload the **Next.js app** to that server. The app runs on Vercel.
- On your server you only need:
  - A **link** or **button** to **https://booking.helicoptertoursonoahu.com** (e.g. “Book now”), or
  - An **iframe** that loads `https://booking.helicoptertoursonoahu.com`
- No copying of `BookingChatbot.tsx` or other app files to your server is required. As long as users open the booking URL (or the iframe loads it), they get the latest app from Vercel, including the new chatbot and phone icon.

### 3. If you still see the old chatbot

1. Confirm the **latest commit** is pushed to **main** (e.g. `387b6ad` or newer).
2. In **Vercel** → your project → **Deployments**, check that the **latest deployment** succeeded and is **Production**.
3. Open the booking site in a **private/incognito** window or another browser to avoid cache.
4. Confirm you’re on **https://booking.helicoptertoursonoahu.com** (or the correct Vercel URL), not an old or local URL.

---

## Summary

- **Phone icon:** In the code (BookingChatbot header, next to X). No image upload.
- **New flow (islands first, buttons, etc.):** In the same component; you’re seeing the old one until cache/deploy is updated.
- **Upload:** No need to upload the app to your server. Push to GitHub; Vercel deploys. Your main site just links to or embeds the booking URL.
