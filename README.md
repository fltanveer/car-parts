# GaariHub: frontends (customer, seller, admin)

Frontend for the v2 multi-vendor marketplace described in:

- `carparts-v2-00-foundation.md`: model, rules and database
- `carparts-v2-01-user-plan.md`: customer app (`/`)
- `carparts-v2-02-vendor-plan.md`: seller panel (`/seller`)
- `carparts-v2-03-admin-plan.md`: admin panel (`/admin`)
- `carparts-v2-04-parts-taxonomy.md`: categories, attributes and upload rules

There is no backend yet. All three panels read and write one mock database, which is saved in `localStorage` (uploaded photos and voice notes go to IndexedDB). An action in one panel shows up in the others. For example, if you open the customer app and the seller panel in two tabs, a quote the seller sends appears on the customer's comparison screen.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production build (the service worker is registered only here)
```

- Customer app: `/`
- Seller panel: `/seller` (you are logged in as the demo shop "রহমান মোটরস")
- Admin panel: `/admin` (you are logged in as super admin; switch staff from the top bar)

Use the grid button in any header to switch panels, change language, or reset the demo data.

### Demo data

- Customer login: phone `01711000000`, and any 6-digit code works.
- Request `R-10231` already has 4 quotes. One of them is suspiciously cheap and comes from a suspended seller.
- There is one order waiting for the seller to accept, one ready for pickup, one delivered, and one disputed claim.
- The admin queues (request desk, verification, moderation, payments, WhatsApp intake) each have items in them.

## Structure

```
src/lib/types.ts         types that mirror the DB schema (file 00 section 12)
src/lib/db/seed.ts       DB shape + demo seed
src/lib/db/store.ts      localStorage store: useDb(selector), update(), resetDemo()
src/lib/db/actions.ts    cross-panel actions (future server actions)
src/lib/db/queries.ts    pure read helpers
src/lib/rules.ts         business rules (10% advance cap, delivery per parcel, escrow, quote score, claims)
src/lib/labels.ts        bn/en labels and status colours for every enum
src/lib/mock/            vehicles, taxonomy, catalog, settings
src/components/ui        primitives (buttons, cards, tabs, status pills, sheet)
src/components/shared    badges, vehicle/category/position pickers, number pad, help call
src/components/layout    the three shells + audio guide
src/components/{customer,seller,admin}   screens for each panel
src/app/(customer)       customer routes
src/app/seller           seller routes
src/app/admin            admin routes
```

### Design rules

Every screen follows the 12 ease-of-use rules in file 00, section 2:

- One main button per screen.
- 🔊 to listen and 🎤 to speak wherever possible.
- "Call us" is always one tap away.
- Bangla is the default language, and digits can be shown in Bangla.
- Colours always mean the same thing: green = OK, yellow = waiting, red = problem.

The brand colour is teal, so it never looks like a status colour.

## Connecting a backend later

- Replace `src/lib/db/store.ts` with Supabase queries and Realtime subscriptions. Keep the `useDb` selectors.
- Turn each function in `src/lib/db/actions*.ts` into a server action. Run `src/lib/rules.ts` again on the server.
- `idb:` media URLs become signed Storage URLs. The 🔊 speech engine becomes the pre-recorded audio files that admins upload.
