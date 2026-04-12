## ADDED Requirements

### Requirement: Invite Members button opens share modal

The system SHALL open an invite share modal when the user clicks "Invite Members" in the pool dashboard.

#### Scenario: Modal opens on button click

- **WHEN** any pool member clicks the "Invite Members" action button
- **THEN** an overlay modal appears containing the pool's invite link and share controls

### Requirement: Modal displays copyable invite link

The modal SHALL display the full invite link built from `window.location.origin + "?pool=" + poolId` along with a "Copy" button.

#### Scenario: Copy button writes link to clipboard

- **WHEN** the user clicks the "Copy" button
- **THEN** the invite link is written to the clipboard via `navigator.clipboard.writeText` and the button label changes to "Copied!" for 2 seconds before reverting

### Requirement: Modal offers native share sheet

The modal SHALL show a "Share" button that triggers `navigator.share` with the invite link and a short message. On browsers that do not support `navigator.share`, the button SHALL fall back to copying the link to the clipboard.

#### Scenario: Share via native sheet (supported browser)

- **WHEN** the user clicks "Share" on a browser where `navigator.share` is available
- **THEN** the device's native share sheet opens pre-filled with the invite link and message

#### Scenario: Share fallback on unsupported browser

- **WHEN** the user clicks "Share" and `navigator.share` is not available
- **THEN** the invite link is copied to the clipboard and a confirmation message is shown

### Requirement: Modal shows confirmation after sharing

After a successful share or copy action the modal SHALL display a brief confirmation message (e.g. "Link copied!" or "Shared!").

#### Scenario: Confirmation message appears

- **WHEN** the user completes a copy or share action
- **THEN** a confirmation message is visible within the modal for at least 2 seconds

### Requirement: Modal can be dismissed

The user SHALL be able to close the modal without taking any action.

#### Scenario: Close via button

- **WHEN** the user clicks a close/dismiss button in the modal
- **THEN** the modal closes and no share action is taken
