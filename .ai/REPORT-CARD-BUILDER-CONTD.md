# Report Card Builder — Continuation Prompt (Phases 6–12)

## ⛔ STOP-AND-REVIEW PROTOCOL

**Complete ONE phase at a time. Stop after each phase, summarize what changed, list
assumptions and discrepancies, and wait for explicit human approval before continuing.
Do not infer approval from silence or a vague reply.**

If a phase reveals a blocker or a design conflict with previous decisions, flag it
immediately rather than silently working around it.

---

## Context — What was built in Phases 1–5

The branch `feat/report-card-template` contains a working report card template builder.
Read `REPORT-CARD-BUILDER.md` (in the repo root) in full before starting. It records
every decision already made. Do not undo any of them.

Key facts:

- Template lives in KV under key `settings:report-card-template`.
- Logo and signature images live in NuxtHub Blob under the `report-card/` prefix.
- Blob is served at `/images/${pathname}` via `server/routes/images/[...pathname].get.ts`.
- Auth guards: `requireAdmin` / `requireSession` from `server/utils/auth-guard.ts`.
- IDs via `typeid-js` (`typeid("block")`, etc.) — not `nanoid`.
- Inline text controls use `UiInput` / `UiTextarea`, not FormKit (builder has no FormKit context).
- No mutation invalidation in builder composables — local working copy + `applyingServerValue` guard.
- Print CSS: `print:hidden` + `@page { size: A4 }`. Do NOT add `#__nuxt { display: none }`.
- Screen scaling via CSS variable `--rc-scale` with `print:transform-none`.
- All data in the system is test/seed data — migrations can be run freely without concern
  for existing data.

---

## Architectural decisions for this phase (agreed before any code)

### 1. Report card builder route

The builder lives at **`/dashboard/report-card-builder`** — a top-level dashboard route,
not nested under `/results/` or `/settings/`. The builder is a school-wide tool, not
scoped to any result. It needs to be reachable quickly. Add it to the main dashboard
sidebar nav (admin only), not to the settings sidebar.

### 2. Minimal view vs full report card view — two separate pages

**`/dashboard/results/[resultId]/report-card/[scoresheetId]` — minimal view (current page)**

Render only:

- A compact student/class/session/term info strip (not the full styled block)
- The subject scores table (data only — no custom styling, no watermark, no logo)
- A compact result summary row in the footer (total, average, position)

This page uses the existing dashboard layout with the sidebar. Its purpose is
quick score verification, not printing.

Add one prominent button: **"View full report card"** — navigates to the full view page.

**`/dashboard/results/[resultId]/report-card/[scoresheetId]/full` — full report card view**

This page uses a dedicated **`fullscreen` layout** (see below) — no sidebar, no
breadcrumbs, no dashboard chrome. It renders `TemplatePreview.vue` with real student
data and the saved template applied.

Its top bar contains three actions only:

- **Print** — calls `window.print()`
- **Edit [student name]'s scores** — navigates back to the scoresheet entry page
- **Customize template** — navigates to `/dashboard/report-card-builder` (admin only, hidden for teachers)

### 3. Fullscreen layout

Create `app/layouts/fullscreen.vue`. It renders only:

- A minimal top bar (`h-12`, `border-b`, `bg-background`) containing a back button
  (← returns to the minimal view) and the three action buttons on the right
- A full-width, full-height content area below the top bar (`flex-1 overflow-auto`)

No sidebar. No breadcrumbs. No `<Page>` component wrapper.

Use `definePageMeta({ layout: 'fullscreen' })` on the full view page.

This layout gives a genuinely blank canvas for the A4 report card to render into, and
means `window.print()` works with zero CSS gymnastics — the only non-document elements
on the page already have `print:hidden` from the top bar.

### 4. Grading key always from `getResultSettings()`

The `grading-key` block has no manual grade entry. Its config is just:

```ts
interface GradingKeyConfig {
  title: StyledText
}
```

The renderer calls `useGetResultSettings()` and reads `gradeBoundaries` at render time.
This ensures the grading key on the report card always matches the current grade config
without the admin having to maintain two places.

### 5. No migration concerns

All data in the system is test/seed data. Drizzle migrations can be run freely.
No backward-compatibility handling is needed for existing rows.

---

## Types to add/replace

The fixed-shape `ReportCardTemplate` is replaced with a slot + block shape.
Add to `shared/constants/kv-settings.ts` (or a new `shared/constants/report-card.ts`
if the file is getting long — match the existing pattern).

### Core shape

