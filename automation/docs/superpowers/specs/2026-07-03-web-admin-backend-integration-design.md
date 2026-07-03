# Web Admin and Automation Backend Integration Design

## Objective

Replace the Next.js demo data and simulated generation behavior with a complete server-side integration to the existing FastAPI automation API. The web admin becomes the operational interface for dashboard data, generation batches, jobs, batik records, publication, wordlists, costume templates, and application settings.

The ComfyUI video prompt must use a portrait output of 720x1280 without audio.

## Scope

### Included

- Connect the Next.js web application to the existing FastAPI endpoints.
- Keep the Next.js email/password session as the browser-facing admin login.
- Store the FastAPI admin key only in the Next.js server environment.
- Replace local demo generation, history, and publication state with SQLite-backed API data.
- Show actual preview images, costume images, and silent videos returned by FastAPI.
- Provide admin interfaces for every currently available FastAPI admin API group.
- Use the public FastAPI batik API for the public gallery and detail page.
- Restore video workflow overrides and tests to 720x1280.

### Excluded

- Seamless-pattern generation, because no backend workflow or endpoint exists.
- AI upscaling, because no backend workflow or endpoint exists.
- Direct browser access to the FastAPI admin key.
- New ComfyUI workflow formats or generation algorithms.
- Changing the FastAPI response envelope solely to match the old demo web.

## Architecture

The browser communicates only with Next.js route handlers under `web/app/api`. Those route handlers act as a backend-for-frontend adapter:

1. Validate the existing Next.js admin session for protected operations.
2. Read `INTERNAL_API_URL` and `ADMIN_API_KEY` from the server environment.
3. Send `X-Admin-Key` to FastAPI for admin requests.
4. Convert FastAPI `{success, message, data}` responses into stable web-facing data.
5. Preserve FastAPI status codes and return readable connection or validation errors.

Public gallery requests also pass through Next.js route handlers but do not use an admin key.

The web must not use `NEXT_PUBLIC_*` variables for backend secrets. The obsolete `ADMIN_API_TOKEN` and `ALLOW_LOCAL_DEMO` variables are removed from the integration contract.

## API Mapping

### Dashboard

- `GET /api/admin/dashboard`

Displays total batik, published batik, active batches, queued jobs, running jobs, and failed jobs.

### Generation Batches and Jobs

- `POST /api/admin/generation-batches`
- `GET /api/admin/generation-batches`
- `GET /api/admin/generation-batches/{batch_id}`
- `POST /api/admin/generation-batches/{batch_id}/cancel`
- `POST /api/admin/generation-batches/{batch_id}/retry-failed`
- `GET /api/admin/generation-batches/{batch_id}/jobs`
- `GET /api/admin/generation-jobs/{job_id}`

The generation form exposes the backend contract directly: amount, mode, combine enabled, video enabled, costume template mode, selected template IDs, random seed, duplicate-prompt permission, and requested-by value. Fixed and mixed modes use wordlist item selections from the wordlist API.

Video generation requires combine and exactly one resolved costume template. The web enforces this before submission and still displays backend validation errors if server state changes.

Batch creation is asynchronous. After receiving a batch ID, the web polls batch and job endpoints until the batch reaches a terminal state. Polling stops when the page is left or the batch is complete, failed, or cancelled.

### Batik Management

- `GET /api/admin/batiks`
- `GET /api/admin/batiks/{batik_id}`
- `PATCH /api/admin/batiks/{batik_id}`
- `DELETE /api/admin/batiks/{batik_id}`
- `POST /api/admin/batiks/{batik_id}/publish`
- `POST /api/admin/batiks/{batik_id}/unpublish`
- `POST /api/admin/batiks/{batik_id}/regenerate-costume`
- `POST /api/admin/batiks/{batik_id}/regenerate-video`

Admin cards use the batik ID as the canonical identifier and display the actual `preview_url`, `costume_files`, `costume_urls`, and video URLs. Publication state comes from `is_published`, never local storage. Delete remains a soft delete performed by FastAPI.

### Wordlists

- `GET/POST/PATCH/DELETE /api/admin/wordlist-categories`
- `GET/POST/PATCH/DELETE /api/admin/wordlist-items`
- `POST /api/admin/wordlist-items/import`

The web provides category and item tables, active-state editing, weights, import, and validation feedback. Wordlist selections are reused by fixed and mixed generation modes.

