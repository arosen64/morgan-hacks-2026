## Context

The app has four locations where brand identity is shown, each currently rendering `<div className="size-7 rounded-lg bg-violet-500" />` as a placeholder. Two size contexts exist:

- **Nav-bar** (compact): `size-7` (~28 px). Used in `MainMenu.tsx` ×2, `PoolDashboard.tsx` ×1, `SignInScreen.tsx` (mobile header) ×1.
- **Hero/splash** (prominent): used in `SignInScreen.tsx` left panel alongside `hero.png` — currently also `size-7`, but should be larger.

Existing assets: `src/assets/hero.png`, `react.svg`, `vite.svg`. No logo file exists yet.

## Goals / Non-Goals

**Goals:**

- Add the Potlock logo file to `src/assets/`
- Create a single `<Logo>` component with `size` prop (`"sm"` for nav-bar, `"lg"` for hero)
- Replace all four placeholder divs with `<Logo size="sm">` or `<Logo size="lg">` as appropriate
- Work correctly on both dark (`bg-zinc-950`) and light (`bg-background`) backgrounds

**Non-Goals:**

- Theming infrastructure changes
- Animated logo or SVG manipulation
- Changes to routing, auth, or any non-logo UI

## Decisions

### 1. Reusable `<Logo>` component over inline `<img>` tags

**Decision**: Create `src/components/Logo.tsx` with a `size` prop instead of placing `<img>` tags directly at each call site.

**Rationale**: Four sites share the same asset. A component centralizes the `alt` text, size mapping, and any future changes (e.g., dark-mode variant). Inline repetition would make future updates error-prone.

**Alternative considered**: Inline `<img src={logo} className="h-7" />` at each site — rejected because it scatters the size and alt-text contract across files.

### 2. SVG preferred, PNG acceptable

**Decision**: Accept whichever format the user provides; SVG is preferred because it scales without blur and works on all screen densities.

**Rationale**: The nav-bar renders at 28–32 px and the hero at a larger size. An SVG scales cleanly for both; a PNG at sufficient resolution (≥256 px) is also acceptable.

### 3. Tailwind size classes for the two variants

| Prop `size`      | Classes applied | Rendered height |
| ---------------- | --------------- | --------------- |
| `"sm"` (default) | `h-7 w-auto`    | 28 px           |
| `"lg"`           | `h-16 w-auto`   | 64 px           |

**Rationale**: `h-7` matches the current placeholder `size-7`. `h-16` gives a prominent hero presence without dominating the layout.

### 4. `object-contain` + transparent background

**Decision**: Always render with `object-contain` so the aspect ratio is preserved and no background fill is applied.

**Rationale**: The logo will appear on both dark (`SignInScreen` left panel) and light backgrounds. Keeping the image transparent/contain avoids a visible bounding-box artifact.

## Risks / Trade-offs

- **Logo not yet in the repo** → The implementation tasks include a step for the user to copy their logo file into `src/assets/`. Tasks list both SVG and PNG paths.
- **PNG on high-DPI screens** → A PNG logo may appear slightly soft at 2× or 3× DPR if the source resolution is low. Mitigation: use at least 256 px tall source image, or prefer SVG.
- **Dark background contrast** → If the logo has dark-coloured elements, it will be invisible on `bg-zinc-950` (left panel of `SignInScreen`). Mitigation: use an SVG/PNG with sufficient contrast or a white variant for dark contexts. Documented in tasks as a check step.
