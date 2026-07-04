# Gallery Media Carousel and Batik Slugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti URL detail galeri berbasis ID dengan slug permanen dan menampilkan preview, costume, serta video dalam satu viewer dengan thumbnail berukuran seragam.

**Architecture:** Backend menyimpan slug unik pada tabel `batiks`, membentuknya melalui utilitas normalisasi bersama, dan menyediakan lookup publik berdasarkan slug sementara endpoint admin tetap memakai ID. Frontend menerima slug dari daftar API, memakai route dinamis `[slug]`, dan mengubah `BatikMedia` menjadi media viewer stateful dengan slider thumbnail horizontal berasio tetap.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, SQLite, Pydantic, pytest, Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, Lucide React.

---

## File Map

- Create `automation/app/utils/slugs.py`: normalisasi keyword dan pemilihan suffix unik yang bersifat murni/deterministik.
- Create `automation/alembic/versions/20260704_0003_batik_slugs.py`: tambah kolom, backfill data lama, unique index, dan constraint non-null.
- Create `automation/tests/test_batik_slugs.py`: unit, migration, repository, API, generation, dan import coverage untuk slug.
- Modify `automation/app/models/batik.py`: deklarasi kolom `slug`.
- Modify `automation/app/repositories/batik_repository.py`: alokasi dan lookup slug.
- Modify `automation/app/services/generation_service.py`: memberi slug pada output worker.
- Modify `automation/app/services/legacy_import_service.py`: memberi slug pada data legacy.
- Modify `automation/scripts/seed_dummy_data.py`: menyimpan slug data lokal.
- Modify `automation/app/schemas/batik.py`: menyertakan slug pada response modern.
- Modify `automation/app/routers/public_batik.py`: lookup detail berdasarkan slug.
- Modify `automation/tests/test_video_api.py`, `automation/tests/test_video_generation_service.py`, dan `automation/tests/test_video_worker.py`: menyesuaikan fixture model wajib slug.
- Modify `automation/README.md`: mendokumentasikan endpoint slug dan perintah migrasi.
- Modify `web/lib/automation-types.ts`: menambahkan `slug` pada tipe `Batik`.
- Modify `web/lib/automation-api.ts`: detail publik menerima slug.
- Modify `web/lib/__tests__/automation-api.test.ts`: menguji URL detail berbasis slug.
- Modify `web/components/motif-card.tsx`: tautan kartu berbasis slug.
- Modify `web/components/gallery-detail-page.tsx`: fetch detail tanpa konversi angka.
- Create `web/app/(public)/gallery/[slug]/page.tsx`: route detail baru.
- Delete `web/app/(public)/gallery/[id]/page.tsx`: menghapus route ID lama.
- Modify `web/components/__tests__/public-gallery.test.tsx`: fixture dan assertion tautan slug.
- Modify `web/components/batik-media.tsx`: viewer tunggal dan thumbnail slider.
- Modify `web/components/__tests__/batik-media.test.tsx`: interaksi media, ukuran seragam, dan video non-autoplay.

### Task 1: Slug Utility, Model, and Migration

**Files:**
- Create: `automation/app/utils/slugs.py`
- Create: `automation/alembic/versions/20260704_0003_batik_slugs.py`
- Create: `automation/tests/test_batik_slugs.py`
- Modify: `automation/app/models/batik.py`

- [ ] **Step 1: Write failing utility tests**

Add these tests to `automation/tests/test_batik_slugs.py`:

```python
from app.utils.slugs import deduplicate_slug, slugify_batik


def test_slugify_batik_normalizes_keyword_and_numeric_values():
    assert slugify_batik("  Kawung Geometris -- Biru! ") == "kawung-geometris-biru"
    assert slugify_batik("10") == "batik-10"
    assert slugify_batik("!!!") == "batik"


def test_deduplicate_slug_uses_incrementing_suffix():
    used = {"kawung", "kawung-2", "kawung-3"}
    assert deduplicate_slug("kawung", used) == "kawung-4"
```

- [ ] **Step 2: Run utility tests and confirm they fail**

Run from `automation`:

```powershell
pytest tests/test_batik_slugs.py -q
```

Expected: collection fails because `app.utils.slugs` does not exist.

