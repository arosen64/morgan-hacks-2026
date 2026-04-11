# Product Requirements Document: Morgan Hacks 2026

## Problem Statement

Managing shared finances in social groups (roommates, fraternities, clubs) is painful and trust-dependent. Venmo/Splitwise don't enforce consensus — one person holds the funds and everyone else just hopes. We want a trustless, on-chain group treasury where money can only leave when the group agrees, governed by a single formalized contract that defines the rules of the account.

## Target Users

- Roommates splitting apartment expenses
- Fraternities / sororities managing chapter funds
- Friend groups pooling money for trips or events
- Small clubs or organizations without a formal treasurer setup

---

## Core Concept

A Solana-based group treasury governed by **one required contract per pool**. The contract defines all the rules: who can contribute and how much, how distributions work, what types of transactions are allowed, and who needs to approve what. Each group fully defines its own approval structure. Transactions are validated against the active contract before going to approvers. All contract versions are retained in a doubly linked list stored on-chain.

---

## User Stories

- As a group founder, I want to create a treasury and define a governing contract so that everyone operates under agreed-upon rules
- As a member, I want to deposit SOL into the treasury per the terms the contract defines
- As a proposer, I want to submit a transaction and have it automatically checked against the contract
- As a proposer, I want to optionally attach a URL and have a Mastra agent run as the first line of validation — with the report sent to everyone (non-blocking)
- As a proposer, I want to cancel a pending transaction at any point before the threshold is met
- As a proposer, I want to amend or cancel my transaction if it fails validation or is rejected by approvers — and have the approval process restart fresh on amendment
- As an approver, I want to approve or reject a pending transaction with full visibility into the Mastra agent report (if one exists)
- As any member, I want to propose a contract amendment in plain language
- As a group, I want to vote on contract amendments, with all versions remaining accessible
- As a new member, I want to join a pool by providing my name and wallet address

---

## Goals

- Solana multi-sig treasury; a contract is required before any transactions can occur
- AI (Gemini) formalizes unstructured natural language into a structured contract and assists with amendments
- Contract defines: contribution rules, distribution rules, allowed transaction types, fully custom approval logic, and amendment approval rules
- Members join by providing name + wallet address; tracked by name → wallet mapping
- Transactions validated against the contract; proposer can cancel at any point before threshold is met; proposer can amend on failure/rejection (restarts process)
- Once approval threshold is met on Solana, funds execute immediately and cannot be reversed
- All contract versions stored in a full doubly linked list on-chain; browsable in UI
- Optional: attach a URL to a transaction; Mastra agent runs as the **first line of defense** — report is non-blocking but shared with all members
- Convex DB for off-chain data (full contract JSON, transaction metadata, member identity)
- Web app only

## Non-Goals

- Not a general-purpose DeFi protocol
- Not supporting tokens other than SOL (for v1)
- Not a full DAO governance system
- No mobile app

---

## The Contract (Required Per Pool)

Every group treasury must have a governing contract before any transactions can be proposed.

### Member Identity

Members join a pool by providing their **name and wallet address**. The name → wallet mapping is used throughout the contract, UI, and approval rules.

```json
{
  "members": [
    { "name": "Alice", "wallet": "...", "role": "manager" },
    { "name": "Bob", "wallet": "...", "role": "member" },
    { "name": "Carol", "wallet": "...", "role": "member" }
  ]
}
```

### What the Contract Defines

```json
{
  "name": "The House Fund",
  "version": 3,
  "prev_version_hash": "abc123...",
  "next_version_hash": null,
  "created_at": "...",
  "members": [ ... ],
  "contribution_rules": "...",
  "distribution_rules": "...",
  "allowed_transaction_types": ["groceries", "utilities", "events", "equipment"],
  "approval_rules": {
    "default": { "...": "any structure the group defines" },
    "amendment": { "type": "unanimous" }
  },
  "budget_limits": {
    "per_transaction_max_sol": 5.0
  }
}
```

### Approval Rules — Fully Group-Defined

Each group defines its own approval logic. Examples:

- k-of-n: any k of n members must approve
- Named set: specific named members must all approve (resolved to wallet)
- Role-based: all managers must approve
- Unanimous: everyone must approve
- Tiered: small transactions need 2-of-5, large ones need all managers

Gemini assists in translating natural language rules into the structured approval schema.

### Amendment Approval

- Defaults to **unanimous** (all members must agree)
- Can be changed by the contract to any other approval structure
- **Any member** may propose an amendment

### Contract Versioning — Doubly Linked List (On-Chain)

The full doubly linked list of version hashes is stored on-chain. Each version points to both its predecessor and successor:

```
v1 <—> v2 <—> v3 (active)
```

