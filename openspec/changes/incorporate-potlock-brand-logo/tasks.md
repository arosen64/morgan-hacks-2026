## 1. Add Logo Asset

- [x] 1.1 Copy your logo file into `src/assets/` and name it `logo.svg` (preferred) or `logo.png`
- [x] 1.2 Verify the file is committed and visible in `src/assets/` listing

## 2. Create Logo Component

- [x] 2.1 Create `src/components/Logo.tsx` that imports the logo asset and exports a `<Logo>` component with a `size` prop (`"sm"` | `"lg"`, default `"sm"`)
- [x] 2.2 Apply `h-7 w-auto` Tailwind classes for `size="sm"` and `h-16 w-auto` for `size="lg"`
- [x] 2.3 Set a meaningful `alt` attribute (e.g. `"Potlock"`) on the underlying `<img>` element
- [x] 2.4 Confirm the component compiles without TypeScript errors

## 3. Replace Placeholders

- [x] 3.1 In `src/components/MainMenu.tsx` line 91 (create-flow header), replace `<div className="size-7 rounded-lg bg-violet-500" />` with `<Logo size="sm" />`
- [x] 3.2 In `src/components/MainMenu.tsx` line 119 (main nav header), replace the same placeholder with `<Logo size="sm" />`
- [x] 3.3 In `src/components/PoolDashboard.tsx` (top nav, ~line 201), replace the placeholder with `<Logo size="sm" />`
- [x] 3.4 In `src/components/SignInScreen.tsx` line 20 (left-panel header), replace the placeholder with `<Logo size="sm" />`
- [x] 3.5 In `src/components/SignInScreen.tsx` line 44 (mobile header), replace the placeholder with `<Logo size="sm" />`
- [x] 3.6 Add the `Logo` import to each modified file

## 4. Visual Verification

- [ ] 4.1 Start the dev server and open the sign-in screen — confirm logo appears in both the dark left panel and the mobile header
- [ ] 4.2 Connect a wallet and open the main menu — confirm logo appears in the top nav and that layout is not broken
- [ ] 4.3 Open a pool dashboard — confirm logo appears in the pool nav bar
- [ ] 4.4 Check dark-background visibility (left panel of sign-in uses `bg-zinc-950`) — logo must be distinguishable
- [ ] 4.5 Confirm no layout regressions (nav height, text alignment, button placement)
