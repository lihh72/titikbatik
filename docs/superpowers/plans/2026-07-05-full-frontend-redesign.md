# TitikBatik AI Full Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the complete TitikBatik Next.js frontend as a modern light-theme textile archive and curator workbench while preserving every FastAPI contract and existing capability.

**Architecture:** Keep `web/lib/automation-api.ts`, backend payloads, and response types unchanged. Build shared visual primitives and two purpose-built shells: an editorial public archive with a motion-led homepage, and a dense but fluid administrator workbench. Use Motion for React only for narrative/stateful animation, CSS for microinteractions, and focused components with testable state boundaries.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.8, Tailwind CSS 4, Motion for React, Lucide React, Vitest 4, Testing Library, Next Image.

---

## Execution prerequisites

Before changing production code:

1. Create an isolated worktree with `superpowers:using-git-worktrees`.
2. Read and apply these installed skills in this order:
   - `redesign-existing-projects`
   - `design-taste-frontend` (Taste v2)
   - `gpt-taste`
   - `full-output-enforcement`
3. Use `superpowers:test-driven-development` for every task.
4. Use `superpowers:verification-before-completion` before every completion claim and before the final commit.
5. Preserve the user's unrelated untracked `.superpowers/`, `output/`, and report document.

## File structure

### Shared foundation

- Modify `web/package.json`: add Motion for React.
- Modify `web/package-lock.json`: lock the installed Motion version.
- Modify `web/app/layout.tsx`: load Manrope and Source Serif 4 font variables and retain `AppProvider`.
- Replace `web/app/globals.css`: define light-theme tokens, typography, focus, reduced-motion, and reusable component classes.
- Modify `web/lib/utils.ts`: retain `cn` and add no visual behavior.
- Create `web/components/ui/action.tsx`: shared button/link variants.
- Create `web/components/ui/feedback.tsx`: loading, empty, and error blocks.
- Create `web/components/ui/page-heading.tsx`: consistent page heading and action slot.
- Modify `web/components/logo.tsx`: modern ink/terracotta mark.

### Public archive

- Create `web/components/public-navbar.tsx`: desktop navbar and mobile drawer.
- Create `web/components/public-footer.tsx`: public navigation, credits, and admin access.
- Modify `web/components/site-shell.tsx`: compose the public navbar/footer and remove glass background decoration.
- Create `web/components/editorial-story.tsx`: documentary and conceptual homepage sequence with reduced-motion fallback.
- Modify `web/components/landing-page.tsx`: hero, story, latest collection, and ethics sections.
- Modify `web/components/motif-card.tsx`: 1:1 motif tile with deliberate costume preview.
- Modify `web/components/gallery-page.tsx`: square grid and complete states.
- Modify `web/components/motif-detail.tsx`: editorial detail composition.
- Modify `web/components/batik-media.tsx`: light-theme media viewer and accessible controls.
- Modify `web/app/(public)/about/page.tsx`: editorial system and ethics content.
- Modify `web/app/(public)/help/page.tsx`: editorial help content.
- Create `web/public/editorial/CREDITS.md`: documentary image attribution and license details.
- Add licensed documentary assets under `web/public/editorial/` and one clearly conceptual AI transition asset generated during execution.

### Curator workbench

- Create `web/components/admin-sidebar.tsx`: grouped administrator navigation and mobile drawer.
- Modify `web/components/admin-shell.tsx`: workbench shell and sidebar.
- Modify `web/components/admin-login-page.tsx`: light-theme authentication experience.
- Modify `web/components/admin-dashboard.tsx`: pipeline-first dashboard.
- Modify `web/components/explore-workspace.tsx`: four-stage production form without changing payload construction.
- Modify `web/components/history-page.tsx`: batch/job master-detail view.
- Modify `web/components/admin-gallery-page.tsx`: 1:1 curation grid and action hierarchy.
- Modify `web/components/wordlist-admin.tsx`: consistent master-detail resource editor.
- Modify `web/components/costume-template-admin.tsx`: portrait template manager.
- Modify `web/components/settings-admin.tsx`: key/JSON editor with clear feedback.

### Tests