```ts
type Slot = "header" | "studentInfo" | "main" | "sidebar" | "footer"

interface ReportCardTemplate {
  id: string
  name: string
  layout: "full" | "sidebar"
  sidebarPosition: "left" | "right" | null // null when layout is 'full'
  watermark: Watermark | null
  header: ReportCardBlock[]
  studentInfo: ReportCardBlock[]
  main: ReportCardBlock[]
  sidebar: ReportCardBlock[] // always [] when layout is 'full'
  footer: ReportCardBlock[]
}

interface Watermark {
  imageUrl: string // NuxtHub Blob pathname
  opacity: number // 0–1
  size: "small" | "medium" | "large"
  mode: "single" | "tiled"
}
```

### Blocks

```ts
type BlockType =
  "school-info" | "student-info" | "scores" | "custom-table" | "grading-key" | "summary" | "remarks"

interface ReportCardBlock<TConfig = unknown> {
  id: string // typeid("block")
  type: BlockType
  hidden: boolean // hides without deleting
  config: TConfig
}
```

### Text styling

```ts
interface TextStyle {
  fontSize: number // px, 10–28
  fontWeight: "normal" | "bold"
  color: string // hex e.g. "#000000"
  align: "left" | "center" | "right"
}

interface StyledText {
  value: string
  style: TextStyle
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 14,
  fontWeight: "normal",
  color: "#000000",
  align: "left"
}
```

### Block configs

#### `school-info`

```ts
interface SchoolInfoConfig {
  logoPlacement: "left" | "center" | "right" | "left-right"
  logoPrimary: string | null // NuxtHub Blob pathname
  logoSecondary: string | null // used when logoPlacement is 'center' or 'left-right'
  // When logoSecondary is null and two logo slots are shown, logoPrimary fills both
  schoolName: StyledText
  address: StyledText
  motto: StyledText
  extraText: StyledText // e.g. phone, email, website
}
```

#### `student-info`

```ts
type StudentInfoField =
  | "student.name"
  | "student.id"
  | "student.class"
  | "class.size"
  | "term.name"
  | "session.name"
  | "result.average"
  | "result.position"
  | "result.positionOutOf"

interface StudentInfoConfig {
  columns: 2 | 3 | 4
  borderStyle: "outlined" | "borderless" | "shaded-labels"
  fields: {
    id: string // typeid("field")
    field: StudentInfoField
    label: string // e.g. "Student Name" — admin-editable
  }[]
}
```

Field-to-data mapping for the renderer:

```
'student.name'         → data.computed.studentName
'student.id'           → data.computed.studentSchoolId
'student.class'        → data.class.name
'class.size'           → data.totalStudents
'term.name'            → data.term.name
'session.name'         → data.term.session.name
'result.average'       → data.computed.average
'result.position'      → data.computed.position
'result.positionOutOf' → data.totalStudents (formatted as "out of N")
```

#### `scores`

```ts
// CA count is ALWAYS dynamic — read scoreConfig.caCount, never hardcode
type ScoreColumnId =
  | "subject"
  | `ca${number}` // ca1, ca2, ca3 … up to scoreConfig.caCount
  | "caTotal"
  | "exam"
  | "total"
  | "classHighest"
  | "classLowest"
  | "classAverage"
  | "grade"
  | "remark"
  | "subjectPosition"

interface ScoresConfig {
  caMode: "breakdown" | "summed"
  // 'breakdown' → individual CA columns; 'summed' → single CA Total column
  // These are independent — both, either, or neither can be on
  columns: ScoreColumnId[] // ordered list of visible columns
}
```

`classHighest`, `classLowest`, `classAverage` require `allStudentTotals` from
`ReportCardData` (already returned by `fetchReportCardData`).

#### `custom-table`

```ts
// 'static' — admin fills label + value at template time
// 'manual' — admin fills label only; teacher fills value per student
//             at scoresheet entry time (stored in manualValues)
interface CustomTableConfig {
  variant: "static" | "manual"
  title: StyledText
  rows: {
    id: string // typeid("row")
    label: string
    value: string // only used when variant is 'static'
  }[]
}
```

#### `grading-key`

```ts
// Data always comes from getResultSettings() — no manual entry
interface GradingKeyConfig {
  title: StyledText
}
```

Renderer calls `useGetResultSettings()` and reads `gradeBoundaries` at render time.

#### `summary`

```ts
type SummaryMetric =
  | "marksObtainable" // sum of all subject max scores from scoreConfig
  | "marksObtained" // student's grandTotal
  | "subjectsOffered" // count of subjects in the scoresheet
  | "average"
  | "position"
  | "positionOutOf"

interface SummaryConfig {
  metrics: SummaryMetric[]
  style: "inline" | "grid"
  // 'inline' → horizontal row of labeled values
  // 'grid'   → 2-column key/value pairs
}
```

