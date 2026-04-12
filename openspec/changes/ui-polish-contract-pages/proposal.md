## Why

The contract-related pages are functional but visually inconsistent — spacing, typography, and layout are ad-hoc and don't feel cohesive with the rest of the app. Polishing these pages before the hackathon demo will improve perceived quality and usability.

## What Changes

- **Contract viewer** (`ContractViewer.tsx`, `ContractEditor.tsx`, `ContractEntryScreen.tsx`): Adopt consistent card layout with clear section headings and visual hierarchy using shadcn/ui and Tailwind
- **Contract history page** (`ContractHistoryPage.tsx`, `AmendContractPage.tsx`): Improve amendment/history display with a readable timeline or versioned list using shadcn/ui components
- **Create proposal page** (`CreateProposalPage.tsx`): Clean up form field layout, labels, and submit button using shadcn/ui Form, Input, Button, and Tailwind spacing
- All pages must use shadcn/ui components exclusively for UI primitives and Tailwind utility classes for layout and spacing — no custom CSS
- Ensure pages are responsive on both mobile and desktop breakpoints

## Capabilities

### New Capabilities

- `contract-viewer-ui`: Polished shadcn/ui + Tailwind layout for the contract viewer, editor, and entry screens
- `contract-history-ui`: Readable timeline/list UI for amendment history using shadcn/ui components
- `create-proposal-ui`: Clean shadcn/ui form layout for creating proposals/requests

### Modified Capabilities

<!-- No existing spec-level behavior changes — this is purely visual/UX polish -->

## Impact

- `src/components/ContractViewer.tsx`
- `src/components/ContractEditor.tsx`
- `src/components/ContractEntryScreen.tsx`
- `src/components/ContractHistoryPage.tsx`
- `src/components/AmendContractPage.tsx`
- `src/components/CreateProposalPage.tsx`
- Shared shadcn/ui components and Tailwind config
- No backend/Convex changes required
- No breaking changes to existing functionality
