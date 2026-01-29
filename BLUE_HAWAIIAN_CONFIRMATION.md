# Blue Hawaiian Helicopters – Confirmation System & Flow

This doc describes the **Blue Hawaiian Helicopters** booking flow end-to-end and **addresses per island** for check-in. Use **BLUE_HAWAIIAN_EMAILS.md** for the exact email copy.

---

## Flow Summary

1. **Customer books** (form/chatbot/phone) → we send **confirmation email** (they get it; we get our copy). We do **not** email Blue Hawaiian yet.
2. **We scrape FareHarbor** for the tour/date and get **closest available times** (near their preferred window or next best).
3. **First follow-up (only after scrape):** We send the customer **one email** on top of the initial confirmation that:
   - Lists the **available times** we found (closest to what they picked).
   - Asks them to **pick one time** and reply.
   - Asks for **payment information and any missing booking info** if they haven’t already provided it (name, party size, weight, etc.). If we have it all, we say so.
4. **When the customer replies** with chosen time + payment/missing info → we send **Blue Hawaiian** the full client information (name, email, phone, party size, date, tour, weight, payment if provided, confirmed time).
5. **When Blue Hawaiian responds** “It’s a go” (or confirms) → we send the **final confirmation** to the customer with: time, where to go, parking, what to bring / what not to bring, when to arrive, and check-in process (see addresses below by island).

---

## Step-by-Step (Blue Hawaiian)

| Step | Who | Action |
|------|-----|--------|
| 1 | Customer | Submits booking. |
| 2 | App | Sends **confirmation email** to customer (and we get our copy). Does **not** email Blue Hawaiian. |
| 3 | App | **Scrapes FareHarbor** for that tour/date → gets closest available times. |
| 4 | App | Sends **first follow-up** to customer: available times + “pick one” + ask for payment and any missing info if needed. |
| 5 | Customer | Replies with chosen time (and payment/missing info if not already sent). |
| 6 | App | Sends **full booking** to Blue Hawaiian (all client info + confirmed time + payment if we have it). |
| 7 | Blue Hawaiian | Confirms to us (e.g. “It’s a go”). |
| 8 | App | Sends **final confirmation** to customer: time, where to go (address for correct island), parking, what to bring, when to arrive, check-in. |

---

## Blue Hawaiian – Addresses & Check-In by Island

Use these in the **final confirmation email** so the customer knows where to go. Source: Blue Hawaiian website / contact; confirm on [bluehawaiian.com](https://www.bluehawaiian.com/en/contact) before sending.

### Oahu

| Location | Address | Phone | Notes |
|----------|---------|--------|--------|
| **Honolulu Heliport** | 99 Kaulele Pl, Honolulu, HI 96819 | (808) 831-8800 | Main Oahu check-in. |
| **Turtle Bay Resort Heliport** | 57-091 Kamehameha Hwy, Kahuku, HI 96731 | (808) 831-8800 | North Shore departures. |

**Parking:** Contact Honolulu Heliport or Blue Hawaiian for current parking instructions.  
**Hours:** 7:00 AM – 7:00 PM Hawaii Standard Time. Reservations: 1-800-745-2583.

---

### Maui

| Location | Address | Phone |
|----------|---------|--------|
| **Kahului Heliport** | 1 Lelepio Pl, Kahului, HI 96732 | (808) 871-8844 |

**Reservations:** 1-800-745-2583.

---

### Kauai

| Location | Address | Phone |
|----------|---------|--------|
| **Lihue Heliport** | 3730 Ahukini Rd, Lihue Heliport #8, Lihue, HI 96766 | (808) 245-5800 |
| **Princeville Heliport** | 5-3541 Kuhio Hwy, Kilauea, HI 96754 | (808) 245-5800 |

---

### Big Island

| Location | Address | Phone |
|----------|---------|--------|
| **Hilo Heliport** | 2650 Kekuanaoa St, Hilo, HI 96720 | (808) 961-5600 |
| **Waikoloa Heliport** | 68-690 Waikoloa Rd, Waikoloa Village, HI 96738 | (808) 886-1768 |

---

### Lanai

*(Check Blue Hawaiian website for current Lanai departure address; may be from Maui or dedicated Lanai location.)*

---

## Check-In Process & What to Bring (Blue Hawaiian)

- **When to arrive:** Plan to arrive early. Allow about **75 minutes total** (including check-in, safety video, and flight).  
- **Check-in includes:** Weight confirmation (required for safety), **7-minute FAA-required safety video**, pilot Q&A, seating orientation.  
- **What to bring:** Cell phone (airplane mode), camera, small plastic water bottle only.  
- **What NOT to bring:** Loose items (hats, purses, backpacks). Lockers are available for personal items.  
- **What to wear:** **Dark clothing** to reduce glare on helicopter windows (better for photos and visibility).  
- **Cancellation:** Full refund if cancelled 24+ hours before; call 1-800-745-2583 (7 AM–7 PM HST). No-shows or cancellations within 24 hours charged full amount.

*(Exact wording for the final confirmation email is in **BLUE_HAWAIIAN_EMAILS.md**.)*

---

## API / Code References

- **New booking:** `POST /api/new-booking-request` → sends confirmation; does **not** email Blue Hawaiian; triggers `check-availability-and-followup`.  
- **Availability + follow-up:** `POST /api/check-availability-and-followup` → scrapes FareHarbor (Browserbase), then sends follow-up with times + “pick one” + ask for payment/missing info (see BLUE_HAWAIIAN_EMAILS.md).  
- **Customer reply (time + payment):** `POST /api/customer-reply` → when customer confirms time (and has sent payment/missing info), we send full booking to Blue Hawaiian.  
- **Operator reply (Blue Hawaiian “it’s a go”):** `POST /api/operator-reply` → when Blue Hawaiian confirms, we send final confirmation email to customer with address for correct island and check-in info from this doc.

---

*Last updated: 2026-01-28. Addresses from Blue Hawaiian contact/website; confirm at [bluehawaiian.com](https://www.bluehawaiian.com/en/contact) before sending to customers.*
