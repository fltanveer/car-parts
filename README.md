# PartsBD: customer site (frontend)

Frontend for the customer site described in `../carparts-01-user-plan.md`. It has no backend yet: all data comes from an in-memory catalog and a client-side store saved in `localStorage` and IndexedDB.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (the service worker is registered only here)
```

## What works

Every route in spec section 6 exists and works end to end against the mock data:

- Home, category, search (Bangla / English / Banglish, part numbers with or without hyphens, synonyms), part detail with fitment check.
- My car: pick from a list, enter a chassis number, or upload a photo of the papers. Saved locally.
- Part request by voice (real `MediaRecorder`), photo or text. Guests can send one with just a phone number. After sending, the user sees a confirmation and a status page with quotes.
- Cart and checkout. Delivery charges and payment options come from the rules in spec 8.
- Manual bKash/Nagad advance payment, order tracking, invoice and warranty card, returns and warranty claims.
- Chat with voice notes and photos, account, help, and policy pages.
- Bangla by default with an English toggle (the `lang` cookie). Bangla digits can be turned off in the account page.

### Demo data and buttons

The first load seeds a quoted request (R-10231), a shipped order and a delivered order. The delivered order includes an electrical part with warranty, so you can try the claim rules. Pages also have buttons labelled **ডেমো** that do what the admin panel will do later: send a quote, verify a payment, or move an order to the next status. **Account → ডেমো ডেটা রিসেট করুন** clears everything.

Login is simulated: any 6-digit code works.

## Structure

```
src/lib/types.ts        types that mirror the DB schema (spec section 10)
src/lib/api.ts          catalog reads (the future Supabase layer; keep these signatures)
src/lib/store.ts        data the user owns (the future server actions)
src/lib/rules.ts        business rules from spec section 8, as pure functions
src/lib/mock/           seed catalog, vehicles, settings, locations
src/lib/blobstore.ts    IndexedDB stand-in for Supabase Storage, plus the upload retry queue
src/components/         shared UI (voice recorder, part card, vehicle picker, forms, ...)
src/app/                routes
```

## Connecting a backend later

- Swap the bodies of the `src/lib/api.ts` functions for Supabase queries.
- Turn each exported action in `src/lib/store.ts` into a server action. Recompute prices, charges and payment rules on the server with `src/lib/rules.ts`.
- `blobstore.uploadWithRetry` becomes a signed upload to the private buckets. `idb:` URLs become signed URLs.
- The audio guide uses the browser's speech engine as a placeholder. Replace it with the pre-recorded files that admins upload.