Metric-to-data mapping:

```
marksObtainable  → sum of (scoreConfig.caMaxScores[i]) * subjectCount + scoreConfig.examMax * subjectCount
marksObtained    → data.computed.grandTotal
subjectsOffered  → data.computed.subjectCount
average          → data.computed.average
position         → data.computed.position
positionOutOf    → data.totalStudents
```

#### `remarks`

```ts
// Comment text is 'manual' — teacher fills it in on the scoresheet form
// All other fields are 'static' — configured by the admin in the template
interface RemarksConfig {
  teacher: {
    visible: boolean
    label: StyledText // e.g. "Class Teacher's Remark"
    showComment: boolean
    showSignature: boolean
    signatureMode: "blank" | "image"
    signatureImage: string | null // NuxtHub Blob pathname
    signatureLabel: StyledText // e.g. "Class Teacher"
  }
  principal: {
    visible: boolean
    label: StyledText
    showComment: boolean
    showSignature: boolean
    signatureMode: "blank" | "image"
    signatureImage: string | null
    signatureLabel: StyledText
  }
}
```

Comment text is stored in `manualValues[blockId]['teacher']` / `['principal']`.

### Block registry

```ts
interface BlockDataRequirements {
  computed: string[] // computed field names used by this block
  manual: string[] // manual input keys expected in manualValues
}

interface BlockDefinition<TConfig = unknown> {
  type: BlockType
  label: string // human-readable display name in the palette
  allowedSlots: Slot[]
  configSchema: z.ZodType<TConfig>
  defaultConfig: () => TConfig
  component: Component
  dataRequirements: BlockDataRequirements
}

type BlockRegistry = { [K in BlockType]: BlockDefinition }
```

### Allowed slots per block type

| Block type     | Allowed slots                              | Notes                             |
| -------------- | ------------------------------------------ | --------------------------------- |
| `school-info`  | `header`                                   | One per template recommended      |
| `student-info` | `studentInfo`                              | One per template recommended      |
| `scores`       | `main`                                     | One per template; primary content |
| `custom-table` | `main`, `sidebar`, `footer`                | Multiple allowed                  |
| `grading-key`  | `main`, `sidebar`, `footer`                | —                                 |
| `summary`      | `studentInfo`, `main`, `sidebar`, `footer` | Placement drives position         |
| `remarks`      | `footer`                                   | One per template recommended      |

### Manual values storage

Per-student teacher-entered data, stored as a JSON column on the scoresheet row:

```ts
type ManualValues = {
  [blockId: string]: {
    [fieldKey: string]: string
    // For custom-table: fieldKey is the row's id
    // For remarks:      fieldKey is 'teacher' or 'principal'
  }
}
```

### Default template

Wrap in a **function** (not a `const`) because `typeid()` generates new IDs each call:

```ts
export function createDefaultReportCardTemplate(): ReportCardTemplate {
  return {
    id: typeid("template"),
    name: "Default Template",
    layout: "full",
    sidebarPosition: null,
    watermark: null,
    header: [
      {
        id: typeid("block"),
        type: "school-info",
        hidden: false,
        config: {
          logoPlacement: "left",
          logoPrimary: null,
          logoSecondary: null,
          schoolName: {
            value: "",
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 18, fontWeight: "bold", align: "center" }
          },
          address: { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 12, align: "center" } },
          motto: {
            value: "",
            style: { ...DEFAULT_TEXT_STYLE, fontSize: 12, fontWeight: "bold", align: "center" }
          },
          extraText: { value: "", style: { ...DEFAULT_TEXT_STYLE, fontSize: 11, align: "center" } }
        } satisfies SchoolInfoConfig
      }
    ],
    studentInfo: [
      {
        id: typeid("block"),
        type: "student-info",
        hidden: false,
        config: {
          columns: 3,
          borderStyle: "outlined",
          fields: [
            { id: typeid("field"), field: "student.name", label: "Student Name" },
            { id: typeid("field"), field: "student.id", label: "Student ID" },
            { id: typeid("field"), field: "student.class", label: "Class" },
            { id: typeid("field"), field: "session.name", label: "Session" },
            { id: typeid("field"), field: "term.name", label: "Term" }
          ]
        } satisfies StudentInfoConfig
      }
    ],
    main: [
      {
        id: typeid("block"),
        type: "scores",
        hidden: false,
        config: {
          caMode: "summed",
          columns: ["subject", "caTotal", "exam", "total", "grade", "remark"]
        } satisfies ScoresConfig
      }
    ],
    sidebar: [],
    footer: [
      {
        id: typeid("block"),
        type: "summary",
        hidden: false,
        config: {
          metrics: ["marksObtained", "average", "position", "positionOutOf"],
          style: "inline"
        } satisfies SummaryConfig
      },
      {
        id: typeid("block"),
        type: "remarks",
        hidden: false,
        config: {
          teacher: {
            visible: true,
            label: { value: "Class Teacher's Remark", style: DEFAULT_TEXT_STYLE },
            showComment: true,
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: { value: "Class Teacher", style: DEFAULT_TEXT_STYLE }
          },
          principal: {
            visible: true,
            label: { value: "Principal's Remark", style: DEFAULT_TEXT_STYLE },
            showComment: true,
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: { value: "Principal", style: DEFAULT_TEXT_STYLE }
          }
        } satisfies RemarksConfig
      }
    ]
  }
}
```

