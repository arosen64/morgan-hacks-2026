## 1. Price Hook

- [x] 1.1 Create `src/hooks/useSolPrice.ts` — fetches SOL/USD from CoinGecko, caches result in a module variable, refreshes every 60 seconds, returns `number | null`

## 2. SolAmount Component

- [x] 2.1 Create `src/components/SolAmount.tsx` — accepts `lamports?: number` and `sol?: number` props; renders `X.XXXX SOL ($Y.YY)` using `useSolPrice`; USD portion styled with `text-muted-foreground text-sm`; falls back to SOL-only when price is null

## 3. Update Display Sites

- [x] 3.1 Update `PoolDashboard.tsx` — replace treasury balance and member contribution SOL strings with `<SolAmount>`
- [x] 3.2 Update `AllTransactionsPage.tsx` — replace all `(proposal.amount / 1e9).toFixed(4) SOL` occurrences with `<SolAmount lamports={proposal.amount}>`
- [x] 3.3 Update `WalletGate.tsx` — replace `balance.toFixed(4) SOL` with `<SolAmount sol={balance}>`
- [x] 3.4 Update `AddMoneyModal.tsx` — replace wallet balance display with `<SolAmount sol={walletBalance}>`
- [x] 3.5 Update `RequestTransactionModal.tsx` — replace treasury balance display with `<SolAmount sol={treasuryBalanceSol}`
- [x] 3.6 Update `ProposalVoting.tsx` — replace `(proposal.amount / 1e9).toFixed(4) SOL` with `<SolAmount lamports={proposal.amount}>`
