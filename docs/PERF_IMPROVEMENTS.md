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
