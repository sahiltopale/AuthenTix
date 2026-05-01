# 🎟️ Authentix — Blockchain-Powered Event Ticketing

> **Developed by Sahil Topale & Co.**

Authentix is a full-stack event ticketing platform that combines a traditional database backend with on-chain NFT tickets, secure rotating QR verification, an interactive seat-map booking experience, and an AI assistant.

---

## ✨ Features

| Area | Highlights |
|---|---|
| **Events** | Browse, search, and view event details with images, dates, categories, prices |
| **Seat Selection** | Category-aware visual maps — **circular stadium** for sports, **curved theater** for concerts, **grid** for conferences |
| **Tier Pricing** | Standard (base) · **Premium +30%** · **VIP +50%** automatically computed from event base price |
| **Multi-Ticket Booking** | Buy **1 to 5 tickets** per booking with per-seat price summary |
| **Blockchain** | Optional MetaMask wallet integration mints each ticket as an **NFT on Sepolia** (`AuthentixTicket.sol`) |
| **QR Verification** | Rotating HMAC tokens (server-signed) prevent screenshot/replay attacks |
| **Auth & Roles** | Email signup + Google OAuth, separate `user_roles` table with `admin` / `user` roles |
| **Admin Dashboard** | Create / edit / delete events, view all tickets, manage availability |
| **AI Assistant** | Streaming chatbot (Lovable AI Gateway, Gemini) with conversation memory & follow-up support, accessible from the floating button, navbar, and footer |
| **Theming** | Light + dark modes, semantic design tokens, polished animations |

---

## 🧱 Tech Stack

- **Frontend:** React 18 + Vite 5 + TypeScript 5
- **Styling:** Tailwind CSS v3 + shadcn/ui + Framer Motion
- **Backend:** Lovable Cloud (Supabase) — PostgreSQL, Auth, Row-Level Security, Edge Functions
- **Blockchain:** Solidity contract on Ethereum Sepolia, ethers.js, MetaMask
- **AI:** Lovable AI Gateway (Gemini models) with Server-Sent Events streaming

---

## 🔄 Complete Booking Workflow

```
┌──────────────┐    ┌──────────────┐    ┌────────────────┐    ┌─────────────────┐
│  Browse      │ →  │  Select      │ →  │  Choose        │ →  │  Confirm        │
│  Events      │    │  Quantity    │    │  Seats (1–5)   │    │  Booking        │
└──────────────┘    │  (1–5)       │    │  on visual map │    └────────┬────────┘
                    └──────────────┘    └────────────────┘             │
                                                                       ▼
                                              ┌────────────────────────────────────────┐
                                              │  Wallet connected?                     │
                                              │  ├─ YES → Mint NFT on Sepolia (per     │
                                              │  │        ticket) → on success →       │
                                              │  └─ NO  → skip                         │
                                              └─────────────────┬──────────────────────┘
                                                                ▼
                                              ┌────────────────────────────────────────┐
                                              │  Edge function `book-ticket`           │
                                              │   • Verifies JWT                       │
                                              │   • Checks seat is not already taken   │
                                              │   • Calls SECURITY DEFINER             │
                                              │     `book_ticket()` RPC                │
                                              │   • Decrements available_seats         │
                                              │   • Stores wallet + nft_token_id       │
                                              └─────────────────┬──────────────────────┘
                                                                ▼
                                                       ┌─────────────────┐
                                                       │  My Tickets     │
                                                       │  shows QR code  │
                                                       │  (rotating HMAC)│
                                                       └─────────────────┘
```

### QR Verification Flow

1. Client requests a fresh token from `generate-qr-token` (signed JWT, short TTL).
2. QR component displays the rotating token (refreshes every ~30 s).
3. Verifier scans → calls `verify-ticket` edge function.
4. Server validates HMAC + TTL + ticket state, returns ✅ / ❌.
5. Optional: marks ticket as `is_used = true` to prevent re-entry.

---

## 🗄️ Database Schema (high level)

| Table | Purpose |
|---|---|
| `events` | Event metadata, total/available seats, base price |
| `tickets` | One row per ticket (event + user + seat + optional NFT token id) |
| `profiles` | User profile data (linked to `auth.users` by `user_id`) |
| `user_roles` | Separate roles table with enum `app_role` — used by `has_role()` |

