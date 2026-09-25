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