- [ ] **Step 3: Implement the pure slug utility**

Create `automation/app/utils/slugs.py`:

```python
import re
import unicodedata
from collections.abc import Collection


MAX_SLUG_LENGTH = 220


def slugify_batik(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")
    slug = slug[:MAX_SLUG_LENGTH].rstrip("-") or "batik"
    return f"batik-{slug}" if slug.isdigit() else slug


def deduplicate_slug(base: str, used: Collection[str]) -> str:
    if base not in used:
        return base
    counter = 2
    while f"{base}-{counter}" in used:
        counter += 1
    return f"{base}-{counter}"
```

- [ ] **Step 4: Add the model field and migration test**

Add to `Batik` in `automation/app/models/batik.py`:

```python
slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
```

Extend `automation/tests/test_batik_slugs.py` with a real Alembic round-trip on a temporary SQLite database:

```python
import sqlite3
from pathlib import Path

from alembic import command
from alembic.config import Config
from app.core.config import get_settings


def test_slug_migration_backfills_unique_values(tmp_path, monkeypatch):
    database = tmp_path / "migration.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{database.as_posix()}")
    get_settings.cache_clear()
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("script_location", str(Path(__file__).parents[1] / "alembic"))
    command.upgrade(config, "20260701_0002")
    with sqlite3.connect(database) as connection:
        connection.executemany(
            """INSERT INTO batiks
               (keyword, warna, style, seed, positive_prompt, negative_prompt,
                file_preview, prompt_hash, is_published, created_at, updated_at)
               VALUES (?, 'biru', 'modern', 1, 'p', 'n', ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)""",
            [
                ("Kawung", "one.webp", "hash-one"),
                ("Kawung", "two.webp", "hash-two"),
                ("10", "three.webp", "hash-three"),
            ],
        )
    command.upgrade(config, "head")
    with sqlite3.connect(database) as connection:
        rows = connection.execute("SELECT slug FROM batiks ORDER BY id").fetchall()
        indexes = connection.execute("PRAGMA index_list('batiks')").fetchall()
    get_settings.cache_clear()
    assert rows == [("kawung",), ("kawung-2",), ("batik-10",)]
    assert any(index[2] == 1 for index in indexes)
```

- [ ] **Step 5: Implement the migration**

Create `automation/alembic/versions/20260704_0003_batik_slugs.py`. Keep revision logic deterministic by ordering existing records by ID:

```python
"""add permanent batik slugs"""

from alembic import op
import sqlalchemy as sa

from app.utils.slugs import deduplicate_slug, slugify_batik


revision = "20260704_0003"
down_revision = "20260701_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("batiks", sa.Column("slug", sa.String(length=255), nullable=True))
    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, keyword FROM batiks ORDER BY id")).mappings()
    used: set[str] = set()
    for row in rows:
        slug = deduplicate_slug(slugify_batik(row["keyword"]), used)
        used.add(slug)
        connection.execute(sa.text("UPDATE batiks SET slug=:slug WHERE id=:id"), {"slug": slug, "id": row["id"]})
    with op.batch_alter_table("batiks") as batch_op:
        batch_op.alter_column("slug", existing_type=sa.String(length=255), nullable=False)
        batch_op.create_index("ix_batiks_slug", ["slug"], unique=True)


def downgrade() -> None:
    with op.batch_alter_table("batiks") as batch_op:
        batch_op.drop_index("ix_batiks_slug")
        batch_op.drop_column("slug")
```

- [ ] **Step 6: Run focused tests**

Run from `automation`:

```powershell
pytest tests/test_batik_slugs.py -q
```

Expected: utility and migration tests pass.

- [ ] **Step 7: Commit the slug foundation**

```powershell
git add automation/app/utils/slugs.py automation/app/models/batik.py automation/alembic/versions/20260704_0003_batik_slugs.py automation/tests/test_batik_slugs.py
git commit -m "feat: add permanent batik slugs"
```

### Task 2: Slug Creation Paths and Public API

