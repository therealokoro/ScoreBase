# AGENTS.md

Guidance for AI agents working in the ScoreBase repository. The code is the source of
truth. `.ai/PROJECT.md` describes intent; when it disagrees with the code, the code wins
and this file (or `.ai/PROJECT.md`) is out of date.

## Critical rules (must follow)

### Responses

- Keep responses concise and to the point, unless the user asks otherwise.
- Keep reasoning outputs as short as possible.

### Planning mode

- Ask clarifying questions when needed.
- Read `.ai/PROJECT.md` for product intent and `DESIGN.md` for the UI system.
- Never assume design, tech stack, or features.
- Document findings in a memory file to free up the context tree.
- Use deep-dive sub-agents to research and to review the plan before presenting it.

### Change / edit mode

- Prefer sub-agents over implementing features yourself; act as coordinator.
- Identify changes that can be implemented in parallel and dispatch sub-agents.
- Use premium models for complex work and mid-tier models for simpler work such as docs.
- Match the coding style, file naming, and conventions already in the project.
- Use the available skills and MCP tools whenever they apply.
- After completing a feature, run `pnpm lint`, `pnpm fmt:check`, and `pnpm build`.

### Database schema changes

- Ask for permission before running `pnpm db:generate` or `pnpm db:migrate`.
- Never run `drizzle push`.

### UI design

- Follow the design system in `DESIGN.md` for every component or page.

## Overview

ScoreBase is a web-based result management platform for Nigerian secondary schools. It
lets admins and teachers create, manage, and publish student academic results with
configurable grading, printable report cards, and role-based access control. The domain
nests an academic Session (max 3 Terms) → one Result per Term → one Scoresheet per student
→ one SubjectScore per subject (CA1/CA2/CA3 plus Exam). Derived values (total, average,
position, grade) are computed on the fly, never stored. The app is a client-side Nuxt SPA
(`ssr: false`).

## Stack

Versions come from `package.json`.

| Layer           | Technology                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| Framework       | Nuxt `^4.5.2`, Vue `^3.5.43`, TypeScript `^6.0.3` (SPA, `ssr: false`)                                   |
| Styling         | Tailwind CSS `^4.3.3`, CSS-first, via `@tailwindcss/vite`. No `tailwind.config.js`                      |
| UI              | shadcn-vue `^2.8.2` / Reka UI `^2.10.5`, generated with UI Thing into `app/components/Ui` (`Ui` prefix) |
| Forms           | FormKit `^2.1.2` only                                                                                   |
| Data fetching   | TanStack Vue Query `^5.103.2`, set up manually                                                          |
| Tables          | TanStack Vue Table `^9.2.4` (v9 API)                                                                    |
| API             | oRPC `^1.15.3` (intentionally v1, not v2)                                                               |
| Backend         | Nitro via the Nuxt `server/` directory                                                                  |
| ORM             | Drizzle ORM `^0.45.3`, drizzle-kit `^0.31.11`, drizzle-zod `^0.8.3`                                     |
| Database        | SQLite via NuxtHub `@nuxthub/core` `^0.10.8` (`hub.db`, libSQL/Turso)                                   |
| KV              | NuxtHub KV: `import { kv } from "@nuxthub/kv"`, deep-merged with `defu`                                 |
| Auth            | Better Auth `^1.7.5` (email/password + admin plugin)                                                    |
| IDs             | `typeid-js` `^1.2.0`                                                                                    |
| Validation      | Zod `^4.6.5`                                                                                            |
| Icons           | `@nuxt/icon` with the `ICONS` map in `shared/constants/icons.ts`                                        |
| Toasts          | `vue-sonner`, aliased to `useSonner`                                                                    |
| Package manager | pnpm `11.5.2`                                                                                           |
| Lint / format   | Oxlint, Oxfmt                                                                                           |

Non-obvious choices:

- **oRPC v1 is pinned deliberately.** v2 is still beta with a changed wire format. Do not
  migrate without an explicit request.
- **TanStack Query is wired manually** in `app/plugins/vue-query.ts`. There is no TanStack
  Query Nuxt module; do not replace the manual setup.
- **TanStack Table v9 API**, not v8. See "TanStack Table v9" under Conventions.
- **NuxtHub Blob is not installed or configured.** There is no `@nuxthub/blob` dependency
  and `hub` only enables `kv` and `db`. There are no file uploads. Add the blob dependency
  and enable `hub.blob` before implementing uploads.
- **NuxtHub imports are package imports**, not v0.9 composables. Use `import { kv } from
"@nuxthub/kv"` and `import { db } from "@nuxthub/db"`, never `hubKv()` / `hubBlob()`.

## Commands

Run all commands with pnpm from the repo root.

