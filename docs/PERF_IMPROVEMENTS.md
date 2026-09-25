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
