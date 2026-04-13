# 🍲 Potlock

> **When everyone brings something to the table, the pot grows.**

🏆 **Morgan Hacks Winner — Best Use of Solana**

A Solana-based group treasury where money only moves when the group agrees — governed by contracts the group writes themselves.

🔗 **Devpost:** [devpost.com/software/potlock](https://devpost.com/software/potlock)

---

## Inspiration
Managing shared money in social groups has always been a mess. Venmo and Splitwise let one person hold the bag and everyone else just hopes they're honest. We wanted to build something where the rules are formalized upfront, enforced automatically, and no single person can move money without group consensus. The idea of a trustless group treasury, governed by a contract the group writes themselves, felt like the right application of crypto where it actually solves a real problem.

## What it does
Potlock is a Solana-based group treasury where money can only move when the group agrees — and the rules are defined in a formal contract before any funds can flow. Groups create a pool, write their governing contract in plain English (Gemini AI formalizes it into a structured schema), and invite members by name and wallet address. From there, anyone can propose a transaction, which is automatically validated against the contract and sent as a non-blocking report to all members before voting. Approvals are fully group-defined (k-of-n, role-based, unanimous, tiered) and once the threshold is met on-chain, funds execute immediately and irreversibly. All contract versions are stored on-chain, so the full history is always browsable.

## How we built it
- **Solana / Anchor** for the on-chain treasury program: deposit, proposal gating, approval accumulation, and execution at threshold
- **Convex** as the off-chain database for full contract JSON per version, transaction metadata, and member identity
- **Google Gemini** to formalize natural language rules into structured contract JSON, assist amendments, and validate transactions against the contract
- **React + Tailwind + shadcn/ui** for the frontend, with **Tiptap** as the rich text contract editor
- **Phantom wallet adapter** for Solana wallet integration

## Challenges we ran into
- Designing approval logic that's fully group-defined (any structure) while still being evaluable on-chain and in Convex
- Handling the amendment lifecycle correctly — unanimous approval by default, restarting the approval process on any amendment
- Getting Gemini to reliably produce structured contract JSON from wildly varied natural language input

## Accomplishments that we're proud of
- A fully functional on-chain treasury that actually enforces group rules
- The AI-assisted contract editor: write in plain English, get a structured contract back, amend it with a sentence
- The complete transaction lifecycle: propose → validate → Gemini report → approve/reject → execute (irrevocable on-chain)
- On-chain contract versioning, making the entire history auditable

## What we learned
- Solana's execution model (immediate, irrevocable at threshold) is incredibly useful for decentralized financial applications
- Combining on-chain enforcement with off-chain storage is a powerful pattern
- Defining "fully group-defined approval logic" is hard — you need a schema flexible enough to express any structure but deterministic enough to evaluate

## What's next for Potlock
- Token support beyond SOL (USDC, SPL tokens)
- Mobile app with push notifications for approvals
- Recurring transactions and scheduled payouts defined in the contract
- Public pool discovery so clubs and orgs can share their governance templates
- Integration with Realms or other DAO tooling for larger organizations
- Analytics dashboard: spending by category, approval velocity, member participation rates
