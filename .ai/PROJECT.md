# ScoreBase — Reference Document

> **Reference of Intent, Not Source of Truth**
>
> This document describes what the project is and why certain decisions were made. It
> serves as a single narrative for onboarding, context, and product intent.
>
> **The actual code is the source of truth.** If this document and the code disagree, the
> code wins — and this document should be updated. See `AGENTS.md` for code-verified
> conventions that agents must follow.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Roles & Permissions](#2-roles--permissions)
3. [Domain Model](#3-domain-model)
4. [Feature Specifications](#4-feature-specifications)
5. [Report Cards](#5-report-cards)
6. [System Configuration](#6-system-configuration)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Tech Stack](#8-tech-stack)
9. [Codebase Structure](#9-codebase-structure)
10. [Code Patterns](#10-code-patterns)
11. [File Naming Conventions](#11-file-naming-conventions)
12. [Business Rules](#12-business-rules)
13. [Glossary](#13-glossary)

---

## 1. Product Overview

ScoreBase is a web-based result management platform purpose-built for **Nigerian secondary
schools**. It enables school administrators and teachers to create, manage, and publish
student academic results with configurable grading systems, printable report cards, and
role-based access control.

The system models the Nigerian academic calendar: a **Session** (e.g. `2025/2026 Academic
Session`) contains up to three **Terms** (1st, 2nd, 3rd). Each Term has exactly one **Result**,
which is composed of one **Scoresheet** per enrolled student, and each Scoresheet contains a
**SubjectScore** row per subject the student offers.

The primary output is a printable report card that includes subject scores, grades, overall
and average scores, class position, and remarks from the teacher and/or principal. Report
cards are rendered from an admin-configurable template, giving each school full control over
layout, branding, and content.

---

## 2. Roles & Permissions

### 2.1 Admin

System-wide authority. Performs everything a Teacher can, plus:

- Full CRUD on Academic Sessions, Terms, Classes, Subjects, Teachers, Students
- Create, review, approve, and publish Results (including those created by Teachers)
- Approve or decline Teacher-proposed result edits
- Promote or demote students between classes
- Configure school-wide settings (grading system, report card template, student ID pattern,
  score distribution, etc.)

### 2.2 Teacher

Scoped strictly to their assigned class:

- CRUD on Students within their assigned class
- CRUD on Results for their assigned class
- Propose edits to published results (subject to Admin approval)
- Manage subject offerings per student scoresheet (add/remove subjects)

### 2.3 Shared Dashboard

Teachers and Admins share a single `/dashboard` route. Sub-routes are hidden or shown based
on `user.role` inside `app/layouts/dashboard.vue` where navigation routes are defined. Pages
that require elevated access use the `admin-only` or `teacher-only` middleware.

---

## 3. Domain Model

### 3.1 Entity Hierarchy

```
Session (e.g. 2025/2026)
  └── Term [max 3 per Session] (e.g. 1st Term)
        └── Result [max 1 per Term]
              └── Scoresheet [1 per Student]
                    └── SubjectScore [1 per Subject offered]
                          ├── CA1 Score
                          ├── CA2 Score
                          ├── CA3 Score (could be cumulative)
                          └── Exam Score

Class (e.g. JSS1A)
  ├── Assigned Teacher
  ├── Preset Subjects
  └── Enrolled Students

Subject
  └── Tags (e.g. Junior, Senior, General, Science, Art, Business)

Teacher
  ├── Assigned Class
  └── Login Credentials (auto-generated on creation)
```

### 3.2 Key Concepts

- **Session** — an academic year. Auto-creates the 1st Term on creation.
- **Term** — one of up to three terms per session. Carries the score distribution config
  (how CA and Exam scores are weighted) for its Result.
- **Result** — one per Term. Represents the collection of scoresheets for a class in that term.
- **Scoresheet** — one per enrolled student per Result. Contains their subject scores.
- **SubjectScore** — one row per subject offered by the student. Holds the CA1/CA2/CA3
  breakdown and the Exam score.
- **Subject List** — a reusable preset of subjects. Assigned to a class so that any student
  enrolled in that class automatically gets those subjects on their scoresheet.

---

## 4. Feature Specifications

### 4.1 Academic Session Management

- Admin creates sessions (e.g. `2025/2026 Academic Session`).
- On session creation, the **1st Term is automatically created** under that session.
- A session supports a **maximum of 3 Terms** (1st, 2nd, 3rd).

### 4.2 Term Management

- Admin creates Terms within a Session.
- Each Term has configurable **score distribution parameters**:
  - Total obtainable score per assessment must sum to **100**.
  - Example: `CA1 = /10, CA2 = /10, CA3 = /10, Exam = /70`.
- Each Term supports **one Result record**.

### 4.3 Class Management

- Admin creates and manages classes (e.g. `JSS1`, `JSS1A`, `SS2B`).
- Each class has a preset list of subjects and one assigned teacher.

### 4.4 Subject Management

- Admin creates subjects and assigns **one or more tags** from a configurable tag list.
- Example tags: `Junior`, `Senior`, `General`, `Science`, `Art`, `Business`.
- Tags allow filtering subjects by category or school arm.
- Admin creates **subject lists** (presets of subjects offerrable by a student).
- Admin can assign a subject-list preset to a class, so any student assigned to that class
  automatically gets assigned those subjects during subject scoring per term.

### 4.5 Student Management

- Admin or assigned Class Teacher manages student records.
- Fields: **Full Name**, **Student ID**, **Class**, **Phone Number (optional)**.
- Student ID follows a configurable pattern (e.g. `STU/2025/001`).

### 4.6 Teacher Management

- Admin creates teacher accounts.
- **Auto-generated credentials on creation:**
  - `username`: derived from name (e.g. `John Doe` → `jdoe`) _(post-MVP)_
  - `password`: derived from phone number (e.g. `08133342323`)
- Teachers can update their credentials from their dashboard.
- Teachers are assigned to one class each.

### 4.7 Result Management

#### Lifecycle

```
Draft → Submitted (by Teacher) → Reviewed → Approved/Published (by Admin)
       └── Edit Proposed (by Teacher) → Approved/Declined (by Admin)
```

#### Scoresheet behaviour

- Created per student within a Result.
- Pre-populated with the **class's preset subjects** on creation.
- Teacher can **add or remove subjects** from individual student scoresheets.
- Score fields: CA1, CA2, CA3 (configurable), Exam — each bounded by term parameters.

#### Derived metrics

Calculated on the fly and cached until dependencies change:

- **Total Score** per subject = sum of CA scores + Exam score
- **Overall Score** = sum of all subject totals
- **Average Score** = Overall Score ÷ Number of Subjects
- **Class Position** = rank by Average Score (ties share the same position)
- **Subject Grade** = mapped from Total Score using configurable grading scale

> **Design Decision — Derived Data Storage:**
> Derived metrics (grade, average, position) are computed at report card load time and cached
> until any dependent score changes. They are **not stored persistently** in the database.
> This avoids stale data and reduces storage complexity while maintaining performance via
> caching.

---

## 5. Report Cards

### 5.1 Contents

| Field          | Description                                                            |
| -------------- | ---------------------------------------------------------------------- |
| Student Info   | Name, Class, Student ID, Session, Term                                 |
| Subject Scores | CA1, CA2, CA3, Exam, Total — one row per subject                       |
| Subject Grade  | Derived from configurable grading scale (A–F or Excellent/V.Good/Poor) |
| Overall Score  | Total score obtained / Total score obtainable                          |
| Average Score  | Used to determine class position                                       |
| Class Position | Configurable display (e.g. show all, or top 3 only)                    |
| Remarks        | Teacher's and/or Principal's comments                                  |

### 5.2 Configurable Options

- Grading scale (e.g. `A, B, C, D, F` or `Excellent, Very Good, Good, Poor, Fail`)
- Position display rules (e.g. show position only for top 3)
- Report card template (see §5.4)
- School information (name, logo, address)

### 5.3 Output

- **Print-optimized CSS view** for browser printing
- **Exportable to PDF**

### 5.4 Report Card Template Builder

The report card template is a first-class feature: admins can fully customise how printed
report cards look, and the config is persisted in NuxtHub KV under the key
`settings:report-card-template`. The renderer component reads this config and combines it
with real student data to produce the printed output.

#### Template structure

The template is a deeply nested config object with four sections:

- **Header** — logo placement (left, center, right, or left-right pair), optional uploaded
  logos for primary and secondary slots, heading and subheading text, a list of configurable
  paragraphs (each with its own font size, colour, bold flag, and alignment), and a
  configurable student info grid (which fields to show and in what order).
- **Body** — column toggles for the score table: subject (always on), CA breakdown, CA
  total, exam, total, grade, and remark.
- **Summary** — placement (header or footer) and toggles for total, average, position, and
  "out of N students".
- **Footer** — remarks block (teacher and principal, each with a label, signature toggle, and
  optional uploaded signature image), class summary (highest, lowest, average), and a list of
  custom blocks for arbitrary content like "Next term begins".

#### Storage and uploads

- The template config is stored in KV as JSON.
- Logos and signature images are uploaded to NuxtHub Blob and the template stores the returned
  pathname, not the binary. This avoids the KV value-size limit.
- Uploads go through oRPC with `z.instanceof(File)` in the input schema, letting oRPC handle
  the multipart serialisation.

#### Builder UI

- Admin-only settings page at `/dashboard/settings/report-card`.
- Two-panel layout: live A4 preview on the left, tabbed settings (Header / Body / Footer) on
  the right.
- Auto-save with a debounced mutation — admins never need to click "save" after a change.
- Reset-to-default action with a confirmation dialog.

#### Renderer

- A single `TemplatePreview.vue` component renders the template against either placeholder
  data (in the builder) or real student data (in the viewer).
- The viewer page at
  `/dashboard/results/[resultId]/report-card/[scoresheetId].vue` uses this component and
  exposes a print button that calls `window.print()`.
- Print styles use `@page { size: A4 }` with all dashboard chrome hidden via `print:hidden`,
  and the report card wrapper tagged with `report-card-print-root`.

---

## 6. System Configuration (Admin)

| Setting              | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| Grading System       | Define grade boundaries and labels                              |
| Score Distribution   | Set CA and Exam weights per term                                |
| Student ID Pattern   | Configurable format (e.g. `STU/YYYY/###`)                       |
| Position Display     | Set which positions to show on report cards                     |
| Report Card Template | Full template builder for layout, logos, and content (see §5.4) |
| School Info          | Name, logo, motto, address                                      |
| Subject Tags         | Manage available subject category tags                          |

---

## 7. Authentication & Authorization

- Auth library: **Better Auth** (v1.7.x)
- Strategies: Email/Password, Username, Admin plugin
- Role-based access: `admin` and `teacher` roles with scoped permissions
- Teachers log in with auto-generated or self-updated credentials
- Server-side admin gating: check `context.session?.user?.role === "admin"` in oRPC handlers
  and throw `FORBIDDEN` when the check fails
- Page-level gating: `definePageMeta({ middleware: ["admin-only"] })`

---

## 8. Tech Stack

| Layer                | Technology                                                           |
| -------------------- | -------------------------------------------------------------------- |
| Frontend Framework   | Vue 3, Nuxt 4, TypeScript (SPA, `ssr: false`)                        |
| Styling              | Tailwind CSS v4 (CSS-first config via `@theme`)                      |
| UI Components        | Shadcn Vue (Reka UI) via UI Thing, `Ui` prefix                       |
| Forms                | FormKit (with custom shadcn-styled inputs)                           |
| Data Fetching        | TanStack Vue Query, set up manually via Nuxt plugin                  |
| Tables               | TanStack Table v9                                                    |
| Backend              | Nitro (via Nuxt 4 `/server` directory)                               |
| ORM                  | Drizzle ORM (0.x)                                                    |
| API Layer            | oRPC (v1)                                                            |
| Database             | SQLite via NuxtHub v0.10 (libSQL/Turso)                              |
| KV Storage           | NuxtHub KV (`import { kv } from '@nuxthub/kv'`)                      |
| Blob Storage         | NuxtHub Blob (`import { blob } from '@nuxthub/blob'`)                |
| Authentication       | Better Auth (email/password + username + admin plugin)               |
| Icons                | `@nuxt/icon` with an `ICONS` map from `~~/shared/constants/icons.ts` |
| Dev Seeding          | Faker.js                                                             |
| Package Manager      | PNPM                                                                 |
| Linting & Formatting | Oxlint, Oxfmt                                                        |

### 8.1 Notes on Key Choices

- **TanStack Query** is set up manually in a Nuxt plugin (SSR hydration, `QueryClient`
  configuration, stale time). `useQuery` and `useMutation` are auto-imported via the
  `imports` option in `nuxt.config.ts`, not via a module.
- **TanStack Table v9** uses the new feature registry API: `useTable`, `tableFeatures()`,
  `table.atoms.<slice>.get()` for state reads, `"start"`/`"end"` for pinning, and
  `FlexRender` with `:header`/`:cell`/`:footer` props.
- **oRPC is intentionally pinned to v1.** v2 is still in beta with a changed wire format;
  migration is deferred until a stable release.
- **NuxtHub** uses v0.10 and above, so no use of composables such as `hubBlob()`, `hubKv()` e.t.c, all imports come from `@nuxthub/**`, e.g (`import { blob } from '@nuxthub/blob'`, `import { kv } from "@nuxthub/kv"`), not accessed via a composable.
- **Tailwind v4** uses the Vite plugin (`@tailwindcss/vite`) and a CSS-based configuration.
  There is no `tailwind.config.js`.

---

## 9. Codebase Structure

```
ScoreBase/
├── .backup/          # Backup files (not tracked by git)
├── .data/            # Data storage
├── .nuxt/            # Nuxt build files
├── .vscode/          # VS Code settings
├── app/              # Main application (Nuxt)
│   ├── assets/
│   │   └── css/      # Global styles (incl. formkit-shadcn.css)
│   ├── components/   # Vue components (organized by feature)
│   ├── composables/  # Auto-imported composables
│   ├── layouts/      # Layout components
│   ├── middleware/   # Route middleware (admin-only, teacher-only)
│   ├── pages/        # Page components (routing)
│   ├── plugins/      # Nuxt plugins
│   ├── utils/        # Utility functions
│   └── formkit.config.ts  # FormKit inputs + config
├── server/           # Server-side code
│   ├── api/          # API endpoints
│   ├── context/      # Server context
│   ├── contracts/    # oRPC contracts
│   ├── db/           # Database layer
│   │   ├── migrations/  # Drizzle migration files
│   │   └── schema/      # Drizzle table definitions
│   │       ├── academic.ts  # Sessions, terms, classes, subjects, students, teachers
│   │       ├── auth.ts      # Better Auth tables (user, session, account, verification)
│   │       ├── common.ts    # Shared column helpers (timestamps, IDs)
│   │       ├── index.ts     # Barrel export + cross-table relations
│   │       └── result.ts    # Results, scoresheets, subject scores
│   ├── kv/           # KV helpers (settings pattern)
│   ├── queries/      # Database queries
│   ├── routers/      # oRPC routers
│   ├── routes/       # Nitro event handler routes
│   └── utils/        # Server utils (Nitro auto-imported)
├── shared/           # Shared code between client/server
│   ├── constants/    # Constant values (incl. KV settings types + ICONS)
│   ├── types/        # TypeScript types
│   ├── utils/        # Utility functions (report-card computation, etc.)
│   └── validators/   # Zod validation schemas
├── public/           # Static assets
├── .ai/              # AI-facing context (PROJECT.md — intent, not truth)
└── config files      # nuxt.config.ts, package.json, tsconfig.json, etc.
```

### 9.1 Module Boundaries

- **`app/`** — the Nuxt frontend. Everything here is compiled for the browser (with SSR
  disabled). Vue components, pages, layouts, plugins, composables, and client-side utilities.
- **`server/`** — Nitro server code. Contracts, routers, database access, KV helpers, auth
  utilities. Auto-imported on the server side.
- **`shared/`** — code imported by both client and server. Zod validators, domain types,
  constants (including KV settings types and defaults), and pure utility functions.

### 9.2 Path Aliases

- `~~/` or `@@/` — repo root
- `~/` or `@/` — `app/` directory
- `#shared/` — `shared/` directory, from server-side code
- `~~/shared/` — `shared/` directory, from app-side code

---

## 10. Code Patterns

### 10.1 Composables

- **Location**: `app/composables/`
- **File naming**: `useXXXX.ts` (e.g. `useAuth.ts`, `useTeachers.ts`)
- **Function naming**:
  - Lists: `useListXXXX()` (e.g. `useListAcademicSessions()`)
  - Single item: `useGetXXXXDetail()` or `useFetchXXXX()`
  - Mutations: `useCreateXXXX()`, `useUpdateXXXX()`, `useDeleteXXXX()`
- **Pattern**: expose reactive state (refs/computeds) and methods, wrapping either TanStack
  Query or `useLazyAsyncData`.

> **Rule:** Never `await useAsyncData` inside a composable. Awaiting blocks navigation and
> degrades the SPA experience. Use `useLazyAsyncData` or a TanStack `useQuery` instead.

### 10.2 ORPC Contracts, Routers, and Queries

**Contracts** — `server/contracts/XXX.contract.ts`

- Define procedure shapes and input/output types via Zod
- Example: `class.contract.ts` defines `list`, `getOne`, `create`, `update`, `delete`
- Settings contracts group related procedures under a namespace (e.g. `school`, `result`,
  `reportCardTemplate`)

**Routers** — `server/routers/XXX.router.ts`

- Implement contract procedures
- Standard procedure names: `list`, `getOne`, `create`, `update`, `delete`
- Use the `implement(contract)` helper
- Admin gating: check `context.session?.user?.role === "admin"`, throw `FORBIDDEN`

**Queries** — `server/queries/XXX.query.ts`

- Reusable database query functions
- Named descriptively: `fetchSingleClass`, `listAllClasses`, `resolveNextTerm`

### 10.3 Data Flow (Server → Frontend)

1. Frontend calls an oRPC procedure via `$orpc.resource.procedure.call()`
2. Wrapped in a composable exposing reactive state
3. Data exposed as:
   - `data.value` (raw data from server)
   - Computed properties for derived state (e.g. `classes = computed(() => data.value ?? [])`)
   - `pending` for loading state
   - `refresh` function to refetch

### 10.4 Component Structure

- **Location**: `app/components/` (grouped by feature: App, Class, Form, FormKit, Page,
  ReportCard, ReportCardBuilder, Session, Subject, Teacher, Ui)
- **Naming**: PascalCase (e.g. `StatsCard.vue`, `UpsertForm.vue`)
- **Component reference**: parent path becomes a prefix, e.g. `<SessionUpsertForm>` for
  `app/components/Session/UpsertForm.vue`

**Props pattern**:

```ts
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
  }>(),
  {
    icon: ICONS.students
  }
)
```

**Emits pattern**:

```ts
const emit = defineEmits<{ submit: [payload: UpsertClassInput] }>()
```

Common events: `submit`, `cancel`, `update`, `delete`, `open`, `close`, `edit`.

**Reusable component examples**:

- `AppEntityCard` — generic card for displaying entities (title, description, icon, link)
- `AppEntitySkeleton` — loading placeholder for entities
- `AppEntityActionDropdown` — dropdown for edit/delete actions
- `UiSheet` — reusable sidebar sheet for forms (used in `Lazy*UpsertForm` patterns)

### 10.5 State and Loading Patterns

**Loading**:

- Server requests: `pending` from `useLazyAsyncData`, or `isPending` from TanStack Query
- Component level: `isSubmitting` from FormKit
- UI placeholders: `AppEntitySkeleton`, `UiSkeleton`

**Error handling**:

- Server: throw appropriate oRPC errors (`errors.NOT_FOUND()`, `errors.CONFLICT()`, etc.)
- Frontend: display via mutation error handling or the `Page` component's `:error` prop
- Toasts: use `useSonner.promise(mutation.mutateAsync(...), { loading, success, error })`

**Empty states**:

- Check data length (e.g. `!classes.length`)
- Use `UiEmpty` with customizable title, description, and button

### 10.6 Forms (FormKit)

FormKit is the single form library across the app. All forms are built with FormKit inputs
and configured via the FormKit Nuxt module.

**Configuration**:

- `app/formkit.config.ts` — registers the custom inputs and any global FormKit settings.
- `nuxt.config.ts` — the `@formkit/nuxt` module is loaded with `autoImport: true`, so
  FormKit components and composables are globally available without explicit imports.
- `app/assets/css/formkit-shadcn.css` — styles FormKit elements using shadcn design tokens
  (colours, radii, focus rings) so FormKit inputs visually match the rest of the UI.

**Custom FormKit inputs**:

Custom input components live in `app/components/FormKit/[InputName].vue`. Each one wraps
FormKit's `createInput` (or the FormKit input contract) and renders a shadcn-styled input.
The current set includes:

- `Password` — password input with reveal toggle and strength affordances
- `Select` — shadcn-styled select with FormKit validation integration
- `Tags` — tag/multi-value input for entering tag lists

Reference these inputs in templates as follows:

- `Password` - auto-imported components e.g `<FormKitPassword label="password" validation="required" name="password" />`
- `Select` - use the value "_select" in the `type` prop on `FormKit` component e.g `<FormKit type="_select" :options="subjects" />`
- `Select` - use the value "_tags" in the `type` prop on `FormKit` component e.g `<FormKit type="_tags" :options="tags" />`

**Validation**:

- Zod schemas live in `shared/validators/` (e.g. `UpsertClassSchema`)
- FormKit's validation rules are used in combination with custom rules where necessary
- Schema-derived types are exported from `shared/types/` via `z.infer<typeof Schema>` and
  auto-imported by Nuxt

**Submission**:

- Handle via FormKit's `@submit` event
- Loading state driven by a local `isSubmitting` ref or the mutation's `isPending` state

**Layout**:

- Fields wrapped in a `fieldset` with `:disabled="isSubmitting"`
- Footer with Cancel and Submit buttons (for `UiSheet` patterns)

### 10.7 Navigation and Layout

**Layouts**:

- `default.vue` — basic container layout
- `dashboard.vue` — sidebar-based layout for authenticated routes (admin/teacher)

**Navigation**:

- Sidebar items defined in the layout, filtered by role
- Breadcrumbs managed via `useBreadcrumbs` composable and `setPageBreadcrumbLabel`

---

## 11. File Naming Conventions

| Type             | Location                  | Pattern                 | Examples                                           |
| ---------------- | ------------------------- | ----------------------- | -------------------------------------------------- |
| Composables      | `app/composables/`        | `useXXXX.ts`            | `useAuth.ts`, `useTeachers.ts`                     |
| Pages            | `app/pages/`              | `XXX.vue` or `[id].vue` | `index.vue`, `[classId].vue`                       |
| Components       | `app/components/`         | `PascalCase.vue`        | `StatsCard.vue`, `UpsertForm.vue`                  |
| FormKit Inputs   | `app/components/FormKit/` | `PascalCase.vue`        | `Password.vue`, `Select.vue`, `Tags.vue`           |
| Server Contracts | `server/contracts/`       | `XXX.contract.ts`       | `class.contract.ts`                                |
| Server Routers   | `server/routers/`         | `XXX.router.ts`         | `class.router.ts`                                  |
| Server Queries   | `server/queries/`         | `XXX.query.ts`          | `class.query.ts`                                   |
| KV Helpers       | `server/kv/`              | `kebab-case.ts`         | `result-settings.ts`                               |
| Database Schema  | `server/db/schema/`       | semantic                | `academic.ts`, `auth.ts`, `result.ts`, `common.ts` |
| Validators       | `shared/validators/`      | semantic                | `academic.ts`, `actors.ts`                         |
| Constants        | `shared/constants/`       | semantic                | `kv-settings.ts`, `icons.ts`                       |

---

## 12. Business Rules

1. A Session has a maximum of **3 Terms**. The 1st Term is auto-created with the session.
2. Each Term has a maximum of **1 Result**.
3. Each Result has **1 Scoresheet per enrolled student**.
4. A Scoresheet's subjects are pre-populated from the **class preset** and can be individually
   adjusted per student.
5. Score distribution across CAs and Exam must always **total 100** per subject.
6. **Two students with the same average share the same class position.**
7. Teachers are **scoped strictly to their assigned class** — they cannot view or edit data
   outside their scope.
8. **Only the Admin can approve, publish, or decline** result edits proposed by teachers.
9. Auto-generated teacher credentials follow deterministic rules based on **name and phone number**.
10. Derived metrics are **never stored** — always computed from raw scores and cached.
11. Report card templates are stored per-installation in KV and are admin-configurable at any
    time; changes take effect on the next render.
12. Logos and signature images are stored in Blob, not KV.

---

## 13. Glossary

| Term                    | Definition                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **Session**             | An academic year, e.g. `2025/2026 Academic Session`. Contains up to 3 Terms.                    |
| **Term**                | One of up to three periods within a Session (1st, 2nd, 3rd). Carries score distribution config. |
| **Result**              | The collection of scoresheets for a class in a given Term. One per Term.                        |
| **Scoresheet**          | One student's scores within a Result. Contains SubjectScore rows.                               |
| **SubjectScore**        | A single subject's scores (CA1/CA2/CA3 + Exam) within a Scoresheet.                             |
| **Subject List**        | A reusable preset of subjects. Assigned to a class so students auto-inherit them.               |
| **Subject Tag**         | A category label applied to subjects (Junior, Senior, Science, Art, etc.).                      |
| **CA**                  | Continuous Assessment. A component of a subject score, typically split into CA1/CA2/CA3.        |
| **Exam**                | The terminal exam score for a subject, typically the largest component of the total.            |
| **Class Position**      | A student's rank within their class, based on Average Score. Ties share a position.             |
| **Derived Metric**      | A value computed from raw scores (Total, Average, Position, Grade) and never stored.            |
| **Published**           | The terminal state of a Result after Admin approval. Edits require Admin re-approval.           |
| **Scoresheet Progress** | A per-student completion metric tracking how many subjects have been fully scored.              |
| **Template Builder**    | The admin settings page for configuring the report card layout and content.                     |
| **KV Setting**          | A typed configuration stored in NuxtHub KV and edited through the settings pages.               |