- Create `web/components/__tests__/design-system.test.tsx`.
- Create `web/components/__tests__/site-shell.test.tsx`.
- Create `web/components/__tests__/landing-page.test.tsx`.
- Create `web/components/__tests__/motif-card.test.tsx`.
- Modify `web/components/__tests__/public-gallery.test.tsx`.
- Modify `web/components/__tests__/batik-media.test.tsx`.
- Create `web/components/__tests__/admin-shell.test.tsx`.
- Create `web/components/__tests__/admin-dashboard.test.tsx`.
- Create `web/components/__tests__/explore-workspace.test.tsx`.
- Create `web/components/__tests__/admin-resources.test.tsx`.
- Modify `web/test/setup.ts`: deterministic matchMedia and observer stubs.

## Task 1: Lock the dependency and test environment

**Files:**
- Modify: `web/package.json`
- Modify: `web/package-lock.json`
- Modify: `web/test/setup.ts`
- Create: `web/components/__tests__/design-system.test.tsx`

- [ ] **Step 1: Install Motion for React**

Run:

```powershell
cd web
npm.cmd install motion
npm.cmd install --save-dev @testing-library/user-event
```

Expected: `motion` appears in `dependencies`, `@testing-library/user-event` appears in `devDependencies`, `package-lock.json` changes, and both commands exit 0.

- [ ] **Step 2: Write the failing design-system smoke test**

Create `web/components/__tests__/design-system.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Action } from "@/components/ui/action";
import { LogoMark } from "@/components/logo";

describe("design system", () => {
  it("renders the brand mark and semantic action variants", () => {
    render(<><LogoMark /><Action href="/gallery">Jelajahi koleksi</Action></>);
    expect(screen.getByLabelText("TitikBatik AI")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("href", "/gallery");
    expect(screen.getByRole("link", { name: "Jelajahi koleksi" })).toHaveAttribute("data-variant", "primary");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm.cmd test -- components/__tests__/design-system.test.tsx`

Expected: FAIL because `@/components/ui/action` does not exist and the old logo has no accessible label.

- [ ] **Step 4: Add deterministic browser API stubs**

Change the existing Vitest import to `import { afterEach, vi } from "vitest";`, then append the browser stubs:

```ts
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? false : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [0];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);
vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
```

- [ ] **Step 5: Create the shared action and accessible logo**

Create `web/components/ui/action.tsx`:

```tsx
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: "primary" | "secondary" | "quiet" | "danger";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Action({ children, className, href, variant = "primary", ...button }: Props) {
  const classes = cn("action", `action-${variant}`, className);
  if (href) return <Link href={href} className={classes} data-variant={variant}>{children}</Link>;
  return <button className={classes} data-variant={variant} {...button}>{children}</button>;
}
```

Replace `web/components/logo.tsx` with:

```tsx
export function LogoMark() {
  return <span className="logo-mark" role="img" aria-label="TitikBatik AI"><i /><i /></span>;
}
```

- [ ] **Step 6: Run the focused test**

Run: `npm.cmd test -- components/__tests__/design-system.test.tsx`

Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```powershell
git add web/package.json web/package-lock.json web/test/setup.ts web/components/ui/action.tsx web/components/logo.tsx web/components/__tests__/design-system.test.tsx
git commit -m "feat: establish frontend redesign foundation"
```

## Task 2: Build the light theme and shared feedback primitives

**Files:**
- Modify: `web/app/layout.tsx`
- Replace: `web/app/globals.css`
- Create: `web/components/ui/feedback.tsx`
- Create: `web/components/ui/page-heading.tsx`
- Modify: `web/components/__tests__/design-system.test.tsx`

- [ ] **Step 1: Extend the failing test for feedback and headings**

Add to `design-system.test.tsx`:

```tsx
import { Feedback } from "@/components/ui/feedback";
import { PageHeading } from "@/components/ui/page-heading";

it("renders semantic page and feedback regions", () => {
  render(<><PageHeading eyebrow="Koleksi" title="Jelajahi motif" /><Feedback kind="error">Galeri gagal dimuat.</Feedback></>);
  expect(screen.getByRole("heading", { name: "Jelajahi motif" })).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Galeri gagal dimuat.");
});
```

- [ ] **Step 2: Verify the new test fails**

Run: `npm.cmd test -- components/__tests__/design-system.test.tsx`

Expected: FAIL because `feedback` and `page-heading` do not exist.

- [ ] **Step 3: Implement the primitives**

Create `web/components/ui/feedback.tsx`:

```tsx
import type { ReactNode } from "react";

export function Feedback({ children, kind = "loading" }: { children: ReactNode; kind?: "loading" | "empty" | "error" | "success" }) {
  const role = kind === "error" ? "alert" : "status";
  return <div className={`feedback feedback-${kind}`} role={role}>{children}</div>;
}
```