| Command            | What it does                                                    |
| ------------------ | --------------------------------------------------------------- |
| `pnpm dev`         | Start the Nuxt dev server                                       |
| `pnpm build`       | Production build (`nuxt build`)                                 |
| `pnpm generate`    | Static generate (`nuxt generate`)                               |
| `pnpm preview`     | Preview the production build                                    |
| `pnpm postinstall` | `nuxt prepare` (regenerates `.nuxt`)                            |
| `pnpm lint`        | Run Oxlint                                                      |
| `pnpm lint:fix`    | Run Oxlint with `--fix`                                         |
| `pnpm fmt`         | Format with Oxfmt                                               |
| `pnpm fmt:check`   | Check formatting with Oxfmt                                     |
| `pnpm db:generate` | `nuxt db generate` — create a Drizzle migration. **Ask first.** |
| `pnpm db:migrate`  | `nuxt db migrate` — apply migrations. **Ask first.**            |
| `pnpm clean-deps`  | Delete `node_modules` and lockfiles (destructive)               |

Notes:

- There is no `typecheck` script and `vue-tsc` is not installed. Use editor/Volar
  diagnostics and `pnpm build` as the closest check.
- `nuxt db generate` and `nuxt db migrate` are provided by NuxtHub through the `nuxt-db`
  binary. There is no root `drizzle.config.ts`; NuxtHub generates one at
  `.nuxt/hub/db/drizzle.config.ts` during `nuxt prepare`. Leave that generation to NuxtHub.
- Migrations live in `server/db/migrations/sqlite/`.
- `pnpm fmt:check` currently reports pre-existing formatting issues in over 1000 files
  repo-wide. Do not run `pnpm fmt` across the whole repo; format only the files you change.

## Directory layout

```
ScoreBase/
├── app/                 # Nuxt frontend (browser). Components, pages, layouts, composables,
│                        # middleware, plugins, utils, assets/css, formkit.config.ts
├── server/              # Nitro server: api, contracts, routers, queries, kv, context,
│                        # db/{schema,migrations}, routes, tasks, seed, utils
├── shared/              # Code used by both sides: constants, types, utils, validators
├── public/              # Static assets
├── .ai/PROJECT.md       # Product intent and domain narrative (descriptive, not truth)
├── DESIGN.md            # UI design system (source of truth for UI decisions)
├── AGENTS.md            # This file
├── .agents/skills/      # Project-local agent skills
├── .data/               # Local SQLite data (not tracked)
├── .nuxt/ .output/      # Build output (not tracked)
└── config files         # nuxt.config.ts, package.json, tsconfig.json, components.json, etc.
```

Path aliases:

- `~~/` or `@@/` → repo root
- `~/` or `@/` → `app/`
- `#shared/` → `shared/` (used from server-side code)
- `~~/shared/` → `shared/` (used from app-side code)

`tsconfig.json` is a solution file that references the generated `.nuxt/tsconfig.*.json`
configs. Do not edit it to add paths.

## Conventions

### oRPC flow: contract → router → composable

1. **Contract** — `server/contracts/<name>.contract.ts`. Use `oc` from `@orpc/contract`
   with `.input()`, `.output()`, and `.errors({ ... })`. Do not use `.route()`; procedure
   paths come from the router object keys. Input/output Zod schemas come from
   `shared/validators/*` (mostly drizzle-zod). A contract can be nested, for example
   `settings.contract.ts` groups `school.*` and `result.*`.
2. **Router** — `server/routers/<name>.router.ts`. Build with
   `implement(contract).$context<APiContext>()` and
   `.handler(async ({ input, context, errors }) => ...)`. Throw typed errors such as
   `errors.NOT_FOUND()`, `errors.CONFLICT({ message })`. Register the router in
   `server/routers/index.ts` under its public key (the key is the API path).
3. **Query** — `server/queries/<name>.query.ts`. Reusable DB access using `db` from
   `@nuxthub/db` and the Drizzle relational API. Name them descriptively
   (`fetchSingleClass`, `listAllClasses`, `listStudentsByClass`).
4. **Composable** — `app/composables/use<Thing>.ts`. Wrap the procedure in `useQuery` /
   `useMutation` via `$orpc.<router>.<procedure>.queryOptions()` /
   `.mutationOptions()`, and invalidate with `$orpc.<router>.<procedure>.queryKey()`.

```ts
// app/composables/useClasses.ts
export const useCreateClass = () => {
  const { $orpc } = useNuxtApp()
  const qc = useQueryClient()
  return useMutation(
    $orpc.class.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: $orpc.class.list.queryKey() })
    })
  )
}
```

