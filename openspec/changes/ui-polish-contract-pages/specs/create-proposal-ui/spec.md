## ADDED Requirements

### Requirement: Create proposal form uses shadcn/ui form primitives

The `CreateProposalPage.tsx` SHALL use shadcn/ui `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, and `<FormMessage>` components for all form fields.

#### Scenario: Form fields have visible labels

- **WHEN** a user views the create proposal page
- **THEN** every input field SHALL have a `<FormLabel>` rendered above it

#### Scenario: Validation errors are displayed inline

- **WHEN** a user submits the form with invalid or missing data
- **THEN** a `<FormMessage>` SHALL appear below the relevant field with a descriptive error

### Requirement: Submit button uses shadcn/ui Button

The form submit action SHALL use the shadcn/ui `<Button>` component with an appropriate variant (e.g., `default` or `primary`) and SHALL be visually prominent.

#### Scenario: Submit button styling

- **WHEN** a user views the create proposal page
- **THEN** the submit button SHALL be a full-width or prominently placed shadcn/ui `<Button>` using Tailwind for sizing

### Requirement: Create proposal page uses consistent spacing and layout

The page SHALL use Tailwind spacing utilities (`gap-`, `space-y-`, `p-`, `px-`, `py-`) for all layout, with no inline styles.

#### Scenario: Field spacing

- **WHEN** multiple form fields are rendered
- **THEN** they SHALL be separated by consistent vertical spacing using `space-y-4` or equivalent Tailwind class

### Requirement: Create proposal page is responsive

The form SHALL be usable on both mobile and desktop viewports.

#### Scenario: Mobile form layout

- **WHEN** a user opens the create proposal page on a mobile device
- **THEN** all fields SHALL be full-width and the layout SHALL not overflow horizontally

### Requirement: Create proposal page preserves existing functionality

The visual refactor SHALL NOT alter form submission logic, routing, or data mutations.

#### Scenario: No functional regression

- **WHEN** a user submits a valid proposal after the polish
- **THEN** the proposal SHALL be created successfully with the same behavior as before
