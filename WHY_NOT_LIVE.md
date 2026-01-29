# Why isn’t the new chatbot live after I pushed to GitHub?

The new code (island buttons, “Aloha! Welcome…”, phone icon, etc.) **is in your repo**. If the live site still shows the old chatbot (“Book Your Tour”, “Please enter your email…”), it’s almost always one of these:

---

## 1. Latest deployment didn’t run or failed (most common)

**Check in Vercel:**

1. Go to [vercel.com](https://vercel.com) → your project (helicoptertoursonoahu-next or booking app).
2. Open **Deployments**.
3. Find the **top deployment** (most recent).
   - Does its commit match your latest push (e.g. message like “Chatbot: island→operator→tour…”)?
   - Is the status **Ready** (green) or **Failed** / **Error**?

**If the latest deploy failed:**

- Click that deployment and read the **build log** (often a red error at the end).
- Fix that error (e.g. missing env, TypeScript error, or the favicon/path issue if you see “Module not found” for a path with `#`).
- Push a fix, or in Vercel click **Redeploy** after fixing.

**If the latest deploy succeeded but isn’t production:**

- On that deployment, click **“…”** → **“Promote to Production”** so the live domain serves this build.

---

## 2. Wrong Vercel “Root Directory”

If your **GitHub repo root** is the Next.js app (e.g. repo = contents of `hto-next`):

- In Vercel: **Project Settings → General → Root Directory** should be **empty** or **`.`**.

If your repo has the app inside a folder (e.g. `bookings/hto-next`):

- Root Directory must be **`bookings/hto-next`** (or whatever path contains `package.json`).

If Root Directory is wrong, Vercel may build an old or empty app and the new chatbot won’t be in the build.

---

## 3. Cache (browser or CDN)

Even when the new deploy is live, your browser (or a CDN) can show the old JS:

- **Hard refresh:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac).
- Or open the site in a **private/incognito** window, or another browser.
- Confirm the URL is **https://booking.helicoptertoursonoahu.com** (or your real Vercel domain), not a local or old URL.

---

## Quick checklist

| Step | What to do |
|------|------------|
| 1 | Vercel → **Deployments** → Is the latest commit there and **Ready**? |
| 2 | If **Failed**, open build log, fix the error, push or **Redeploy**. |
| 3 | If latest is **Ready** but not live, **Promote to Production**. |
| 4 | **Settings → General** → **Root Directory** correct for your repo layout? |
| 5 | Open booking URL in **incognito** or **hard refresh** to avoid cache. |

Once the **latest successful deploy** is **Production** and you’re not cached, you should see the new header (“Helicopter Tours on Oahu”, “Chat & book”), island buttons, and phone icon.
