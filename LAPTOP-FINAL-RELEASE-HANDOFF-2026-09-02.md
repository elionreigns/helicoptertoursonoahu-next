# Helicopter Tours on Oahu — Final Release Handoff

## Source of truth

- Repository: `elionreigns/helicoptertoursonoahu-next`
- Branch: `main`
- Release commit: `846c606`
- Production target: `https://booking.helicoptertoursonoahu.com`

## What this release contains

- SEO landing page: `/private-helicopter-flights-hawaii`
- Short internal redirect: `/p`
- Legacy redirect: `/private`
- Five unbranded Oahu aerial image assets in `public/images/private-helicopter-flights/`
- Exact FareHarbor private booking URLs and FareHarbor Lightframe modal classes on the private page, home, and `/bookings`
- Global FareHarbor Lightframe script in `src/app/layout.tsx`, immediately before the closing body tag
- Mobile-first private landing-page layout and mobile navigation link
- Terms page: `/terms`, with payment responsibility language kept off the sales page
- Updated default email routing: `bookings@helicoptertoursonoahu.com` for customer replies; `coralcrowntechnologies@gmail.com` for internal alerts
- Vapi reference: `docs/vapi-helicopter-booking-reference.txt`

## Vapi state verified on the PC

- Assistant: `Helicopter Tours` (`2ed16509-a321-4f09-84d8-bf1fcfe42438`)
- Published version: v3, "Private FareHarbor and Blue Hawaiian flow"
- Opening: private flight versus Blue Hawaiian shared flight
- Private route: FareHarbor links and `tinyurl.com/privatehelicopterhawaii`
- Blue Hawaiian route: `/bookings` request form, no booking promise
- Payment collection prohibited in the prompt
- Vapi webhook remains intentionally blank while Blue Hawaiian lead routing is disabled and the Supabase health issue is unresolved.

## Safety flags

- `BLUE_HAWAIIAN_LEAD_ROUTING_ENABLED` must remain `false` until the Supabase health endpoint is healthy and operator routing is intentionally enabled.
- `PAYMENT_CAPTURE_ENABLED` must remain `false`. Do not collect raw card numbers, CVC/CVV, expiry, billing address, or bank details through the app, chatbot, or Vapi.

## Verification completed on the PC

- `npm run build` passed after the release changes.
- Git push to `main` succeeded.
- Vercel received the deployment for commit `846c606`; check the Vercel dashboard for final Ready status before making any further changes.
- `bookings@helicoptertoursonoahu.com` exists and is unrestricted in cPanel.
- The main `helicoptertoursonoahu.com` mail domain shows valid SPF/DKIM in cPanel Email Deliverability.

## Laptop handling

1. Do not overwrite or extract this archive over an existing working tree.
2. Inspect its SHA-256, then extract to a new review folder.
3. Compare the laptop worktree to commit `846c606` before merging laptop-only changes.
4. Do not alter Syncthing folder configuration.
