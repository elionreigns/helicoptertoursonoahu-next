# Vercel Build Fail Report — TypeScript "Property X does not exist on type 'never'"

**Project:** helicoptertoursonoahu-next (hto-next)  
**Last updated:** After fixing vapi-webhook and adding this report  
**Purpose:** Record every Supabase-related TS build failure and the rules that prevent it from recurring.

---

## 1. Root cause (why it kept failing)

The Supabase client is created with `createClient<Database>(...)`, but in the **Vercel/Next build** (and sometimes in `tsc`), the **return type of query/insert chains is still inferred as `never`** in these cases:

- `supabase.from('bookings').insert(...).select().single()` → `data` inferred as `never`
- `supabase.from('bookings').select('*').eq(...).single()` → `data` inferred as `never`
- Destructuring: `const { data: booking } = await supabase...single()` → `booking` is `never`
- Any use of `booking.id`, `booking.metadata`, `newRow.id`, etc. then fails with **"Property 'X' does not exist on type 'never'"**

So the failure was **not** "wrong code" in one file; it was the **same typing bug appearing in each API route** that used raw Supabase calls and then used `.data` without an explicit type. We fixed one route, pushed, and the next route failed the same way.

---

## 2. Every failure (as observed)

| # | File | Line | Error message | What was wrong |
|---|------|------|---------------|----------------|
| 1 | `src/app/api/customer-reply/route.ts` | 71 | Property 'id' does not exist on type 'never'. | `const { data: newRow } = await insertBooking(...)` — in build, `newRow` was still inferred as `never`. |
| 2 | `src/app/api/update-booking-status/route.ts` | 75 | Property 'metadata' does not exist on type 'never'. | `const { data: booking } = await supabase.from('bookings').select(...).single()` — `booking` inferred as `never`; then `booking.metadata` failed. |
| 3 | `src/app/api/vapi-webhook/route.ts` | 250 | Property 'id' does not exist on type 'never'. | `const { data: booking } = await supabase.from('bookings').insert(...).select().single()` — `booking` inferred as `never`; then `booking.id` and `booking.created_at` failed. |

**Earlier (pre–FAIL_REPORT) fixes in this project:**

- `new-booking-request/route.ts` — was using raw `supabase.from('bookings').insert(...).select().single()` and `booking.id`; switched to `insertBooking(insertPayload)` so `booking` is `BookingsRow | null`.
- `operator-reply/route.ts` — `booking.status` etc. on `never`; fixed by typing select results as `SelectOne` and using `updateBooking` + `prevMeta = booking?.metadata ?? {}`.

So the **pattern of failure** is always: **using Supabase booking result (from insert or select) without an explicit type, then accessing a property in the build**.

---

## 3. Rules that prevent it from happening again

### 3.1 Bookings INSERT

**Do not:**

- Use `supabase.from('bookings').insert(...).select().single()` and then use `data` (e.g. `booking.id`).

**Do:**

- Use **`insertBooking(payload)`** from `@/lib/supabaseClient`.
- Type the result explicitly:  
  `const insertResult: InsertBookingResult = await insertBooking(insertPayload);`  
  `const booking = insertResult.data;`  
  `const dbError = insertResult.error;`
- Build `insertPayload` as `BookingsInsert` (from `@/lib/database.types`).
- Only use `booking.id`, `booking.created_at`, etc. **after** `if (dbError || !booking) return error ...`.

**Files that must follow this:** any route that creates a booking and then uses its `id` or `created_at` (e.g. `new-booking-request`, `vapi-webhook`, `customer-reply` when it inserts).

### 3.2 Bookings SELECT (one row)

**Do not:**

- Use `const { data: booking } = await supabase.from('bookings').select(...).single()` and then use `booking.something` without typing.

**Do:**

- Define (or reuse) a result type, e.g.  
  `type SelectOne = { data: BookingsRow | null; error: { message?: string } | null };`
- Assert the promise result:  
  `...(await supabase.from('bookings').select('*').eq('id', id).single()) as SelectOne`
- Then: `const booking = result.data;` and only use `booking.*` after a null check.

**Files that must follow this:** any route that fetches one booking by id or similar and then uses its fields (e.g. `update-booking-status`, `operator-reply`).

### 3.3 Bookings SELECT (many rows)

**Do not:**

