# Secure Payment Setup – Step by Step

Do these **once** so the secure payment link and encrypted card storage work in production.

---

## 1. Supabase: Create the `secure_payments` table

1. Go to **[Supabase](https://supabase.com)** and sign in.
2. Open your **project** (the one used by this booking app).
3. In the left sidebar, click **SQL Editor**.
4. Click **New query**.
5. Copy and paste the SQL below into the editor.
6. Click **Run** (or press Ctrl+Enter).
7. You should see “Success. No rows returned.” That means the table was created.

**SQL to run:**

```sql
-- Secure payments: encrypted card payloads per booking. Never store plain card data.
-- Run this once in Supabase SQL Editor (Dashboard → SQL Editor).

CREATE TABLE IF NOT EXISTS secure_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL,
  encrypted_payload text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  operator_token text UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_secure_payments_ref_code ON secure_payments(ref_code);
CREATE INDEX IF NOT EXISTS idx_secure_payments_operator_token ON secure_payments(operator_token) WHERE operator_token IS NOT NULL;

COMMENT ON TABLE secure_payments IS 'Encrypted card payloads for bookings. Decrypted only for one-time operator view.';
```

Done. You do **not** need to run this again.

---

## 2. Vercel: Add environment variables

1. Go to **[Vercel](https://vercel.com)** and sign in.
2. Open the **project** for this booking app (e.g. helicoptertoursonoahu-next).
3. Click **Settings** (top menu).
4. In the left sidebar, click **Environment Variables**.
5. Add the **two payment-related** environment variables. For each one:
   - **Key:** use the variable names expected by the app (see your Vercel dashboard or private setup notes).
   - **Value:** a 64-character hex string (32 bytes). Generate two different values; do not share or commit them.
   - **Environments:** check **Production** (and **Preview** if you use preview deploys).
   - Click **Save**.

### Generate the two secrets

You need **two different** 64-character hex strings (32 bytes each).

**Option A – Node (if you have Node installed)**  
In a terminal (or in the `bookings/hto-next` folder), run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it **twice**. Use the first output for one variable and the second for the other (variable names are not listed in this public repo).

**Option B – Online**  
Use a generator that outputs “random hex” or “64 hex characters”, e.g.:

- https://www.random.org/strings/ (generate 2 strings, length 64, hex)
- Or search “random hex string generator” and generate two 64-character hex values.

**Option C – PowerShell (Windows)**  
In PowerShell you can do:

```powershell
[Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Run it **twice**. Use the first for one variable and the second for the other (variable names are not listed in this public repo).

Do **not** commit these values to GitHub or put them in code. Variable names are configured in Vercel (not documented in this public repo). After saving both, trigger a **redeploy** (Deployments → … on latest → Redeploy) so the app uses the new variables.

---

## 3. Redeploy

After adding the env vars:

- Vercel → your project → **Deployments**.
- Open the **…** menu on the latest deployment → **Redeploy** (or push a small commit to trigger a new deploy).

Once the new deploy is live, the secure payment flow is active: the confirmation email will include the secure link, and customers can submit full card details via that link; operators get the one-time “View payment details” link when the customer confirms a time.