Create `web/components/ui/page-heading.tsx`:

```tsx
import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>;
}
```

- [ ] **Step 4: Replace the global theme and load fonts**

In `web/app/layout.tsx`, import `Manrope` and `Source_Serif_4` from `next/font/google`, create `--font-sans` and `--font-serif`, and apply both variables to `<body>`.

Replace `web/app/globals.css` with Tailwind import plus these required tokens and classes:

```css
@import "tailwindcss";

:root {
  --paper: #f4f1e9;
  --paper-raised: #fbf8f1;
  --ink: #18201c;
  --ink-soft: #59615c;
  --terracotta: #c94e38;
  --terracotta-dark: #a83a29;
  --line: #b8b0a3;
  --success: #2f6b4f;
  --warning: #986313;
  --danger: #a2372c;
  --radius-sm: 8px;
  --radius-md: 14px;
}

* { box-sizing: border-box; }
html { background: var(--paper); scroll-behavior: smooth; }
body { margin: 0; min-height: 100vh; color: var(--ink); background: var(--paper); font-family: var(--font-sans), sans-serif; text-rendering: optimizeLegibility; }
a { color: inherit; text-decoration: none; }
button, input, select, textarea { font: inherit; }
button { cursor: pointer; }
:focus-visible { outline: 3px solid color-mix(in srgb, var(--terracotta) 75%, white); outline-offset: 3px; }
::selection { color: white; background: var(--terracotta); }
.serif { font-family: var(--font-serif), serif; }
.action { display: inline-flex; min-height: 44px; align-items: center; justify-content: center; gap: .5rem; border: 1px solid transparent; border-radius: var(--radius-sm); padding: .7rem 1rem; font-size: .875rem; font-weight: 700; transition: transform .18s ease, background .18s ease, color .18s ease; }
.action-primary { color: white; background: var(--terracotta); }
.action-primary:hover { background: var(--terracotta-dark); transform: translateY(-1px); }
.action-secondary { border-color: var(--ink); color: var(--ink); background: transparent; }
.action-quiet { color: var(--ink-soft); background: transparent; }
.action-danger { color: white; background: var(--danger); }
.logo-mark { position: relative; display: inline-grid; width: 36px; height: 36px; place-items: center; border: 1px solid currentColor; border-radius: var(--radius-sm); }
.logo-mark i:first-child { width: 15px; height: 15px; border: 1px solid var(--terracotta); transform: rotate(45deg); }
.logo-mark i:last-child { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--terracotta); }
.eyebrow { margin: 0; color: var(--terracotta); font-size: .75rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.page-heading { display: flex; align-items: end; justify-content: space-between; gap: 1.5rem; border-bottom: 1px solid var(--line); padding-bottom: 1.5rem; }
.page-heading h1 { margin: .5rem 0 0; font-size: clamp(2rem, 4vw, 3.5rem); letter-spacing: -.05em; }
.page-heading > div > p:last-child { max-width: 46rem; color: var(--ink-soft); line-height: 1.7; }
.feedback { border-left: 3px solid var(--ink); padding: 1rem; color: var(--ink-soft); background: var(--paper-raised); }
.feedback-error { border-color: var(--danger); color: var(--danger); }
.feedback-success { border-color: var(--success); color: var(--success); }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
```

- [ ] **Step 5: Run focused and full tests**

Run:

```powershell
npm.cmd test -- components/__tests__/design-system.test.tsx
npm.cmd test
```

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```powershell
git add web/app/layout.tsx web/app/globals.css web/components/ui/feedback.tsx web/components/ui/page-heading.tsx web/components/__tests__/design-system.test.tsx
git commit -m "feat: add modern archive design system"
```

## Task 3: Replace the public shell with an explicit navbar

**Files:**
- Create: `web/components/public-navbar.tsx`
- Create: `web/components/public-footer.tsx`
- Modify: `web/components/site-shell.tsx`
- Create: `web/components/__tests__/site-shell.test.tsx`

- [ ] **Step 1: Write failing navigation tests**

Create `site-shell.test.tsx` with `next/navigation` pathname mocked as `/gallery`. Assert the banner contains links named `Beranda`, `Koleksi`, `Tentang`, `Bantuan`, that `Koleksi` has `aria-current="page"`, the mobile menu button toggles a `dialog` named `Navigasi utama`, and the footer contains `Akses Admin` linked to `/admin/login`.

Use this interaction:

```tsx
const user = userEvent.setup();
render(<SiteShell><p>Konten</p></SiteShell>);
expect(screen.getByRole("link", { name: "Koleksi" })).toHaveAttribute("aria-current", "page");
await user.click(screen.getByRole("button", { name: "Buka navigasi" }));
expect(screen.getByRole("dialog", { name: "Navigasi utama" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify failure**

Run: `npm.cmd test -- components/__tests__/site-shell.test.tsx`

Expected: FAIL because the old shell has no dialog semantics and uses the old gallery label/structure.

- [ ] **Step 3: Implement the navbar and footer**

`public-navbar.tsx` must export `PUBLIC_NAV_ITEMS` and `PublicNavbar`. Use `usePathname`, one desktop `<nav aria-label="Navigasi utama">`, a 44px menu button, and a conditional `<div role="dialog" aria-label="Navigasi utama">`. Set `aria-current="page"` only on the active route and close the drawer after navigation.

`public-footer.tsx` must repeat the four public routes, include the image/AI ethics sentence, documentary credit destination, and a quiet `/admin/login` link.

- [ ] **Step 4: Rebuild SiteShell as composition only**

Replace the glass layers in `site-shell.tsx` with:

```tsx
import { PublicFooter } from "@/components/public-footer";
import { PublicNavbar } from "@/components/public-navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="public-shell"><PublicNavbar /><div id="main-content">{children}</div><PublicFooter /></div>;
}
```

- [ ] **Step 5: Run the shell test and full suite**

Run:

```powershell
npm.cmd test -- components/__tests__/site-shell.test.tsx
npm.cmd test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add web/components/public-navbar.tsx web/components/public-footer.tsx web/components/site-shell.tsx web/components/__tests__/site-shell.test.tsx web/app/globals.css
git commit -m "feat: redesign public navigation shell"
```

## Task 4: Build the documentary homepage narrative

**Files:**
- Create: `web/components/editorial-story.tsx`
- Modify: `web/components/landing-page.tsx`
- Create: `web/components/__tests__/landing-page.test.tsx`
- Create: `web/public/editorial/CREDITS.md`
- Add: `web/public/editorial/batik-artisan-canting.jpg`
- Add: `web/public/editorial/batik-malam-tools.jpg`
- Add: `web/public/editorial/generative-transition.webp`

- [ ] **Step 1: Acquire and document visual assets**

Download documentary files from their verified Wikimedia Commons file pages at practical web dimensions, not the full originals:

- `Batik Artisan Drawing Wax with Canting in Trusmi Cirebon Indonesia.jpg`, author Ahaetulla, CC BY-SA 4.0.
- `Heating Batik Wax (Malam) with Canting in a Traditional Workshop, Trusmi Cirebon.jpg`, author Ahaetulla, CC BY-SA 4.0.

Run from `web/`:

```powershell
New-Item -ItemType Directory -Force -Path 'public\editorial' | Out-Null
Invoke-WebRequest -Uri 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Batik_Artisan_Drawing_Wax_with_Canting_in_Trusmi_Cirebon_Indonesia.jpg?width=1600' -OutFile 'public\editorial\batik-artisan-canting.jpg'
Invoke-WebRequest -Uri 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Heating_Batik_Wax_(Malam)_with_Canting_in_a_Traditional_Workshop,_Trusmi_Cirebon.jpg?width=1400' -OutFile 'public\editorial\batik-malam-tools.jpg'
```

Expected: both local JPEG files exist and are non-empty.

Write `CREDITS.md` with original file-page URL, author, license URL, local filename, and whether the image was cropped or color-adjusted.

Use the `imagegen` skill to generate `generative-transition.webp` with this exact prompt:

```text
Editorial abstract textile transition for a modern Indonesian batik archive website, macro layers of warm ivory cloth, deep ink-green wax lines and one terracotta accent, contemporary museum photography, tactile fibers, no people, no text, no logos, no imitation of a specific traditional sacred motif, horizontal 16:10 composition.
```

- [ ] **Step 2: Write the failing homepage test**

Mock `listPublicBatiks` to return three items. Assert the page has the headline `Motif lama. Bahasa baru.`, one `region` named `Proses batik`, image alt text for the artisan and tools, a clearly labeled `Visual konseptual AI`, an ethics heading, and exactly three latest collection links.

- [ ] **Step 3: Run and verify failure**

Run: `npm.cmd test -- components/__tests__/landing-page.test.tsx`

Expected: FAIL because the narrative regions do not exist.

- [ ] **Step 4: Implement EditorialStory**

Use `motion/react` imports `motion`, `useReducedMotion`, `useScroll`, and `useTransform`. The component must render the same semantic document in both modes. In reduced motion, use normal vertical flow; otherwise animate image masks and text opacity from scroll progress. Do not attach `window` scroll listeners.

Required component contract:

```tsx
export function EditorialStory() {
  const reduceMotion = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [70, -45]);
  return <section ref={section} aria-label="Proses batik">{/* documentary frames, captions, conceptual transition */}</section>;
}
```

- [ ] **Step 5: Rebuild LandingPage**

Keep the existing API call and cleanup guard. Render, in order: disciplined hero, `EditorialStory`, latest collection of up to three `MotifCard`s, ethics statement, and collection CTA. Hero copy must remain within two desktop lines and the primary action must be visible without scroll.

- [ ] **Step 6: Run tests**

Run:

```powershell
npm.cmd test -- components/__tests__/landing-page.test.tsx
npm.cmd test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add web/components/editorial-story.tsx web/components/landing-page.tsx web/components/__tests__/landing-page.test.tsx web/public/editorial web/app/globals.css
git commit -m "feat: add documentary homepage narrative"
```

## Task 5: Implement 1:1 gallery tiles and costume hover previews

**Files:**
- Modify: `web/components/motif-card.tsx`
- Create: `web/components/__tests__/motif-card.test.tsx`
- Modify: `web/components/gallery-page.tsx`
- Modify: `web/components/__tests__/public-gallery.test.tsx`

- [ ] **Step 1: Write timer-driven failing tests**

Use `vi.useFakeTimers()` and a Batik fixture with two costume URLs. Assert:

```tsx
fireEvent.mouseEnter(screen.getByRole("article", { name: "Kawung Indigo" }));
await vi.advanceTimersByTimeAsync(349);
expect(screen.getByTestId("motif-preview")).toHaveAttribute("src", batik.preview_url);
await vi.advanceTimersByTimeAsync(1);
expect(screen.getByTestId("costume-preview")).toHaveAttribute("src", batik.costume_urls[0]);
await vi.advanceTimersByTimeAsync(1500);
expect(screen.getByTestId("costume-preview")).toHaveAttribute("src", batik.costume_urls[1]);
fireEvent.mouseLeave(screen.getByRole("article", { name: "Kawung Indigo" }));
expect(screen.getByTestId("motif-preview")).toHaveAttribute("src", batik.preview_url);
```

Add separate tests for keyboard focus/blur, no-costume fallback, timer cleanup on unmount, and reduced motion showing only the first costume without a 1.5-second cycle.

- [ ] **Step 2: Verify failure**

Run: `npm.cmd test -- components/__tests__/motif-card.test.tsx`

Expected: FAIL because preview test IDs and timer behavior do not exist.

- [ ] **Step 3: Implement the isolated preview hook**

Keep the hook in `motif-card.tsx` unless it exceeds 50 lines; if it does, create `web/components/use-costume-preview.ts`.

Required state machine:

```tsx
const HOVER_INTENT_MS = 350;
const COSTUME_CYCLE_MS = 1500;
const [active, setActive] = useState(false);
const [costumeIndex, setCostumeIndex] = useState(-1);
const reduceMotion = useReducedMotion();

