## Why

Users currently see all monetary values in SOL (e.g. "0.2500 SOL"), which is opaque to anyone unfamiliar with crypto prices. Showing the USD equivalent inline gives members an immediate real-world sense of how much money is involved without needing to look up the exchange rate themselves.

## What Changes

- Fetch the live SOL/USD price from a public API (CoinGecko or similar) and cache it client-side.
- Wherever the UI currently renders a SOL amount, append the USD equivalent in a secondary style — e.g. `0.2500 SOL ($45.00)`.
- Locations affected: pot treasury balance, member contribution totals, transaction request amounts, wallet balance in the header, and the add-money/deposit flow.
- A shared `useSolPrice` hook provides the live price; a shared `SolAmount` component handles display formatting.

## Capabilities

### New Capabilities

- `sol-usd-display`: Shared hook and component for converting and displaying SOL amounts with their live USD equivalent.

### Modified Capabilities

<!-- No existing spec-level requirements are changing. -->

## Impact

- **New files**: `src/hooks/useSolPrice.ts`, `src/components/SolAmount.tsx`
- **Modified components**: `PoolDashboard`, `AllTransactionsPage`, `WalletGate`, `AddMoneyModal`, `RequestTransactionModal`, `ProposalVoting`
- **External dependency**: public price API (CoinGecko `/simple/price` — no API key required for low-frequency polling)
- **Styling**: Tailwind + shadcn conventions throughout
