## ADDED Requirements

### Requirement: Join Pool button is enabled in the main menu

The "Join Pool" button in `MainMenu` SHALL be enabled and open an input flow where a user can enter a pool ID or paste a full invite link.

#### Scenario: Button is clickable

- **WHEN** a signed-in user views the main menu
- **THEN** the "Join Pool" button is interactive (not disabled)

### Requirement: User can enter a pool ID or invite link to join

The system SHALL accept either a bare pool ID or a full invite URL (containing `?pool=<id>`) in the join input. It SHALL extract the pool ID and navigate to `JoinPoolForm` for that pool.

#### Scenario: Valid pool ID entered

- **WHEN** the user enters a valid pool ID and confirms
- **THEN** the app navigates to `JoinPoolForm` pre-filled with that pool ID

#### Scenario: Full invite URL pasted

- **WHEN** the user pastes a full invite URL (e.g. `https://app.potlock.xyz?pool=abc123`) and confirms
- **THEN** the pool ID is extracted from the URL and the app navigates to `JoinPoolForm` for that pool

### Requirement: App auto-routes to join flow on page load when invite link is opened

When the app is loaded with a `?pool=<poolId>` query parameter the system SHALL skip `MainMenu` and route directly to `JoinPoolForm` for the given pool ID, provided the user is authenticated.

#### Scenario: Authenticated user opens invite link

- **WHEN** an authenticated user opens the app URL with `?pool=<poolId>`
- **THEN** `JoinPoolForm` is displayed immediately with the pool ID pre-filled

#### Scenario: Unauthenticated user opens invite link

- **WHEN** an unauthenticated user opens the app URL with `?pool=<poolId>`
- **THEN** the sign-in screen is shown first; after connecting their wallet the app routes to `JoinPoolForm` for the given pool ID

### Requirement: Query param is removed from URL after routing

After the app reads and acts on the `?pool=` query parameter it SHALL remove the parameter from the browser URL using `window.history.replaceState` so that a page refresh does not re-trigger the join flow.

#### Scenario: URL is cleaned after auto-route

- **WHEN** the app successfully reads and acts on `?pool=<poolId>` from the URL
- **THEN** the browser address bar no longer shows the `?pool=` parameter