### Costume Templates

- `GET/POST/PATCH/DELETE /api/admin/costume-templates`
- `POST /api/admin/costume-templates/upload`

The template interface supports image upload, metadata editing, active-state changes, ordering, and deletion. Generation template selectors only include active templates.

### Settings

- `GET /api/admin/settings`
- `PUT /api/admin/settings/{key}`

Settings are displayed and updated using their backend keys. The web does not invent settings that are absent from the API.

### Public Gallery

- `GET /api/v1/batiks`
- `GET /api/v1/batiks/search`
- `GET /api/v1/batiks/{batik_id}`

The Next.js public routes adapt `data.items` and `data.pagination` to gallery views. Only published batiks are returned by FastAPI. Static sample motifs are removed as a data source for gallery results.

## Web Information Architecture

The private admin area contains these operational views:

- Dashboard
- Generation
- Batches and jobs
- Batik results and publication
- Wordlists
- Costume templates
- Settings

The old seven-module studio is replaced. Generate, combine, and video are represented as options in one generation pipeline because that matches the durable worker model. Auto generation is represented by an amount greater than one. Seamless and upscaling controls are removed until corresponding backend workflows exist.

## Data Model Adaptation

Web types mirror the FastAPI schemas rather than the old `GenerationResult` demo shape. Shared adapters unwrap API responses and validate required fields before components consume them.

Image and video URL handling accepts absolute URLs returned by FastAPI and resolves relative URLs against `INTERNAL_API_URL` on the server. Components use real image and video elements with loading, empty, and error states.

Local storage may remain only for non-authoritative public preferences such as likes or bookmarks. It is not used for generation history, publication status, batches, jobs, or batik records.

## Authentication and Configuration

`web/.env.local` uses:

```env
INTERNAL_API_URL=http://127.0.0.1:8000
ADMIN_API_KEY=the-same-value-as-automation
ADMIN_EMAIL=admin@titikbatik.local
ADMIN_PASSWORD=replace-with-a-strong-password
ADMIN_SESSION_TOKEN=replace-with-a-long-random-session-token
```

`ADMIN_API_KEY` must match `automation/.env`. Next.js route handlers never return the key to the browser or log it.

## Error Handling

- FastAPI offline: return HTTP 503 with an Indonesian connection message.
- Invalid or missing admin key: preserve HTTP 401 and instruct the operator to check server configuration.
- FastAPI validation error: preserve the backend message and field errors.
- Empty lists: render a clear empty state without demo records.
- Failed jobs: show the stored error message and offer retry when allowed.
- Cancelled jobs: remain visible in history with their final status.
- ComfyUI offline: batch and jobs remain visible while the durable worker applies retry and recovery behavior.
- Image or video unavailable: show a media placeholder without discarding record metadata.

No request falls back to fabricated generation or gallery data.

## Video Workflow Correction

`WorkflowService.build_video_prompt` sets:

- Node `320:312` width to `720`.
- Node `320:299` height to `1280`.
- Audio input removed from the final video creation node.

Tests and documentation assert portrait 720x1280 silent output. Other video workflow parameters continue to follow `workflows/videobatik.json`.

## Testing

### Web

- API adapter tests for response unwrapping and error propagation.
- Route-handler tests for session protection and `X-Admin-Key` forwarding.
- Mapping tests for batik, batch, job, wordlist, template, and settings responses.
- Generation validation tests, including the exactly-one-template video rule.
- Component tests for loading, empty, success, failure, and media states where practical.
- ESLint, TypeScript, and production build.

### Automation

- Workflow prompt test for 720x1280 output and absent final audio input.
- Existing batch, recovery, storage, API, and worker tests remain passing.
- Alembic remains at the current head because this integration requires no database schema change.

## Acceptance Criteria

- Every current FastAPI admin API group has a usable web interface.
- All admin FastAPI requests originate from Next.js server route handlers with `X-Admin-Key`.
- The browser never receives the backend admin key.
- Generation creates real durable batches and displays live status and job errors.
- Batik publication and regeneration actions persist in SQLite.
- Public gallery and detail pages render only records returned by the public API.
- No demo fallback or simulated processing remains in the active web flow.
- Seamless and upscaling are absent until backend support exists.
- Video prompt output is 720x1280 and silent.
- Python tests, web lint, TypeScript checks, and production build pass.
