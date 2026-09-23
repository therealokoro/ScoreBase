# Report Card Builder — Agent Implementation Prompt

## Project Overview

This is a Nuxt 4 SPA (ssr: false) using:

- **ORPC** for type-safe API (contract → router → client via `$orpc` plugin)
- **TanStack Query** via `@peterbud/nuxt-query` (`useQuery`, `useMutation`)
- **Better Auth** for authentication (`useAuth()` composable with `isAdmin`, `currentUser`)
- **NuxtHub KV** (`kv` from `@nuxthub/kv`) for settings persistence
- **NuxtHub Blob** (`blob` from `hub:blob`) for file uploads
- **FormKit** for all forms
- **UI Thing** (shadcn-vue variant, `Ui` prefix components) for UI primitives
- **Tailwind CSS** + `tailwind-variants` (`tv()`) for styling

Before writing any code, read these files in full to understand the conventions:

- `shared/constants/kv-settings.ts` — how KV types and defaults are structured
- `server/kv/result-settings.ts` — the KV helper pattern (get with overloads, set, reset)
- `server/kv/school-settings.ts` — same pattern, second example
- `server/contracts/settings.contract.ts` — how settings contracts are defined
- `server/routers/settings.router.ts` — how settings handlers are written
- `app/composables/useSettings.ts` — how settings composables wrap `$orpc` + `useQuery`/`useMutation`
- `server/contracts/scoresheet.contract.ts` — how output schemas are composed with Zod
- `server/queries/reportCard.query.ts` — the existing report card data query
- `app/components/ReportCard/Document.vue` — the existing report card renderer (will be replaced)
- `app/pages/dashboard/settings/results.vue` (if it exists) — settings page pattern to mirror

---

## What You Are Building

A **report card template builder** — a settings page where an admin can configure how printed
report cards look. The template config is persisted to NuxtHub KV. A separate renderer component
reads this config and renders the report card with real student data.

This is a two-part feature:

1. **Server layer** — KV type, KV helper, ORPC contract, ORPC handler, Blob upload endpoint
2. **Client layer** — builder settings page, renderer component, updated viewer page

---

## Part 1 — Template Config Type

Add the following to `shared/constants/kv-settings.ts`:

```ts
export interface ReportCardParagraph {
  id: string
  text: string
  fontSize: number // 10–24, default 12
  color: string // hex, default "#000000"
  bold: boolean
  align: "left" | "center" | "right"
}

export interface ReportCardTemplate {
  header: {
    logoPlacement: "left" | "center" | "right" | "left-right"
    logoPrimary: string | null // NuxtHub Blob URL
    logoSecondary: string | null // Only used in "left-right" and "center" presets
    heading: string // Main heading e.g. "Federal Government College Sokoto"
    subheading: string // e.g. "Academic Excellence Since 1975"
    paragraphs: ReportCardParagraph[]
    info: {
      student: boolean // student's name, always true
      class: boolean
      session: boolean // full session name e.g. "2025/2026 Session"
      term: boolean // full term name e.g. "First Term"
      order: ("student" | "class" | "session" | "term")[]
    }
  }
  body: {
    columns: {
      subject: boolean // always true — do not allow hiding this
      caBreakdown: boolean // show CA1, CA2... as individual columns
      caTotal: boolean // show a single summed CA column
      exam: boolean
      total: boolean
      grade: boolean
      remark: boolean
    }
  }
  summary: {
    placement: "header" | "footer" // which section renders the summary row
    total: boolean
    average: boolean
    position: boolean
    outOf: boolean
  }
  footer: {
    remarks: {
      show: boolean
      teacher: {
        show: boolean
        label: string // e.g. "Class Teacher" — editable
        signature: boolean // show a printed blank signature line
        signatureImage: string | null // NuxtHub Blob URL for an uploaded signature image
      }
      principal: {
        show: boolean
        label: string // e.g. "Principal"
        signature: boolean
        signatureImage: string | null
      }
    }
    classSummary: {
      show: boolean
      highest: boolean
      lowest: boolean
      average: boolean
    }
    customBlocks: {
      id: string
      label: string // e.g. "Next term begins"
      content: string // static text
    }[]
  }
}

export const DEFAULT_REPORT_CARD_TEMPLATE: ReportCardTemplate = {
  header: {
    logoPlacement: "left",
    logoPrimary: null,
    logoSecondary: null,
    heading: "",
    subheading: "",
    paragraphs: [],
    info: {
      student: true,
      class: true,
      session: true,
      term: true,
      order: ["student", "class", "session", "term"]
    }
  },
  body: {
    columns: {
      subject: true,
      caBreakdown: false,
      caTotal: true,
      exam: true,
      total: true,
      grade: true,
      remark: true
    }
  },
  summary: {
    placement: "footer",
    total: true,
    average: true,
    position: true,
    outOf: true
  },
  footer: {
    remarks: {
      show: true,
      teacher: { show: true, label: "Class Teacher", signature: true, signatureImage: null },
      principal: { show: true, label: "Principal", signature: true, signatureImage: null }
    },
    classSummary: { show: false, highest: true, lowest: true, average: true },
    customBlocks: []
  }
}
```