---

## Phases

### Phase 6 — Schema Refactor

**Goal:** Replace the fixed-shape schema with the slot + block shape. No UI changes.
The builder page will temporarily break — that's expected on this branch.

**Deliverables:**

1. Add all new types (`ReportCardTemplate`, `ReportCardBlock`, `Watermark`, `StyledText`,
   `TextStyle`, `DEFAULT_TEXT_STYLE`, all block config interfaces, `ManualValues`,
   `BlockType`, `Slot`) to the appropriate shared constants file. If `kv-settings.ts` is
   getting crowded, move the report-card-specific types to a new
   `shared/constants/report-card.ts` and update all imports. Match the existing file
   pattern.

2. Replace `ReportCardTemplateSchema` in `shared/validators/settings.ts` with a full
   Zod schema for the new shape. Every block config interface must have its own named
   Zod schema. No `z.any()` in block config schemas. Use discriminated union for the
   block array: `z.discriminatedUnion("type", [SchoolInfoBlockSchema, ...])`.

3. Replace `DEFAULT_REPORT_CARD_TEMPLATE` constant with `createDefaultReportCardTemplate`
   function (as defined above). Update `getReportCardTemplate()` in
   `server/kv/report-card-template.ts` to call `createDefaultReportCardTemplate()` when
   the KV key is empty.

4. Update `useGetReportCardTemplate`'s `placeholderData` to call
   `createDefaultReportCardTemplate()` instead of referencing the old constant.

5. Verify `mergeSettings` in `server/kv/merge-settings.ts` replaces slot arrays
   rather than concatenating them. If it concatenates, patch this call site to use
   a custom merge that replaces array fields entirely.

6. Update `ReportCardTemplateSchema` in the ORPC contract
   (`server/contracts/settings.contract.ts`) to match. Confirm `allStudentTotals`
   is still present on `ReportCardOutputSchema` (added in Phase 2 — do not remove it).

7. Update unit tests for the schema and KV helpers to cover the new shape.

8. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — all must pass. The
   builder page and renderer will have TypeScript errors referencing old fields —
   suppress them with `// @ts-expect-error Phase 6: fixed in Phase 7` so the build
   passes. List every suppressed line in your summary.

---

**🛑 Phase 6 — STOP AND REVIEW**

Summarize: files changed, suppressed TS errors, schema alignment check (compare the
TypeScript interface to the Zod schema field by field), how the default function
differs from the old constant, and whether `mergeSettings` correctly replaces arrays.

---

### Phase 7 — Block Registry and Placeholder Renderers

**Goal:** Wire the block registry and create placeholder Vue components for all seven
block types. Update `TemplatePreview.vue` to render via the registry.

**Deliverables:**

1. `app/components/ReportCard/blocks/registry.ts` — exports:
   - `BlockDefinition` interface
   - One `BlockDefinition` object per block type with fully populated
     `type`, `label`, `allowedSlots`, `configSchema`, `defaultConfig()`,
     `component` (pointing to placeholder), `dataRequirements`
   - `blockRegistry: BlockRegistry`
   - `getBlockDefinition(type: BlockType): BlockDefinition` — throws on unknown type

2. One placeholder component per block type in `app/components/ReportCard/blocks/`:
   `SchoolInfoBlock.vue`, `StudentInfoBlock.vue`, `ScoresBlock.vue`,
   `CustomTableBlock.vue`, `GradingKeyBlock.vue`, `SummaryBlock.vue`, `RemarksBlock.vue`

   Each renders its display name and `"[Not yet implemented]"`. Props:

   ```ts
   defineProps<{ config: unknown; data?: ReportCardData | null }>()
   ```

3. Update `TemplatePreview.vue` to iterate each slot's block array and render via the
   registry. Remove all `// @ts-expect-error` suppressions from Phase 6. Delete
   `SummaryRow.vue` — its role moves to `SummaryBlock.vue`.

4. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — all must pass.

**Verification:** open the builder preview in the browser. It should show placeholder
blocks in the correct slot order with no console errors.

---

**🛑 Phase 7 — STOP AND REVIEW**

Summarize: registry structure, `dataRequirements` per block type, any decisions made
about how `TemplatePreview.vue` renders across slots.

---

### Phase 8 — Real Block Renderers

**Goal:** Implement full rendering logic for all seven block types.

**Implementation notes per block:**

**`school-info`:**

- Logo layout per `logoPlacement` preset — four variants (left/right/center/left-right).
- Blob images served at `/images/${pathname}`.
- `StyledText` fields rendered with `:style="{ fontSize: f.style.fontSize + 'px',
fontWeight: f.style.fontWeight, color: f.style.color, textAlign: f.style.align }"`.
- Skip fields where `value` is empty string.

**`student-info`:**

- Grid of `columns` columns.
- Field values resolved from the mapping table in the types section above.
- When rendering with placeholder data (no `data` prop), use `PLACEHOLDER` values.
- `borderStyle` applied to the grid container class.

**`scores`:**

- CA columns are **dynamic** — read `data.scoreConfig.caCount` (or
  `PLACEHOLDER.scoreConfig.caCount = 3`).
- `caMode: 'breakdown'` → individual CA1, CA2... columns.
- `caMode: 'summed'` → single CA Total column.
- Both can be on simultaneously.
- `classHighest`, `classLowest`, `classAverage` computed from `data.allStudentTotals`.
- Use `UiTable` inside `UiScrollArea` matching the pattern in the deleted `Document.vue`
  (check git history for its content if needed).

**`custom-table`:**

- `'static'` → render `config.rows` directly.
- `'manual'` → render `config.rows` with values from
  `data.manualValues?.[block.id]?.[row.id] ?? '—'`.
  In Phase 8, `manualValues` does not yet exist on `ReportCardData` — render `'—'`
  and add `// TODO Phase 11: read from manualValues`.

**`grading-key`:**

- Call `useGetResultSettings()` inside the block component.
- Render `data.value.gradeBoundaries` as a table (grade | min | max | label).
- In placeholder mode, use a hardcoded sample: A (70–100, Excellent), B (60–69, Very Good),
  C (50–59, Good), D (45–49, Pass), F (0–44, Fail).

**`summary`:**

- Compute `marksObtainable` as `(sum of scoreConfig.caMaxScores) + scoreConfig.examMax`
  multiplied by `data.computed.subjectCount`.
- Render `config.style`: `'inline'` → `flex` row; `'grid'` → two-column definition list.

**`remarks`:**

- Render teacher and principal sections when `visible: true`.
- Comment text from `data.manualValues?.[block.id]?.['teacher']` — same TODO as above.
- Signature: when `signatureMode: 'image'` and `signatureImage` is set, render
  `<img :src="'/images/' + signatureImage" />`. When `'blank'` (or image is null) and
  `showSignature: true`, render a blank underline
  `<div class="border-b border-foreground w-40 mt-6 mb-1" />`.
- Render `signatureLabel.value` below the line/image.

**After all seven blocks:**

5. Remove all `// TODO Phase 8` placeholders.
6. Update `TemplatePreview.vue` to pass properly typed `config` to each block component.
7. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — all must pass.

**Verification:** Open the real report card viewer for a student. The rendered output
should be visually equivalent to the old `Document.vue` output for the same data. Take
a screenshot and note any visual differences in your summary.

---

**🛑 Phase 8 — STOP AND REVIEW**

Summarize: how each block resolves its data, how CA count is handled dynamically, how
`classHighest/Lowest/Average` is computed, and the screenshot comparison result.

---

### Phase 9 — Routing Restructure and Layouts

**Goal:** Create the fullscreen layout, restructure the report card routes, and reduce
the minimal view to display only score data.

**Deliverables:**

1. **`app/layouts/fullscreen.vue`** — new layout:
   - Minimal top bar (`h-12 border-b bg-background flex items-center px-4 gap-3`).
   - Left side: a back button (← goes to the minimal view using `router.back()` or a
     hardcoded route back to `[scoresheetId]`).
   - Right side: the three action buttons. Wrap in `print:hidden`.
   - Below the top bar: `<slot />` in a `flex-1 overflow-auto` container.
   - No sidebar. No breadcrumbs. No `<Page>` wrapper.

