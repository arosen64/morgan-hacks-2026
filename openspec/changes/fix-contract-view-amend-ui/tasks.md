## 1. Create ContractDisplay component

- [x] 1.1 Create `src/components/ContractDisplay.tsx` with a typed `ContractContract` interface matching the Gemini-generated contract shape (name, version, members, contribution_rules, distribution_rules, allowed_transaction_types, approval_rules, budget_limits)
- [x] 1.2 Implement Members section: render each member as a row with name, role Badge (violet for Manager, secondary for Member), and truncated wallet address
- [x] 1.3 Implement Contribution Rules section: labeled Card section showing the rules string
- [x] 1.4 Implement Distribution Rules section: labeled Card section showing the rules string
- [x] 1.5 Implement Allowed Transaction Types section: render each type as a capitalized Badge chip
- [x] 1.6 Implement Approval Rules section: render `default` and `amendment` rules as human-readable text (e.g. "Unanimous" or "2 of 3")
- [x] 1.7 Implement Budget Limits section: show "Max per Transaction: X SOL"
- [x] 1.8 Add graceful empty/null handling for each section (render nothing or a placeholder when a field is missing)

## 2. Wire up ContractDisplay in ContractCreationPage

- [x] 2.1 In `src/components/ContractCreationPage.tsx`, replace the import and usage of `ContractFieldView` with `ContractDisplay`
- [x] 2.2 Remove the old `ContractFieldView` function export from `ContractCreationPage.tsx`

## 3. Wire up ContractDisplay in AmendContractPage

- [x] 3.1 In `src/components/AmendContractPage.tsx`, replace the import of `ContractFieldView` from `ContractCreationPage` with `ContractDisplay`
- [x] 3.2 Replace both usages of `<ContractFieldView contract={...} />` (current contract card and amended preview card) with `<ContractDisplay contract={...} />`

## 4. Visual polish and consistency

- [x] 4.1 Ensure all section headings use human-readable labels (no snake_case or camelCase visible)
- [x] 4.2 Verify the amend page's primary buttons use `bg-violet-600 hover:bg-violet-700` and secondary buttons use appropriate `variant="ghost"` or `variant="outline"` with violet accents — fix any inconsistencies
- [x] 4.3 Test responsive layout: verify no horizontal overflow at mobile widths using browser devtools

## 5. Cleanup and verification

- [x] 5.1 Search the codebase for any remaining references to `ContractFieldView` and remove or update them
- [x] 5.2 Visually verify the contract creation preview, current contract display on amend page, and amended preview all show no raw JSON
- [x] 5.3 Verify `ContractViewer.tsx` (TipTap-based) is unaffected and still renders correctly
