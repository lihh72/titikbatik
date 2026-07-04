# TitikBatik AI Full Frontend Redesign

## Context

TitikBatik AI currently presents its public gallery and protected administrator interface through the same dark glass visual language. The interface works, but its floating pill navigation, ambient gradients, repeated panels, and equal card grids make the public experience feel generic and the administrator experience feel rigid.

This redesign covers the complete Next.js frontend in `web/`. It may reorganize frontend structure and navigation, but it must not change the FastAPI backend, database, automation workflows, request payloads, response shapes, or API contracts.

## Design Read

TitikBatik AI becomes a modern digital textile archive: culturally grounded, image-led, warm, precise, and contemporary, with a public editorial archive and a fluid curator workbench sharing one design system.

## Goals

- Give the public experience a recognizable Indonesian textile identity without relying on nostalgic ornament or generic heritage styling.
- Introduce meaningful motion through documentary process imagery and text before visitors reach the product gallery.
- Keep generated batik products stable, comparable, and easy to browse in a consistent 1:1 gallery.
- Replace the rigid administrator layout with a modular workspace optimized for production, curation, and system management.
- Preserve all backend behavior and existing public and administrator capabilities.
- Ship a responsive, accessible, tested light theme whose tokens can support a future dark theme.

## Non-goals

- No FastAPI, database, migration, worker, ComfyUI, or workflow changes.
- No request or response contract changes.
- No dark theme in the initial release.
- No new public generation capability.
- No decorative motion applied to product images in the gallery.
- No fabricated documentary imagery or misleading AI attribution.

## Core Direction

The chosen direction is **Arsip Tekstil Nusantara with contemporary sharpness**.

The experience uses warm ivory surfaces, ink green text, one terracotta accent, thin structural rules, a restrained small-radius system, and a mix of modern sans-serif typography with editorial serif accents. Sans-serif type controls navigation, metadata, forms, and operational information. Serif type appears selectively in cultural statements and narrative transitions.

The initial theme is light. Colors, shadows, borders, and semantic states must be implemented as design tokens so a future "arsip malam" theme can be added without restructuring components.

### Shape lock

- Use sharp edges or small radii, generally 6 to 14 pixels.
- Avoid floating pill containers and fully rounded navigation shells.
- Reserve circular shapes for icon buttons or genuinely circular indicators.

### Color lock

- Warm ivory is the page foundation.
- Deep ink green is the dominant text and navigation color.
- Terracotta is the single brand accent for primary actions, active states, and selected emphasis.
- Semantic success, warning, and error colors may be used only for real system state.

## Information Architecture

### Public

The public navbar remains visible and explicit. It contains:

- Beranda: `/`
- Koleksi: `/gallery`
- Tentang: `/about`
- Bantuan: `/help`
- A single "Jelajahi koleksi" action

The `/admin/login` link remains available discreetly in the footer. Existing URLs remain valid even though labels and hierarchy may be refined.

Desktop navigation is a single line no taller than 80 pixels. Mobile navigation uses the brand, one menu control, and an accessible drawer.

### Administrator

Administrator navigation moves to a grouped sidebar:

- Operasi
  - Ringkasan: `/admin`
  - Studio produksi: `/admin/studio`
  - Batch dan job: `/admin/history`
- Kurasi
  - Koleksi batik: `/admin/gallery`
  - Template costume: `/admin/templates`
- Sistem
  - Wordlist: `/admin/wordlists`
  - Pengaturan: `/admin/settings`

Links to the public archive and logout remain at the bottom of the sidebar. On narrow screens, the sidebar collapses into a compact rail or accessible drawer without hiding route context.

## Public Experience

### Homepage

The homepage is a narrative-to-collection sequence:

1. **Hero**
   - Fits within the initial viewport.
   - Uses one documentary image of the batik-making process, a headline of no more than two desktop lines, short supporting copy, and a visible collection action.
   - Does not use scroll cues, version labels, atmospheric location strips, or decorative badges.
2. **People and process**
   - Uses properly licensed documentary photography of artisans, canting, malam, cloth, tools, and workshops.
   - Integrates changing text with a pinned or masked image sequence.
   - Explains the human process before discussing generated output.
3. **Tradition-to-generation transition**
   - Uses clearly contextualized original AI imagery only as an atmospheric or conceptual bridge.
   - Never presents AI imagery as documentary evidence.