Composables return the raw TanStack result (`data`, `isPending`, `error`, `mutateAsync`).
Single-item getters accept `MaybeRef` / `MaybeRefOrGetter` and resolve with `toValue()`.

### Authorization guards

`server/utils/auth-guard.ts` is the single source of truth for access checks. Use its
helpers instead of inline role checks:

- `requireAdmin(context)` — admin-only handlers. Throws `UNAUTHORIZED` when there is no
  session and `FORBIDDEN` when the user is not an admin.
- `requireClassAccess(context, classId)` — class-scoped records. Admins pass; a teacher
  passes only for their own `user.classId`.
- `requireSelf(context, id)` — actions on the caller's own account (used by `account.*`).

```ts
import { requireClassAccess } from "../utils/auth-guard"

const getStudent = os.getOne.handler(async ({ input, context }) => {
  requireClassAccess(context, student.classId)
})
```

- **Page layer** — `app/middleware/auth.global.ts` blocks non-admins from
  `ADMIN_ONLY_PAGES` (`/dashboard/classes`, `/dashboard/sessions`, `/dashboard/subjects`,
  `/dashboard/teachers`). Per-page middleware `admin-only` and `teacher-only` add scoped
  checks. Add new admin pages to `ADMIN_ONLY_PAGES`.
- **Teacher scoping** — call `requireClassAccess` before reading or mutating a class-scoped
  record. When a teacher may not change a field (for example reassigning a class teacher or
  moving a student to another class), throw `FORBIDDEN` explicitly. Procedures teachers use
  (settings reads, class/student/subject list reads, result and scoresheet flows,
  `teacher.getClass`) must not be admin-gated.

### KV settings pattern

Settings are typed config objects stored in NuxtHub KV.

- Defaults and types: `shared/constants/kv-settings.ts` (`DEFAULT_SCHOOL_SETTINGS`,
  `DEFAULT_RESULT_SETTINGS`).
- Helpers: `server/kv/school-settings.ts` (key `settings:school`) and
  `server/kv/result-settings.ts` (key `settings:result`).
- Read pattern deep-merges stored values over defaults with `defu` through
  `server/kv/merge-settings.ts`: `const settings = mergeSettings(stored ?? {}, DEFAULT_X)`.
  The merger replaces arrays wholesale, because plain `defu` concatenates arrays and would
  duplicate `gradeBoundaries` / `caMaxScores`. Pass a key to read one field:
  `getSchoolSettings("termPreset")`.
- Write pattern merges the partial into the current value and calls `kv.set`. Reset calls
  `kv.del`.
- `getResultScoreConfig()` snapshots only `{ caCount, caMaxScores, examMax }` onto a Result
  at creation time. Grading and position settings are read fresh at render time.

### Never await `useAsyncData`

Awaiting `useAsyncData` blocks navigation. Use `useLazyAsyncData` or a TanStack `useQuery`.
`await useAsyncData` does not appear anywhere in the codebase. Two files use
`useLazyAsyncData` with the raw `$orpc.<router>.<procedure>.call(...)` escape hatch:
`app/components/Student/ListTable.vue` and `app/pages/dashboard/my-class.vue`.

### TanStack Query and the oRPC client

- `app/plugins/vue-query.ts` creates the `QueryClient` (`staleTime: 5 min`) and
  dehydrates/hydrates through `useState("vue-query")`. With `ssr: false`, the server
  dehydrate and `app/plugins/orpc.server.ts` paths are effectively dead code.
- `app/plugins/orpc.client.ts` creates an `RPCLink` to `/rpc` with
  `credentials: "include"` and wraps it in `createTanstackQueryUtils`. `$orpc` is typed
  from the plugin return value; there is no `.d.ts` augmentation.

### TanStack Table v9

- Features are registered once in the exported `tanStackTableFeatures` const in
  `app/components/Ui/TanStackTable.vue` via `tableFeatures({ ... })`.
- Create tables with `useTable({ features, data, columns, state, on*Change })`.
- Read atom state with `table.atoms.<slice>.get()` (for example
  `table.atoms.pagination.get()`).
- Column pinning uses `"start"` / `"end"`; row pinning uses `"top"` / `"bottom"`.
- Render with `FlexRender` and `:header` / `:cell` / `:footer` props.
- Do not use v8 APIs such as `getCoreRowModel`.

### Report card print

- The viewer page calls `window.print()`; dashboard chrome (sidebar, header, action bar)
  is hidden with Tailwind `print:hidden`.
- The report card wrapper is tagged `report-card-print-root`, and
  `app/assets/css/tailwind.css` sets `@page { size: A4 }`.
- The renderer is `app/components/ReportCard/Document.vue`.

### Auto-imports

Configured in `nuxt.config.ts` under `imports`:

