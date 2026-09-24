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

---

## [2026-09-24] — createScoresheets queried the wrong table's columns; missing class scope

**Severity:** Critical
**Category:** Logic loopholes
**Files changed:** `server/routers/scoresheet.router.ts`
**Regression risk:** Low (procedure was broken at runtime; only fixes the path)

### Problem
`createScoresheets` filtered the `students` table by `results.id` and the `classes` table by
`results.id`. Those are not joins, so libSQL failed with "no such column" and the procedure 500'd
every time. It also never verified the supplied `studentIds` belonged to `result.classId`, and used a
hand-rolled teacher role check instead of the shared guard.

### Fix
- `inArray(students.id, input.studentIds)` and `eq(classes.id, result.classId)`.
- Scope students to the result's class: `and(inArray(students.id, ...), eq(students.classId, result.classId))`.
- Replaced the inline role check with `requireClassAccess(context, result.classId)`.
- Removed the now-unused `results` import.

### Verification
`pnpm lint` — 0 warnings, only the pre-existing empty-file error. Manual read confirms all three
queries now target the correct tables.

---

## [2026-09-24] — student.update always threw CONFLICT

**Severity:** Critical
**Category:** Logic loopholes
**Files changed:** `server/routers/student.router.ts`
**Regression risk:** None (updates previously never succeeded)

### Problem
`checkConflict(name, studentId)` looked up a student matching the new name OR student ID and threw
`CONFLICT` on any hit. On update, the student's own row always matched its own name, so every
`student.update` failed — even a no-op edit — making it impossible to edit a student's phone number
or class.

### Fix
Added an `excludeId` parameter to `checkConflict` and included `ne(students.id, excludeId)` in the
`where` clause (via `and`); the update handler passes `input.id`. Also replaced the inline
`new ORPCError("FORBIDDEN", ...)` with `errors.FORBIDDEN(...)` for consistency.

### Verification
`pnpm lint` — clean. Manual read confirms the self-row is excluded from the conflict lookup.

---

## [2026-09-24] — unauthenticated seed endpoints

**Severity:** Critical
**Category:** Security
**Files changed:** `server/api/seed/admin.post.ts` (deleted), `nuxt.config.ts`, `AGENTS.md`
**Regression risk:** Low (the `seed:admin` Nitro task still provides the same capability in dev)

### Problem
`POST /api/seed/admin` created an admin account with no auth, method, or host guard, was
non-idempotent, and re-threw raw errors via `createError(error)`. Separately,
`nitro.experimental.tasks: true` exposed Nitro's unauthenticated HTTP task endpoints in
production, including seed tasks that create data.

### Fix
Deleted the seed route (the `seed:admin` Nitro task already covers local seeding) and gated
`nitro.experimental.tasks` to non-production environments. Updated AGENTS.md seeding docs and the
convention log.

### Verification
`Test-Path server/api/seed/admin.post.ts` → `False`; only `server/api/auth/[...all].ts` remains under
`server/api`. `pnpm build` is re-run at the end of the batch.