**Files:**
- Modify: `automation/app/repositories/batik_repository.py`
- Modify: `automation/app/services/generation_service.py`
- Modify: `automation/app/services/legacy_import_service.py`
- Modify: `automation/scripts/seed_dummy_data.py`
- Modify: `automation/app/schemas/batik.py`
- Modify: `automation/app/routers/public_batik.py`
- Modify: `automation/tests/test_batik_slugs.py`
- Modify: `automation/tests/test_video_api.py`
- Modify: `automation/tests/test_video_generation_service.py`
- Modify: `automation/tests/test_video_worker.py`

- [ ] **Step 1: Write failing repository and public API tests**

Extend `automation/tests/test_batik_slugs.py` with a complete model helper and repository allocation test:

```python
import uuid

import pytest

from app.models import Batik
from app.repositories.batik_repository import BatikRepository


def make_batik(*, slug: str, keyword: str = "Kawung", is_published: bool = True) -> Batik:
    return Batik(
        slug=slug,
        keyword=keyword,
        warna="biru",
        style="modern",
        seed=1,
        positive_prompt="batik kawung",
        negative_prompt="blur",
        file_preview=f"{uuid.uuid4().hex}.webp",
        prompt_hash=uuid.uuid4().hex,
        is_published=is_published,
    )


@pytest.mark.asyncio
async def test_repository_allocates_next_available_slug(session):
    session.add_all([
        make_batik(slug="kawung"),
        make_batik(slug="kawung-2"),
        make_batik(slug="kawung-3"),
    ])
    await session.flush()

    slug = await BatikRepository().next_slug(session, "Kawung")

    assert slug == "kawung-4"
```

Add the public API behavior test to `automation/tests/test_video_api.py`, which already supplies `client` and `session` fixtures:

```python
@pytest.mark.asyncio
async def test_public_detail_uses_slug_and_hides_unpublished(client, session):
    published = Batik(
        slug="kawung-biru", keyword="Kawung Biru", warna="biru", style="modern",
        seed=1, positive_prompt="batik kawung", negative_prompt="blur",
        file_preview="kawung-biru.webp", prompt_hash=uuid.uuid4().hex, is_published=True,
    )
    hidden = Batik(
        slug="kawung-rahasia", keyword="Kawung Rahasia", warna="biru", style="modern",
        seed=2, positive_prompt="batik kawung", negative_prompt="blur",
        file_preview="kawung-rahasia.webp", prompt_hash=uuid.uuid4().hex, is_published=False,
    )
    session.add_all([published, hidden])
    await session.commit()

    found = await client.get("/api/v1/batiks/kawung-biru")
    hidden_response = await client.get("/api/v1/batiks/kawung-rahasia")
    numeric_response = await client.get("/api/v1/batiks/10")

    assert found.status_code == 200
    assert found.json()["data"]["slug"] == "kawung-biru"
    assert hidden_response.status_code == 404
    assert numeric_response.status_code == 404
```

Also add explicit creation-path tests to `automation/tests/test_batik_slugs.py`:

```python
from unittest.mock import AsyncMock

from app.models import GenerationJob
from app.services.generation_service import GenerationService
from app.services.legacy_import_service import LegacyImportService
from app.utils.time import utcnow


@pytest.mark.asyncio
async def test_generation_service_assigns_repository_slug(session):
    repository = BatikRepository()
    repository.next_slug = AsyncMock(return_value="kawung-biru")
    service = GenerationService(batik_repository=repository)
    job = GenerationJob(
        id=str(uuid.uuid4()),
        batch_id=str(uuid.uuid4()),
        sequence_number=1,
        job_type="generate",
        status="running",
        max_attempts=3,
        seed=42,
        workflow_name="generatebatik",
        prompt_hash=uuid.uuid4().hex,
        positive_prompt="batik kawung",
        negative_prompt="blur",
        available_at=utcnow(),
        settings_json={"keyword": "Kawung Biru", "warna": "biru", "style": "modern"},
    )

    batik = await service.create_batik_from_job(session, job, file_preview="generated.webp")

    repository.next_slug.assert_awaited_once_with(session, "Kawung Biru")
    assert batik.slug == "kawung-biru"


class FakeLegacyResponse:
    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return {"batiks": [{
            "id": 7,
            "keyword": "Parang Emas",
            "warna": "emas",
            "style": "tradisional",
            "seed": 7,
            "file_preview": "legacy.webp",
            "file_costume": None,
            "file_video": None,
        }]}


class FakeLegacyClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def get(self, path, params=None):
        return FakeLegacyResponse()


@pytest.mark.asyncio
async def test_legacy_import_assigns_repository_slug(session, monkeypatch):
    repository = BatikRepository()
    repository.next_slug = AsyncMock(return_value="parang-emas")
    monkeypatch.setattr(
        "app.services.legacy_import_service.httpx.AsyncClient",
        lambda **kwargs: FakeLegacyClient(),
    )
    service = LegacyImportService(batik_repository=repository)

    result = await service.import_pages(session, max_pages=1)

    imported = await session.scalar(select(Batik).where(Batik.file_preview == "legacy.webp"))
    assert result["imported"] == 1
    assert imported is not None
    assert imported.slug == "parang-emas"
```

