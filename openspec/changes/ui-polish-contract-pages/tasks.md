## 1. Contract Viewer Polish

- [x] 1.1 Read `ContractViewer.tsx` and identify all sections to wrap in shadcn/ui `<Card>`
- [x] 1.2 Refactor `ContractViewer.tsx` to use `<Card>`, `<CardHeader>`, `<CardContent>` for each section
- [x] 1.3 Replace any inline styles or custom CSS in `ContractViewer.tsx` with Tailwind utilities
- [x] 1.4 Read `ContractEditor.tsx` and apply the same card-based section layout
- [x] 1.5 Replace any inline styles or custom CSS in `ContractEditor.tsx` with Tailwind utilities
- [x] 1.6 Read `ContractEntryScreen.tsx` and apply card layout and Tailwind typography
- [x] 1.7 Verify all three viewer/editor files are responsive on mobile and desktop

## 2. Contract History Polish

- [x] 2.1 Read `ContractHistoryPage.tsx` and map each amendment entry to a `<Card>` + `<Badge>` + `<Separator>` layout
- [x] 2.2 Refactor `ContractHistoryPage.tsx` to use the new layout with Tailwind spacing
- [x] 2.3 Read `AmendContractPage.tsx` and apply consistent card layout and Tailwind typography
- [x] 2.4 Verify history pages are responsive on mobile and desktop

## 3. Create Proposal Form Polish

- [x] 3.1 Read `CreateProposalPage.tsx` and audit existing form handling (controlled state vs react-hook-form)
- [x] 3.2 Wrap form fields with shadcn/ui `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>`
- [x] 3.3 Replace submit button with a shadcn/ui `<Button>` using appropriate variant and Tailwind sizing
- [x] 3.4 Apply `space-y-4` (or equivalent) Tailwind spacing between all form fields
- [x] 3.5 Verify form is responsive on mobile and desktop

## 4. Cross-Cutting Consistency Check

- [x] 4.1 Verify all six files use only Tailwind utility classes and shadcn/ui components — no inline styles remain
- [x] 4.2 Confirm typography scale (`text-sm font-medium text-muted-foreground`, `text-base font-semibold`) is consistent across all pages
- [x] 4.3 Smoke-test all existing actions (view contract, edit, submit amendment, create proposal) to confirm no functional regressions
