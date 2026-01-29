# Rainbow Helicopters – Confirmation System & Flow

This doc describes the **Rainbow Helicopters** booking flow end-to-end and where to go for each island. Use **RAINBOW_EMAILS.md** for the exact email copy used in this process.

---

## Flow Summary

1. **Customer books** (form/chatbot/phone) → we send **confirmation email** (they get it; we get our copy).
2. **First follow-up (right after confirmation):** We message the customer in **one email** that:
   - We are communicating with Rainbow Helicopters to get available times closest to what they picked.
   - We ask for **all payment information and any missing booking info** (name, party size, weight, hotel, etc.). If they already gave it all, we say “We have your details; no need to send again.” If they didn’t give payment or other required info, we ask them to send it now so we can relay everything to Rainbow in one go.
3. **When the customer responds** with payment + any missing info → we message **Rainbow** with full client information (name, email, phone, party size, date, tour, weight, payment if provided, etc.).
4. **When Rainbow replies** with available times → we email the **customer** with those times and ask them to confirm which time works.
5. **When the customer confirms** (e.g. “2pm works”) → we confirm with **Rainbow** (full booking + confirmed time). When **Rainbow confirms** with us (e.g. “It’s a go”) → we send the **final confirmation** to the customer with: where to park, what to bring / what not to bring, when to be there, how early to arrive, and the check-in process (see addresses and check-in section below).

---

## Step-by-Step (Rainbow)

| Step | Who | Action |
|------|-----|--------|
| 1 | Customer | Submits booking (form/chatbot/phone). |
| 2 | App | Sends **confirmation email** to customer (and we get our copy). |
| 3 | App | Sends **first follow-up** to customer: “We’re communicating with Rainbow for times closest to your pick” + **ask for payment and any missing info** (if already complete, say so). |
| 4 | Customer | Replies with payment info and any missing details. |
| 5 | App | Sends **full booking** to Rainbow (all client info + confirmed time when we have it, or “awaiting time confirmation” and relay time in next step). |
| 6 | Rainbow | Replies to us with available times. |
| 7 | App | Emails **customer** with those times; ask them to pick one and confirm. |
| 8 | Customer | Replies with chosen time (e.g. “2pm”). |
| 9 | App | Sends **full booking + confirmed time** to Rainbow (if not already sent). |
| 10 | Rainbow | Confirms to us (e.g. “It’s a go”). |
| 11 | App | Sends **final confirmation** to customer: time, where to go, parking, what to bring, when to arrive, check-in process (see addresses below). |

---

## Rainbow Helicopters – Addresses & Check-In by Island

Use these for the **final confirmation email** (where to go, parking, check-in).

### Oahu

- **Check-in address:** 155 Kapalulu Pl, Ste. 197, Honolulu, HI 96819  
- **Location:** Honolulu International Airport (Castle & Cooke Aviation building).  
- **Parking:** Left-hand side lot; check-in at large glass doors at main entrance.  
- **Reference:** [Rainbow Helicopters – Oahu](https://rainbowhelicopters.com/)

### Big Island

- **Check-in address:** 73-4370 Pao'o St, Kailua-Kona, HI 96740  
- **Location:** Kona only (no Hilo check-in).  
- **Reference:** [Rainbow Helicopters – Big Island](https://rainbowhelicopters.com/big-island-helicopter-tours/)

---

## Check-In Process & What to Bring (Rainbow)

- **When to arrive:** Arrive at the time given in your confirmation (typically 15–30 minutes before flight).  
- **What to wear:** Comfortable, loose-fitting clothing; long pants; closed-toe flat shoes (e.g. sneakers).  
- **What to bring:** Sunglasses, hat, sunscreen (apply before flight), camera.  
- **Parking:** Use the lot indicated for your location (Oahu: left-hand side lot at Castle & Cooke Aviation).  
- **Check-in:** Go to the main entrance (Oahu: large glass doors); have your confirmation and ID ready.

*(For the exact wording in the final confirmation email, use the templates in **RAINBOW_EMAILS.md**.)*

---

## API / Code References

- **New booking:** `POST /api/new-booking-request` → sends confirmation; for Rainbow, sends availability inquiry to Rainbow; triggers `check-availability-and-followup`.  
- **First follow-up:** `POST /api/check-availability-and-followup` → for Rainbow, sends follow-up that says “we’re in contact with Rainbow” and **should also ask for payment and any missing info** (see RAINBOW_EMAILS.md).  
- **Customer reply (time + payment):** `POST /api/customer-reply` → when customer confirms time and has sent payment/missing info, we send full booking to Rainbow.  
- **Operator reply (Rainbow times):** `POST /api/operator-reply` → when Rainbow sends times, we email customer to pick one.  
- **Final confirmation:** When Rainbow confirms “it’s a go,” operator-reply (or related flow) sends the final confirmation email to the customer using the copy and addresses in **RAINBOW_EMAILS.md** and this doc.

---

*Last updated: 2026-01-28. Addresses/check-in from Rainbow Helicopters website; confirm on their site before sending to customers.*
