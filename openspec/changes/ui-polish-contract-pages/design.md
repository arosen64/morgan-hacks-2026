## Context

The contract-related pages (`ContractViewer`, `ContractEditor`, `ContractEntryScreen`, `ContractHistoryPage`, `AmendContractPage`, `CreateProposalPage`) were built quickly and lack visual consistency. The app already has shadcn/ui installed and uses Tailwind throughout — this polish pass standardizes the contract pages to use those tools uniformly.

## Goals / Non-Goals

**Goals:**

- Apply consistent shadcn/ui Card, Badge, Separator, Button, and form components across all six files
- Use Tailwind utility classes for all spacing, typography, and color — no inline styles or custom CSS
- Ensure each page is responsive (mobile-first, readable on desktop)
- Maintain 100% functional parity — no behavior changes

**Non-Goals:**

- New features or backend changes
- Redesigning the overall app navigation or layout shell
- Adding animations or transitions beyond what shadcn/ui provides by default
- Changes to any page not listed in scope

## Decisions

**Use shadcn/ui Card as the primary layout primitive**
Every logical section of a page (contract terms, signatories, history entry) is wrapped in a `<Card>` with a `<CardHeader>` and `<CardContent>`. This immediately improves visual grouping without custom CSS.

- Alternative considered: plain `<div>` with border classes — rejected because it duplicates what Card already provides and is harder to maintain.

**Typography via Tailwind prose scale**
Section headings use `text-sm font-medium text-muted-foreground` for labels and `text-base font-semibold` for values, following the existing pattern in `PoolDashboard.tsx`.

- Alternative: shadcn/ui Typography — not yet installed; adding it would be scope creep.

**Contract history as a vertical list with `<Separator>`**
Each amendment entry is a Card with a timestamp badge and diff summary. A `<Separator>` divides entries. This is simpler and more readable than a custom timeline component.

- Alternative: A `<Timeline>` from a third-party library — rejected to keep dependencies minimal.

**Form layout in CreateProposalPage using shadcn/ui Form primitives**
Use `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, and `<FormMessage>` to get consistent label alignment, error states, and accessible markup for free.

## Risks / Trade-offs

- [Risk] Existing pages may have tightly coupled layout logic that makes refactoring tedious → Mitigation: treat each file as an independent unit; refactor one at a time and verify in the browser after each.
- [Risk] shadcn/ui Form requires react-hook-form; `CreateProposalPage` may not already use it → Mitigation: check existing form handling first; if it uses controlled state, wrap with `useForm` during the refactor.

## Open Questions

- Does `ContractEntryScreen` share any state/props with `ContractViewer` that would require coordinating layout changes between them?
