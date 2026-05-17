# Project Reference: ScoreBase

## App Overview

ScoreBase - A nigerian secondary school result management system for admins and teachers to manage academic sessions, terms, students, classes, subjects, teachers, and results. Full feature set in `docs/APP_DESCRIPTION.md`.

## Tech Stack

### Frontend

- **Framework**: Vue 3.5.33, Nuxt 4.4.4 (app directory structure)
- **Language**: TypeScript 6.0.3
- **Styling**: Tailwind CSS 4.2.4, Tailwind Variants, clsx, tailwind-merge
- **Data Fetching**: Tanstack Vue Query 5.100.6, oRPC 1.14.0 (type-safe RPC)
- **UI**: Shadcn Vue 2.6.2 (Reka UI 2.9.6), @tabler/icons-vue, @iconify-json
- **Validation**: Zod 4.4.1, vee-validate 4.15.1

### Backend

- **Runtime**: Nitro (Nuxt server)
- **Database**: Nuxthub 0.10.7 (SQLite via Drizzle ORM 0.45.2, KV storage)
  - Use `import { db, schema } from 'hub:db'` for server-side DB access
  - Migrations: `npx nuxt db generate` + `npx nuxt db migrate`
  - Typeid-js prefixes for entity IDs: e.g `typeid("aca")`, `typeid("term")`, `typeid("class")`, `typeid("subject")`, `typeid("user")`, etc.
- **Auth**: Better Auth 1.6.9 (email/password, admin plugin, Drizzle adapter)
- **RPC**: oRPC 1.14.0 (contracts, routers, server/client plugins)

### Dev/Other

- **Package Manager**: pnpm 10.33.2
- **Seeding**: FakerJS (server/tasks/seed.ts)
- **Linting/Formatting**: Oxlint, Oxfmt (per APP_DESCRIPTION.md)
- **Shared**: typeid-js (type-safe IDs), drizzle-zod (schema generation)

---

## Project Structure

### Root Files

| File                        | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `docs/APP_DESCRIPTION.md`   | App overview, features, roles, tech stack               |
| `docs/MVP_BREAKDOWN.md`     | Complete work breakdown for MVP implementation          |
| `docs/PROJECT_REFERENCE.md` | Complete work breakdown for MVP implementation          |
| `nuxt.config.ts`            | Nuxt config (modules, runtime config, vite plugins)     |
| `package.json`              | Dependencies, scripts, package manager                  |
| `tsconfig.json`             | Extends `.nuxt/tsconfig.json`                           |
| `opencode.json`             | Opencode agent config                                   |
| `DESIGN.md`                 | Instructions for agents for UI/UX across the ap         |
| `skills-lock.json`          | Lock file for pre-installed skills                      |
| `shared/`                   | Shared validators/constants/types between client/server |

### `shared/` Directory

| Path                     | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `validators/academic.ts` | Zod schemas for academic entities (sessions, terms, classes, subjects, subject lists) |
| `validators/actors.ts`   | Zod schemas for actors (students,teachers use user table)                             |
| `types/entities.ts`      | TypeScript types inferred from Zod schemas                                            |
| `constants/icons.ts`     | Reusable icons defined in an object as a single source of truth for app wide use      |

### `app/` Directory (Nuxt 4 App)

| Path                        | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `layouts/default.vue`       | Main app layout                                                   |
| `layouts/print.vue`         | Print-optimized layout for report cards                           |
| `pages/index.vue`           | Root page                                                         |
| `components/ui/`            | Shadcn Vue (Reka UI) components with barrel `index.ts` exports    |
| `components/form/`          | Custom form components built for form usage `index.ts` exports    |
| `composables/session.ts`    | Academic session Tanstack Query composables                       |
| `composables/useAuth.ts`    | Better Auth client composable (session, sign in/out, role checks) |
| `composables/useSidebar.ts` | Sidebar state composable                                          |
| `plugins/orpc.server.ts`    | Server-side oRPC client for Tanstack Query                        |
| `plugins/orpc.client.ts`    | Client-side oRPC client (fetch link, CSRF protection)             |
| `middleware/auth.ts`        | Redirects unauthenticated users to login                          |
| `middleware/guard.ts`       | Role-based access guard (user/admin/guest)                        |
| `lib/utils.ts`              | `cn()` function (clsx + tailwind-merge for class merging)         |
| `assets/css/main.css`       | Main Tailwind CSS v4 entry                                        |

### `server/` Directory (Nitro Backend)

