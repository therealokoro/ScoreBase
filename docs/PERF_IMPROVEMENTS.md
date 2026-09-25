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
