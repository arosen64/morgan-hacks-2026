## ADDED Requirements

### Requirement: Full-screen sign-in prompt for unauthenticated users

The app SHALL display a full-screen sign-in screen using shadcn/ui `Card` and `Button` components when no Phantom wallet is connected. The screen SHALL contain a "Connect Wallet" button that triggers the Phantom wallet connection flow via `WalletMultiButton`.

#### Scenario: User opens app with no wallet connected

- **WHEN** the app loads and `connected` from `useWallet()` is false
- **THEN** the full-screen sign-in screen is rendered and no other app content is visible

#### Scenario: User clicks Connect Wallet

- **WHEN** the user clicks the "Connect Wallet" button on the sign-in screen
- **THEN** the Phantom wallet connection modal opens

#### Scenario: Wallet connects successfully

- **WHEN** the user approves the wallet connection in Phantom
- **THEN** `connected` becomes true and the user is navigated to the main menu

### Requirement: Wallet disconnect returns user to sign-in

The app SHALL return the user to the sign-in screen whenever the wallet disconnects, regardless of which screen they are currently on.

#### Scenario: User disconnects wallet from within the app

- **WHEN** `connected` from `useWallet()` becomes false while the user is on any screen
- **THEN** the app immediately renders the sign-in screen and clears any selected pool state
