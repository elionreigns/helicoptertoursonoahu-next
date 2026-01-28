# n8n Email Workflow – Process Incoming Booking Emails

**If you use Resend for sending:** You can use **Resend Inbound** instead of n8n to receive and route replies. See **RESEND_INBOUND_SETUP.md** for setup. Once Resend Inbound is configured, replies to bookings@ are received by Resend and POSTed to the app; no n8n email workflow is required.

---

This document describes how to set up an **n8n workflow** (alternative to Resend Inbound) that watches your `bookings@helicoptertoursonoahu.com` inbox and forwards incoming emails to the correct API so that:

- **Customer replies** (e.g. "2pm works", "yes confirmed") → `POST /api/customer-reply` → app sends full booking to operator when appropriate.
- **Operator replies** (e.g. Rainbow: "We have 2pm available") → `POST /api/operator-reply` → app emails customer to confirm.

**Base URL for all API calls:** Use your production booking app, e.g.  
`https://booking.helicoptertoursonoahu.com`  
(or your Vercel URL if different).

---

## 1. What You Need

- **n8n** (you already have it; free trial is fine).
- **Access to the inbox** that receives replies for `bookings@helicoptertoursonoahu.com`.  
  That might be:
  - **Gmail** (if you use Google Workspace and bookings@ is a Gmail address or is forwarded to Gmail).
  - **IMAP** (if your host gives you IMAP for that address).
  - **Microsoft 365 / Outlook** (if you use that for bookings@).
- The inbox should receive:
  - Replies from **customers** (to confirmation/follow-up emails).
  - Replies from **operators** (Blue Hawaiian / Rainbow) to the emails you send them.

---

## 2. Operator Emails (for Routing)

If the **From** address of an incoming email is one of these, n8n should send it to **operator-reply**. Otherwise, treat it as a **customer reply** and send to **customer-reply**.

| Operator              | Email (from `src/lib/constants.ts`)     |
|-----------------------|------------------------------------------|
| Blue Hawaiian (test)  | `coralcrowntechnologies@gmail.com`       |
| Rainbow (test)        | `ashleydanielleschaefer@gmail.com`       |

When you switch to real operator emails, update these in **both** `src/lib/constants.ts` and your n8n workflow (e.g. the list in the IF condition).

---

## 3. n8n Workflow Structure

Create a **new** workflow (separate from your existing “new booking” webhook). High level:

```
[Email Trigger] → [IF: From = operator?] → Yes → [HTTP Request: operator-reply]
                    ↓ No
                    → [HTTP Request: customer-reply]
```

- **Email Trigger** – Watches the inbox that receives mail for bookings@ (e.g. Gmail “Watch emails” or IMAP “Read Email”).
- **IF** – Check if the message’s **From** address is one of the operator emails above (case-insensitive). If yes → operator-reply; if no → customer-reply.
- **HTTP Request** – POST to the correct endpoint with the body described below.

---

## 4. Step-by-Step n8n Setup

### Step 4.1 – Email Trigger

1. Add a trigger that gets **new emails** from the inbox used for bookings@:
   - **Gmail:** use the **Gmail** node → “Trigger” → “On New Email” (or “Watch emails” if available). Connect your Gmail account that receives bookings@ (or the mailbox that forwards to it).
   - **IMAP:** use **IMAP Email** node → trigger on new message; enter IMAP credentials for the mailbox that receives bookings@.
   - **Microsoft 365:** use **Microsoft Outlook** (or equivalent) trigger for new mail in the folder that receives bookings@.

2. Configure the trigger so it returns, for each email, at least:
   - **From** (sender email address).
   - **Subject**.
   - **Body / text** (plain text or HTML; see below).

3. Make sure the trigger runs on **incoming** mail only (not sent mail). If your trigger returns both, add a filter so you only process messages where “From” is not your own address (e.g. not `bookings@helicoptertoursonoahu.com`).

### Step 4.2 – Get Body and From

