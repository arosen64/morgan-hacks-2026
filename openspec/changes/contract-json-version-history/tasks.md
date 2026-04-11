## 1. Dependencies

- [x] 1.1 Install `@tiptap/react`, `@tiptap/starter-kit`, and `@tiptap/extension-placeholder`

## 2. Convex Schema

- [x] 2.1 Add `contractVersions` table to Convex schema with fields: `poolId`, `version`, `versionHash`, `prevVersionHash`, `nextVersionHash`, `content` (Tiptap JSON as `v.any()`), `createdAt`
- [x] 2.2 Add index on `contractVersions` by `poolId` and by `versionHash`

## 3. Convex Functions

- [x] 3.1 Implement `storeContractVersion` mutation — generates UUID as `versionHash`, links `prevVersionHash`, updates previous active version's `nextVersionHash`
- [x] 3.2 Implement `getActiveContractVersion(poolId)` query — returns record with `nextVersionHash: null` for the pool
- [x] 3.3 Implement `getContractVersionByHash(versionHash)` query — returns matching record or null
- [x] 3.4 Implement `listContractVersions(poolId)` query — returns all versions for pool ordered by `version` ascending
- [x] 3.5 Implement `extractContractFromPdf` Convex action — accepts PDF bytes, calls Gemini API to extract text, returns plain text string

## 4. Contract Entry Screen

- [x] 4.1 Create `ContractEntryScreen` component shown when no contract exists — two options: "Upload PDF" and "Create from scratch"
- [x] 4.2 Implement "Create from scratch" flow — navigates to empty editor

## 5. PDF Upload Flow

- [x] 5.1 Implement PDF file input in `ContractEntryScreen`
- [x] 5.2 On PDF select, call `extractContractFromPdf` action with file bytes and show loading state
- [x] 5.3 On success, navigate to editor pre-populated with extracted content as Tiptap document
- [x] 5.4 On failure, show error message and remain on the entry/upload screen

## 6. Contract Editor

- [x] 6.1 Create `ContractEditor` component with Tiptap editor (StarterKit + Placeholder extension)
- [x] 6.2 Accept optional `initialContent` prop (Tiptap JSON) to pre-populate from PDF extraction or existing contract
- [x] 6.3 Add Save button — calls `storeContractVersion` with `editor.getJSON()` output
- [x] 6.4 On save success, navigate to contract viewer

## 7. Contract Viewer & Version History

- [x] 7.1 Create `ContractViewer` component — renders Tiptap JSON in read-only mode
- [x] 7.2 Display version number, version hash, and creation timestamp alongside content
- [x] 7.3 Add "Previous version" button — disabled/hidden when `prevVersionHash` is null
- [x] 7.4 Add "Next version" button — disabled/hidden when `nextVersionHash` is null; label active version
- [x] 7.5 On prev/next click, fetch version by hash via `getContractVersionByHash` and render

## 8. Routing

- [x] 8.1 Add route for contract page (e.g. `/pool/:poolId/contract`) that renders entry screen or viewer based on contract existence
- [x] 8.2 Add route for contract editor (e.g. `/pool/:poolId/contract/edit`)