4. **Latest collection**
   - Introduces real product images only after the narrative sequence.
   - Product cards remain stable and directly link to details.
5. **Ethics and curation**
   - Briefly explains human review, the role of AI, cultural respect, and publication criteria.

### Gallery

- Every motif thumbnail uses a fixed 1:1 aspect ratio with `object-fit: cover`.
- The gallery uses a consistent responsive square grid, not masonry.
- Product images do not float, parallax, or autoplay.
- The only product-image motion is a subtle hover or focus scale that does not impair comparison.
- Search continues to use the current backend-supported query behavior.
- Pagination, loading, empty, and error states receive complete layouts.
- Like and bookmark actions remain available and continue using local frontend state.

### Detail page

- The media viewer remains the visual anchor and supports preview images, costume images, and videos.
- Media never autoplays.
- Thumbnails and previous/next controls are keyboard accessible.
- Keyword, style, color, date, seed, prompt, and available media are rendered from the existing `Batik` type.
- Like and bookmark actions remain available.
- The layout becomes editorial but does not invent cultural meaning that is absent from backend data.

### About and Help

- About explains the system, curation process, ethical position, and separation between the public archive and internal production.
- Help remains at `/help` and explains gallery search, detail viewing, likes, and bookmarks.
- Both pages reuse the public design system without falling back to equal three-card feature rows.

## Image Policy

Documentary photography must come from a source that allows the intended use. Credit, license link, and modification disclosure must be retained where required. Wikimedia Commons CC BY or CC BY-SA material is acceptable when its individual file license is verified.

Original AI imagery may be created for atmospheric transitions and abstract visual bridges. It must not impersonate a real artisan, workshop, historical event, or documentary record. The interface must not attach fake photographer credits or misleading provenance.

Product imagery always comes from the existing TitikBatik backend and appears only in collection-oriented contexts.

## Administrator Experience

### Shell

- Replace the floating top navigation with a stable grouped sidebar.
- Use a compact top line for page title, system context, refresh, and primary action.
- Preserve route visibility and responsive navigation.
- Keep destructive and logout actions visually distinct from primary brand actions.

### Dashboard

- Make the active production pipeline the primary visual focus.
- Show batch progress as a connected sequence of prompt, generate, combine, and video stages.
- Place collection totals, service health, and worker information in supporting modules of different visual weight.
- Avoid four identical metric cards as the dominant layout.

### Studio production

- Keep the existing `/admin/studio` route and payload creation behavior.
- Divide the long form into visible stages within the route:
  1. Batch configuration
  2. Prompt composition
  3. Costume and video
  4. Review and run
- Preserve random, mixed, and fixed modes, amount, seed, duplicate behavior, template selection, combine, video, and fixed wordlist choices.
- Keep validation near the relevant stage and provide a complete final review before submission.

### Batch and job history

- Use a master-detail layout that keeps the selected batch and its jobs in context.
- Preserve cancel and retry behavior.
- Represent status with text and iconography, not color alone.
- Keep wide job data responsive through deliberate column priority and horizontal overflow where unavoidable.

### Batik curation

- Use 1:1 motif previews for consistency with the public collection.
- Keep publish, unpublish, delete, regenerate costume, and regenerate video actions.
- Separate frequent curation actions from destructive operations.

### Wordlists, templates, and settings

- Wordlists use a consistent master-detail pattern for category selection, item editing, import, activation, and deletion.
- Costume templates retain their natural portrait preview ratio and existing upload, order, activation, and deletion behavior.
- Settings retain the key and JSON editor model, with clearer validation and save feedback.

## Component Architecture

The redesign should introduce shared primitives instead of repeating long utility-class strings:

- Theme tokens and global typography
- Public navbar and footer
- Administrator sidebar and page header
- Button, icon button, field, select, checkbox, textarea, and file input styles
- Surface, divider, status, empty state, error state, and loading state
- Square motif tile and metadata row
- Media viewer controls
- Progress pipeline and operational modules
- Master-detail shell
- Dialog or confirmation pattern for destructive actions
- Motion wrappers that centralize reduced-motion behavior

Public and administrator shells share tokens and primitives but must not share one universal layout. Public pages optimize narrative and discovery; administrator pages optimize scan speed and action density.

## Data Flow and State

