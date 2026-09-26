# Performance Improvements

Log of shipped performance/UX-efficiency changes. Newest additions appended per fix.

## Fix 1 — TanStack Query retry config

**Date:** 2026-09-25
**Files changed:** `app/plugins/vue-query.ts`
**What:** The `QueryClient` set only `staleTime`; every other option was the TanStack default,
including `retry: 3` with exponential backoff.
**Why it was slow:** A failed query (4xx/5xx) kept the page in a pending/loading state through
~1s → 2s → 4s backoff — up to ~7s before the error surfaced.
**What changed:** Added `retry: false` and `retryDelay: 500` under
`defaultOptions.queries`.
**Expected impact:** Removes the ~7s worst-case loading cliff on failed queries; errors surface
immediately.

## Fix 2 — Lower student search debounce

**Date:** 2026-09-25
**Files changed:** `app/components/Student/ListTable.vue`
**What:** `useUrlTableState` for the student list debounced search input by 1000 ms.
**Why it was slow:** Each keystroke waited a full second before the request fired, making
search-as-you-type feel unresponsive.
**What changed:** Debounce reduced from `1000` to `300` ms (the app's standard).
**Expected impact:** Search results feel ~700ms snappier on every keystroke.

## Fix 3 — Bundle icons client-side and drop two remote-collection names

**Date:** 2026-09-25
**Files changed:** `nuxt.config.ts`, `app/pages/dashboard/results/[resultId]/report-card/index.vue`,
`app/components/Ui/DropdownMenu/RadioItem.vue`
**What:** Icons are bound dynamically via the `ICONS` map, which the `@nuxt/icon` scanner cannot
see, so almost none were bundled client-side; two names also referenced uninstalled collections.
**Why it was slow:** Every dynamic icon became a separate `/api/_nuxt_icon` request after render
(blank-first pop-in), and `heroicons:magnifying-glass` / `ph:circle-fill` fell back to the public
Iconify API (an extra internet round trip).
**What changed:** Added `clientBundle.icons: Object.values(ICONS)` (and confirmed `ICONS` only uses
the installed `lucide`/`tabler` sets), and replaced the two bad names with `lucide:search` /
`lucide:circle`.
**Expected impact:** Removes the per-icon request waterfall on every page and two third-party API
calls.
**Build follow-up (Fix 3a):** the first build after this change failed — `Object.values(ICONS)`
exposed an invalid entry, `tabler:verified` (not in the installed Tabler collection), which threw
during client-bundle generation. Remapped `verified` to `lucide:badge-check` (the name was unused in
the app). This also removes a latent runtime 404 for that icon.

## Fix 4 — Remove redundant manual refetch after mutations

**Date:** 2026-09-25
**Files changed:** `app/pages/dashboard/students/[studentId].vue`,
`app/pages/dashboard/settings/school.vue`, `app/pages/dashboard/sessions/index.vue`,
`app/pages/dashboard/results/[resultId]/index.vue`, `app/pages/dashboard/results/settings.vue`,
`app/pages/dashboard/classes/[classId].vue`,
`app/pages/dashboard/results/[resultId]/[scoresheetId].vue`
**What:** Several mutation `onSuccess` handlers called `refetch()`/`refresh()`/`refetchScoresheet()`
on a query that the mutation already invalidates.
**Why it was slow:** Invalidation triggers its own refetch, so the same (often heavy nested) payload
could be requested twice; the manual refetch also races the invalidated one.
**What changed:** Removed the manual refetch calls where `invalidateQueries` covers the same query
(7 pages). Kept them where the data is **not** in the Query cache: `my-class.vue` and
`Student/ListTable.vue` use `useLazyAsyncData`/`$orpc.*.call` (and `useCreateStudent` has no
invalidation), so their `refresh()` is still required.
**Not done (raised for review):** `queryClient.setQueryData` for mutation-returned rows and further
narrowing of the broad `$orpc.result.key()` / `$orpc.scoresheet.key()` invalidation. Both risk stale
list/detail views and need a product decision on exactly which queries depend on each mutation.
**Expected impact:** Removes a duplicate request per mutation on the heaviest result/scoresheet
payloads.

## Fix 5 — O(n²) rank computation on the report-card roster

**Date:** 2026-09-25
**Files changed:** `app/pages/dashboard/results/[resultId]/report-card/index.vue`
**What:** `rankMap` called `unique.indexOf(total)` once per student to derive each rank.
**Why it was slow:** `Array.indexOf` is O(n), so rank building was O(n²) — ~2,500 comparisons for a
50-student class on every render.
**What changed:** Sort the unique totals once, build a `Map<total, rank>`, then assign in one pass
(O(n log n) + O(n)).
**Expected impact:** Removes the quadratic rank pass; scales cleanly to large classes.

## Fix 6 — Read settings once per function instead of per field

**Date:** 2026-09-25
**Files changed:** `server/queries/dashboard.query.ts`, `server/routers/student.router.ts`,
`server/routers/session.router.ts`
**What:** Several functions called `getSchoolSettings(field)` multiple times, each doing a full KV
read + `defu` merge + Zod parse of the same object.
**Why it was slow:** Each call is a separate KV round trip (remote in production) plus a redundant
parse — the dashboard read the key twice, `createStudent` twice, `createSession` twice (including
via `getTermPreset`).
**What changed:** Read the full settings object once with the existing `getSchoolSettings()`
no-arg overload, then index it; `createSession` uses `TERMS_PRESET[settings.termPreset]` instead of
a second `getTermPreset()` read. (No module-level cache — per the Cloudflare Workers constraint.)
**Expected impact:** One fewer KV round trip on the dashboard, student creation, and session
creation.
**Not done (raised for review):** `settings.router.setResultSettings` still reads the current value
and then `setResultSettings` reads it again; collapsing that needs a KV setter signature change.

## Fix 7 — Index `createdAt` for list ordering

**Date:** 2026-09-25
**Files changed:** `server/db/schema/academic.ts`, `server/db/schema/result.ts`,
`server/db/schema/auth.ts`, `server/db/migrations/sqlite/0007_productive_marvel_boy.sql`
**What:** List queries `ORDER BY createdAt DESC`, but no table had an index on that column.
**Why it was slow:** SQLite did a full scan + temp-B-tree sort for every list (worst for
`students` pagination, which sorts the whole filtered set before `limit/offset`).
**What changed:** Added indexes on the tables that actually sort by `createdAt`:
`results(createdAt)`, `students(createdAt)`, `students(class_id, createdAt)` (paginated class list),
`user(created_at)`, `subjects(createdAt)`, `subject_lists(createdAt)`. Generated and applied
migration `0007_productive_marvel_boy.sql`.
**Divergence from the original instruction (approved):** the requested `classes` and `scoresheets`
indexes were dropped because no query orders those tables by `createdAt` (they would be unused);
`subjects` and `subject_lists`, which do sort by `createdAt`, were added instead.
**Expected impact:** Turns per-list full scans + sorts into index scans.

## Fix 10 — Replace `motion-v` and inline `lodash-es`

**Date:** 2026-09-25
**Files changed:** `app/components/Ui/Loader.vue`, `app/components/Ui/TanStackTable.vue`
**What:** `motion-v` was used only for two `Loader` fade/scale animations; `lodash-es` was imported
only for `startCase` in the table's auto-column fallback.
**Why it was slow:** Both pulled sizable libraries into the client bundle — and `Loader` sits on the
critical path of many pages.
**What changed:** Replaced the motion wrappers with Vue's built-in `<Transition>` plus a small scoped
CSS transition; inlined a ~6-line `startCase` helper and dropped the import.
**Expected impact:** Smaller client bundle / faster parse; no runtime behaviour change.

## Fix 11 — Remove unused dependencies

**Date:** 2026-09-25
**Files changed:** `package.json`, `pnpm-lock.yaml`
**What:** Several direct dependencies had zero imports in the codebase.
**Why it was slow:** They inflated install/CI time and risked future accidental imports of a
duplicate icon/animation system (no runtime bundle cost, since unimported and tree-shaken).
**What changed:** Removed `@tabler/icons-vue`, `vaul-vue`, `@internationalized/number`,
`@types/lodash-es`, plus `motion-v` and `lodash-es` (both made unused by Fix 10). Verified with a
repo-wide grep that only `package.json`/`pnpm-lock.yaml` referenced them.
**Expected impact:** Leaner dependency tree; no user-visible change.

## Fix 6b — Avoid the second KV read in `setResultSettings`

**Date:** 2026-09-26
**Files changed:** `server/kv/result-settings.ts`, `server/routers/settings.router.ts`
**What:** `result.setSettings` read the current settings for validation and then `setResultSettings`
read them again internally.
**Why it was slow:** Two KV reads (remote in production) + two Zod parses per settings update.
**What changed:** `setResultSettings` accepts an optional already-read `current`; the router passes
the value it already fetched for validation.
**Expected impact:** One fewer KV round trip per result-settings save.
