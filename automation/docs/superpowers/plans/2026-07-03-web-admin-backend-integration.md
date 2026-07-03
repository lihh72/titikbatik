# Web Admin and Automation Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Next.js demo behavior with a secure, complete interface for the existing FastAPI automation API and restore silent video output to 720x1280.

**Architecture:** Next.js route handlers form a backend-for-frontend boundary that stores `ADMIN_API_KEY` server-side and proxies authenticated requests to FastAPI with `X-Admin-Key`. Focused client modules consume the proxy, while separate operational components manage generation, batches, batiks, wordlists, templates, settings, and the public gallery.

**Tech Stack:** Next.js 16, React 19, TypeScript, FastAPI, SQLAlchemy, Vitest, Testing Library, pytest.

---

## File Structure

### Automation

- Modify `automation/app/services/workflow_service.py`: set final video prompt width and height.
- Modify `automation/tests/test_video_worker.py`: assert portrait 720x1280 silent output.
- Modify `automation/README.md`: document the corrected video dimensions.

### Web Integration Layer

- Modify `web/package.json`: add Vitest test scripts and dependencies.
- Create `web/vitest.config.ts`: configure the TypeScript alias and test environment.
- Create `web/test/setup.ts`: load DOM matchers.
- Create `web/lib/automation-types.ts`: mirror FastAPI response and domain schemas.
- Modify `web/lib/server-backend.ts`: implement safe server-side proxy behavior.
- Create `web/lib/automation-api.ts`: browser-side typed request functions.
- Create `web/app/api/automation/admin/[...path]/route.ts`: session-protected admin proxy.
- Create `web/app/api/automation/public/[...path]/route.ts`: public API proxy.
- Create `web/lib/__tests__/automation-api.test.ts`: response and error tests.
- Create `web/app/api/automation/admin/[...path]/route.test.ts`: session and key-forwarding tests.

### Web Admin Views

- Modify `web/components/admin-shell.tsx`: navigation for all real admin modules.
- Modify `web/components/admin-dashboard.tsx`: load actual dashboard data.
- Replace `web/components/explore-workspace.tsx`: real generation form and batch submission.
- Replace `web/components/history-page.tsx`: batch and job monitor.
- Replace `web/components/admin-gallery-page.tsx`: actual batik records and actions.
- Create `web/components/wordlist-admin.tsx`: category and item CRUD/import.
- Create `web/components/costume-template-admin.tsx`: upload and template management.
- Create `web/components/settings-admin.tsx`: settings editor.
- Create pages under `web/app/admin/(protected)` for wordlists, templates, and settings.
- Create focused component tests for generation validation and response rendering.

### Public Web and Cleanup

- Modify public gallery route handlers to call `/api/v1/batiks` through the public proxy.
- Modify `web/lib/data.ts`, gallery components, and media components to map real batik records.
- Modify `web/components/app-provider.tsx`: keep only non-authoritative browser preferences.
- Delete obsolete demo admin generation/history/gallery route handlers.
- Modify `web/.env.example` and `web/README.md`: document the real integration variables and commands.

---

### Task 1: Restore Portrait Video Output

**Files:**
- Modify: `automation/tests/test_video_worker.py`
- Modify: `automation/app/services/workflow_service.py`
- Modify: `automation/README.md`

- [ ] **Step 1: Change the workflow test to the approved dimensions**

Update the existing video prompt assertion to:

```python
assert prompt["320:312"]["inputs"]["value"] == 720
assert prompt["320:299"]["inputs"]["value"] == 1280
assert "audio" not in prompt["320:310"]["inputs"]
```

- [ ] **Step 2: Run the test and verify it fails**

