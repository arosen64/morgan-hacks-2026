## Why

The group treasury app requires that every contract version's full content be accessible off-chain so the UI can render and edit it without querying the Solana chain directly. Without this, members cannot browse historical contract rules, create a contract, or amend an existing one.

## What Changes

- Add a `contractVersions` table in Convex DB to store the full contract content (as Tiptap JSON) for each version, along with `versionHash`, `prevVersionHash`, and `nextVersionHash` string pointers that mirror the on-chain doubly linked list
- `versionHash` is mocked via `crypto.randomUUID()` until issue #3 (on-chain versioning) lands
- Add Convex queries to fetch the active version and navigate prev/next versions by hash
- Add a `storeContractVersion` mutation to persist a new version
- Add a rich text editor UI (Tiptap) — Google Docs-like — for creating a new contract or amending the current one
- When no contract exists, allow uploading a PDF → sent to Gemini → extracted content pre-populates the editor
- Add a Contract History UI for viewing the active contract (read-only rendered view) and browsing all previous versions via prev/next navigation

## Capabilities

### New Capabilities

- `contract-storage`: Persist full contract content per version in Convex as Tiptap JSON, with mocked version hash and doubly linked list pointers (`prevVersionHash`, `nextVersionHash`)
- `contract-editor-ui`: Rich text editor (Tiptap) for creating or amending a contract; PDF upload → Gemini extraction → pre-populated editor when no contract exists
- `contract-version-history-ui`: Read-only rendered view of the active contract with prev/next version navigation

### Modified Capabilities

<!-- None - this is a net-new feature with no existing specs to modify -->

## Impact

- **New dependencies**: `@tiptap/react`, `@tiptap/starter-kit` (and extensions)
- **Convex schema**: New `contractVersions` table
- **Convex functions**: New queries (`getActiveContractVersion`, `getContractVersionByHash`, `listContractVersions`) and mutation (`storeContractVersion`)
- **Convex action**: `extractContractFromPdf` — uploads PDF bytes to Gemini, returns extracted content loaded into editor
- **Frontend**: New `ContractEditor` and `ContractHistory` pages/components; routing additions
- **No breaking changes** to existing functionality
- **Future**: Mock hash replaced with real Solana on-chain hash once issue #3 is implemented
