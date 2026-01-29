# SEO Summary – Booking & Main Site

## What Was Added

### booking.helicoptertoursonoahu.com (Next.js app)

- **Meta:** Stronger title and description with “helicopter tours on oahu” and related terms; `keywords`, `authors`, `creator`; `metadataBase` and `alternates.canonical`.
- **Open Graph & Twitter:** Full OG/Twitter meta (title, description, image, url) so shares look correct.
- **JSON-LD (schema.org):**
  - **Organization** – name, url, logo, telephone, contactPoint (booking, hours, areaServed).
  - **WebSite** – name, url, description, publisher, `ReserveAction` pointing to `/bookings`.
  - **TouristAttraction** – name, description, telephone, address, areaServed (Oahu, Maui, Kauai, Big Island), image.
- **Sitemap:** `/sitemap.xml` lists home, `/bookings`, `/bookings/success` with priorities and change frequencies.
- **Robots:** `/robots.txt` allows crawling; disallows `/admin/` and `/api/`; references sitemap.
- **Page-level:** Home and `/bookings` have their own title/description/canonical; H1s use “Helicopter Tours on Oahu” / “Oahu Helicopter Tour”.

### www.helicoptertoursonoahu.com (public_html/index.php)

- **Title:** “Helicopter Tours on Oahu | Oahu Helicopter Tours | Blue Hawaiian & Rainbow | Book Now”.
- **Meta description:** Longer, keyword-rich (under ~160 chars), includes “helicopter tours on oahu” and phone.
- **Canonical:** `https://www.helicoptertoursonoahu.com/`.
- **Robots:** `index, follow`.
- **Open Graph & Twitter Card:** Full set (og:type, url, title, description, image, twitter:card, etc.).
- **Schema.org JSON-LD:**
  - **Organization** – name, url, logo, telephone, contactPoint (booking, hours, areaServed).
  - **WebSite** – name, url, description, publisher, `ReserveAction` to booking subdomain.
  - **TouristAttraction** – name, description, telephone, image, address, areaServed (Oahu, Maui, Kauai, Big Island).

## Next Steps (You)

1. **Google Search Console:** Add both properties (www.helicoptertoursonoahu.com and booking.helicoptertoursonoahu.com), verify ownership, submit sitemaps (`/sitemap.xml` for booking site; create one for main site if you have many URLs).
2. **Bing Webmaster Tools:** Add and verify both sites; submit sitemaps.
3. **Main site sitemap:** If the main site has more than a few pages, add a sitemap (e.g. `sitemap.xml`) and link it in GSC/Bing.
4. **Backlinks & content:** SEO takes time. Build links from local/Hawaii and travel sites; add more text (e.g. “Why choose helicopter tours on Oahu”, FAQs) so Google has more to match queries.
5. **Image:** Confirm `https://www.helicoptertoursonoahu.com/images/helicoptertours-bluehawaiian.webp` exists and is a good share image (e.g. 1200×630). If not, replace with a real image URL in meta and schema.

## Files Touched

- **Booking app:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/bookings/page.tsx`, `src/components/JsonLd.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- **Main site:** `public_html/public_html/index.php` (head: meta, canonical, OG, Twitter, 3× JSON-LD scripts)