| Path                                | Purpose                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `db/schema/index.ts`                | Exports all Drizzle schema files (auth, academic, common)                                             |
| `db/schema/auth.ts`                 | Better Auth tables (user, session, account, verification) with typeid-js IDs                          |
| `db/schema/academic.ts`             | Academic tables (sessions, terms, classes with subjectList FK, subjects with JSON tags, subjectLists) |
| `db/migrations/sqlite/`             | Drizzle SQLite migrations (0000_naive_speed_demon.sql - single migration)                             |
| `utils/auth.ts`                     | Better Auth initialization (Drizzle adapter, admin plugin)                                            |
| `utils/orpc.ts`                     | Base oRPC instance (`baseORPC`)                                                                       |
| `routers/index.ts`                  | Main API router (combines all sub-routers)                                                            |
| `routers/session.router.ts`         | Academic Session CRUD + auto-create 1st term                                                          |
| `routers/term.router.ts`            | Term CRUD (list, getOne, create, update, delete)                                                      |
| `routers/class.router.ts`           | Class CRUD + teacher assignment                                                                       |
| `routers/subject.router.ts`         | Subject CRUD (list, getOne, create, update, delete) with tags                                         |
| `routers/teacher.router.ts`         | Teacher CRUD (list, getOne, create, update, delete)                                                   |
| `routers/subjectList.router.ts`     | Subject List CRUD (presets of subjects students can offer)                                            |
| `contracts/session.contract.ts`     | oRPC contracts + error definitions for sessions                                                       |
| `contracts/term.contract.ts`        | oRPC contracts + error definitions for terms                                                          |
| `contracts/class.contract.ts`       | oRPC contracts + error definitions for classes                                                        |
| `contracts/subject.contract.ts`     | oRPC contracts + error definitions for subjects                                                       |
| `contracts/subjectList.contract.ts` | oRPC contracts for subject lists (create, list, getOne, delete)                                       |
| `contracts/teacher.contract.ts`     | oRPC contracts for teachers (uses Better Auth user table)                                             |
| `queries/session.query.ts`          | Reusable read queries only (fetchSingle, listAll)                                                     |
| `queries/term.query.ts`             | Reusable read queries only (fetchSingleTerm, listAllTerms)                                            |
| `queries/class.query.ts`            | Reusable read queries only (fetchSingleClass, listAllClasses)                                         |
| `queries/subject.query.ts`          | Reusable read queries (fetchSingleSubject, listAllSubjects, listSubjectsByTags)                       |
| `queries/subjectList.query.ts`      | Reusable read queries for subject lists                                                               |
| `queries/teacher.query.ts`          | Reusable read queries for teachers (fetches from user table with class include)                       |
| `routes/rpc/[...].ts`               | Catch-all oRPC handler (CORS, CSRF, body limit plugins, 10MB max)                                     |
| `context/index.ts`                  | Reserved for oRPC context (currently empty)                                                           |
| `tasks/seed.ts`                     | FakerJS database seeding task                                                                         |

### Entity Naming Convention

- **`academicSession`** = School academic session (e.g., "2025/26 Academic Session")
  - DB Table: `academic_sessions`
  - Contract: `session.contract.ts` (shortened for convenience)
  - Router: `session.router.ts`
  - Query: `session.query.ts`
- **`session`** = Better Auth user session (login session)
  - DB Table: `session` (in `auth.ts`)
  - Managed by Better Auth, not oRPC

### `.agents/skills/` Directory (Pre-installed Skills)

- antfu, better-auth-best-practices, brainstorming, create-adaptable-composable, create-auth-skill, dispatching-parallel-agents, executing-plans, find-skills, finishing-a-development-branch, nuxt, nuxt-better-auth, nuxthub, pnpm, receiving-code-review, reka-ui, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, vite, vue, vue-best-practices, vue-debug-guides, vueuse, vueuse-functions, writing-plans, writing-skills

---

## Code Patterns & Conventions

### oRPC Implementation Pattern

**File Structure** (per entity - subject to domain-deriven approach for closely coupled entities):

- `server/contracts/<entity>.contract.ts` - Input/output schemas + error definitions
- `server/routers/<entity>.router.ts` - Handlers with business logic + DB mutations
- `server/queries/<entity>.query.ts` - ONLY reusable read queries (no mutations)
- `shared/validators/<entity>.ts` - reusable zod schemas for validations
- `shared/types/<entity>.ts` - reusable Typescript types extracted drizzle or zod schemas
- `app/composables/<entity>.ts` - reusable composables that wrap tanstack query & orpc calls for both queries and mutations

