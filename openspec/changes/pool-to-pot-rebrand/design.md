## Context

The Potlock app uses "pool" and "investment" language throughout its UI, which contradicts the product name and implies a narrower use case than intended. This change is a pure copy/label update — no data models, APIs, routes, or component logic change. All internal identifiers (prop names, variable names, Convex table names) remain untouched.

The UI is built with React, Tailwind CSS, and shadcn/ui components.

## Goals / Non-Goals

**Goals:**

- Replace every user-visible string "pool" / "Pool" with "pot" / "Pot"
- Remove or reword any copy that frames Potlock as an investment product
- Keep changes isolated to JSX string literals and text content
- Use existing Tailwind utility classes and shadcn/ui components for any badge/button label changes

**Non-Goals:**

- Renaming internal TypeScript identifiers (props, state variables, function names, Convex table/field names)
- Changing component filenames (e.g. `CreatePoolFlow.tsx` stays as-is)
- Redesigning layouts or adding new UI elements
- Updating backend types or API contracts

## Decisions

**Decision: Only user-visible strings change, not identifiers**
Rationale: Renaming identifiers (e.g. `poolId → potId`) would cascade into Convex schema, generated types, and all call sites — high risk for zero user-visible benefit. String literals are self-contained and safe to update in isolation.

**Decision: Tailwind + shadcn/ui for any styled label updates**
Rationale: The existing Badge and Button components from shadcn/ui already handle styling. Changing label text requires no new classes; existing `variant` props and Tailwind utilities remain unchanged.

**Decision: Neutral, action-oriented replacement copy**
Rationale: Rather than finding a direct synonym for "invest," rewrite hero copy to focus on what users _do_ — create and manage pots with people they trust. Examples:

- "The smarter way to invest with people you trust." → "The smarter way to manage money with people you trust."
- "Manage your investment pools or start a new one with people you trust." → "Manage your pots or start a new one with people you trust."
- "Investment Pools" badge → "Your Pots"

## Risks / Trade-offs

- [Risk] Missing an occurrence of "pool" or "invest" in the UI → Mitigation: grep for both terms across `src/` as a final verification step after all edits
- [Risk] Pluralization edge cases ("pools" → "pots", "a pool" → "a pot") → Mitigation: review each replacement in context rather than doing a blind global find-and-replace
- [Risk] Snapshot or E2E tests asserting on the old copy text → Mitigation: check `src/**/*.test.*` and `e2e/` for string assertions; update any that reference old labels
