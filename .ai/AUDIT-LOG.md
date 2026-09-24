# ScoreBase Audit Log

Ledger of audit findings, their fixes, and won't-fix decisions. Maintained per the
2026-09-24 codebase-wide audit. Newest entries appended at the bottom.

---

## [2026-09-24] — result.create missing authorization

**Severity:** Critical
**Category:** Security
**Files changed:** `server/routers/results.router.ts`
**Regression risk:** None

### Problem
`result.create` destructured only `{ input, errors }` and performed no authorization check. The RPC
route injects the session into context but enforces nothing centrally, so an anonymous caller could
create a result — plus a scoresheet per enrolled student and the pre-populated subject scores — for
any term/class. It was the only mutating procedure in the codebase with no guard.

### Fix
Admins may create results for any class; teachers are scoped to their assigned class (PROJECT.md §2.2).
Added `requireClassAccess(context, input.classId)` at the top of the handler, which throws
`UNAUTHORIZED` for anonymous callers and `FORBIDDEN` for out-of-scope teachers.

```ts
const createResult = os.create.handler(async ({ input, errors, context }) => {
  // Authorization: admins may create results for any class; teachers only for their own.
  requireClassAccess(context, input.classId)
```

### Verification
`pnpm lint` — no new errors (only the pre-existing `shared/validators/scoreConfig.ts` empty-file
error, tracked separately as audit #38). Manual read confirms the guard runs before every DB read.

