# Grove

A living tree of the people in your photos. Grove looks through Google Photos, a folder, or the camera roll, grows a **branch for each person**, and makes that branch thicker and fruitier the more memories you share.

This is a Progressive Web App. On a phone it can sit on the home screen, accept a new camera shot, and — on Plus — rescan a watched folder or Google Photos picker session so the tree updates as life happens.

## What it does

- **Faces → people → branches.** Photos are scanned in the browser. Faces are clustered into people; you name them and merge duplicates.
- **Fruit follows attention.** More pictures with someone means a heavier bough and riper fruit. Pets, friends, mentors, and family all count — this is not an ancestry chart.
- **Live growth.** Camera captures land immediately. A watched folder is rescanned on an interval. Google Photos uses Google’s [Photos Picker API](https://developers.google.com/photos/picker/guides/get-started) (Google no longer grants new apps silent access to an entire library).
- **Share a grove or a single branch.** Participants open a link that shows how large they are in your life.
- **Monetization.** Free Seedling (8 people, 120 photos, watermark). Plus (unlimited, live sync, HD, seasons). Family (6 contributors, print discount). Archival prints as a one-time product.

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Grow a sample grove** to see a full tree without importing anything.

```bash
npm run build
npm start
```

## Optional keys

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google Identity + Photos Picker. Enable the Photos Picker API on a Google Cloud project. |
| `STRIPE_SECRET_KEY` | Real Checkout. Without it, Plus/Family unlock immediately for demo. |
| `STRIPE_PRICE_PLUS` / `STRIPE_PRICE_FAMILY` | Stripe Price IDs for yearly subscriptions. |
| `PRINTFUL_API_KEY` | Hook for print fulfillment. The UI is in place; ordering is stubbed until this is set. |

Photos and the grove itself stay in **IndexedDB on the device**. Share links store a compact snapshot (names, counts, a few tiny thumbs) on the server under `data/shares/`.

## Product loop

1. Plant the grove (your name at the trunk).
2. Import from Google Photos, files, camera, or a folder.
3. Name the people on each branch.
4. Leave live sync on so new pictures add fruit.
5. Share the whole tree, or send someone *their* branch.
6. Upgrade when you outgrow eight people — or order a print of the year.

## Stack

Next.js 16, React 19, Tailwind 4, IndexedDB, Canvas 2D tree, optional Google Photos Picker and Stripe Checkout.