- `useQuery`, `useMutation`, `useQueryClient` from `@tanstack/vue-query`
- `tv` and the `VariantProps` type from `tailwind-variants`
- `useSonner` as an alias for `vue-sonner`'s `toast`

Nuxt also auto-imports components (`Ui*`, `Page`, `App*`) and supports lazy `Lazy<Name>`
forms. Some `Ui/*` files still import `tv` / `VariantProps` manually; both styles exist.

### FormKit custom inputs

FormKit is the only form library.

- Config: `app/formkit.config.ts`; module `@formkit/nuxt` with `autoImport: true`.
- Custom inputs are registered centrally with `createInput`:
  - `_select` → `app/components/FormKit/Select.vue`, used as `<FormKit type="_select" />`
  - `_tags` → `app/components/FormKit/Tags.vue`, used as `<FormKit type="_tags" />`
- `app/components/FormKit/Password.vue` is a wrapper used directly as
  `<FormKitPassword />`, not registered in `inputs`.
- Styles live in `app/assets/css/formkit-shadcn.css`.
- Zod schemas live in `shared/validators/`; derive types with `z.infer`.

### Better Auth

- Email/password plus the `admin` plugin only. There is no username plugin and no
  `useUserSession`; the client is built in `app/composables/useAuth.ts` around Better
  Auth's `useSession` atom.
- In `server/db/schema/auth.ts`, `account.issuer` is nullable and unindexed (Better Auth
  1.7.3+). Do not reintroduce a unique index on `(issuer, accountId)`.

### IDs, seeding, and env

- IDs use `typeid-js` with prefixes: `aca`, `term`, `class`, `subject`, `subprst`, `stu`,
  `result`, `ssheet`, `sscore`. Better Auth generates its own IDs. Do not use `nanoid`.
- Two seeding mechanisms: Nitro tasks in `server/tasks/seed/*` (enabled by
  `nitro.experimental.tasks`) and standalone scripts in `server/seed/*`, plus an admin
  seed route at `server/api/seed/admin.post.ts`.
- Auth env vars: `NUXT_BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (exposed as
  `public.betterAuthUrl`), and `NUXT_DEFAULT_ADMIN_{EMAIL,PASS,NAME,PHONE}`.

## What NOT to do

- Do not migrate oRPC to v2, or change the `/rpc` wire format.
- Do not replace the manual TanStack Query setup with a Nuxt module.
- Do not use TanStack Table v8 APIs.
- Do not use `hubBlob()` / `hubKv()`; import from `@nuxthub/**`.
- Do not use `nanoid`; use `typeid-js` with the existing prefixes.
- Do not `await useAsyncData` inside composables or components.
- Do not introduce another form library; use FormKit.
- Do not run `drizzle push`; ask before `pnpm db:generate` or `pnpm db:migrate`.
- Do not hardcode colors or spacing; use the tokens in `DESIGN.md`.
- Do not add admin-only server procedures without calling `requireAdmin(context)`.
- Do not admin-gate procedures that teachers use (see Admin gating).

## Maintaining this file

1. Every task that changes a convention, script, dependency, or folder layout must update
   `AGENTS.md` in the same change.
2. Fix stale sections opportunistically when you notice them.
3. Code wins over `AGENTS.md` and over `.ai/PROJECT.md` when they conflict. A conflict
   means `AGENTS.md` (or `.ai/PROJECT.md`) needs updating.
4. If the code and `.ai/PROJECT.md` disagree, fix the code or update `.ai/PROJECT.md`.
   Do not leave a stale claim in this file.
5. Keep it scannable. If a section grows beyond about 30 lines, move detail to
   `.ai/PROJECT.md`.
6. Date significant convention changes with a one-line note.

_Convention changes logged here:_

- 2026-09-23 — Initial code-verified `AGENTS.md`. Fixed the stale
  `docs/APP_DESCRIPTION.md` reference to `.ai/PROJECT.md`.
- 2026-09-23 — KV settings now deep-merge with `defu` (`server/kv/merge-settings.ts`,
  arrays replaced wholesale); admin gating goes through the shared `requireAdmin` helper in
  `server/utils/auth-guard.ts`; report card print uses `report-card-print-root` and
  `@page { size: A4 }`. Removed references to the removed form-validation and code-quality
  tooling and to the former TanStack Query module, and removed the former Gotchas/Known
  drift section.
- 2026-09-24 — Added `requireSelf` and `requireClassAccess` to `server/utils/auth-guard.ts`.
  `account.*` is now self-scoped; `class.update` / `class.setSubjectList` are class-scoped
  (teachers cannot reassign a class teacher); `student.getOne` / `create` / `update` /
  `delete` / `query` are class-scoped (teachers cannot move a student to another class).