Also add `"settings:report-card-template"` as a constant key alongside the other KV keys.

---

## Part 2 — Server Layer

### 2a. KV Helper — `server/kv/report-card-template.ts`

Follow the exact same pattern as `server/kv/result-settings.ts`:

- `getReportCardTemplate()` — returns full template, merging stored value with `DEFAULT_REPORT_CARD_TEMPLATE`
- `setReportCardTemplate(partial)` — deep-merges with current, saves, returns new value
- `resetReportCardTemplate()` — deletes the KV key

The merge for `setReportCardTemplate` must be a **deep merge** for nested objects (header, body,
summary, footer), not a shallow spread — otherwise updating `footer.remarks.teacher.label` would
wipe `footer.remarks.principal`. Use a recursive deep merge utility like `defu`.

### 2b. Blob Upload Endpoints — `server/routes/report-card/`

Create two Nitro event handler routes (NOT ORPC — file uploads go through Nitro directly, same
pattern as any NuxtHub Blob upload):

**`server/routes/report-card/logo.post.ts`**

- Accepts `multipart/form-data` with a `file` field
- Validates: image only (`image/png`, `image/jpeg`, `image/webp`), max 2MB
- Uploads via `hubBlob().put(...)` under the path `report-card/logos/<uuid>.<ext>`
- Returns `{ url: string }`
- Protected: check session via `serverAuth.api.getSession({ headers })`, reject if not admin

**`server/routes/report-card/signature.post.ts`**

- Same pattern, path `report-card/signatures/<uuid>.<ext>`
- Same admin protection

Look at any existing Nitro route in `server/routes/` for the upload pattern. If none exists, use
the NuxtHub docs pattern: `hubBlob().put(filename, file, { contentType, addRandomSuffix: true })`.

### 2c. ORPC Contract — add to `server/contracts/settings.contract.ts`

Add a `reportCard` group alongside `school` and `result`:

```ts
import { ReportCardTemplateSchema } from '~~/shared/validators/settings'

export const getReportCardTemplate = oc.output(ReportCardTemplateSchema)
export const setReportCardTemplate = oc
  .input(ReportCardTemplateSchema.deepPartial())
  .output(ReportCardTemplateSchema)
export const resetReportCardTemplate = oc.output(ReportCardTemplateSchema)

// Add to settingsContract:
reportCard: {
  getTemplate: getReportCardTemplate,
  setTemplate: setReportCardTemplate,
  resetTemplate: resetReportCardTemplate
}
```

You need to create `ReportCardTemplateSchema` in `shared/validators/settings.ts` as a Zod schema
matching `ReportCardTemplate`. Follow the pattern of `ResultSettingsSchema` in that file.