- Existing functions in `web/lib/automation-api.ts` remain the source of backend data.
- Existing TypeScript response types remain authoritative.
- Components may be decomposed and state reorganized, but requests, payloads, and response interpretation must remain compatible.
- Likes and bookmarks remain local frontend state through the current app provider unless separately authorized later.
- No optimistic update should hide a backend failure for administrator mutations.
- Successful mutations refresh or reconcile the relevant resource while preserving useful user context.

## Motion System

Motion has three levels:

1. **Narrative motion**
   - Masked image reveals, pinned story sequences, and text-image transitions on the homepage.
   - Implemented with a React-compatible motion library or an equivalent scroll animation system, not hand-written scroll listeners that update React state.
2. **Interface motion**
   - Route entry, drawer, panel, status, progress, and success feedback.
   - Short, restrained, and tied to a state change.
3. **Microinteraction**
   - CSS hover, focus, press, and subtle image scaling.

`prefers-reduced-motion` is mandatory. When reduced motion is enabled, pinned sequences become normal document flow, reveals become immediate, and no content or meaning is lost.

## Error Handling and Feedback

- Loading states preserve page structure and explain what is loading.
- Empty states explain the condition and provide the next valid action where one exists.
- Errors appear close to the failed operation and retain the backend-provided message when safe and useful.
- Success feedback is brief and does not block continued work.
- Destructive actions require confirmation that names the affected resource.
- Disabled and busy controls remain legible and prevent duplicate submissions.
- Authentication errors remain on the login form and preserve the intended `from` destination behavior.

## Accessibility

- Meet WCAG AA contrast for text, controls, focus indicators, and semantic state.
- Use landmarks, headings, labels, and native controls before ARIA workarounds.
- Support complete keyboard operation for navigation, drawers, forms, gallery actions, media controls, tables, and dialogs.
- Maintain visible focus and logical focus order.
- Do not communicate status with color alone.
- Provide meaningful alt text for documentary and product imagery; decorative imagery uses empty alt text.
- Do not trap users in scroll-driven sequences.
- Maintain readable targets and spacing on touch devices.

## Responsive Behavior

- Public navbar becomes a drawer only at narrow widths.
- The homepage narrative converts pinned compositions into a readable vertical sequence on small screens.
- The gallery uses one column on the smallest screens, two on common mobile/tablet widths, and three or more where space allows. Every tile remains 1:1.
- Administrator sidebar collapses without losing route access.
- Dense tables prioritize essential columns and allow controlled horizontal scrolling when necessary.
- Forms become single-column without changing validation or submission behavior.

## Performance

- Prioritize only the hero image needed in the initial viewport.
- Lazy-load below-the-fold documentary and product images.
- Use responsive image sizing and avoid unnecessarily large originals.
- Do not autoplay video.
- Use CSS for simple transitions and reserve the motion library for narrative or stateful animation.
- Avoid long-running requestAnimationFrame loops and scroll-driven React state updates.

## Test Strategy

The existing Vitest and Testing Library setup remains in use.

Required automated coverage includes:

- Public navbar and mobile menu behavior
- Gallery loading, search, empty, error, pagination, and 1:1 tile contract
- Detail media selection, thumbnail controls, likes, and bookmarks
- Administrator sidebar and responsive navigation
- Dashboard loading, error, refresh, and pipeline rendering
- Studio stage navigation, validation, payload preservation, and submission outcomes
- Batch selection, cancel, retry, and job detail behavior
- Batik curation actions
- Wordlist, costume template, and settings forms
- Destructive confirmation behavior
- Reduced-motion rendering where practical

Verification before completion must run:

- `npm.cmd test`
- `npm.cmd run lint`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- Browser checks for representative public and administrator routes at desktop and mobile widths
- Keyboard and reduced-motion checks for motion-heavy and interactive paths

## Acceptance Criteria

- All current public and administrator capabilities remain available.
- FastAPI and automation tests require no contract changes caused by the redesign.
- Public pages use the approved modern archive direction and explicit navbar.
- Documentary and conceptual imagery are clearly separated.
- Product images remain stable and use 1:1 gallery tiles.
- Administrator pages use the approved grouped sidebar and modular workbench.
- Motion is meaningful, responsive, and fully reduced-motion safe.
- Light theme is complete and design tokens are ready for a future dark theme.
- Automated checks and browser verification pass before the redesign is declared complete.
