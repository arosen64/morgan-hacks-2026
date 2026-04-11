## Context

The group treasury app stores contract versions on-chain (Solana doubly linked list of hashes, issue #3) and off-chain (full content in Convex). This change implements the Convex storage layer and the full contract UI — editor, viewer, and version history — independent of the Solana program, which is not yet built.

The contract content is rich text authored by pool members. It must be editable in a Google Docs-like experience and stored per-version so any historical version can be retrieved and rendered.

## Goals / Non-Goals

**Goals:**

- Convex `contractVersions` table with Tiptap JSON content and linked-list hash pointers
- Rich text editor (Tiptap) for creating and amending contracts
- PDF upload → Gemini extraction → editor pre-population (first-time creation only)
- Read-only contract viewer with prev/next version navigation
- Mocked version hash (`crypto.randomUUID()`) so the full feature works before Solana is ready

**Non-Goals:**

- Real on-chain hash integration (deferred to issue #3)
- Approval/voting flow for amendments (deferred to issue #7)
- Gemini natural-language-to-structure formalization (deferred to issue #6)
- Collaborative real-time editing

## Decisions

### 1. Store contract content as Tiptap JSON, not HTML or Markdown

**Decision**: Persist `editor.getJSON()` output in Convex.

**Rationale**: Tiptap JSON is structured, diff-friendly, and round-trips perfectly back into the editor. HTML is fragile to sanitize and hard to diff. Markdown loses formatting fidelity. Tiptap JSON is the canonical format for Tiptap and avoids any serialization mismatch.

**Alternative considered**: Store as HTML — rejected because of XSS surface area and lossy re-parsing.

### 2. Mock version hash with `crypto.randomUUID()`

**Decision**: `storeContractVersion` generates a random UUID as `versionHash` until issue #3 provides real on-chain hashes.

**Rationale**: The UI and Convex layer can be fully built and tested now. The hash is just an opaque string identifier — swapping in a real Solana hash later requires only changing one line in the mutation.

**Alternative considered**: Block the feature on issue #3 — rejected because it creates unnecessary dependency and slows delivery.

### 3. Doubly linked list in Convex mirrors on-chain structure

**Decision**: Each `contractVersions` record stores `prevVersionHash: string | null` and `nextVersionHash: string | null`. Navigation queries look up records by hash.

**Rationale**: This mirrors the on-chain structure exactly, making the eventual integration with real hashes a drop-in. It also makes prev/next navigation a simple indexed query.

**Alternative considered**: Store a single ordered array of versions — rejected because it diverges from the on-chain model and complicates future reconciliation.

### 4. Tiptap StarterKit + minimal extensions

**Decision**: Use `@tiptap/starter-kit` (headings, bold, italic, lists, blockquote, code) plus `@tiptap/extension-placeholder`.

**Rationale**: StarterKit covers all formatting needs for a contract document. Additional extensions (tables, collaboration) can be added later without breaking existing content.

### 5. PDF extraction via Convex action calling Gemini

**Decision**: PDF bytes are uploaded from the browser, passed to a Convex action that calls the Gemini API (`gemini-1.5-flash`), and the extracted text is returned as a Tiptap-compatible document.

**Rationale**: Keeps API keys server-side in Convex. Gemini's multimodal capability handles PDF parsing without a separate parsing library.

**Alternative considered**: Parse PDF client-side with pdf.js then send text to Gemini — rejected because pdf.js adds bundle weight and Gemini handles raw PDF bytes directly.

## Risks / Trade-offs

- **Tiptap JSON schema changes** — if Tiptap releases breaking schema changes, stored documents may not render. Mitigation: pin Tiptap version; add a `tiptapVersion` field to the record for future migration.
- **Large contract documents** — Convex has a 1MB document limit. Rich text contracts are unlikely to approach this, but very long contracts with embedded images could. Mitigation: disallow image embeds in the editor; text-only contracts are well under the limit.
- **Mock hash collision** — UUIDs are not cryptographically linked to content, so two versions could theoretically have the same hash (astronomically unlikely). Mitigation: acceptable for development; replaced by deterministic on-chain hashes in production.
- **Gemini PDF extraction quality** — complex PDF layouts (tables, columns) may not extract cleanly. Mitigation: show the user the extracted content in the editor before saving so they can correct it.

## Open Questions

- Should the amendment flow (create a new version from the current one) require approval before `storeContractVersion` is called, or does saving immediately create a new version? (Approval flow is issue #7 — for now, saving always creates a new version.)
- What is the `poolId` foreign key structure? Contracts belong to a pool — this assumes a `pools` table exists or will exist. For now, `poolId` is a required string field and can be a placeholder.