useEffect(() => {
  if (!active || !batik.costume_urls.length) { setCostumeIndex(-1); return; }
  const intent = window.setTimeout(() => setCostumeIndex(0), HOVER_INTENT_MS);
  return () => window.clearTimeout(intent);
}, [active, batik.costume_urls.length]);

useEffect(() => {
  if (costumeIndex < 0 || reduceMotion || batik.costume_urls.length < 2) return;
  const cycle = window.setInterval(() => setCostumeIndex((value) => (value + 1) % batik.costume_urls.length), COSTUME_CYCLE_MS);
  return () => window.clearInterval(cycle);
}, [costumeIndex, reduceMotion, batik.costume_urls.length]);
```

The card article handles `onMouseEnter`, `onMouseLeave`, `onFocusCapture`, and `onBlurCapture`. Use a CSS media query `(hover: hover) and (pointer: fine)` to prevent pointer cycling on touch. Keep accessible naming on the article/link stable and mark the changing costume layer `aria-hidden="true"`.

The timing contract is approximately 350 milliseconds before the first costume and 1.5 seconds between later costumes.

- [ ] **Step 4: Rebuild GalleryPage states and square grid**

Keep `listPublicBatiks({ page, perPage: 32, query: activeQuery })`. Use `PageHeading`, `Feedback`, semantic search label, 1-column/2-column/3-column responsive grid, and existing previous/next pagination. Do not add unsupported backend filters.

- [ ] **Step 5: Update public gallery tests**

Assert the search submits the exact query, errors render with `role="alert"`, empty results render the archive empty state, pagination changes page, and every motif container has `aspect-square`.

- [ ] **Step 6: Run tests**

Run:

```powershell
npm.cmd test -- components/__tests__/motif-card.test.tsx components/__tests__/public-gallery.test.tsx
npm.cmd test
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add web/components/motif-card.tsx web/components/gallery-page.tsx web/components/__tests__/motif-card.test.tsx web/components/__tests__/public-gallery.test.tsx web/app/globals.css
git commit -m "feat: add square gallery costume previews"
```

## Task 6: Redesign details, About, Help, and login

**Files:**
- Modify: `web/components/batik-media.tsx`
- Modify: `web/components/motif-detail.tsx`
- Modify: `web/components/gallery-detail-page.tsx`
- Modify: `web/components/__tests__/batik-media.test.tsx`
- Modify: `web/app/(public)/about/page.tsx`
- Modify: `web/app/(public)/help/page.tsx`
- Modify: `web/components/admin-login-page.tsx`

- [ ] **Step 1: Extend media tests before implementation**

Assert the main viewer has a descriptive region label, thumbnails retain `aria-pressed`, the active thumbnail exposes a selected class, video has no `autoplay`, empty media uses `role="status"`, and next/previous buttons appear only when thumbnail overflow is reported.

- [ ] **Step 2: Verify the tests fail**

Run: `npm.cmd test -- components/__tests__/batik-media.test.tsx components/__tests__/public-gallery.test.tsx`

Expected: FAIL on the new semantics and light-theme contracts.

- [ ] **Step 3: Rebuild the detail experience**

Preserve `buildMediaItems` and all media URLs. Use an editorial two-column layout, a stable 4:5 main viewer, thumbnail strip, metadata definition list, local like/bookmark controls, and prompt disclosure. Keep the `getPublicBatik(slug)` data flow unchanged.

- [ ] **Step 4: Replace About and Help layouts**

About must have sections for system separation, human curation, ethical use, and public simplicity. Help must cover search, 1:1 collection, detail media, costume preview behavior, likes, and bookmarks. Replace the old equal three-card row with staggered two-column editorial sections.

- [ ] **Step 5: Redesign login without changing authentication**

Keep POST `/api/admin/login`, `from` validation, busy state, show-password behavior, error handling, and router replacement. Remove glass effects and use a split editorial/workbench introduction with visible labels rather than hint-only fields.

- [ ] **Step 6: Run tests and commit**

```powershell
npm.cmd test -- components/__tests__/batik-media.test.tsx components/__tests__/public-gallery.test.tsx
npm.cmd test
git add web/components/batik-media.tsx web/components/motif-detail.tsx web/components/gallery-detail-page.tsx web/components/admin-login-page.tsx 'web/app/(public)/about/page.tsx' 'web/app/(public)/help/page.tsx' web/components/__tests__/batik-media.test.tsx web/app/globals.css
git commit -m "feat: redesign public detail and support pages"
```

Expected: tests PASS and commit succeeds.

## Task 7: Build the grouped administrator shell and pipeline dashboard

**Files:**
- Create: `web/components/admin-sidebar.tsx`
- Modify: `web/components/admin-shell.tsx`
- Modify: `web/components/admin-dashboard.tsx`
- Create: `web/components/__tests__/admin-shell.test.tsx`
- Create: `web/components/__tests__/admin-dashboard.test.tsx`

- [ ] **Step 1: Write failing shell and dashboard tests**

Mock pathname `/admin/history`. Assert grouped labels `Operasi`, `Kurasi`, and `Sistem`; active `Batch dan job`; public archive link; logout POST and route replace. Mock dashboard data and assert pipeline stage counts, service health text plus icon/label, refresh behavior, and error alert.

- [ ] **Step 2: Verify failure**

Run: `npm.cmd test -- components/__tests__/admin-shell.test.tsx components/__tests__/admin-dashboard.test.tsx`

Expected: FAIL because the grouped sidebar and pipeline-first dashboard do not exist.

- [ ] **Step 3: Implement AdminSidebar**

Export grouped route data with exact existing URLs. Render `<aside>` on desktop and a dialog drawer on mobile. Use `aria-current`, close the drawer after route selection, and expose public archive/logout at the bottom.

- [ ] **Step 4: Simplify AdminShell**

Compose `AdminSidebar` and a `<main id="admin-content">`. Keep the current logout function unchanged and pass it to the sidebar. Remove ambient background and floating top nav.

- [ ] **Step 5: Rebuild AdminDashboard**

Preserve `getDashboard()` and `load`. Render the active pipeline as the primary module, supporting published total, worker heartbeat, queued/running/failed counts, and ComfyUI state. Do not invent time-series data unavailable from the API.

- [ ] **Step 6: Run tests and commit**

```powershell
npm.cmd test -- components/__tests__/admin-shell.test.tsx components/__tests__/admin-dashboard.test.tsx
npm.cmd test
git add web/components/admin-sidebar.tsx web/components/admin-shell.tsx web/components/admin-dashboard.tsx web/components/__tests__/admin-shell.test.tsx web/components/__tests__/admin-dashboard.test.tsx web/app/globals.css
git commit -m "feat: add curator workbench shell"
```

Expected: PASS.

## Task 8: Turn Studio into a four-stage production flow

**Files:**
- Modify: `web/components/explore-workspace.tsx`
- Create: `web/components/__tests__/explore-workspace.test.tsx`
- Preserve: `web/lib/generation-form.ts`
- Preserve: `web/lib/__tests__/generation-form.test.ts`

- [ ] **Step 1: Write failing workflow tests**

Mock templates, categories, items, and `createGenerationBatch`. Assert stage navigation starts at `Konfigurasi batch`, cannot move past required fixed selections, preserves values when moving backward, renders a final payload review, and passes the exact object returned by `buildGenerationPayload` to `createGenerationBatch`.

Required final assertion:

```tsx
await user.click(screen.getByRole("button", { name: "Jalankan batch" }));
expect(mocks.createGenerationBatch).toHaveBeenCalledWith({
  amount: 1,
  mode: "random",
  combine_enabled: true,
  video_enabled: false,
  costume_template_mode: "random_one",
  costume_template_ids: [],
  random_seed: null,
  allow_duplicate_prompts: false,
  fixed_wordlist_items: {},
  requested_by: "web-admin",
});
```

- [ ] **Step 2: Verify failure**

Run: `npm.cmd test -- components/__tests__/explore-workspace.test.tsx lib/__tests__/generation-form.test.ts`

Expected: new component test FAIL; existing payload tests PASS.

- [ ] **Step 3: Add stage state without changing domain state**

Add `type StudioStage = "batch" | "prompt" | "media" | "review"` and `const [stage, setStage] = useState<StudioStage>("batch")`. Keep every existing data state, memo, validation, and `buildGenerationPayload` call. Move related controls into stage sections; do not split API logic across new components until the behavior is green.

- [ ] **Step 4: Add review and navigation rules**

Back is always available after stage one. Next validates only requirements needed to enter the following stage. The final stage displays amount, mode, category selections, template mode, combine, video, seed, and duplicate behavior before enabling `Jalankan batch`.

- [ ] **Step 5: Run tests and commit**

```powershell
npm.cmd test -- components/__tests__/explore-workspace.test.tsx lib/__tests__/generation-form.test.ts
npm.cmd test
git add web/components/explore-workspace.tsx web/components/__tests__/explore-workspace.test.tsx web/app/globals.css
git commit -m "feat: guide admin batch production"
```

Expected: PASS with existing payload behavior unchanged.

## Task 9: Redesign administrator resource screens

**Files:**
- Modify: `web/components/history-page.tsx`
- Modify: `web/components/admin-gallery-page.tsx`
- Modify: `web/components/wordlist-admin.tsx`
- Modify: `web/components/costume-template-admin.tsx`
- Modify: `web/components/settings-admin.tsx`
- Create: `web/components/__tests__/admin-resources.test.tsx`

- [ ] **Step 1: Write failing resource-screen tests**

Mock the existing API functions and cover:

- History selects a batch, renders its jobs, keeps cancel/retry actions, and marks state with visible text.
- Admin gallery renders 1:1 preview containers and keeps publish, unpublish, delete, regenerate costume, and regenerate video.
- Wordlist selects a category, creates an item, imports lines, toggles activation, and confirms deletion.
- Templates retain 3:4 previews and upload/update/delete behavior.
- Settings reject non-object JSON and save a valid object.

Use `vi.spyOn(window, "confirm").mockReturnValue(true)` only for destructive tests and restore it after each test.

- [ ] **Step 2: Verify failure**

Run: `npm.cmd test -- components/__tests__/admin-resources.test.tsx`

Expected: FAIL on the new labels, ratios, master-detail structure, and confirmations.

- [ ] **Step 3: Rebuild History and Admin Gallery**

History uses a batch list plus selected detail; maintain every API call and selected batch/job state. Admin gallery uses square tiles, separates frequent curation actions from a danger menu/section, and keeps error/loading states inline.

- [ ] **Step 4: Rebuild Wordlist, Templates, and Settings**

Reuse the same master-detail classes and shared `Action`, `Feedback`, and `PageHeading`. Preserve all payload builders and form parsing functions. Add visible `<label>` elements to every control; inline example text remains a hint only.

- [ ] **Step 5: Run focused and full tests**

```powershell
npm.cmd test -- components/__tests__/admin-resources.test.tsx lib/__tests__/admin-resource-forms.test.ts
npm.cmd test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add web/components/history-page.tsx web/components/admin-gallery-page.tsx web/components/wordlist-admin.tsx web/components/costume-template-admin.tsx web/components/settings-admin.tsx web/components/__tests__/admin-resources.test.tsx web/app/globals.css
git commit -m "feat: redesign admin resource workflows"
```

## Task 10: Complete route metadata, accessibility, and visual verification

**Files:**
- Modify: `web/app/(public)/gallery/page.tsx`
- Modify: `web/app/admin/(protected)/*/page.tsx` where metadata/copy is stale
- Modify: `web/app/admin/(auth)/login/page.tsx`
- Modify: any component identified by verification
- Modify: relevant tests identified by verification

- [ ] **Step 1: Update visible metadata and loading fallbacks**

Use `Koleksi Motif`, `Curator Workbench`, `Studio Produksi`, `Batch dan Job`, `Koleksi Batik`, `Sumber Wordlist`, `Template Costume`, and `Pengaturan Sistem`. Replace dark hard-coded Suspense fallbacks with shared light-theme feedback.

- [ ] **Step 2: Run automated verification**

Run from `web/`:

```powershell
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Expected: all commands exit 0; Vitest reports zero failed tests; ESLint reports zero errors; TypeScript reports no diagnostics; Next build completes all routes.

- [ ] **Step 3: Run browser verification at desktop width**

Use the in-app browser at approximately 1440×900 and verify:

- `/`: navbar, hero CTA above fold, documentary sequence, conceptual AI label, latest collection, ethics, footer.
- `/gallery`: 1:1 grid, search, pagination, one-card hover delay/cycle/reset, no inactive-card cycling.
- `/gallery/<known-slug>`: image/costume/video selection and no autoplay.
- `/about`, `/help`, `/admin/login`: complete light layouts and keyboard focus.
- Authenticated admin routes: grouped sidebar, dashboard, studio, history, gallery, wordlists, templates, settings.

Capture screenshots of representative public and administrator states for comparison with the approved direction.

- [ ] **Step 4: Run mobile and accessibility verification**

At approximately 390×844 verify the public drawer, vertical narrative, square gallery, detail viewer, admin drawer/rail, single-column forms, and controlled table overflow. Emulate `prefers-reduced-motion: reduce` and verify no timed costume cycle or pinned narrative. Navigate every primary route and actionable control by keyboard; verify visible focus, correct dialog focus/close behavior, no color-only status, and WCAG AA contrast.

- [ ] **Step 5: Fix only evidence-backed issues and rerun the affected checks**

For every issue found, write or extend the smallest failing test first, observe the failure, make the minimal correction, then rerun the focused test plus the full verification command affected by the change.

- [ ] **Step 6: Run final clean verification**

```powershell
npm.cmd test
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
git diff --check
git status --short
```

Expected: all four frontend commands and `git diff --check` exit 0. `git status --short` contains only the redesign files intended for the final commit plus the user's pre-existing untracked files.

- [ ] **Step 7: Commit the final verified polish**

```powershell
git add web
git commit -m "feat: complete TitikBatik frontend redesign"
```

- [ ] **Step 8: Request code review**

Invoke `superpowers:requesting-code-review`, review the complete diff against `docs/superpowers/specs/2026-07-04-full-frontend-redesign-design.md`, address validated findings with TDD, and rerun Task 10 Step 6 before declaring completion.