4. In n8n, the trigger usually outputs items with fields like:
   - `from` or `fromEmail` or `sender` (sender email)
   - `subject`
   - `text` or `body` or `message` (email body)

   Use the **field names your node actually provides**. In the next steps, “email body” = the full text of the email (plain text is fine; if only HTML, use that). “From” = the sender’s email address (e.g. `customer@gmail.com` or `ashleydanielleschaefer@gmail.com`).

### Step 4.3 – IF: Is this an operator?

5. Add an **IF** node after the trigger.
   - **Condition:** “From” (or whatever field has the sender email) **equals** one of the operator addresses (case-insensitive).
   - On n8n free tier you may only have two branches: **true** and **false**.
   - **True** → this email is from an operator → connect to **operator-reply** HTTP Request.
   - **False** → this email is from a customer (or anyone else) → connect to **customer-reply** HTTP Request.

   If your n8n version doesn’t support “equals any of [list]”, use two conditions (From equals `coralcrowntechnologies@gmail.com` **OR** From equals `ashleydanielleschaefer@gmail.com`).

   **Important:** Compare the **normalized** From address (lowercase, no display name). Some triggers give “Name <email>”; extract the part inside `<>` or the part after the last `<` and trim, then lowercase.

### Step 4.4 – HTTP Request: operator-reply (operator branch)

6. Add **HTTP Request** node.
   - **Method:** POST  
   - **URL:** `https://booking.helicoptertoursonoahu.com/api/operator-reply`  
     (replace with your real booking app URL if different.)
   - **Headers:**  
     `Content-Type: application/json`
   - **Body (JSON):**

```json
{
  "emailContent": "{{ $json.text }}",
  "fromEmail": "{{ $json.from }}",
  "subject": "{{ $json.subject }}"
}
```

   Replace `$json.text` / `$json.from` / `$json.subject` with the actual field names from your Email Trigger (e.g. `$json.body`, `$json.fromEmail`, etc.). The API will:
   - Use `emailContent` to parse the reply (e.g. proposed time).
   - Use `fromEmail` to recognize the operator.
   - Use `subject` (and `emailContent`) to extract ref code (e.g. `HTO-XXXXXX`) if not provided.

   **Optional:** If you already extract ref code in n8n, you can add:
   - `"refCode": "HTO-XXXXXX"`  
   (Replace with the value from the subject or body.)

7. No auth is required for this API unless you add it later. Save the node.

### Step 4.5 – HTTP Request: customer-reply (customer branch)

8. Add another **HTTP Request** node on the **false** branch of the IF.
   - **Method:** POST  
   - **URL:** `https://booking.helicoptertoursonoahu.com/api/customer-reply`  
   - **Headers:**  
     `Content-Type: application/json`  
   - **Body (JSON):**

```json
{
  "emailContent": "{{ $json.text }}",
  "fromEmail": "{{ $json.from }}",
  "subject": "{{ $json.subject }}"
}
```

   Again, use the real field names from your trigger. The API expects:
   - **emailContent** (string) – full email body.
   - **fromEmail** (string) – must be a valid email (the customer’s address).
   - **subject** (string, optional) – helps with context.

9. Save the node.

---

## 5. API Reference (for copy-paste)

### POST /api/customer-reply

- **URL:** `https://booking.helicoptertoursonoahu.com/api/customer-reply`
- **Body (JSON):**

| Field         | Type   | Required | Description                    |
|---------------|--------|----------|--------------------------------|
| emailContent  | string | Yes      | Full body of the customer email |
| fromEmail     | string | Yes      | Customer’s email address       |
| subject       | string | No       | Email subject                  |

### POST /api/operator-reply

- **URL:** `https://booking.helicoptertoursonoahu.com/api/operator-reply`
- **Body (JSON):**

| Field        | Type   | Required | Description                                |
|--------------|--------|----------|--------------------------------------------|
| emailContent | string | Yes      | Full body of the operator email            |
| fromEmail    | string | No*      | Sender email (recommended for matching)    |
| subject      | string | No       | Email subject (used to extract ref code)   |
| refCode      | string | No       | e.g. `HTO-XXXXXX` (or extracted from subject/body) |

