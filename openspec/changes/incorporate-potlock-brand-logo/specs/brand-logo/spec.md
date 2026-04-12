## ADDED Requirements

### Requirement: Logo asset exists in src/assets/

The project SHALL contain a Potlock brand logo file at `src/assets/` with a filename of `logo.svg` (preferred) or `logo.png`.

#### Scenario: Logo file is present

- **WHEN** the project is built
- **THEN** a file named `logo.svg` or `logo.png` exists under `src/assets/`

---

### Requirement: Logo component renders at nav-bar size

The `<Logo>` component SHALL render the brand image at a height of 28 px (Tailwind `h-7`) when `size="sm"` or when no `size` prop is provided.

#### Scenario: Default / small size

- **WHEN** `<Logo />` or `<Logo size="sm" />` is rendered
- **THEN** the image element has the Tailwind class `h-7` and `w-auto`

---

### Requirement: Logo component renders at hero size

The `<Logo>` component SHALL render the brand image at a height of 64 px (Tailwind `h-16`) when `size="lg"`.

#### Scenario: Large/hero size

- **WHEN** `<Logo size="lg" />` is rendered
- **THEN** the image element has the Tailwind class `h-16` and `w-auto`

---

### Requirement: Placeholder replaced in MainMenu nav bars

The violet square placeholder in `MainMenu.tsx` SHALL be replaced with `<Logo size="sm" />` in both the create-pool header and the main nav header.

#### Scenario: Create-pool flow header

- **WHEN** the create-pool flow is open
- **THEN** the header displays the `<Logo size="sm" />` component instead of the violet square

#### Scenario: Main nav header

- **WHEN** the main menu is displayed
- **THEN** the header displays the `<Logo size="sm" />` component instead of the violet square

---

### Requirement: Placeholder replaced in PoolDashboard nav bar

The violet square placeholder in `PoolDashboard.tsx` SHALL be replaced with `<Logo size="sm" />`.

#### Scenario: Pool dashboard header

- **WHEN** a pool dashboard is displayed
- **THEN** the header displays the `<Logo size="sm" />` component instead of the violet square

---

### Requirement: Placeholder replaced in SignInScreen

The two violet square placeholders in `SignInScreen.tsx` SHALL be replaced with `<Logo>`:

- Left-panel branding header: `<Logo size="sm" />`
- Mobile header: `<Logo size="sm" />`

#### Scenario: Sign-in left-panel header

- **WHEN** the sign-in screen is shown on a large viewport
- **THEN** the left-panel brand header displays `<Logo size="sm" />`

#### Scenario: Sign-in mobile header

- **WHEN** the sign-in screen is shown on a small viewport
- **THEN** the mobile header displays `<Logo size="sm" />`

---

### Requirement: Logo renders correctly on dark and light backgrounds

The logo image SHALL have sufficient contrast to be visible on both dark (`bg-zinc-950`) and light (`bg-background`) backgrounds.

#### Scenario: Dark background visibility

- **WHEN** `<Logo />` is rendered inside a dark (`bg-zinc-950`) container
- **THEN** the logo is visually distinguishable from the background

#### Scenario: Light background visibility

- **WHEN** `<Logo />` is rendered inside a light (`bg-background`) container
- **THEN** the logo is visually distinguishable from the background