- Use `const { data: rows } = await supabase.from('bookings').select(...)` and then use `rows[0].id` etc. without typing.

**Do:**

- Assert: `(rows as BookingsRow[] | null) ?? null` and assign to a variable typed as `BookingsRow[] | null`, then use elements only after length/undefined checks.

**Example:** `customer-reply` uses `(rows as BookingsRow[] | null) ?? null` for the list from `customer_email`.

### 3.4 Bookings UPDATE

**Do not:**

- Use `(booking.metadata as object || {})` when `booking` can be inferred as `never`.

**Do:**

- Use **`updateBooking(id, data)`** from `@/lib/supabaseClient` with `BookingsUpdate`.
- For metadata: `const prevMeta = booking?.metadata ?? {}` and then `updateData.metadata = { ...prevMeta, ...newStuff }`.

**Files that must follow this:** any route that updates a booking (e.g. `update-booking-status`, `operator-reply`, `customer-reply`).

### 3.5 Central typing in `@/lib`

- **`supabaseClient.ts`:**  
  - `createClient<Database>(...)`  
  - `insertBooking(data: BookingsInsert): Promise<InsertBookingResult>`  
  - `updateBooking(id, data: BookingsUpdate)`  
  - `InsertBookingResult = { data: BookingsRow | null; error: PostgrestError | null }`
- **`database.types.ts`:**  
  - `BookingsRow`, `BookingsInsert`, `BookingsUpdate`  
  - Full row type including `metadata: Record<string, any> | null`.

All booking API routes should rely on these types and helpers instead of raw Supabase chains when touching bookings.

---

## 4. Checklist for new or touched API routes

Before pushing, confirm for **every** place that touches `bookings`:

- [ ] **Insert:** Uses `insertBooking(...)` and types the result as `InsertBookingResult`; uses `result.data` / `result.error`; only uses `result.data.id` etc. after a success/null check.
- [ ] **Select one:** Uses `as SelectOne` (or equivalent) on `.single()` and only uses `data.*` after a null check.
- [ ] **Select many:** Uses `(rows as BookingsRow[] | null) ?? null` (or equivalent) and checks length before indexing.
- [ ] **Update:** Uses `updateBooking(id, updateData)` with `BookingsUpdate`; uses `booking?.metadata ?? {}` (or similar) for metadata, never `(x as object || {})` when `x` could be inferred as `never`.
- [ ] **No raw `as any`** on booking insert/update payloads; use `BookingsInsert` / `BookingsUpdate`.

---

## 5. Files updated to satisfy these rules (as of this report)

| File | Change |
|------|--------|
| `src/app/api/customer-reply/route.ts` | `InsertBookingResult` + `insertResult.data` / `insertResult.error`; `(rows as BookingsRow[] \| null)`; `updateBooking`; `booking?.metadata ?? {}`. |
| `src/app/api/update-booking-status/route.ts` | Select result `as SelectOne`; `updateBooking`; `prevMeta = booking?.metadata ?? {}`; re-fetch after update for response. |
| `src/app/api/operator-reply/route.ts` | All selects typed (SelectOne / array); `updateBooking`; `prevMeta = booking?.metadata ?? {}`. |
| `src/app/api/new-booking-request/route.ts` | Uses `insertBooking(insertPayload)` with `BookingsInsert`; no raw insert. |
| `src/app/api/vapi-webhook/route.ts` | Uses `insertBooking(insertPayload)` with `BookingsInsert`; `InsertBookingResult` and `insertResult.data` / `insertResult.error`; no raw `supabase.from('bookings').insert(...).single()`. |

---

## 6. Why this report exists

Builds were failing repeatedly, each time in a **different** route with the **same** kind of error (“Property X does not exist on type 'never'”). This report:

1. Records each failure and the exact fix.
2. States the root cause (Supabase result inferred as `never` in build).
3. Locks in **mandatory** patterns for booking insert/select/update.
4. Provides a short checklist so future changes don’t reintroduce the same bug.

**If another build fails with "Property X does not exist on type 'never'":**

- Open the failing file and line.
- If it’s a booking: apply the matching rule from §3 (insert → `insertBooking` + `InsertBookingResult`; select → `SelectOne` or array assertion; update → `updateBooking` + `prevMeta`).
- Add that file/line to §2 and the fix to §5.
- Before merging, run through the §4 checklist for all touched booking routes.
