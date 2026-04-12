## Context

The app currently renders all monetary values as raw SOL figures (e.g. `0.2500 SOL`). SOL is a volatile asset, so users have no sense of real-world value without mentally computing an exchange rate. Issue #59 asks us to show a USD equivalent next to every SOL amount in the UI.

The UI is a React + Vite app styled with Tailwind/shadcn. There is no backend price service — the frontend fetches directly from a public API.

## Goals / Non-Goals

**Goals:**

- Show the live USD equivalent alongside every SOL amount the user sees
- Keep the implementation self-contained (one hook, one display component)
- Gracefully degrade when the price is unavailable (show SOL-only)
- Use Tailwind + shadcn conventions for all visual changes

**Non-Goals:**

- Storing or auditing historical exchange rates
- Supporting currencies other than USD
- Adding a Convex backend function for price fetching (unnecessary for this read-only display concern)

## Decisions

### 1 — Fetch price client-side via `useSolPrice` hook

**Choice**: A React hook (`src/hooks/useSolPrice.ts`) fetches `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd` on mount, caches the result in module-level state (shared across hook instances via a simple module variable), and refreshes every 60 seconds.

**Why**: No API key is required for CoinGecko's free tier at this polling cadence. A module-level cache means the request fires once regardless of how many components use the hook. A Convex action was considered but adds unnecessary latency and infrastructure for a simple read operation.

**Alternatives considered**:

- Binance public REST API — works but less standard; CoinGecko is more commonly used in the Solana ecosystem.
- SWR/React Query — would work but introduces a new library dependency for a single use-case.

### 2 — Shared `SolAmount` display component

**Choice**: A `SolAmount` component (`src/components/SolAmount.tsx`) accepts `lamports: number` (or `sol: number`) and renders the primary SOL figure with the USD equivalent beneath or inline in a muted style.

**Why**: Centralising formatting logic avoids inconsistency — currently some components use `(value / 1e9).toFixed(4)` and others use `LAMPORTS_PER_SOL`. A single component is the right abstraction and makes future changes (decimal precision, currency toggle) a one-line edit.

### 3 — Display format

`0.2500 SOL ($45.00)` on the same line. The USD part uses `text-muted-foreground text-sm` so it's readable but clearly secondary.

For large balance displays (e.g. treasury card), place USD on a second line for breathing room.

## Risks / Trade-offs

- **CoinGecko rate limiting** → Mitigation: 60-second polling interval plus module-level caching ensures at most 1 request/minute across the whole app; well within the free-tier limit.
- **Stale price during rapid SOL movement** → Mitigation: Acceptable for this use-case (informational display only); no financial transactions are priced off this figure.
- **Price unavailable (API down / network error)** → Mitigation: `useSolPrice` returns `null` when the fetch fails; `SolAmount` renders only the SOL figure when `solPriceUsd` is null, preserving the existing UX.