Add `select` to the existing SQLAlchemy imports in this test file. These tests keep worker and import behavior explicit rather than relying only on schema validation.

- [ ] **Step 2: Run the focused tests and confirm failures**

```powershell
pytest tests/test_batik_slugs.py -q
```

Expected: failures because repository lookup/allocation, schema, router, and creation paths do not yet expose slug.

- [ ] **Step 3: Add repository slug allocation and lookup**

Modify `automation/app/repositories/batik_repository.py`; add these methods inside `BatikRepository`:

```python
from app.utils.slugs import deduplicate_slug, slugify_batik


async def next_slug(self, session: AsyncSession, keyword: str) -> str:
    base = slugify_batik(keyword)
    existing = set(
        (await session.scalars(select(Batik.slug).where(Batik.slug.like(f"{base}%")))).all()
    )
    return deduplicate_slug(base, existing)


async def get_by_slug(self, session: AsyncSession, slug: str) -> Batik | None:
    stmt = (
        select(Batik)
        .options(selectinload(Batik.costume_files).selectinload(BatikCostumeFile.template))
        .where(Batik.slug == slug, Batik.deleted_at.is_(None))
    )
    return await session.scalar(stmt)
```

Keep the existing integer `get` method unchanged for admin operations.

- [ ] **Step 4: Assign slug in every creation path**

Import `BatikRepository`, add `batik_repository: BatikRepository | None = None` to `GenerationService.__init__`, and assign `self.batik_repository = batik_repository or BatikRepository()`. Replace `create_batik_from_job` with:

```python
async def create_batik_from_job(
    self,
    session: AsyncSession,
    job: GenerationJob,
    *,
    file_preview: str,
) -> Batik:
    meta = job.settings_json or {}
    keyword = meta.get("keyword", "batik pattern")
    batik = Batik(
        slug=await self.batik_repository.next_slug(session, keyword),
        keyword=keyword,
        warna=meta.get("warna", ""),
        style=meta.get("style", ""),
        seed=job.seed or 0,
        positive_prompt=job.positive_prompt or "",
        negative_prompt=job.negative_prompt or "",
        file_preview=file_preview,
        prompt_hash=job.prompt_hash or "",
        generation_job_id=job.id,
        is_published=True,
    )
    session.add(batik)
    await session.flush()
    return batik
```

In `LegacyImportService`, import `BatikRepository`, add optional constructor injection, and calculate keyword/slug immediately before constructing `Batik`:

```python
keyword = item.get("keyword") or ""
slug = await self.batik_repository.next_slug(session, keyword)
batik = Batik(
    slug=slug,
    keyword=keyword,
    warna=item.get("warna") or "",
    style=item.get("style") or "",
    seed=int(item.get("seed") or 0),
    positive_prompt=keyword,
    negative_prompt="",
    file_preview=preview_name,
    file_video=item.get("file_video"),
    prompt_hash=stable_hash({"legacy_id": item.get("id"), "file_preview": preview_name}),
    is_published=True,
)
```

The constructor becomes:

```python
def __init__(
    self,
    settings: Settings | None = None,
    storage: StorageService | None = None,
    batik_repository: BatikRepository | None = None,
) -> None:
    self.settings = settings or get_settings()
    self.storage = storage or StorageService(self.settings)
    self.batik_repository = batik_repository or BatikRepository()
```