2. **`app/pages/dashboard/results/[resultId]/report-card/[scoresheetId]/full.vue`**
   — new page (the full report card):

   ```ts
   definePageMeta({ layout: "fullscreen" })
   ```

   Fetches both `useGetReportCard(scoresheetId)` and `useGetReportCardTemplate()`.
   Renders `<TemplatePreview :template="template" :data="card" />` centred in the
   page with a white background and a subtle shadow.

   Top bar actions (passed via a named slot or directly in the layout via `teleport` —
   choose whichever is cleaner for this codebase):
   - **Print** — `window.print()`, `print:hidden`
   - **Edit [student name]'s scores** — navigates to the scoresheet entry page for
     this student
   - **Customize template** — navigates to `/dashboard/report-card-builder` (visible
     to admins only — use `v-if="isAdmin"`)

   > **Layout/slot note:** if passing action buttons to the layout via a slot is
   > complex, an alternative is to render the top bar directly inside `full.vue` and
   > have the layout only provide the outer shell. Choose whichever approach is simpler
   > and document your decision in the summary.

3. **Update `[scoresheetId].vue`** — minimal view:
   - Remove `<TemplatePreview>` / `<ReportCardDocument>` entirely.
   - Render a compact, unstyled layout:
     - A small info strip: student name, student ID, class, session, term (read from
       `card.computed` and `card.term` / `card.class`).
     - The subject scores table — use `UiTable` with these fixed columns only:
       `Subject | CA Total | Exam | Total | Grade`. No custom-table blocks, no class
       averages, no remarks. This is a quick-verify view.
     - A compact summary footer: Total score, Average, Position, Out of N.
   - Add a prominent **"View full report card"** button that navigates to `./full`
     (relative route, or the full path `[scoresheetId]/full`).
   - This page still uses the regular dashboard layout (sidebar visible).

4. **`app/pages/dashboard/report-card-builder.vue`** — new top-level builder page:
   - `definePageMeta({ middleware: ['admin-only'] })`
   - Moves the builder from wherever it currently lives (settings page) to this route.
   - Same two-panel layout as before: live preview left, tabbed controls right.
   - If the builder was at `/dashboard/settings/report-card`, update the settings nav
     to remove it and add it to the main sidebar nav as "Report Card Builder" (admin
     only).

5. Add "Report Card Builder" to the main dashboard sidebar nav — admin only. Use
   `ICONS.result` (or the most appropriate existing key in `ICONS`).

6. `pnpm lint`, `pnpm typecheck`, `pnpm build` — all must pass.

**Verification:**

- Navigate to a student's minimal report card view → confirm it shows only the
  compact table + summary, no styled template rendering.
- Click "View full report card" → confirms it opens the fullscreen layout with no
  sidebar.
- Click Print → confirm only the A4 document renders, no top bar.
- Navigate to `/dashboard/report-card-builder` → confirm the builder loads.
- As a teacher (not admin), confirm "Customize template" button is not visible in the
  top bar.

---

**🛑 Phase 9 — STOP AND REVIEW**

Summarize: the new routes, the fullscreen layout structure, how action buttons are
passed to the layout (slot, teleport, or inline), the minimal view's fixed columns,
and the sidebar nav update. Confirm the branch is still not merged to main.

---

### Phase 10 — Block Editor UI

**Goal:** Replace the three fixed section components with a slot-organized block editor.

**Deliverables:**

1. **`app/components/ReportCardBuilder/StyledTextInput.vue`** — reusable sub-component.
   Props: `v-model:modelValue` typed as `StyledText`.
   Shows: text input (or `UiTextarea` for multi-line), font size `UiSlider` (10–28),
   bold `UiSwitch`, `UiColorPicker`, three alignment buttons (left/center/right as
   `UiButton` with `size="icon-sm"`, segmented). This component is used by every config
   panel that has a `StyledText` field — do not repeat its UI inline.

2. **`app/components/ReportCardBuilder/BlockEditor.vue`** — replaces the three `UiTabs`
   sections (HeaderSection, BodySection, FooterSection). Slot tabs:
   **Header | Student Info | Main | Sidebar | Footer**.
   The Sidebar tab is disabled (`opacity-50 pointer-events-none`) with a tooltip when
   `template.layout === 'full'`.

   Per slot tab:
   - Ordered list of the slot's blocks. Each block row shows:
     - Block display name (from `blockRegistry`)
     - A hide/show eye toggle (`block.hidden`)
     - A duplicate button (copies the block with a new `typeid("block")` id)
     - A delete button (confirm via `UiAlertDialog`)
     - Up/down reorder buttons (disabled at boundaries)
   - "Add block" button opens a palette showing only blocks whose `allowedSlots`
     includes this slot. Each palette entry shows the block's `label` and
     `dataRequirements` summary. Clicking adds a block with `defaultConfig()`.
   - Clicking a block row opens its config panel below (or in a slide-in panel —
     choose whichever is cleaner).