- All versions are retained; full contract JSON for each version is stored in Convex DB
- The active (latest) version governs all new transactions
- A new version is appended on every amendment

### Creating / Amending the Contract

- Founder describes rules in plain language → Gemini formalizes into structured contract JSON
- If no structure is provided, AI generates a reasonable default from group size and description
- To **amend**: any member proposes a change in natural language → Gemini merges it into the current contract → group approves per amendment rules (default: unanimous) → new version appended and linked

---

## Transaction Lifecycle

```
PROPOSED
  → Automated validation against active contract
      [FAIL] → proposer can AMEND or CANCEL

      [PASS] → URL attached?
                  YES → Mastra Agents run (first line of defense, non-blocking)
                          → Report sent to ALL members
                          → Transaction proceeds regardless; members have context
                  NO  → proceed

  → Submitted to approvers per contract's approval rules
      (Approvers see the Mastra report if one exists)
      Proposer can CANCEL at any time before threshold is met
      [REJECTED by approvers] → proposer can AMEND or CANCEL
                                  → if amended, approval process RESTARTS from scratch
      [APPROVED / threshold met on Solana] → executes immediately, irrevocable

  → EXECUTED: funds transferred, transaction recorded
```

**Once the approval threshold is met on-chain, the transaction executes immediately and cannot be reversed.**

### Transaction Fields

- Amount (SOL)
- Description
- Category / type
- Optional: URL link to item/service (triggers Mastra agent pipeline if provided)
- Proposer name (resolved to wallet)

---

## AI Integration

### Gemini API

- Formalizes plain-language group rules → structured contract JSON
- Assists contract amendments: current contract + natural language change → new contract version JSON
- Validates a proposed transaction against contract terms (type allowed, budget in range, description coherent)

### Mastra Agents (Optional per Transaction — First Line of Defense)

- Triggered when a proposer attaches a URL to a transaction
- **Non-blocking**: transaction flow continues regardless of agent findings
- **Fetch Agent**: retrieves and parses the linked page
- **Validation Agent**: checks if item/price/description matches contract's allowed types and budget limits
- **Report Agent**: produces a human-readable summary
- Report is sent to **all members** so everyone votes with full context

---

## Architecture Overview

```
Pool Creation (contract required)
  → Members join: name + wallet address
  → Plain language rules
    → Gemini → Structured Contract JSON (v1)
      → Hash stored on-chain (head of doubly linked list)
      → Full JSON stored in Convex DB
        → Solana treasury initialized

Transaction Proposal
  → Automated validation against active contract
    → FAIL → proposer amends or cancels
    → PASS → (optional) URL → Mastra Agents (non-blocking, first line of defense)
                → Report sent to all members asynchronously
  → Submitted to approvers per contract's approval rules
    → Proposer can cancel at any time before threshold
    → REJECTED → proposer amends or cancels (approval restarts if amended)
    → APPROVED (threshold met on-chain) → executes immediately (irrevocable)

Contract Amendment
  → Any member proposes change in natural language
    → Gemini merges into current contract → new version JSON
      → Group approves (default: unanimous, configurable)
        → New version hash stored on-chain, linked in doubly linked list
        → Full JSON stored in Convex DB
        → All versions remain accessible
```

---

## Tech Stack

| Layer                  | Technology                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| Blockchain             | Solana (Anchor framework)                                        |
| AI Formalization       | Google Gemini API                                                |
| Multi-Agent (optional) | Mastra                                                           |
| Frontend               | Next.js + Tailwind + shadcn/ui                                   |
| UI Components          | shadcn/ui (component library built on Radix UI + Tailwind)       |
| Wallet                 | Phantom / Solana wallet adapter                                  |
| Off-chain Storage      | Convex DB (contract JSON, transaction metadata, member identity) |

---

## Key Features / Scope (v1 Hackathon)

- [ ] Solana program: treasury deposit, transaction proposal, approval gating, immediate execution at threshold
- [ ] Contract required before any transactions; version hash + full doubly linked list stored on-chain
- [ ] Full contract JSON per version stored in Convex DB; all versions browsable in UI
- [ ] Member onboarding: name + wallet address input; name → wallet mapping throughout
- [ ] Gemini: plain language → structured contract; assists amendments
- [ ] Fully group-defined approval rules (any structure); amendment defaults to unanimous
- [ ] Transaction validation against contract; proposer can cancel anytime before threshold
- [ ] Proposer can amend on validation failure or approver rejection; amendment restarts the process
- [ ] In-flight transactions (threshold met on-chain) are irrevocable and always execute
- [ ] Optional Mastra agent pipeline: URL → fetch → validate → non-blocking report sent to all members
- [ ] Any member can propose contract amendments
- [ ] Web app: pool creation, contract view/history, transaction flow, approval voting, treasury dashboard