In `automation/scripts/seed_dummy_data.py`, include `slug` in the raw SQL insert and update clauses, using the existing `item["slug"]`. This keeps repeat runs idempotent.

- [ ] **Step 5: Expose and resolve slug in the public API**

Add `slug: str` to `BatikRead` in `automation/app/schemas/batik.py`.

Change only the public detail route in `automation/app/routers/public_batik.py`:

```python
@router.get("/{slug}")
async def get_batik(slug: str, session: AsyncSession = Depends(get_session)):
    item = await repository.get_by_slug(session, slug)
    if not item or not item.is_published:
        raise NotFoundError("Batik not found")
    image_service.enrich_batik(item)
    return ok(BatikRead.model_validate(item).model_dump(mode="json"))
```

Keep `/search` declared before `/{slug}` so the static search route remains reachable.

- [ ] **Step 6: Update direct Batik test fixtures**

Add deterministic `slug="kawung"` values to each direct `Batik(...)` constructor in:

```text
automation/tests/test_video_api.py
automation/tests/test_video_generation_service.py
automation/tests/test_video_worker.py
```

Where one test creates multiple batiks in one database, use `slug=f"kawung-{uuid.uuid4().hex}"` to satisfy the unique index.

- [ ] **Step 7: Run backend tests**

```powershell
pytest -q
```

Expected: all backend tests pass, including the new public slug tests and existing admin ID tests.

- [ ] **Step 8: Commit backend slug integration**

```powershell
git add automation/app automation/scripts/seed_dummy_data.py automation/tests
git commit -m "feat: serve public batiks by slug"
```

### Task 3: Frontend Slug Routes

**Files:**
- Modify: `web/lib/automation-types.ts`
- Modify: `web/lib/automation-api.ts`
- Modify: `web/lib/__tests__/automation-api.test.ts`
- Modify: `web/components/motif-card.tsx`
- Modify: `web/components/gallery-detail-page.tsx`
- Modify: `web/components/__tests__/public-gallery.test.tsx`
- Create: `web/app/(public)/gallery/[slug]/page.tsx`
- Delete: `web/app/(public)/gallery/[id]/page.tsx`

- [ ] **Step 1: Write failing API and gallery-link tests**

Add `slug: "kawung-indigo"` to every frontend `Batik` fixture. In `web/lib/__tests__/automation-api.test.ts`, import `getPublicBatik` and add:

```typescript
it("loads a public batik by encoded slug", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ success: true, message: "ok", data: batik }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  await getPublicBatik("kawung biru");

  expect(fetchMock).toHaveBeenCalledWith(
    "/api/automation/public/batiks/kawung%20biru",
    expect.objectContaining({ cache: "no-store" }),
  );
});
```

In `web/components/__tests__/public-gallery.test.tsx`, assert both detail links resolve to `/gallery/kawung-indigo` and never `/gallery/12`.

- [ ] **Step 2: Run tests and confirm they fail**

Run from `web`:

```powershell
npm test -- automation-api.test.ts public-gallery.test.tsx
```

Expected: failures because `Batik` has no slug and links/client still use ID.

- [ ] **Step 3: Update the API type and client**

Add to `Batik` in `web/lib/automation-types.ts`:

```typescript
slug: string;
```

Change `getPublicBatik` in `web/lib/automation-api.ts`:

```typescript
export const getPublicBatik = async (slug: string) =>
  normalizeBatikMedia(
    await automationRequest<Batik>(`${PUBLIC_BASE}/batiks/${encodeURIComponent(slug)}`),
  );
```

- [ ] **Step 4: Replace card and detail route IDs with slugs**

In `web/components/motif-card.tsx`, change both detail links to:

```tsx
<Link href={`/gallery/${batik.slug}`}>
```

Replace `web/components/gallery-detail-page.tsx` with:

