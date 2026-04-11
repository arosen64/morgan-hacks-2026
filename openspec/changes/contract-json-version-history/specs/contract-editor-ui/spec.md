## ADDED Requirements

### Requirement: Contract creation entry screen

When no contract exists for a pool, the system SHALL present two options: upload a PDF or create a contract from scratch.

#### Scenario: No contract — entry screen shown

- **WHEN** a user navigates to the contract page for a pool with no existing contract
- **THEN** an entry screen is shown with two choices: "Upload PDF" and "Create from scratch"

#### Scenario: Contract exists — entry screen not shown

- **WHEN** a user navigates to the contract page for a pool with an existing contract
- **THEN** the entry screen is NOT shown
- **THEN** the editor is shown pre-populated with the active contract's content

### Requirement: Create from scratch

The system SHALL allow a user to open an empty Tiptap editor to author a contract from scratch when no contract exists.

#### Scenario: Create from scratch selected

- **WHEN** the user selects "Create from scratch" on the entry screen
- **THEN** an empty Tiptap editor is shown with a placeholder prompt

### Requirement: PDF upload pre-populates editor

The system SHALL allow a user to upload a PDF from the entry screen. The PDF bytes SHALL be sent to Gemini via a Convex action solely for reading and extracting the document text. On success, the extracted content SHALL be loaded into the Tiptap editor.

#### Scenario: PDF uploaded successfully

- **WHEN** the user uploads a PDF file from the entry screen
- **THEN** the PDF bytes are sent to the `extractContractFromPdf` Convex action
- **THEN** Gemini reads the PDF and returns the extracted text
- **THEN** the editor is shown populated with the extracted content as a Tiptap document

#### Scenario: PDF upload fails

- **WHEN** the Gemini API returns an error during PDF extraction
- **THEN** an error message is shown
- **THEN** the user remains on the upload screen (the editor is NOT shown)

#### Scenario: PDF upload unavailable once contract exists

- **WHEN** a contract version already exists for the pool
- **THEN** the PDF upload option is NOT available

### Requirement: Rich text contract editor

The system SHALL provide a Tiptap-powered rich text editor for authoring and amending contract content. The editor SHALL support headings, bold, italic, bullet lists, ordered lists, blockquotes, and inline code.

#### Scenario: Editor shown after PDF extraction

- **WHEN** PDF extraction succeeds
- **THEN** the Tiptap editor is shown with the extracted content loaded

#### Scenario: Editor shown for existing contract

- **WHEN** a contract already exists for the pool
- **THEN** the Tiptap editor is shown pre-populated with the active contract's Tiptap JSON content

#### Scenario: User saves contract

- **WHEN** the user clicks Save in the editor
- **THEN** `storeContractVersion` is called with the current editor JSON content
- **THEN** the user is navigated to the contract viewer

### Requirement: Save creates new contract version

The system SHALL create a new version record each time the editor is saved, linking it to the previous active version if one exists.

#### Scenario: First save creates v1

- **WHEN** the user saves with no prior contract for the pool
- **THEN** a version record with `version: 1` and `prevVersionHash: null` is stored

#### Scenario: Amendment save creates new version

- **WHEN** the user saves an amendment to an existing contract
- **THEN** a new version record is created with `prevVersionHash` pointing to the previously active version's hash
- **THEN** the previous version's `nextVersionHash` is updated to the new version's hash