### 2d. ORPC Router — add to `server/routers/settings.router.ts`

Add a `reportCard` group following the exact same pattern as `school` and `result`:

- `getTemplate` handler calls `getReportCardTemplate()`
- `setTemplate` handler calls `setReportCardTemplate(input)` — **admin only** (check
  `context.session?.user?.role === "admin"`, throw `FORBIDDEN` otherwise)
- `resetTemplate` handler calls `resetReportCardTemplate()` then returns the default — **admin only**

### 2e. Update `server/routers/index.ts`

The `settingsRouter` export is nested — make sure the new `reportCard` group is included. No
structural change needed to the top-level `apiRouter`, since `settingsRouter` is already registered
there.

### 2f. Update `server/queries/reportCard.query.ts`

Add `getReportCardTemplate()` to the `Promise.all` in `fetchReportCardData` so the template config
is returned alongside the computed report card data. Add `template: ReportCardTemplate` to the
return object. This makes the template available to the renderer without a second fetch.

---

## Part 3 — Client Composables

Add to `app/composables/useSettings.ts`:

```ts
export const useGetReportCardTemplate = () => {
  const { $orpc } = useNuxtApp()
  return useQuery(
    $orpc.settings.reportCard.getTemplate.queryOptions({
      placeholderData: () => DEFAULT_REPORT_CARD_TEMPLATE
    })
  )
}

export const useSetReportCardTemplate = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.reportCard.setTemplate.mutationOptions())
}

export const useResetReportCardTemplate = () => {
  const { $orpc } = useNuxtApp()
  return useMutation($orpc.settings.reportCard.resetTemplate.mutationOptions())
}
```

---

## Part 4 — Builder Page

**Route:** `app/pages/dashboard/settings/report-card.vue`
**Middleware:** `definePageMeta({ middleware: ["admin-only"] })`
**Sidebar:** Add "Report Card" link to the settings sidebar alongside "Result Settings" and
"School Settings". Check `app/layouts/dashboard.vue` or the sidebar component to find where the
settings nav links are defined.

The page is a **two-column layout** — a settings form on the left/top and a live A4 preview on
the right/bottom (hidden on mobile, shown on md+). Use a `sticky` preview panel on desktop.

The page does NOT use FormKit's `type="form"` wrapper. Each section saves independently via its
own "Save" button calling `useSetReportCardTemplate`. Show a `useSonner` toast on success/error.
Show a "Saved" / "Unsaved changes" indicator in the page header.

### Section A — Header settings

#### Logo placement

Four preset cards the admin clicks to select (visual radio group, not a dropdown):

- **Left** — single logo left-aligned, heading centered or left
- **Center** — one or two logos centered above headings stacked
- **Right** — single logo right-aligned
- **Left / Right** — logo on far left, logo on far right, heading centered between them

Show logo upload input(s) based on the selected preset:

- "Left", "Right" → one upload for `logoPrimary`
- "Center" → two uploads: `logoPrimary` (left logo) and `logoSecondary` (right logo), with a
  "Use same logo for both" checkbox that copies `logoPrimary` to `logoSecondary`
- "Left / Right" → same as Center (two uploads)

Upload button calls `POST /report-card/logo` with `FormData`. On success, save the returned URL
to the template. Show a small preview of the uploaded logo with a remove button (sets URL to null).

#### Headings

- FormKit `type="text"` for `heading` and `subheading`

#### Paragraphs

A dynamic list (same pattern as grade boundaries in `results.vue`):

- Add paragraph button → appends `{ id: useId() /* useId() from nuxt */, text: "", fontSize: 12, color: "#000000", bold: false, align: "center" }` to the array
- Each row: textarea for text, number input for fontSize (10–24), color input (use `UiColorPicker`
  from UI Thing — install with `npx ui-thing@latest add color-picker`), bold toggle button, align
  toggle group (left/center/right icons), delete button
