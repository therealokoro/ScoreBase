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

---

## [2026-09-24] — CORS reflected any origin with credentials enabled

**Severity:** High
**Category:** Security
**Files changed:** `server/routes/rpc/[...].ts`
**Regression risk:** Low (same-origin and the configured app origin are still allowed)

### Problem
`CORSPlugin({ origin: (origin) => origin, credentials: true })` reflected every requesting origin
while allowing credentials, so a malicious site could drive credentialed JSON POSTs to `/rpc`
(preflight passed; `SimpleCsrfProtectionHandlerPlugin` only blocks simple form-style requests).

### Fix
Replaced the reflector with an allowlist: the configured `BETTER_AUTH_URL` origin, the incoming
request's own origin (same-origin callers), and localhost in development. Origins outside the
allowlist receive no `Access-Control-Allow-Origin` header.

### Verification
`pnpm lint` — clean. Read of `@orpc/server`'s `CORSPlugin` confirms the header is only emitted when
the returned value matches the request origin.

---

## [2026-09-24] — partial result-settings updates could break the sum-to-100 invariant

**Severity:** High
**Category:** Logic loopholes
**Files changed:** `server/routers/settings.router.ts`, `server/contracts/settings.contract.ts`
**Regression risk:** Low (valid payloads unchanged; invalid ones now get a clean error)

### Problem
`PartialResultSettingsSchema` is `ResultSettingsBaseSchema.partial()` with the cross-field refines
dropped, so `result.setSettings({ examMax: 80 })` could persist a config whose CA maxima + examMax
exceeded 100. Every later `result.create` snapshots that broken config, and all score-ceiling checks
then validate against it.

### Fix
`result.setSettings` now merges the partial over the stored settings and re-validates the merged
object with the full `ResultSettingsSchema` (including both refines) before writing. Added a
`BAD_REQUEST` error to the contract so the failure is typed.

```ts
const parsed = ResultSettingsSchema.safeParse({ ...current, ...input })
if (!parsed.success) throw errors.BAD_REQUEST({ message: parsed.error.issues[0]?.message })
return await setResultSettings(parsed.data)
```

### Verification
`pnpm lint` — clean. Manual reasoning: a partial that leaves the sum ≠ 100 now fails `safeParse`
instead of reaching `kv.set`.

---

## [2026-09-24] — class.update optional id and teacher class rename

**Severity:** High
**Category:** Authorization / Logic loopholes
**Files changed:** `server/contracts/class.contract.ts`, `server/routers/class.router.ts`
**Regression risk:** Medium (contract input now requires `id`; all callers already send it)

### Problem
`class.update` used `UpsertClassSchema`, whose `id` is optional, so omitting it produced
`eq(classes.id, undefined)` — a runtime SQL error instead of a typed failure. The only
teacher-protected field was `teacherId`, so a teacher could rename their class (a school-wide change)
and `setSubjectList` remained class-scoped as documented.

### Fix
- Contract update input is now `UpsertClassSchema.extend({ id: z.string().min(1) })`.
- Router drops the `input.id!` assertions and adds an explicit admin-only guard for `name` changes,
  mirroring the existing teacher-reassignment guard. Replaced the inline `ORPCError` with
  `errors.FORBIDDEN`.

### Verification
`pnpm lint` — clean. Affected caller `app/composables/useClasses.ts` already passes `id`.

---

## [2026-09-24] — scoresheet/result/settings mutations never invalidated their queries

**Severity:** High
**Category:** Data-fetching correctness
**Files changed:** `app/composables/useResult.ts`, `app/composables/useSettings.ts`,
`app/composables/useClasses.ts`
**Regression risk:** Low (invalidation only; extra refetches are intended)

### Problem
`scoresheet.*` / `subjectScore.*` mutations had no `onSuccess` invalidation. The scoresheet page
worked around this with a manual `refetchScoresheet()`, but the report card is a separate query
(`scoresheet.getReportCard`) with a 5-minute `staleTime`, so a teacher could edit scores and then
print a report card showing the previous totals, grades, and position. The same gap made result
status changes, score-config changes, settings changes, and class edits stale across pages.

### Fix
Added `onSuccess` invalidation with the oRPC-generated keys:
- All scoresheet/subjectScore mutations, plus result status/scoreConfig/delete → invalidate
  `$orpc.scoresheet.key()` and `$orpc.result.key()`.
- Settings set mutations → invalidate `$orpc.settings.school.key()` / `$orpc.settings.result.key()`.
- `useUpdateClass` / `useDeleteClass` → invalidate `$orpc.class.key()` (covers `class.getOne`, not
  just `class.list`).

### Verification
`pnpm lint` — clean. Query-key invalidation is prefix-based, so `getOne`/`getReportCard` queries
under the same router key are covered.

---

## [2026-09-24] — core domain invariants had no DB-level enforcement

**Severity:** High
**Category:** Logic loopholes
**Files changed:** `server/db/schema/academic.ts`, `server/db/schema/result.ts`,
`server/db/migrations/sqlite/0005_perpetual_monster_badoon.sql` (+ meta)
**Regression risk:** Medium (schema change; duplicate rows would block the migration)

### Problem
"One result per (term, class)", "one scoresheet per (result, student)", "max one term per ordinal
per session", and unique session names were enforced only by check-then-insert in the routers. Two
concurrent requests both pass the check and both insert.

### Fix
Added unique indexes: `academic_sessions(name)`, `terms(sessionId, position)`,
`results(termId, classId)`, `scoresheets(resultId, studentId)`. Generated and applied migration
`0005_perpetual_monster_badoon.sql` against the local SQLite DB. The friendly app-level checks stay.

### Verification
`pnpm db:generate` produced the four `CREATE UNIQUE INDEX` statements; `pnpm db:migrate` reported
"Database migration 0005… applied"; `pnpm lint` clean.

---

## [2026-09-24] — no indexes on hot-path foreign keys

**Severity:** High
**Category:** Performance
**Files changed:** `server/db/schema/academic.ts`, `server/db/schema/result.ts`,
`server/db/migrations/sqlite/0006_mysterious_tag.sql` (+ meta)
**Regression risk:** Low (additive)

### Problem
Per-request lookups on `students.classId`, `results.classId`, `scoresheets.studentId`, and
`subjectScores.scoresheetId` had no supporting indexes, so SQLite did full table scans (worst in
`bulkUpdateSubjectScores`, which filters by `scoresheetId` per row). `resultId`/`termId`/`sessionId`
are covered by the leftmost prefixes of the composite unique indexes added in audit #10.

### Fix
Added `index()` definitions for the four columns. Generated and applied migration
`0006_mysterious_tag.sql`.

### Verification
Migration SQL contains the four `CREATE INDEX` statements; `pnpm db:migrate` reported migrations up
to date; `pnpm lint` clean.



