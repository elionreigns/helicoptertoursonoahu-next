# Blue Hawaiian Helicopters – Email Templates

Use these templates for the Blue Hawaiian confirmation process. Replace placeholders (e.g. `{{customerName}}`, `{{refCode}}`) in code. See **BLUE_HAWAIIAN_CONFIRMATION.md** for the flow and **addresses by island** (use the correct island block in the final confirmation).

---

## 1. First Follow-Up (after we scrape FareHarbor)

**When:** Only after we have scraped FareHarbor and have **available times** (or a “checking live availability” message). This email is **on top of** the initial booking confirmation.

**Subject:** `Available Tour Times for {{refCode}} – Choose Your Time`

**Body (plain text; adapt for HTML):**

```
Dear {{customerName}},

Great news! We've checked availability for your {{tourName}} tour with Blue Hawaiian Helicopters on {{formattedDate}}.

**Available times near your preferred window:**

{{list of slots, e.g.}}
1. 9:00 AM – $XXX per person (Total: $XXX for X guests)
2. 11:30 AM – $XXX per person (Total: $XXX for X guests)
3. 2:00 PM – $XXX per person (Total: $XXX for X guests)
{{/list}}

**What we need from you:**

1. Reply to this email with your **preferred time** (e.g. "11:30 AM" or "2pm works").
2. If you haven't already sent your **payment information**, please send it now (card name, number, expiry, CVC, billing address) so we can confirm your booking with Blue Hawaiian. You can also call us at {{phone}} to provide payment over the phone.
3. If we're missing any details (party size, total weight, hotel, special requests), please send those too.

Once you pick a time and we have your payment (or you call us), we'll confirm with Blue Hawaiian and get you locked in.

**Total price:** ${{totalPrice}} for {{partySize}} guest(s).

Reply or call us at {{phone}} with your chosen time and any missing info.

Best regards,
Helicopter Tours on Oahu

Reference Code: {{refCode}}
```

**If scrape didn’t return times yet (fallback):**

```
We're checking live availability for your preferred date ({{formattedDate}}) and will contact you shortly with available time slots. You can also call us at {{phone}} to discuss times.

In the meantime, if you haven't already sent your payment information or any missing booking details (party size, weight, hotel), please send them now so we're ready to confirm as soon as we have times.
```

---

## 2. Final Confirmation (when Blue Hawaiian says “It’s a go”)

**Subject:** `{{refCode}} – You're Confirmed! Blue Hawaiian Helicopter Tour – Where to Go & What to Know`

**Body:** Use the correct **island block** below based on the booking (Oahu, Maui, Kauai, Big Island).

```
Dear {{customerName}},

You're all set! Blue Hawaiian Helicopters has confirmed your tour.

**Your tour**
• Tour: {{tourName}}
• Date: {{formattedDate}}
• Time: {{confirmedTime}}
• Reference: {{refCode}}

**Where to go (check-in address)**

[OAHU]
Oahu – Honolulu Heliport
99 Kaulele Pl, Honolulu, HI 96819
Phone: (808) 831-8800

Or if your tour departs from North Shore:
Turtle Bay Resort Heliport
57-091 Kamehameha Hwy, Kahuku, HI 96731
[/OAHU]

[MAUI]
Maui – Kahului Heliport
1 Lelepio Pl, Kahului, HI 96732
Phone: (808) 871-8844
[/MAUI]

[KAUAI]
Kauai – Lihue Heliport
3730 Ahukini Rd, Lihue Heliport #8, Lihue, HI 96766
Phone: (808) 245-5800

Or Princeville:
5-3541 Kuhio Hwy, Kilauea, HI 96754
[/KAUAI]

[BIG ISLAND]
Big Island – Hilo Heliport
2650 Kekuanaoa St, Hilo, HI 96720
Phone: (808) 961-5600

Or Waikoloa:
68-690 Waikoloa Rd, Waikoloa Village, HI 96738
Phone: (808) 886-1768
[/BIG ISLAND]

**When to arrive**
Plan to arrive early. Allow about 75 minutes total (check-in, 7-minute FAA safety video, pilot briefing, and flight). Business hours: 7:00 AM – 7:00 PM Hawaii Standard Time.

**What to bring**
• Cell phone (airplane mode), camera, small plastic water bottle only.

**What NOT to bring**
• Loose items (hats, purses, backpacks). Lockers are available at check-in.

**What to wear**
• Dark clothing to reduce glare on the windows (better for photos and views).

**Cancellation**
Full refund if you cancel 24+ hours before your tour. Call 1-800-745-2583 (7 AM–7 PM HST). No-shows or cancellations within 24 hours are charged the full amount.

If you have any questions, reply to this email or call us at {{phone}}.

Have an amazing flight!

Helicopter Tours on Oahu

Reference Code: {{refCode}}
```

---

## Placeholders

| Placeholder | Example / source |
|-------------|-------------------|
| `{{customerName}}` | Booking customer_name |
| `{{refCode}}` | Booking ref_code |
| `{{tourName}}` | Booking tour name |
| `{{formattedDate}}` | preferred_date formatted |
| `{{confirmedTime}}` | Time confirmed with Blue Hawaiian |
| `{{list of slots}}` | From FareHarbor scrape (time + price per person + total) |
| `{{totalPrice}}` | Total for party |
| `{{partySize}}` | Party size |
| `{{phone}}` | (707) 381-2583 or VAPI_PHONE_NUMBER |

**Island:** Use booking’s tour island or metadata to pick Oahu / Maui / Kauai / Big Island block in the final confirmation.

---

*Use these templates in the app (e.g. sendAvailabilityFollowUp for Blue Hawaiian, operator-reply final confirmation) so the process matches BLUE_HAWAIIAN_CONFIRMATION.md.*