3. **Config panel components** in `app/components/ReportCardBuilder/blocks/config/`:

   - **`SchoolInfoConfig.vue`** — logo placement preset picker (four tiny flex diagrams,
     reuse the visual approach from the old `HeaderSection.vue`), logo uploads via
     `AssetUpload.vue`, `StyledTextInput` for schoolName/address/motto/extraText.

   - **`StudentInfoConfig.vue`** — columns selector (2/3/4), borderStyle selector
     (`UiSelect` or segmented buttons), fields list with add/remove/reorder, editable
     label input per field, field type picker (`UiSelect` from `StudentInfoField` enum).

   - **`ScoresConfig.vue`** — `caMode` toggle (Breakdown / Summed), column checklist.
     `subject` is always checked (disabled + tooltip).

   - **`CustomTableConfig.vue`** — variant toggle (Static / Manual), title `StyledTextInput`,
     row list with add/delete/reorder, label input per row, value input per row (hidden
     when variant is 'manual').

   - **`GradingKeyConfig.vue`** — title `StyledTextInput` only. Display a read-only note:
     "Grade data is pulled from result settings automatically."

   - **`SummaryConfig.vue`** — metric checkboxes, style toggle (Inline / Grid).

   - **`RemarksConfig.vue`** — teacher and principal sub-panels. Each: visible toggle,
     label `StyledTextInput`, showComment toggle, showSignature toggle, signatureMode
     toggle (Blank line / Upload image), `AssetUpload` for signature image (shown when
     signatureMode is 'image'), signatureLabel `StyledTextInput`.

4. Template-level controls shown above the slot tabs:
   - Template name text input.
   - Layout toggle: Full width / With sidebar (sets `template.layout` +
     `template.sidebarPosition`).
   - Watermark section: `AssetUpload` for the watermark image, opacity `UiSlider`,
     size selector (Small / Medium / Large), mode toggle (Single / Tiled). Shown only
     when a watermark image is set.

5. Delete `HeaderSection.vue`, `BodySection.vue`, `FooterSection.vue`. Replace their
   usage in `report-card-builder.vue` with `<BlockEditor v-model:template="template" />`.

6. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — all must pass.

**Verification:**

- Add a grading key block to the footer → confirm it appears in the preview.
- Hide a block → confirm preview hides it.
- Reorder blocks → confirm preview updates.
- Edit school name text → confirm preview updates in real time.
- Change a `StyledText` color → confirm color updates in the preview.

---

**🛑 Phase 10 — STOP AND REVIEW**

Summarize: how the config panel is opened (inline, slide-in), how `StyledTextInput` is
used across panels, any UI Thing components that needed installing, and what reordering
and palette-filtering look like.

---

### Phase 11 — Sidebar Layout and Watermark

**Goal:** Make sidebar layouts and watermarks actually render in `TemplatePreview.vue`.

**Deliverables:**

1. **Sidebar layout** in `TemplatePreview.vue`:
   - When `layout === 'sidebar'`: two-column flex layout.
     - `sidebarPosition: 'left'` → sidebar left (35%), main right (65%).
     - `sidebarPosition: 'right'` → main left (65%), sidebar right (35%).
   - `header`, `studentInfo`, `footer` slots always full-width regardless of layout.
   - When `layout === 'full'`: single column as before.

2. **Watermark rendering**:
   - When `template.watermark` is set and `imageUrl` is not null:
   - Document container must have `position: relative; overflow: hidden`.
   - All block content must have `position: relative; z-index: 1`.
   - `mode: 'single'`: `<img>` with `position: absolute; inset: 0; margin: auto`
     and `opacity: watermark.opacity`. Size map: small → 200px, medium → 350px,
     large → 500px.
   - `mode: 'tiled'`: inline style `background-image: url('/images/${pathname}');
background-repeat: repeat; background-size: ${size}px` on the document container.
     Apply opacity via a pseudo-element or a wrapper `div` — CSS `opacity` on the
     container would affect the content too.

3. `pnpm lint`, `pnpm typecheck`, `pnpm build` — all must pass.

**Verification:**

- Set layout to sidebar (right) → confirm two-column split in the preview.
- Upload a watermark, set opacity 10% → confirm it renders behind the content.
- Print the full report card → confirm watermark appears in print output.

---

**🛑 Phase 11 — STOP AND REVIEW**

---

### Phase 12 — Manual Values Pipeline

**Goal:** Enable teachers to fill in manual-entry blocks (Custom Table, Remarks) at
scoresheet entry time.

**Deliverables:**

