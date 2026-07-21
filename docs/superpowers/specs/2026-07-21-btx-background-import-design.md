# BTX Background Import Design

## Goal

Move BTX catalogue imports out of the admin HTTP request so an admin can close Admin Gallery while the import continues and later inspect the one persisted import job.

## Scope

- Keep exactly one BTX import job record: the current active job or the most recently finished job.
- Use the existing Python worker process and its locking/retry conventions.
- Persist progress after each catalogue record so the UI can show accurate status after refresh or reconnect.
- Preserve current import behavior: BTX `getall` is fetched once, duplicate source records are skipped, preview/costume/video media are downloaded, and batiks with video remain first in gallery ordering.
- Do not change generation batch or ComfyUI job behavior.

## Architecture

Add a dedicated `btx_import_jobs` table rather than placing imports in `generation_jobs`. Generation jobs require a batch, carry ComfyUI-specific fields, and feed generation metrics; importing external media does neither.

`BtxImportJob` has one logical singleton record. It stores `id`, `status`, `requested_limit`, `examined`, `imported`, `skipped_duplicates`, `failed`, `errors_json`, lock fields, retry metadata, and lifecycle timestamps. Status values are `queued`, `claimed`, `running`, `retry_wait`, `completed`, and `failed`.

The existing worker claims BTX work through a dedicated repository method in the same loop that claims generation jobs. It fetches the catalogue once, processes candidates one at a time, and commits progress after every candidate. A catalogue-level failure is retried by the job retry policy. A candidate-level media/data failure increments `failed`, appends a bounded error message, and continues with the next candidate.

## API

- `POST /api/admin/batik-imports/btx` accepts `{ limit }`, upserts the singleton job, and returns its current state immediately. If a job is queued, claimed, running, or retrying, it returns that job unchanged rather than queueing a second import.
- `GET /api/admin/batik-imports/btx` returns the singleton job or `null` if no import has ever been requested.
- Both routes remain behind the existing admin API-key proxy.

## Admin Gallery

The import panel keeps the requested-pair input, but its action becomes `Antrekan impor BTX`. Once queued, the page displays status, progress (`examined / requested_limit`), imported/skipped/failed totals, and concise candidate errors. It polls the status endpoint every two seconds while active and refreshes the gallery after completion. The admin may close the page at any time because the server-side worker owns the job.

The existing warning remains: `getall` can take time because BTX returns its full catalogue JSON before the selected number of records is processed.

## Failure and Recovery

- A stale `claimed` or `running` import job is released back to `retry_wait` when the worker starts, matching generation-job recovery.
- The worker retries catalogue-level failures up to three attempts with bounded backoff, then marks the job failed with its error message.
- Individual malformed records or media failures do not fail the whole job; they are recorded and the job continues.
- Starting a new import after a terminal state replaces the singleton record and clears previous counters/errors.

## Testing

- Repository tests cover singleton creation, active-job reuse, job claiming, and stale-lock recovery.
- Service tests cover progress persistence, candidate failure continuation, and terminal completion.
- Router tests cover immediate queue response and current-job lookup.
- Worker tests cover the BTX dispatch branch without touching ComfyUI.
- Admin Gallery tests cover queue action, visible progress, and terminal refresh behavior.