- Up/down arrow buttons to reorder paragraphs (simple array splice, no drag library needed)

#### Student info fields

Four toggle switches (FormKit or `UiSwitch`) for `student`, `class`, `session`, `term`.
Below the toggles, show the currently enabled fields in their display order with Up/Down arrow
buttons to reorder the `order` array. Only enabled fields appear in the reorder list.

### Section B — Body / Score table settings

Toggle switches for each column:

- Subject (disabled/always on — show as a locked toggle)
- CA breakdown (individual CA columns) — note: if this is on, `caTotal` auto-disables and vice
  versa. Mutually exclusive. Show them as a radio group or explain the exclusivity with helper text.
- Exam
- Total
- Grade
- Remark

### Section C — Summary settings

Radio group for placement: "In header" / "In footer"
Four checkboxes for: Total score, Average, Position, Out of N students

### Section D — Footer settings

#### Remarks

Master toggle for `remarks.show`. When enabled:

- Teacher remarks sub-section: show toggle, label text input, signature toggle, signature image
  upload (calls `POST /report-card/signature`)
- Principal remarks sub-section: same

When `signature: true` and no image uploaded, show a note: "A blank signature line will be printed."
When an image is uploaded, show preview with remove button.

#### Class summary

Toggle for `classSummary.show`. When enabled: three checkboxes for highest, lowest, average.

#### Custom blocks

Same dynamic list pattern as paragraphs:

- Add block button
- Each row: label input, content textarea, delete button
- No reordering needed here

### Page footer

"Reset to default" button (calls `useResetReportCardTemplate`, shows confirmation dialog first
using `UiDialog` or `UiAlertDialog`).

---

## Part 5 — Report Card Renderer

**File:** `app/components/ReportCard/Document.vue` (replace the existing one entirely)

This component accepts:

```ts
defineProps<{
  data: ReportCardData // from server/queries/reportCard.query.ts
}>()
```

`ReportCardData` now includes `data.template: ReportCardTemplate` (added in step 2f).

The renderer is the source of truth for print layout. It must use Tailwind `print:` utilities
throughout so `window.print()` produces a clean page with no dashboard chrome.

### Header rendering

**Logo placement presets:**

`left`: `<div class="flex items-center gap-4">` — logo on left (48px tall, auto width), heading
block takes remaining space, left-aligned or center per preference.

`right`: same but logo on right using `flex-row-reverse` or `justify-end`.

`center`: logo(s) centered above headings. If `logoSecondary` is set, show both side by side
centered. Stack headings below.

`left-right`: `<div class="flex items-center justify-between">` — primary logo left, secondary
logo right (or primary mirrored if secondary is null), heading block centered between using
`absolute` + `left-1/2 -translate-x-1/2` or a three-column grid.

Logo images: `<img :src="template.header.logoPrimary" class="h-12 w-auto object-contain" />`

Overlay logo (the watermark behind the table): if `logoPrimary` is set, render it as a centered
`position: absolute` image inside the document container with `opacity-10 pointer-events-none
select-none` — this is separate from the header logo placement.

**Headings:** render `heading` as `<h1>`, `subheading` as `<h2 class="text-muted-foreground">`.

**Paragraphs:** `v-for` over `header.paragraphs`, render each as a `<p>` with inline styles for
`fontSize`, `color`, `fontWeight`, and `textAlign`.

**Student info grid:** render only the fields where `info[field] === true`, in the order defined
by `info.order`. Use a CSS grid, 2 or 4 columns depending on how many are enabled.

**Summary in header:** `v-if="template.summary.placement === 'header'"` — render the summary row
here (see summary rendering below).

### Body rendering

The score table. Only render columns where `body.columns[col] === true`.

- `caBreakdown: true` → render individual CA columns (`CA 1`, `CA 2`...) from `scoreConfig.caCount`
- `caTotal: true` → render a single `CA Total` column showing `row.caTotal`
- Both cannot be true simultaneously (enforced in the builder) but render defensively

