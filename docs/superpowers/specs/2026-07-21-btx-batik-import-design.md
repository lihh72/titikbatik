# BTX Batik Import Design

## Purpose

Add an administrator-controlled importer for the BTX Batik API at
`https://btx.agunghakase.my.id/api/batik/`. The importer downloads source
records and their available media into TitikBatik, makes imported work
available to the public gallery, and prevents duplicate records or duplicate
media on later imports.

## Scope

- Admin starts an import and selects the maximum number of batik/costume pairs
  to process.
- The backend fetches BTX catalogue JSON, normalizes records, downloads media,
  and creates published TitikBatik records.
- The importer makes records resilient to missing optional fields, including
  source slugs and video URLs.
- Public gallery ordering puts records with a video visualizer before records
  without one.
- Admin receives a final per-run summary of imported, skipped, and failed
  records.

## Explicit Non-goals

- No automatic scheduled import.
- No source record deletion or overwrite of manually curated TitikBatik
  metadata after the initial import.
- No reliance on externally hosted media after an import completes.
- No requirement that an imported batik has a video. Batik and costume media
  without a video remain valid public records.

## Source API Handling

`/api/batik/getall` is a bulk endpoint. It can respond slowly because it
serializes the source database into one large JSON response. The importer must
therefore:

1. Use a configurable, extended read timeout for catalogue retrieval.
2. Fetch the catalogue once per import run rather than once per selected item.
3. Cap work after normalization to the administrator-selected pair limit.
4. Surface a clear "retrieving source catalogue" phase in the import status.
5. Fail a catalogue request with a useful timeout/error summary without
   partially creating records.

The BTX response adapter is deliberately defensive. It accepts list payloads
directly and common list wrappers (`data`, `items`, `results`), and isolates
field aliases in one mapping module. Once a record is selected, individual
media failures are recorded and do not cancel remaining records.

## Data Model

### Import identity

Add an optional, unique source identity to a batik record:

- `source_provider`: fixed value `btx` for this importer.
- `source_id`: the BTX record identifier when supplied.
- `source_media_hash`: deterministic fallback derived from the normalized
  primary preview URL when no source identifier exists.

The importer looks up `source_provider + source_id` first. When a source ID is
unavailable, it looks up `source_provider + source_media_hash`. A matching
record is skipped, never duplicated.

### Normalized batik record

Each selected source record produces:

- `keyword`: source title/name/keyword, with a safe descriptive fallback.
- `slug`: source slug if valid and unused; otherwise a slugified keyword with
  a deterministic source-ID or content suffix on collision.
- `warna`, `style`, prompts, seed, and source creation date when present.
- `file_preview`: a locally downloaded preview image; a record without a
  usable preview is reported as failed and not created.
- `file_video`: a locally downloaded video only when the source provides one.
- `costume_files`: zero or more downloaded costume images and any costume
  video supplied by the source.
- `is_published`: `true` for successful imports.

Downloaded files retain an extension inferred from the source Content-Type or
URL and are named from the normalized source identity to avoid collisions.

## Backend Design

### Import service

Create a focused BTX import service with four separable responsibilities:

1. Fetch and unwrap the external catalogue.
2. Normalize one external record into a validated internal import candidate.
3. Download and validate one media asset into the existing local storage
   directories.
4. Persist one candidate transactionally after duplicate checks.

The import service returns a structured summary: requested limit, examined,
imported, skipped as duplicates, failed, and compact errors keyed by source
identity. It does not expose source URLs or files through the public API unless
they have been downloaded into existing TitikBatik media storage.

### Admin API

Add an authenticated endpoint under `/api/admin/` accepting a positive,
bounded pair limit. It invokes the importer and returns the import summary.
Only the existing server-side admin key can call it; the public Next.js proxy
continues to keep that key out of the browser.

## Admin Experience

Add an **Import BTX** control to the existing protected Admin Gallery page:

- Numeric input for max pairs, with a conservative default and client-side
  bounds mirrored by the backend.
- Primary action labelled for the source import.
- Busy state that names the catalogue retrieval phase before item processing.
- Success panel showing counts for imported, skipped duplicate, and failed.
- Error panel that keeps the existing gallery usable and explains when the
  bulk `getall` request timed out.
- Refresh the admin gallery only after an import result is returned.

No external source secrets are sent to the browser.

## Public Gallery Ordering

Public list and search queries order by:

1. Records whose `file_video` is present, non-empty, and not deleted.
2. `created_at` descending.
3. `id` descending as a stable tie-breaker.

The same ordering applies to normal gallery listings, searches, and the home
page's latest published works, so video-backed works consistently lead each
surface.

## Errors and Recovery

- Catalogue request failure: no records are written; admin receives a single
  actionable error.
- Invalid source record or required preview failure: record is counted as
  failed; other records continue.
- Duplicate record: no media is downloaded again when identity is already
  known; record is counted as skipped.
- Database write failure after new media download: remove the just-downloaded
  assets before reporting failure.
- A repeated import is idempotent for successfully persisted source records.

## Test Plan

- Unit tests for wrapped/unwrapped BTX payloads, field aliases, slug fallback,
  and media filename inference.
- Service tests covering source-ID deduplication, URL-hash fallback,
  per-record media failures, and no partial writes on catalogue failure.
- Router tests for admin authorization, limit validation, and summary shape.
- Repository tests proving video-first ordering for both list and search.
- Component tests for pair-limit submission, disabled busy state, result
  summary, and error feedback.

## Acceptance Criteria

- An admin can import a selected number of BTX batik/costume pairs.
- Successful import produces local media and published records.
- Re-running the same import creates no duplicates.
- Missing source slug receives a valid, unique local slug.
- Records without video remain visible, but video-backed records appear first
  in the public gallery.
- A slow or failed `getall` request is visibly explained and does not corrupt
  existing data.