Run from `automation`:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_video_worker.py -q
```

Expected: failure showing the current value is `512`.

- [ ] **Step 3: Restore the service overrides**

In `WorkflowService.build_video_prompt`, set:

```python
self._set_input(workflow, "320:312", "value", 720)
self._set_input(workflow, "320:299", "value", 1280)
```

Keep the existing removal of the final audio input.

- [ ] **Step 4: Update the backend README and rerun tests**

Replace all statements that promise 512x512 output with 720x1280 portrait output, then run:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_video_worker.py tests/test_workflow_service.py -q
```

Expected: all selected tests pass.

- [ ] **Step 5: Commit**

```powershell
git add automation/app/services/workflow_service.py automation/tests/test_video_worker.py automation/README.md
git commit -m "fix: restore portrait video output"
```

### Task 2: Add Typed API Contracts and Test Infrastructure

**Files:**
- Modify: `web/package.json`
- Create: `web/vitest.config.ts`
- Create: `web/test/setup.ts`
- Create: `web/lib/automation-types.ts`
- Create: `web/lib/__tests__/automation-types.test.ts`

- [ ] **Step 1: Install the test dependencies**

Run from `web`:

```powershell
npm.cmd install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Add scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 2: Configure Vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
  },
});
```

Create `test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Write failing contract tests**

Create tests that import the planned types and response helper:

```typescript
import { describe, expect, it } from "vitest";
import { unwrapAutomationResponse } from "@/lib/automation-types";