\*Not required by schema but recommended so the app can match the operator.

---

## 6. Field Names: Gmail vs IMAP vs Others

Your trigger node will output different property names. After adding the trigger, run the workflow once (or use “Execute node”) and look at the **output JSON**. Then:

- Replace `$json.text` with the field that contains the **email body** (e.g. `$json.plainText`, `$json.body`, `$json.message.plainText`).
- Replace `$json.from` with the field that contains the **sender email** (e.g. `$json.from.email`, `$json.fromEmail`, `$json.sender`).
- Replace `$json.subject` with the field that contains the **subject** (e.g. `$json.subject`, `$json.message.subject`).

If you use **Expression** in n8n, you can also do:
- `{{ $json.body || $json.plainText || $json.text }}`
- `{{ $json.from?.address || $json.fromEmail || $json.from }}`

---

## 7. Avoid Processing Your Own Outgoing Mail

If the same mailbox sends mail (e.g. bookings@ sends confirmations), make sure you don’t process those. In the IF node:

- **Operator branch:** From is one of the two operator addresses.
- **Customer branch:** From is **not** one of those and **not** your own address (e.g. not `bookings@helicoptertoursonoahu.com`).

So: only treat as “customer” when From is not operator and not your hub. That way you won’t send your own sent mail to the APIs.

---

## 8. Testing

1. **Operator reply (Rainbow):**
   - From your **Rainbow test** address (`ashleydanielleschaefer@gmail.com`), send an email to bookings@ with subject containing a ref code (e.g. `Re: Availability inquiry HTO-XXXXXX`) and body e.g. “We have 2pm available.”
   - Run the workflow (or wait for trigger). Check that one execution hits **operator-reply**.
   - In your app, the customer for that booking should get an email: “Rainbow Helicopters has 2pm available. Reply to confirm.”

2. **Customer reply:**
   - From a **customer** address that has an existing booking (e.g. the email you used when submitting a test booking), send a reply to a confirmation/follow-up email, e.g. “2pm works” or “Yes, confirmed.”
   - Run the workflow. Check that one execution hits **customer-reply**.
   - For Blue Hawaiian, the app should send the full booking to Blue Hawaiian. For Rainbow, the app should send the full booking to Rainbow (if they had already proposed a time and customer is confirming).

3. **Vercel / app logs:**
   - In your deployment logs, look for “Operator reply received” and “Customer reply” / booking updates to confirm the APIs were called and succeeded.

---

## 9. n8n Free Trial Notes

- **Polling:** Email triggers often poll every X minutes. So there can be a delay (e.g. 5–15 minutes) before an email is processed.
- **Executions:** Free tier may limit executions per month. One email = one workflow run; keep an eye on usage.
- **Credentials:** You need valid Gmail/IMAP/Outlook credentials for the mailbox that receives bookings@. If bookings@ is not Gmail, you may need to forward it to a Gmail address and watch that, or use IMAP for the real mailbox.

---

## 10. Summary Checklist

- [ ] New n8n workflow created (separate from “new booking” webhook).
- [ ] Email trigger added and connected to the inbox that receives bookings@ mail.
- [ ] IF node: From = operator email (Blue Hawaiian or Rainbow) → operator branch; else → customer branch.
- [ ] HTTP Request to `POST .../api/operator-reply` with `emailContent`, `fromEmail`, `subject` (and optional `refCode`).
- [ ] HTTP Request to `POST .../api/customer-reply` with `emailContent`, `fromEmail`, `subject`.
- [ ] JSON body field names updated to match your trigger’s output (`from`, `text`, `subject`, etc.).
- [ ] Workflow saved and activated (published).
- [ ] Test: send operator reply from Rainbow test address → operator-reply runs → customer gets “confirm your time” email.
- [ ] Test: send customer reply from a test customer → customer-reply runs → operator gets full booking when applicable.

When this is in place, **customer and operator reply emails are processed automatically** and the app will send full bookings to operators at the right time and email customers to confirm when Rainbow proposes a time.