Use `UiScrollArea` + `UiTable` (already in use in the current `Document.vue`).

### Summary row rendering

A grid of 2 or 4 cells showing whichever of total/average/position/outOf are enabled.
Rendered in header OR footer based on `summary.placement`.

### Footer rendering

**Summary in footer:** `v-if="template.summary.placement === 'footer'"` — render summary row here.

**Class summary:** `v-if="footer.classSummary.show"` — compute highest/lowest/average from
`data.allStudentTotals` (you need to add this to `fetchReportCardData` — the array of grand totals
for all students in the class, computed the same way as position ranking). Show whichever of
highest/lowest/average are enabled.

**Remarks:** Two columns (teacher left, principal right), each showing:

- The remark text (`teacherRemark` / `principalRemark`)
- If `signature: true` and `signatureImage` set: `<img :src="signatureImage" class="h-10 w-auto" />`
- If `signature: true` and no image: a blank line `<div class="border-b border-foreground w-32 mt-4" />`
- The label below the signature line/image in small text

**Custom blocks:** `v-for` over `footer.customBlocks` — render each as a small card with label
and content.

---

## Part 6 — Update Viewer Page

**File:** `app/pages/dashboard/results/[resultId]/report-card/[scoresheetId].vue`

- Remove the Print button
- Add a "Customize template" link button (`UiButton variant="outline"` with a link icon) pointing
  to `/dashboard/settings/report-card` — visible to admins only (`v-if="isAdmin"`)
- Add a Print button that calls `window.print()`
- Pass `data` (which now includes `data.template`) to `<ReportCardDocument :data="data" />`

---

## Print Styles

In `app/assets/css/tailwind.css` (or wherever global styles live), add:

```css
@media print {
  /* Hide everything except the report card document */
  body > * {
    display: none !important;
  }
  .report-card-print-root {
    display: block !important;
  }

  @page {
    size: A4;
    margin: 15mm;
  }
}
```

Give the outermost wrapper in `Document.vue` the class `report-card-print-root`. Every element
outside the document (sidebar, breadcrumbs, action buttons) must also have `print:hidden`.

---

## Important Conventions to Follow

1. **ORPC pattern**: contract first → handler second → composable third. Never call `$orpc` directly
   in pages — always wrap in a composable in `app/composables/`.

2. **Error handling**: all mutations use `useSonner.promise(mutation.mutateAsync(...), { loading, success, error })`.

3. **Admin gating**: the builder page has `middleware: ["admin-only"]`. The ORPC handlers for
   `setTemplate` and `resetTemplate` must also check `context.session?.user?.role === "admin"` and
   throw `FORBIDDEN`. Read-only `getTemplate` does not need a role check (teachers need it to
   render their students' report cards).

4. **File path imports**: the project uses `~~/` for root-level imports (e.g.
   `~~/shared/constants/kv-settings`) and `~/` for `app/` imports. Follow this in all new files.

5. **UI Thing components**: use `npx ui-thing@latest add <component>` to install any component
   not already in `app/components/Ui/`. Install `color-picker` and `switch` if not already present.
   Check `app/components/Ui/` before installing to avoid duplicates.

6. **Auto-imports**: Nuxt auto-imports composables from `app/composables/` and components from
   `app/components/`. You do not need to manually import these in `<script setup>`.

7. **KV deep merge**: the `setReportCardTemplate` KV helper must deep-merge nested objects. A
   shallow spread will wipe nested sibling fields. Test this mentally: updating only
   `footer.remarks.teacher.label` must not erase `footer.remarks.principal`.

8. **Schema alignment**: the Zod schema in `shared/validators/settings.ts` must exactly mirror
   the TypeScript interface in `shared/constants/kv-settings.ts`. No optional fields without
   `.nullable()` or `.optional()` in the schema.
