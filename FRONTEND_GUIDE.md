# Event Ticketing Frontend — Quickstart

## Setup

```bash
unzip event-ticketing-frontend.zip && cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

Edit `.env` to point `VITE_API_URL` at your backend (defaults to `http://localhost:5000`, which matches the backend's default port).

## What's different from the original spec

Per your request, there's **no separate `/register` page**. The landing page (`/`) contains the countdown timer, pricing cards, and the full registration form all in one scroll — clicking "Book Tickets" smooth-scrolls down to the form instead of navigating away. Everything else (payment, thank-you, retrieve ticket, admin) is unchanged from the original routing plan.

## Routes

| Route | Page |
|---|---|
| `/` | Landing page — hero, countdown, pricing, embedded registration form |
| `/payment` | Razorpay checkout (auto-mocks if no Razorpay key set) |
| `/thank-you?orderId=...` | All ticket QR codes + download |
| `/retrieve-ticket` | Resend tickets by email |
| `/admin` | PIN login |
| `/admin/scan` | Camera QR scanner + manual entry + live stats |

## Design

Dark "event night" theme: ink background, coral/amber accents, condensed Anton display type for headlines, Inter for body text, JetBrains Mono for ticket IDs and data. The countdown timer is the signature hero element — flip-clock style digits.

## Notes

- `VITE_ADMIN_PIN` is optional client-side gating for the scanner UI; the real security is the `VITE_ADMIN_TOKEN` bearer token sent with every admin API call, which must match `ADMIN_SECRET_TOKEN` in the backend `.env`.
- The registration form auto-saves to `localStorage` (`event_form_draft`) and restores on reload, clearing only after successful payment — matches the original spec.
- Razorpay checkout auto-detects dev mode: if `VITE_RAZORPAY_KEY_ID` is empty, payment is simulated by calling `/api/verify-payment` with `mock: true`, matching the backend's mock mode.
