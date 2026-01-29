# Rainbow Helicopters – Email Templates

Use these templates for the Rainbow confirmation process. Replace placeholders (e.g. `{{customerName}}`, `{{refCode}}`) in code or when sending manually. See **RAINBOW_CONFIRMATION.md** for the flow.

---

## 1. First Follow-Up (after confirmation email)

**When:** Right after we send the booking confirmation. One email that (a) says we’re communicating with Rainbow for times closest to their pick, and (b) asks for payment and any missing info.

**Subject:** `Available Tour Times for {{refCode}} – We're Contacting Rainbow & Need Your Details`

**Body (use for plain text; adapt for HTML):**

```
Dear {{customerName}},

Thank you for booking with Helicopter Tours on Oahu! We've received your request for {{tourName}} with Rainbow Helicopters on {{formattedDate}}.

We're now in contact with Rainbow Helicopters to get available times closest to your preferred date. We'll email you as soon as we have options.

**We need a few details from you so we can send everything to Rainbow in one go:**

• If you haven't already, please send us your **payment information** (card name, number, expiry, CVC, billing address). We'll pass it securely to Rainbow once your time is confirmed. For security, you can also call us at {{phone}} to provide payment over the phone.
• If any of the following were missing from your booking, please send them now: full name, party size, total weight (all guests combined), hotel or pickup location, and any special requests or doors-off preference.

If we already have everything from your booking, you're all set — we'll just need you to confirm your preferred time once Rainbow sends us their available slots.

Reply to this email with your payment info and any missing details, or call us at {{phone}}.

Best regards,
Helicopter Tours on Oahu

Reference Code: {{refCode}}
```

---

## 2. When Rainbow Sends Us Available Times (email to customer)

**Subject:** `{{refCode}} – Rainbow Has Times for You – Pick One & Confirm`

**Body:**

```
Dear {{customerName}},

Rainbow Helicopters has provided the following available times for your tour on {{formattedDate}}:

{{list of times, e.g. "• 9:00 AM\n• 11:30 AM\n• 2:00 PM"}}

Please reply to this email with which time works best for you (e.g. "2pm works" or "I'll take 11:30 AM"). If you haven't already sent your payment information, please include it in your reply or call us at {{phone}} so we can confirm your booking with Rainbow.

Once you confirm your time, we'll notify Rainbow and get your tour locked in.

Best regards,
Helicopter Tours on Oahu

Reference Code: {{refCode}}
```

---

## 3. Final Confirmation (when Rainbow says “It’s a go”)

**Subject:** `{{refCode}} – You're Confirmed! Rainbow Helicopter Tour – Where to Go & What to Know`

**Body:**

```
Dear {{customerName}},

You're all set! Rainbow Helicopters has confirmed your tour.

**Your tour**
• Tour: {{tourName}}
• Date: {{formattedDate}}
• Time: {{confirmedTime}}
• Reference: {{refCode}}

**Where to go (check-in address)**

{{#if islandOahu}}
Oahu – Honolulu
155 Kapalulu Pl, Ste. 197, Honolulu, HI 96819
(Honolulu International Airport – Castle & Cooke Aviation building. Parking: left-hand side lot. Check-in at the large glass doors at the main entrance.)
{{/if}}

{{#if islandBigIsland}}
Big Island – Kona
73-4370 Pao'o St, Kailua-Kona, HI 96740
(Check-in at the address above. Kona location only.)
{{/if}}

**When to arrive**
Please arrive 15–30 minutes before your scheduled flight time. Have your confirmation and ID ready.

**What to bring**
• Comfortable, loose-fitting clothing and long pants
• Closed-toe flat shoes (e.g. sneakers)
• Sunglasses, hat, sunscreen (apply before flight)
• Camera

**What not to bring**
• Loose items that could fall (store in car or as directed at check-in)

**Parking**
Use the lot indicated for your location (Oahu: left-hand side lot at Castle & Cooke Aviation).

If you have any questions, reply to this email or call us at {{phone}}.

Have an amazing flight!

Helicopter Tours on Oahu

Reference Code: {{refCode}}
```

*(In code, use island from booking to pick Oahu vs Big Island block.)*

---

## Placeholders

| Placeholder | Example / source |
|-------------|-------------------|
| `{{customerName}}` | Booking customer_name |
| `{{refCode}}` | Booking ref_code |
| `{{tourName}}` | Booking tour name |
| `{{formattedDate}}` | preferred_date formatted (e.g. Saturday, January 30, 2026) |
| `{{confirmedTime}}` | Time confirmed with Rainbow |
| `{{phone}}` | (707) 381-2583 or VAPI_PHONE_NUMBER |
| `{{list of times}}` | From Rainbow’s reply (operator-reply) |
| `{{islandOahu}}` / `{{islandBigIsland}}` | From booking (tour island or operator location) |

---

*Use these templates in the app (e.g. operator-reply final confirmation, check-availability-and-followup for Rainbow first follow-up) so the process matches RAINBOW_CONFIRMATION.md.*