**Security highlights**

- All tables have **Row-Level Security** enabled.
- Roles live in a dedicated `user_roles` table (never on profiles) — checked via the `SECURITY DEFINER` function `has_role(uuid, app_role)`.
- Seat availability is checked through a `SECURITY DEFINER` RPC `get_booked_seats()` so users can see *which* seats are booked without seeing *who* booked them.
- A unique index on `(event_id, seat_number)` guarantees no double-booking at the database level.

---

## 🚀 Local Development

### Prerequisites

- **Node.js 20+** and **bun** (or npm) — `curl -fsSL https://bun.sh/install | bash`
- **Git**
- **MetaMask** browser extension (only needed if you want to test on-chain minting)
- A Lovable Cloud / Supabase project (already provisioned for this app)

### Setup

```bash
# 1. Clone
git clone <your-repo-url>
cd authentix

# 2. Install dependencies
bun install        # or: npm install

# 3. Environment
# `.env` is auto-generated by Lovable Cloud and contains:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_PUBLISHABLE_KEY
#   VITE_SUPABASE_PROJECT_ID
# Do NOT edit it manually.

# 4. Run dev server
bun run dev        # or: npm run dev
# → http://localhost:5173
```

### Optional: Blockchain (Sepolia)

1. Install MetaMask and switch to **Sepolia** test network.
2. Get test ETH from <https://sepoliafaucet.com/>.
3. The contract (`src/contracts/AuthentixTicket.sol`) is already deployed; the address lives in `src/services/blockchainService.ts`. Update `CONTRACT_ADDRESS` if you redeploy.
4. To redeploy: open the contract in [Remix](https://remix.ethereum.org/), compile with Solidity 0.8.x, deploy on the Sepolia network using your MetaMask account, then paste the new address into `blockchainService.ts`.

### Running tests

```bash
bunx vitest run         # unit tests
bunx playwright test    # e2e (if configured)
```

---

## 📁 Project Structure

```
src/
├─ components/
│  ├─ chatbot/              # Modular AI assistant (streaming, quick replies, markdown)
│  ├─ ui/                   # shadcn/ui primitives
│  ├─ Navbar.tsx, Footer.tsx, ChatbotButton.tsx
│  └─ SeatLayout.tsx        # Circular / curved / grid seat maps + tier pricing
├─ contexts/
│  ├─ AuthContext.tsx       # Supabase auth + admin role
│  └─ WalletContext.tsx     # MetaMask connection + Sepolia chain check
├─ pages/                   # Events, EventDetails, MyTickets, Admin, Auth, Verify…
├─ services/blockchainService.ts   # ethers.js bridge to AuthentixTicket.sol
├─ contracts/AuthentixTicket.sol   # NFT ticket contract
└─ integrations/supabase/   # Auto-generated client + types (do not edit)

supabase/
├─ functions/
│  ├─ book-ticket/          # JWT-verified booking + seat uniqueness
│  ├─ generate-qr-token/    # Rotating HMAC tokens
│  ├─ verify-ticket/        # Validates token + marks used
│  └─ chat/                 # Streaming AI assistant via Lovable AI Gateway
└─ migrations/              # SQL migrations (read-only)
```

---

## 🤖 AI Assistant

- Floating button (bottom-right), plus quick-access buttons in the **Navbar** and **Footer**.
- Powered by Lovable AI Gateway with Gemini, streamed via Server-Sent Events.
- Maintains conversation history → understands follow-up questions naturally.
- Knows the platform's features, pricing tiers, booking flow, and that **Authentix is developed by Sahil Topale & Co.**

---

## 🛡️ Security Notes

- JWT validated server-side in every edge function.
- Roles enforced via `has_role()` SECURITY DEFINER (no client-side role checks).
- All write paths go through edge functions or RPCs — clients never touch service-role keys.
- HMAC-signed QR tokens with short TTL prevent screenshot reuse.
- Seat uniqueness enforced by a database-level unique constraint (defense in depth).

---

## 📜 License & Credits

Built with ❤️ by **Sahil Topale & Co.**

Open-source dependencies: React, Vite, Tailwind CSS, shadcn/ui, Supabase, ethers.js, react-markdown.