describe("unwrapAutomationResponse", () => {
  it("returns data from a successful FastAPI envelope", () => {
    expect(unwrapAutomationResponse({ success: true, message: "ok", data: { id: 4 } })).toEqual({ id: 4 });
  });

  it("throws the backend message for an error envelope", () => {
    expect(() => unwrapAutomationResponse({ success: false, message: "Invalid admin key", errors: {} }))
      .toThrow("Invalid admin key");
  });
});
```

- [ ] **Step 4: Run tests and verify the missing module failure**

```powershell
npm.cmd test -- automation-types.test.ts
```

Expected: failure because `automation-types.ts` does not exist.

- [ ] **Step 5: Implement complete domain contracts**

Create `automation-types.ts` with `AutomationResponse<T>`, `AutomationError`, `DashboardData`, `GenerationBatchCreate`, `GenerationBatchQueued`, `GenerationBatch`, `GenerationJob`, `Batik`, `CostumeFile`, `CostumeTemplate`, `WordlistCategory`, `WordlistItem`, `Pagination`, and `PublicBatikList`. Implement:

```typescript
export function unwrapAutomationResponse<T>(payload: AutomationResponse<T> | AutomationError): T {
  if (!payload.success) throw new Error(payload.message || "Permintaan backend gagal.");
  return payload.data;
}
```

Use snake_case field names matching Pydantic output so adapters do not silently rename backend state.

- [ ] **Step 6: Run tests and commit**

```powershell
npm.cmd test -- automation-types.test.ts
git add web/package.json web/package-lock.json web/vitest.config.ts web/test/setup.ts web/lib/automation-types.ts web/lib/__tests__/automation-types.test.ts
git commit -m "test: define automation API contracts"
```

Expected: contract tests pass.

### Task 3: Build Secure Next.js Proxy Routes

**Files:**
- Modify: `web/lib/server-backend.ts`
- Create: `web/app/api/automation/admin/[...path]/route.ts`
- Create: `web/app/api/automation/public/[...path]/route.ts`
- Create: `web/app/api/automation/admin/[...path]/route.test.ts`
- Modify: `web/.env.example`

- [ ] **Step 1: Write proxy route tests**

Mock `hasAdminSession` and global `fetch`. Verify:

```typescript
expect(response.status).toBe(401);
expect(fetch).not.toHaveBeenCalled();
```

for a missing session, and:

```typescript
expect(fetch).toHaveBeenCalledWith(
  "http://127.0.0.1:8000/api/admin/dashboard",
  expect.objectContaining({ headers: expect.objectContaining({ "X-Admin-Key": "secret" }) }),
);
```

for an authenticated request. Add a multipart test proving the original content type and bytes are forwarded.

- [ ] **Step 2: Run the route tests and verify failure**

```powershell
npm.cmd test -- route.test.ts
```

Expected: failure because the proxy route does not exist.

- [ ] **Step 3: Implement the server proxy helper**

Implement helpers that construct URLs, copy only safe request headers, set `X-Admin-Key`, preserve query strings, forward request bytes for non-GET methods, and return the backend body/status/content type. Reject missing `ADMIN_API_KEY` with HTTP 500 and return HTTP 503 when `fetch` cannot connect.

The required server variables are:

```env
INTERNAL_API_URL=http://127.0.0.1:8000
ADMIN_API_KEY=change-this-secret
```

- [ ] **Step 4: Implement catch-all admin and public routes**

The admin route must export `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`, call `hasAdminSession`, sanitize each path segment, and prefix FastAPI paths with `/api/admin/`.

The public route exports `GET`, does not require a session, allows only `batiks` paths, and prefixes paths with `/api/v1/`.

- [ ] **Step 5: Run tests and commit**

```powershell
npm.cmd test -- route.test.ts
git add web/lib/server-backend.ts web/app/api/automation web/.env.example
git commit -m "feat: proxy automation API securely"
```

Expected: all proxy tests pass and the key is present only in the server-side fetch call.

### Task 4: Add Typed Browser API Functions

**Files:**
- Create: `web/lib/automation-api.ts`
- Create: `web/lib/__tests__/automation-api.test.ts`

- [ ] **Step 1: Write failing API-client tests**

Mock browser `fetch` and assert:

```typescript
await listBatches({ limit: 20, offset: 0 });
expect(fetch).toHaveBeenCalledWith("/api/automation/admin/generation-batches?limit=20&offset=0", expect.any(Object));
```

Also test POST JSON, multipart upload, envelope unwrapping, HTTP 401, HTTP 422, and HTTP 503.

- [ ] **Step 2: Implement the request core and domain functions**

Use one request function:

```typescript
async function automationRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const payload = await response.json().catch(() => ({ success: false, message: "Respons backend tidak valid." }));
  if (!response.ok) throw new Error(payload.message ?? `Server mengembalikan status ${response.status}`);
  return unwrapAutomationResponse<T>(payload);
}
```

Export functions for every mapped dashboard, batch, job, batik, wordlist, template, setting, and public batik endpoint. Upload functions must pass `FormData` without manually setting `Content-Type`.

- [ ] **Step 3: Run tests and commit**

```powershell
npm.cmd test -- automation-api.test.ts
git add web/lib/automation-api.ts web/lib/__tests__/automation-api.test.ts
git commit -m "feat: add typed automation API client"
```

Expected: all API-client tests pass.

### Task 5: Implement Dashboard, Generation, and Batch Monitoring

**Files:**
- Modify: `web/components/admin-shell.tsx`
- Modify: `web/components/admin-dashboard.tsx`
- Replace: `web/components/explore-workspace.tsx`
- Replace: `web/components/history-page.tsx`
- Create: `web/components/__tests__/generation-form.test.tsx`

- [ ] **Step 1: Write failing generation validation tests**

Render the generation form with two active templates. Assert that enabling video automatically enables combine and requires `random_one` or exactly one selected template. Assert the submitted payload is:

```typescript
{
  amount: 1,
  mode: "random",
  combine_enabled: true,
  video_enabled: true,
  costume_template_mode: "random_one",
  costume_template_ids: [],
  allow_duplicate_prompts: false,
  requested_by: "web-admin"
}
```

- [ ] **Step 2: Replace simulated generation with durable batch submission**

The generation page loads active costume templates and wordlist values. It exposes backend fields, validates the video rule, submits with `createBatch`, displays the returned batch ID, and links to the batch monitor. Remove motif color controls that are not backed by wordlist items.

- [ ] **Step 3: Implement live batches and jobs**

The history page lists batches, loads jobs for the selected batch, polls every two seconds while status is queued or running, stops polling for terminal states, and exposes cancel and retry-failed actions. Show `error_message`, attempt count, job type, output filename, and ComfyUI prompt ID.

- [ ] **Step 4: Connect the dashboard and navigation**

Load `/dashboard`, render actual counters and ComfyUI/worker status, and add navigation entries for Generation, Batches, Batiks, Wordlists, Templates, and Settings. Remove references to seven simulated FR modules.

- [ ] **Step 5: Run tests, lint, and commit**

```powershell
npm.cmd test -- generation-form.test.tsx
npm.cmd run lint
npx.cmd tsc --noEmit
git add web/components/admin-shell.tsx web/components/admin-dashboard.tsx web/components/explore-workspace.tsx web/components/history-page.tsx web/components/__tests__/generation-form.test.tsx
git commit -m "feat: manage generation batches from web"
```

Expected: tests, lint, and TypeScript checks pass.

### Task 6: Implement Batik Result Management

**Files:**
- Replace: `web/components/admin-gallery-page.tsx`
- Create: `web/components/batik-media.tsx`
- Create: `web/components/__tests__/batik-admin.test.tsx`

- [ ] **Step 1: Write failing batik action tests**

Render one unpublished batik with a preview and costume. Verify the preview URL is used and clicking publish calls `publishBatik(12)`. Add tests for unpublish, delete confirmation, regenerate costume, regenerate video, loading, empty, and failed request states.

- [ ] **Step 2: Implement real batik cards and detail actions**

Load admin batiks from SQLite. Render actual preview, costume pairs, and silent video controls. Use `is_published` as the publication source of truth. Refresh the selected record after every mutation and do not update local state optimistically when the server fails.

- [ ] **Step 3: Run tests and commit**

```powershell
npm.cmd test -- batik-admin.test.tsx
npm.cmd run lint
npx.cmd tsc --noEmit
git add web/components/admin-gallery-page.tsx web/components/batik-media.tsx web/components/__tests__/batik-admin.test.tsx
git commit -m "feat: manage generated batiks from web"
```

Expected: tests, lint, and TypeScript checks pass.

### Task 7: Implement Wordlists, Costume Templates, and Settings

**Files:**
- Create: `web/components/wordlist-admin.tsx`
- Create: `web/components/costume-template-admin.tsx`
- Create: `web/components/settings-admin.tsx`
- Create: `web/app/admin/(protected)/wordlists/page.tsx`
- Create: `web/app/admin/(protected)/templates/page.tsx`
- Create: `web/app/admin/(protected)/settings/page.tsx`
- Create: `web/components/__tests__/admin-resources.test.tsx`

- [ ] **Step 1: Write failing resource-management tests**

Verify category creation and active toggling, item creation and weight editing, newline import with replace mode, image upload using `FormData`, template active toggling, ordering, deletion, and JSON setting save.

- [ ] **Step 2: Implement wordlist management**

Render category and item tables with category filtering. Forms use exact backend fields. Parse import text into trimmed non-empty lines before sending `{category_code, items, replace}`. Display validation errors without losing form content.

- [ ] **Step 3: Implement costume-template management**

Render template metadata and image previews from `/api/v1/images/template/{filename}`. Upload with file, name, description, active state, and sort order. Support metadata updates, active toggles, and soft deletion.

- [ ] **Step 4: Implement settings management**

Render existing setting keys and their JSON values. Validate edited text with `JSON.parse`, then send the parsed object to `PUT /settings/{key}`. Do not allow empty keys or non-object JSON values.

- [ ] **Step 5: Run tests and commit**

```powershell
npm.cmd test -- admin-resources.test.tsx
npm.cmd run lint
npx.cmd tsc --noEmit
git add web/components/wordlist-admin.tsx web/components/costume-template-admin.tsx web/components/settings-admin.tsx "web/app/admin/(protected)/wordlists/page.tsx" "web/app/admin/(protected)/templates/page.tsx" "web/app/admin/(protected)/settings/page.tsx" web/components/__tests__/admin-resources.test.tsx
git commit -m "feat: manage automation resources from web"
```

Expected: tests, lint, and TypeScript checks pass.

### Task 8: Connect the Public Gallery and Remove Demo State

**Files:**
- Modify: `web/app/api/public/gallery/route.ts`
- Modify: `web/app/api/public/gallery/[id]/route.ts`
- Modify: `web/components/gallery-page.tsx`
- Modify: `web/components/gallery-detail-page.tsx`
- Modify: `web/components/motif-card.tsx`
- Modify: `web/components/motif-detail.tsx`
- Modify: `web/lib/data.ts`
- Modify: `web/components/app-provider.tsx`
- Delete: `web/app/api/admin/generate/route.ts`
- Delete: `web/app/api/admin/history/route.ts`
- Delete: `web/app/api/admin/gallery/[id]/route.ts`
- Create: `web/components/__tests__/public-gallery.test.tsx`

- [ ] **Step 1: Write failing gallery mapping tests**

Mock a public `Batik` response and verify cards use `keyword`, `style`, `warna`, `preview_url`, and numeric ID. Verify an empty API response produces an empty state and does not insert static sample motifs.

- [ ] **Step 2: Adapt public routes and components**

Map FastAPI `data.items` plus pagination to the gallery and map `data` to detail. Use `/api/automation/public/batiks` and `/api/automation/public/batiks/{id}`. Render real media and metadata; do not synthesize prices, likes, origin, license, or SVG artwork.

- [ ] **Step 3: Remove authoritative local demo state**

Delete local generation history and publication storage from `AppProvider`. Keep only likes and bookmarks if the public components still use them. Delete demo route handlers and local fallback generation.

- [ ] **Step 4: Run tests and commit**

```powershell
npm.cmd test -- public-gallery.test.tsx
npm.cmd run lint
npx.cmd tsc --noEmit
git add -A -- web/app/api web/components web/lib
git commit -m "feat: serve gallery from automation API"
```

Expected: tests, lint, and TypeScript checks pass with no demo records in API-driven views.

### Task 9: Documentation and End-to-End Verification

**Files:**
- Modify: `web/README.md`
- Modify: `web/.env.example`
- Modify: `automation/README.md`

- [ ] **Step 1: Document the exact environment and startup flow**

Document matching `ADMIN_API_KEY` values, two-terminal startup, ComfyUI requirements, the asynchronous batch lifecycle, public gallery publication behavior, and 720x1280 silent video output. Remove `ADMIN_API_TOKEN`, `ALLOW_LOCAL_DEMO`, and demo backend references.

- [ ] **Step 2: Run all backend verification**

From `automation`:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe scripts/inspect_workflows.py
```

Expected: all tests pass, migration is `20260701_0002 (head)`, and all three workflows inspect successfully.

- [ ] **Step 3: Run all web verification**

From `web`:

```powershell
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Expected: all tests pass, lint has no errors, TypeScript exits zero, and the production build succeeds.

- [ ] **Step 4: Smoke-test the running applications**

Start automation and web, then verify:

```text
GET http://127.0.0.1:8000/health -> 200
GET http://localhost:3000/gallery -> 200
GET http://localhost:3000/admin/login -> 200
Authenticated GET /api/automation/admin/dashboard -> 200
Unauthenticated GET /api/automation/admin/dashboard -> 401
```

Confirm an admin can create a batch while ComfyUI is offline and can see the queued/retry status without fabricated output.

- [ ] **Step 5: Check the final diff and commit**

```powershell
git diff --check
git status --short
git add web/README.md web/.env.example automation/README.md
git commit -m "docs: explain integrated web admin"
```

Expected: only unrelated user reports and output files remain untracked.