1. Add `manualValues` column to `scoresheets` table:

   ```ts
   manualValues: text("manualValues", { mode: "json" }).$type<ManualValues>().default({}).notNull()
   ```

   Run `pnpm db:generate` then `pnpm db:migrate`. (All data is test data — migration
   is safe.)

2. `server/utils/manual-values.ts` — export:

   ```ts
   export function getManualFields(template: ReportCardTemplate): ManualFieldGroup[]
   ```

   Walks all slots, filters to `hidden: false` blocks with non-empty
   `dataRequirements.manual`, returns one `ManualFieldGroup` per block with its
   `blockId`, display label (from block config), and field keys.

3. Update the scoresheet entry page to render one section per manual field group.
   Each section shows the block's title and one `UiInput` or `UiTextarea` per field.
   Values saved via a new `updateManualValues` ORPC procedure (add to scoresheet
   contract and router).

4. Update `fetchReportCardData` to include `manualValues` from the target scoresheet.
   Add to `ReportCardOutputSchema`.

5. Remove all `// TODO Phase 11: read from manualValues` comments and replace with
   real reads in `CustomTableBlock.vue` and `RemarksBlock.vue`.

6. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` — all must pass.

**Verification:**

- Add a manual Custom Table block (3 rows) to the template.
- Open scoresheet entry for a student → confirm the three fields appear.
- Enter values and save.
- Open the full report card for that student → confirm values render in the table.

---

**🛑 Phase 12 — STOP AND REVIEW**

---

### Phase 13 — Preset Library

**Goal:** Give admins ready-made starting points.

> **Do not choose preset content yourself.** Before writing any preset objects, present
> five preset outlines (names, slot structure, blocks per slot, key config choices) to
> the human for approval. Wait for explicit approval before writing any code.

**Deliverables (after human approval of outlines):**

1. `shared/constants/report-card-presets.ts` — five preset `ReportCardTemplate`
   objects using only the seven block types. Each calls
   `createDefaultReportCardTemplate()` as a base then overrides.

2. Update the builder page: when the admin clicks "Reset to default", show a preset
   picker `UiDialog` with "Start blank" + the five presets. Each shows the preset name
   and a one-sentence description.

3. Update the `resetTemplate` ORPC handler to accept an optional preset payload:

   ```ts
   // existing: oc.output(ReportCardTemplateSchema)
   // updated:
   oc.input(z.object({ preset: ReportCardTemplateSchema.optional() })).output(
     ReportCardTemplateSchema
   )
   ```

   When a preset is provided, save it; otherwise save the blank default.

4. `pnpm lint`, `pnpm typecheck`, `pnpm build` — all must pass.

---

**🛑 Phase 13 — STOP AND REVIEW**

---

## Post-MVP (acknowledged — do not build now)

- **PDF recognition pipeline** — upload an existing school report card as PDF/image,
  run extraction via Cloudflare Workers AI, produce a draft template for admin review.
- **Recognition review UI** — two-panel review and refinement of AI-extracted drafts.
- Multi-page report cards.
- Free-form block positioning.
- QR codes, barcodes, school stamp blocks.
- Per-student block visibility.

If a real report card format cannot be expressed with the seven blocks, log it and ask
before extending the block set.

---

## Agent rules

1. **Stop after each phase.** Do not chain phases. Wait for explicit written approval.
2. **Do not undo previous decisions.** `REPORT-CARD-BUILDER.md` is binding. Read it
   before every phase.
3. **Do not overcomplicate.** Use the simplest solution that satisfies the spec. Ask
   before building something that feels overengineered.
4. **Respect the slot system.** A block only appears in a slot listed in its
   `allowedSlots`. The editor enforces this; the renderer trusts it.
5. **Every block config has a Zod schema.** No `z.any()`.
6. **`dataRequirements` is mandatory per block.**
7. **CA count is always dynamic.** Read `scoreConfig.caCount`. Never hardcode a number.
8. **Every user-facing name is plain English.** Written for a non-technical school
   administrator. No abbreviations, no code conventions.
9. **Null safety everywhere.** `manualValues` can be null/undefined on old rows.
   `logoPrimary`, `logoSecondary`, `signatureImage`, `watermark` can all be null.
   Never throw on null — render a sensible fallback or empty string.
10. **Presets need human approval before code.** Phase 13 step 1 is to present
    outlines and wait. Do not skip this.
11. **Update `AGENTS.md` and `.ai/PROJECT.md`** after each phase that introduces new
    conventions or changes existing ones.
12. **Log spec divergences** in a "Known drift" section of `AGENTS.md`.
13. **Do not merge `feat/report-card-template` to `main`** until Phase 10 is approved
    and the builder is fully functional. Flag this in every phase summary.