**Contract Pattern** (`server/contracts/session.contract.ts`):

```typescript
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { EntitySchema, CreateEntitySchema, UpdateEntitySchema } from '@@/shared/validators/...'

export const list = oc.output(z.array(EntitySchema));

export const getOne = oc
  .input(EntitySchema.pick({ id: true }))
  .output(EntitySchema)
  .errors({ NOT_FOUND: { message: "..." } })

export const create = oc
  .input(CreateEntitySchema)
  .output(EntitySchema)
  .errors({ CONFLICT: { message: "..." } })

export const update = oc
  .input(UpdateEntitySchema)
  .output(EntitySchema)
  .errors({ NOT_FOUND: ..., CONFLICT: ... })

export const remove = oc
  .input(z.object({ id: z.string() }))
  .output(z.object({ success: z.boolean() }))
  .errors({ NOT_FOUND: ..., PRECONDITION_FAILED: ... })

export const entityContract = { list, getOne, create, update, 'delete': remove };
```

**Router Pattern** (`server/routers/session.router.ts`):

```typescript
import { implement } from "@orpc/server"
import { entityContract } from "../contracts/entity.contract"
import { fetchSingle, listAll } from "../queries/entity.query"
import { entityTable } from "../db/schema"
import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"

const os = implement(entityContract)

const listEntities = os.list.handler(async () => await listAll())

const getSingle = os.getOne.handler(async ({ input, errors }) => {
  const entity = await fetchSingle(input.id)
  if (!entity) throw errors.NOT_FOUND()
  return entity
})

const createEntity = os.create.handler(async ({ input, errors }) => {
  // Business logic (e.g., check duplicates)
  const existing = await fetchSingle(input.name, "name")
  if (existing) throw errors.CONFLICT()

  // DB mutation directly in handler
  const [entity] = await db.insert(entityTable).values(input).returning()
  return entity!
})

const updateEntity = os.update.handler(async ({ input, errors }) => {
  const existing = await fetchSingle(input.id)
  if (!existing) throw errors.NOT_FOUND()

  // Check conflicts if name changed
  if (input.name !== existing.name) {
    const nameConflict = await fetchSingle(input.name, "name")
    if (nameConflict) throw errors.CONFLICT()
  }

  const [updated] = await db
    .update(entityTable)
    .set({ name: input.name })
    .where(eq(entityTable.id, input.id))
    .returning()
  return updated!
})

const removeEntity = os.delete.handler(async ({ input, errors }) => {
  const existing = await fetchSingle(input.id)
  if (!existing) throw errors.NOT_FOUND()

  // Check dependencies (e.g., prevent delete if has children)
  const dependencies = await db.query.relatedTable.findMany({
    where: eq(relatedTable.entityId, input.id)
  })
  if (dependencies.length > 0) throw errors.PRECONDITION_FAILED()

  await db.delete(entityTable).where(eq(entityTable.id, input.id))
  return { success: true }
})

export const entityRouter = {
  list: listEntities,
  getOne: getSingle,
  create: createEntity,
  update: updateEntity,
  delete: removeEntity
}
```

**Query Pattern** (`server/queries/session.query.ts`):

```typescript
import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"
import { entityTable } from "../db/schema"

/** Reusable: Find by id or any column */
export const fetchSingle = async (payload: string, column: "id" | "name" = "id") => {
  return await db.query.entityTable.findFirst({
    where: eq(entityTable[column], payload)
  })
}

/** Reusable: List all */
export const listAll = async () => {
  return await db.query.entityTable.findMany()
}
// NO mutations here - only reusable reads
```

### Drizzle ORM Patterns

- **Primary Keys**: Typeid-js with entity prefix via `$default(() => typeid("entity").toString())`
  - Sessions: `typeid("aca")`, Terms: `typeid("term")`, Classes: `typeid("class")`
  - Subjects: `typeid("subject")`, Users: `typeid("user")`, Sessions(BetterAuth): `typeid("session")`
  - Subject Lists: `typeid("subprst")`
- **Foreign Keys**: Use `text` type to match typeid format (e.g., `sessionId: text('session_id')`)
- **Casing**: Snake case (configured in `nuxt.config.ts` via `hub.db.casing`)
- **Timestamps**: Shared `dateTimeSchema` in `server/db/schema/common.ts` using `timestamp_ms` mode
- **JSON Columns**: Use Drizzle's JSON mode with `$type<T>()` for TypeScript
  ```typescript
  tags: text("tags", { mode: "json" }).$type<string[]>()
  subjectIds: text("subjectIds", { mode: "json" }).$type<string[]>()
  ```