```tsx
export function GalleryDetailPage({ slug }: { slug: string }) {
  const [batik, setBatik] = useState<Batik | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug.trim()) {
      setLoading(false);
      return;
    }
    let active = true;
    getPublicBatik(slug)
      .then((result) => { if (active) setBatik(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Batik tidak tersedia."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (!slug.trim()) return <NotFound message="Slug batik tidak valid." />;
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-20"><p className="flex items-center justify-center gap-2 text-sm text-white/45"><LoaderCircle size={17} className="animate-spin" />Memuat batik...</p></main>;
  if (!batik) return <NotFound message={error ?? "Batik tidak tersedia."} />;
  return <MotifDetail batik={batik} />;
}

function NotFound({ message }: { message: string }) {
  return <main className="mx-auto max-w-4xl px-4 py-20 text-center"><h1 className="text-2xl font-semibold">Batik tidak tersedia</h1><p className="mt-3 text-sm text-white/45">{message}</p><Link href="/gallery" className="mt-6 inline-flex bg-[#ff9d42] px-5 py-3 text-sm font-semibold text-[#201307]">Kembali ke galeri</Link></main>;
}
```

Keep the existing imports for `MotifDetail`, `getPublicBatik`, `Batik`, `LoaderCircle`, `Link`, `useEffect`, and `useState`.

Create `web/app/(public)/gallery/[slug]/page.tsx`:

```tsx
import { GalleryDetailPage } from "@/components/gallery-detail-page";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GalleryDetailPage slug={slug} />;
}
```

Delete `web/app/(public)/gallery/[id]/page.tsx`.

- [ ] **Step 5: Run frontend slug tests**

```powershell
npm test -- automation-api.test.ts public-gallery.test.tsx
```

Expected: both files pass and generated links use slugs.

- [ ] **Step 6: Commit frontend slug routing**

```powershell
git add web
git commit -m "feat: route gallery details by slug"
```

### Task 4: Unified Media Viewer and Thumbnail Slider

**Files:**
- Modify: `web/components/batik-media.tsx`
- Modify: `web/components/__tests__/batik-media.test.tsx`

- [ ] **Step 1: Replace the current media test with interaction-focused failing tests**

Add `slug: "kawung"` to the existing fixture. Test one main media at a time, uniform thumbnail sizing, selection, and non-autoplay video:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";

it("renders uniformly sized thumbnails and switches the main media", () => {
  const { container } = render(<BatikMedia batik={batik} />);
  const thumbnails = screen.getAllByRole("button", { name: /tampilkan/i });

  expect(thumbnails).toHaveLength(3);
  thumbnails.forEach((thumbnail) => expect(thumbnail).toHaveClass("aspect-[4/5]"));
  expect(screen.getByTestId("main-image")).toHaveAttribute("src", batik.preview_url);

  fireEvent.click(screen.getByRole("button", { name: "Tampilkan Costume Model" }));
  expect(screen.getByTestId("main-image")).toHaveAttribute("src", batik.costume_urls[0]);

  fireEvent.click(screen.getByRole("button", { name: "Tampilkan Video Model" }));
  const video = container.querySelector("[data-testid='main-video']");
  expect(video).toHaveAttribute("src", batik.costume_files[0].video_url);
  expect(video).not.toHaveAttribute("autoplay");
  expect(video).toHaveProperty("muted", true);
});
```

Add a second test asserting missing URLs are omitted and the empty-state message appears when all media URLs are null/empty.

- [ ] **Step 2: Run the media test and confirm failure**

```powershell
npm test -- batik-media.test.tsx
```

Expected: failures because current media are stacked and no thumbnail buttons exist.

- [ ] **Step 3: Implement a typed media list and selected main viewer**

Refactor `web/components/batik-media.tsx` into a client component. Define:

```tsx
type MediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  label: string;
};
```

Build the list with `useMemo`: preview first, then each available costume image followed by its paired video. Hold `selectedId` in state and reset it to the first item when `batik.id` changes. Render one `aspect-[4/5]` viewport. Use `Image` with `object-contain` for images and this video for the selected video:

```tsx
<video
  key={selected.url}
  data-testid="main-video"
  src={selected.url}
  muted
  controls
  playsInline
  preload="metadata"
  className="h-full w-full object-contain"
