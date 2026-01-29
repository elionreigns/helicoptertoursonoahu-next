# Resend Inbound – Step-by-Step Checklist

Use this checklist. The app code is already in place; you only set things in Resend and Vercel.

---

**Important:** If Resend asks you to pay when you click **“Add domain”**, stop. You do **not** need to add a domain. Use Resend’s **free** receiving address (the one that looks like `something@something.resend.app`) and set `REPLY_TO_INBOUND` to that. No payment required.

---

## Part 1: Resend Website

### Step 1 – Turn on Receiving (Inbound) – **Free option (no $20)**

**Do not click “Add domain”.** That path is for custom domains and will ask you to pay. Instead, use Resend’s **free receiving address** (the .resend.app address Resend gives you when you turn on Receiving).

1. Log in at **https://resend.com**
2. In the left sidebar, go to **Emails** → **Receiving**  
   (or open: https://resend.com/emails/receiving)
3. Turn **on** “Enable Receiving” if it isn’t already.
4. Find **“Receiving address”** or **“Your .resend.app domain”**. Resend shows **`<anything>@your-id.resend.app`** — you can use any word before the @. Use e.g. **`helicopter@goudamo.resend.app`** (or `bookings@...`). **Set REPLY_TO_INBOUND to that full address.**
5. In **Vercel** → your project → **Settings** → **Environment Variables**, add:
   - **Name:** `REPLY_TO_INBOUND`
   - **Value:** the address you chose (e.g. `helicopter@goudamo.resend.app`)
6. Redeploy the app. From then on, all outgoing emails will use **Reply-To: that address**, so when someone hits Reply, the reply goes to Resend’s free address and Resend receives it – **no new domain, no MX, no $20.**

**If you later want a custom address (e.g. bookings@booking.helicoptertoursonoahu.com)** and are okay paying for an extra domain, you can add the subdomain via “Add domain” and then set `REPLY_TO_INBOUND` to `bookings@booking.helicoptertoursonoahu.com` (or remove the env var and rely on the app’s default). For now, the free .resend.app address is enough.

### Step 2 – Add the Webhook (so Resend notifies your app)

1. In Resend, go to **Webhooks** in the sidebar  
   (or open: https://resend.com/webhooks)
2. Click **“Add Webhook”** (or **“Create webhook”**).
3. Fill in:
   - **Endpoint URL:**  
     `https://booking.helicoptertoursonoahu.com/api/webhooks/resend-inbound`  
     (If your booking app has a different URL, use that base + `/api/webhooks/resend-inbound`.)
   - **Description (optional):** e.g. `Inbound – route replies to booking app`
   - **Events:** Turn **on** only **“email.received”**. Turn off the rest (sent, delivered, bounced, etc.).
4. Click **Save** / **Create**.
5. After it’s created, Resend may show a **“Signing secret”** (a long string).  
   **Copy it** and keep it somewhere safe — you’ll add it to Vercel in Part 2.

---

## Part 2: Vercel – Environment Variables

1. Open **Vercel** → your project → **Settings** → **Environment Variables**.
2. You should already have (from sending):
   - **RESEND_API_KEY** – Your Resend API key (used for sending and for the webhook to fetch the received email body).  
     If not: Resend → **API Keys** → Create / copy key.
   - **RESEND_FROM** – e.g. `Helicopter Tours <bookings@helicoptertoursonoahu.com>`.
3. Add or confirm these:

| Name | Value | Where you get it |
|------|--------|-------------------|
| **RESEND_API_KEY** | `re_xxxx...` | Resend → API Keys. **Must have Receiving scope** (or full access). If you see "This API key is restricted to only send emails" when a reply is received, create a new key with **full access** or enable **Receiving** so the webhook can fetch the email body. |
| **RESEND_FROM** | `Helicopter Tours <bookings@helicoptertoursonoahu.com>` | Your sending address |
| **REPLY_TO_INBOUND** | Your Resend receiving address (e.g. `helicopter@goudamo.resend.app`) | Resend → Emails → Receiving → use &lt;anything&gt;@your-id.resend.app (free) |
| **RESEND_WEBHOOK_SECRET** | The **Signing secret** from the webhook you just created | Resend → Webhooks → your webhook → Signing secret (optional but recommended) |
| **VERCEL_AUTOMATION_BYPASS_SECRET** | Your Vercel protection bypass token | Vercel → Project → Deployment Protection → Protection Bypass for Automation (if you use Deployment Protection) |

4. **RESEND_WEBHOOK_SECRET** is optional: the app works without it. Adding it lets us verify that webhooks really come from Resend (we can add that check in code later if you want).
5. **VERCEL_AUTOMATION_BYPASS_SECRET** is only needed if Vercel Deployment Protection is on; the webhook calls your own APIs and that call can get 401 without the bypass.
6. Save and **redeploy** the project so the new/updated env vars are used.

---

## Part 3: What to Give Me (or Change in Code)

- **Nothing.** You don’t need to give me any keys or secrets; keep those in Resend and Vercel only.
- The app uses **REPLY_TO_INBOUND** from Vercel env vars, so setting that to your Resend receiving address (e.g. `helicopter@goudamo.resend.app`) is all you need for the free option.

---

## Quick Reference

| Step | Where | What to do |
|------|--------|------------|
| 1 | Resend → Emails → Receiving | Turn on receiving; copy your **.resend.app** receiving address (free; no Add domain). Set **REPLY_TO_INBOUND** in Vercel to that address. |
| 2 | Resend → Webhooks | Add webhook: URL = `https://booking.helicoptertoursonoahu.com/api/webhooks/resend-inbound`, event = **email.received** only; copy Signing secret |
| 3 | Vercel → Settings → Environment Variables | Ensure RESEND_API_KEY, RESEND_FROM; add RESEND_WEBHOOK_SECRET (optional), VERCEL_AUTOMATION_BYPASS_SECRET (if using Deployment Protection) |
| 4 | Vercel | Redeploy so new env vars are active |

After that, when someone replies to an email from your app, the reply goes to your Resend address (e.g. helicopter@goudamo.resend.app), Resend receives it and POSTs to your app, and the app routes it to operator-reply or customer-reply.