- **Read Operations**: Use `db.query.table.findFirst()` or `db.query.table.findMany()`
- **Insert**: `db.insert(table).values(input).returning()`
- **Update**: `db.update(table).set(data).where(eq(table.id, id)).returning()`
- **Delete**: `db.delete(table).where(eq(table.id, id))`

### Schema Patterns (`shared/validators/`)

Using drizzle-zod's schema generators for clean, type-safe schemas:

```typescript
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { entityTable } from "~~/server/db/schema"

export const EntitySchema = createSelectSchema(entityTable)
export const CreateEntitySchema = createInsertSchema(entityTable)
export const UpdateEntitySchema = createUpdateSchema(entityTable, {
  id: z.string(),
  name: z.string("Validation message")
})

// For JSON fields with validation:
export const CreateSubjectListSchema = createInsertSchema(subjectLists, {
  subjectIds: z.array(z.string()).min(1, "Must have at least one subject")
})
```

### Better Auth

- **Server-side**: `server/utils/auth.ts` with Drizzle adapter + admin plugin
- **Client-side**: `app/composables/useAuth.ts` wraps `better-auth/vue` client
- **Entity naming**: Use `academicSession` (not `session`) to distinguish from Better Auth's `session`

## Key Business Rules (from APP_DESCRIPTION.md)

1. **Session**: Max 3 terms. 1st term auto-created on session creation.
2. **Term**: Max 1 result per term. Score distribution must total 100 (e.g., CA1=10, CA2=10, CA3=10, Exam=70).
3. **Subject List**: Admin creates presets of subjects offerrable by students. Each list contains an array of subject IDs. Classes reference a subject list, so students in that class automatically get those subjects during scoring.
4. **Result**: Draft → Submitted → Reviewed → Approved/Published lifecycle.
5. **Scoresheet**: 1 per student per result. Pre-populated from class's assigned subject list.
6. **Derived Metrics**: Computed on-the-fly, cached until dependencies change. **NEVER stored in DB**.
   - Total Score = sum of CA scores + Exam
   - Overall Score = sum of all subject totals
   - Average Score = Overall ÷ Number of Subjects
   - Class Position = rank by Average (ties share position)
   - Subject Grade = mapped from Total using configurable scale
7. **Teachers**: Scoped to assigned class only. Auto-generated credential: `password` (name + phone).
8. **Admin Only**: Approve/publish/decline result edits, promote/demote students, configure system settings.

### State Management

- **Server State**: Tanstack Vue Query via oRPC plugin (`app/plugins/orpc.*.ts`)
- **UI State, mutations and data fetching**: Vue composables (`app/composables/`)

### UI Patterns

- **Components**: Shadcn Vue (Reka UI) in `app/components/ui/` with barrel `index.ts`
- **Domain Driven Approach for components**: Closely coupled components are defined in a single folder and referenced with the path prefix
- **Styling**: Tailwind CSS v4 + `cn()` utility (`app/lib/utils.ts`)
- **Design Instructions**: `DESIGN.md` file at the root for instructions, skills for best practices

---

## File Naming Conventions

- **Composables**: camelCase (`useAuth.ts`, `useSidebar.ts`)
- **Vue Components**: PascalCase (`TagsInput.vue`, `ToggleGroup.vue`)
- **oRPC Files**: dot notation (`session.router.ts`, `session.contract.ts`)
- **Drizzle Schemas**: lowercase (`academic.ts`, `auth.ts`, `common.ts`)
- **Barrel Files**: `index.ts` for exports (routers, schema)

---

## Inter-File Workflow

1. Client requests hit `/rpc/*` → caught by `server/routes/rpc/[...].ts` (oRPC handler)
2. oRPC router matches contract → executes handler in `server/routers/`
3. Handlers query Drizzle DB via `db` import from `@nuxthub/db`
4. Client-side oRPC plugin (`app/plugins/orpc.client.ts`) provides typed client via `useNuxtApp().$orpc`
5. Composables (e.g., `app/composables/session.ts`) use `$orpc` with Tanstack Query for data fetching and mutation
6. Auth middleware (`app/middleware/auth.ts`, `guard.ts`) checks session via `useAuth()` composable
7. Better Auth server utils (`server/utils/auth.ts`) manage sessions/accounts via Drizzle adapter