/>
```

Do not add `autoPlay`.

- [ ] **Step 4: Implement the horizontal thumbnail slider**

Use `useRef<HTMLDivElement>(null)` for the strip and `hasOverflow` state. Measure overflow on mount, media-count changes, and browser resize:

```tsx
useEffect(() => {
  const updateOverflow = () => {
    const strip = thumbnailStrip.current;
    setHasOverflow(Boolean(strip && strip.scrollWidth > strip.clientWidth));
  };
  const frame = window.requestAnimationFrame(updateOverflow);
  window.addEventListener("resize", updateOverflow);
  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("resize", updateOverflow);
  };
}, [mediaItems.length]);
```

Render `ChevronLeft`, `ChevronRight`, and `Play` from Lucide. Show the two arrow buttons only when `hasOverflow` is true. Arrow buttons call:

```tsx
function scrollThumbnails(direction: -1 | 1) {
  thumbnailStrip.current?.scrollBy({ left: direction * 240, behavior: "smooth" });
}
```

Each thumbnail button must have stable dimensions and accessible text:

```tsx
<button
  type="button"
  aria-label={`Tampilkan ${item.label}`}
  aria-pressed={item.id === selected.id}
  className={`relative aspect-[4/5] w-20 shrink-0 overflow-hidden border sm:w-24 ${
    item.id === selected.id ? "border-[#ff9d42]" : "border-white/12"
  }`}
  onClick={() => setSelectedId(item.id)}
>
```

For image thumbnails use `Image` with `object-cover`. For video thumbnails use a muted `<video preload="metadata">` with no controls plus a centered Play icon overlay. The strip uses `overflow-x-auto`, `scroll-smooth`, and fixed-gap flex layout. Hide visual scrollbars only if an existing utility already supports it; otherwise retain the native scrollbar for accessibility.

- [ ] **Step 5: Run component and full frontend tests**

```powershell
npm test -- batik-media.test.tsx
npm test
npm run lint
npm run build
```

Expected: media tests pass, full Vitest suite passes, ESLint reports no errors, and Next production build succeeds.

- [ ] **Step 6: Commit the carousel**

```powershell
git add web/components/batik-media.tsx web/components/__tests__/batik-media.test.tsx
git commit -m "feat: add gallery media thumbnail slider"
```

### Task 5: Documentation, Database Upgrade, and End-to-End Verification

**Files:**
- Modify: `automation/README.md`

- [ ] **Step 1: Update endpoint and migration documentation**

Replace `GET /api/v1/batiks/{id}` with `GET /api/v1/batiks/{slug}` in `automation/README.md`. Add a short note under Database:

```markdown
Setelah mengambil versi yang menambahkan slug galeri, jalankan `alembic upgrade head` sebelum API dan worker dimulai. Data batik lama akan memperoleh slug unik secara otomatis.
```

- [ ] **Step 2: Run the complete backend verification**

From `automation`:

```powershell
pytest -q
alembic current
alembic upgrade head
alembic current
```

Expected: all tests pass; final revision is `20260704_0003 (head)`. Existing local batiks contain non-null unique slugs.

- [ ] **Step 3: Run the complete frontend verification**

From `web`:

```powershell
npm test
npm run lint
npm run build
```

Expected: all tests pass, lint has no errors, and production build succeeds with route `/gallery/[slug]`.

- [ ] **Step 4: Start development services and verify API behavior**

Start automation and web using the existing project runners. Verify:

```text
GET http://127.0.0.1:8000/api/v1/batiks
GET http://127.0.0.1:8000/api/v1/batiks/{slug-from-list}
GET http://127.0.0.1:8000/api/v1/batiks/10
```

Expected: list and slug detail return 200; numeric legacy URL returns 404.

- [ ] **Step 5: Perform browser visual verification**

Open `http://localhost:3000/gallery/{slug-from-list}` at desktop 1440x900 and mobile 390x844. Confirm:

- Main viewport remains `4:5` when switching motif, costume, and video.
- Costume and video thumbnail boxes have identical dimensions.
- No text, controls, or media overlap.
- Horizontal scrolling and arrow controls work.
- Selecting video shows controls but does not autoplay.
- Card links and direct refresh retain the slug URL.

- [ ] **Step 6: Commit documentation**

```powershell
git add automation/README.md
git commit -m "docs: document public batik slugs"
```

- [ ] **Step 7: Inspect final scope**

```powershell
git status --short
git log -6 --oneline
```

Expected: only the user's pre-existing untracked report files remain; implementation commits are visible and no generated database, `.next`, storage output, or report artifact is staged.
