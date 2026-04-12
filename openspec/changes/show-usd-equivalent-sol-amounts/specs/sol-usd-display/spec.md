## ADDED Requirements

### Requirement: Live SOL/USD price is fetched and cached

The system SHALL fetch the live SOL/USD exchange rate from the CoinGecko public API on app load and refresh it every 60 seconds. The price SHALL be shared across all consumers via a single module-level cache so that multiple components incur only one network request.

#### Scenario: Price fetched successfully

- **WHEN** the app loads
- **THEN** `useSolPrice` returns the current SOL price in USD as a number

#### Scenario: Price fetch fails

- **WHEN** the CoinGecko API is unreachable or returns an error
- **THEN** `useSolPrice` returns `null` and no error is surfaced to the user

#### Scenario: Price refreshes periodically

- **WHEN** 60 seconds have elapsed since the last successful fetch
- **THEN** `useSolPrice` triggers a new fetch and updates the returned value

### Requirement: SOL amounts are displayed with USD equivalent

The system SHALL render every SOL amount in the UI alongside its USD equivalent using the format `X.XXXX SOL ($Y.YY)`. The USD portion SHALL use a muted, secondary text style (Tailwind `text-muted-foreground`) so it is visually subordinate to the SOL figure.

#### Scenario: USD price available

- **WHEN** `useSolPrice` returns a non-null price and a SOL amount is rendered
- **THEN** the display shows both the SOL figure and its USD equivalent inline

#### Scenario: USD price unavailable

- **WHEN** `useSolPrice` returns `null`
- **THEN** only the SOL figure is shown, with no USD placeholder or error text

### Requirement: `SolAmount` component is used for all SOL display sites

The system SHALL use the shared `SolAmount` component (accepting `lamports` or `sol` prop) in: pot treasury balance, member contribution amounts, transaction request amounts, wallet balance in the header, and the deposit/add-money flow.

#### Scenario: Treasury balance card

- **WHEN** the pot dashboard loads and price data is available
- **THEN** the treasury balance card shows the SOL balance and its USD equivalent

#### Scenario: Member contribution row

- **WHEN** a member's contribution is displayed on the dashboard
- **THEN** the SOL contribution amount shows its USD equivalent inline

#### Scenario: Transaction request amount

- **WHEN** a pending or approved transaction request is shown in the transactions list
- **THEN** the requested SOL amount shows its USD equivalent inline

#### Scenario: Wallet balance in header

- **WHEN** a user is signed in and the header renders their wallet balance
- **THEN** the SOL balance shows its USD equivalent

#### Scenario: Add-money modal balance indicator

- **WHEN** the add-money modal is open
- **THEN** the user's available wallet balance shows its USD equivalent
