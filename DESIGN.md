# DESIGN.md — Particle Theme

> **Agent Instructions:** This document is the single source of truth for all UI decisions in this project. All generated components, styling, and layouts **must** follow the tokens, patterns, and rules defined here. Never invent colors, spacing values, or component structures. When in doubt, reference a token from this file.

---

> **General Rules:** Agents may request permission to modify token values in the CSS files or improve primitive components when necessary to enhance consistency, accessibility, or overall UI quality.

---

# 1. Theme Identity

| Property          | Value                                                   |
| ----------------- | ------------------------------------------------------- |
| Theme Name        | Particle                                                |
| CSS Framework     | Tailwind CSS v4 (`@import "tailwindcss"`)               |
| Animation Library | `tw-animate-css`                                        |
| Component Library | shadcn-vue (`@import "shadcn-vue/tailwind.css"`)        |
| Dark Mode         | Class-based via `@custom-variant dark (&:is(.dark *))`  |
| Color Model       | **OKLCH** throughout (perceptually uniform, wide gamut) |
| Font — Sans       | `Inter, sans-serif`                                     |
| Font — Serif      | `Source Serif 4, serif`                                 |
| Font — Mono       | `JetBrains Mono, monospace`                             |
| Base Radius       | `0.375rem` (6px)                                        |
| Letter Spacing    | `0em` (no tracking adjustment by default)               |

---

# 2. Full CSS Source

The complete CSS source and token definitions are located at:

```txt
./app/assets/css/main.css
```

This file is the canonical source of all design tokens.

---

# 3. Token Reference

## 3.1 Color Tokens

Every token maps to a Tailwind utility through `--color-{token}` in `@theme inline`.

### Rules

- Always use Tailwind utility classes.
- Never use raw OKLCH, RGB, HEX, or arbitrary color values in component code.
- Never use default Tailwind color utilities such as `text-gray-500` or `bg-blue-100`.

---

## Core Surface & Text

| Token              | Tailwind Class          | Light                   | Dark                     | Usage                              |
| ------------------ | ----------------------- | ----------------------- | ------------------------ | ---------------------------------- |
| `background`       | `bg-background`         | White                   | Near-black `oklch(0.20)` | Page background                    |
| `foreground`       | `text-foreground`       | Dark gray `oklch(0.32)` | Off-white `oklch(0.92)`  | Primary body text                  |
| `card`             | `bg-card`               | White                   | `oklch(0.27)`            | Card surfaces                      |
| `card-foreground`  | `text-card-foreground`  | Dark gray               | Off-white                | Text on cards                      |
| `muted`            | `bg-muted`              | Near-white blue tint    | Very dark                | Subtle backgrounds, table headers  |
| `muted-foreground` | `text-muted-foreground` | Mid blue-gray           | Light gray               | Placeholder text, secondary labels |
| `border`           | `border-border`         | Light blue-gray         | Dark gray `oklch(0.37)`  | Borders and dividers               |
| `input`            | Internal                | Same as `border`        | Same as `border`         | Input borders                      |
| `ring`             | `ring-ring`             | Primary blue            | Primary blue             | Focus rings                        |

---

## Brand

| Token                  | Tailwind Class                | Value (Light)               | Usage                       |
| ---------------------- | ----------------------------- | --------------------------- | --------------------------- |
| `primary`              | `bg-primary` / `text-primary` | Blue `oklch(0.62 0.19 260)` | CTAs, active nav, links     |
| `primary-foreground`   | `text-primary-foreground`     | White                       | Text/icons on primary       |
| `secondary`            | `bg-secondary`                | Light blue-gray             | Secondary buttons, chips    |
| `secondary-foreground` | `text-secondary-foreground`   | Blue-gray                   | Text on secondary           |
| `accent`               | `bg-accent`                   | Pale blue                   | Hover states, selected rows |
| `accent-foreground`    | `text-accent-foreground`      | Deep blue                   | Text on accent              |

---

## Semantic / Status

> `success`, `warning`, and `info` are custom extensions added to the base shadcn theme and defined in this project's `:root` and `.dark` blocks.

| Token                    | Tailwind Class                        | Meaning           | Usage                             |
| ------------------------ | ------------------------------------- | ----------------- | --------------------------------- |
| `destructive`            | `bg-destructive` / `text-destructive` | Error / danger    | Delete actions, validation errors |
| `destructive-foreground` | `text-destructive-foreground`         | —                 | Text on destructive backgrounds   |
| `success`                | `bg-success` / `text-success`         | Success / passing | Published results, Grade A        |
| `success-foreground`     | `text-success-foreground`             | —                 | Text on success                   |
| `warning`                | `bg-warning` / `text-warning`         | Caution / pending | Pending review, borderline grades |
| `warning-foreground`     | `text-warning-foreground`             | —                 | Text on warning                   |
| `info`                   | `bg-info` / `text-info`               | Informational     | Submitted results, banners        |
| `info-foreground`        | `text-info-foreground`                | —                 | Text on info                      |

---

## Sidebar

Sidebar tokens are completely independent. Never substitute `bg-muted` or `bg-accent` within the sidebar.

| Token                        | Tailwind Class                    | Usage                |
| ---------------------------- | --------------------------------- | -------------------- |
| `sidebar`                    | `bg-sidebar`                      | Sidebar surface      |
| `sidebar-foreground`         | `text-sidebar-foreground`         | Sidebar text         |
| `sidebar-primary`            | `bg-sidebar-primary`              | Active nav item      |
| `sidebar-primary-foreground` | `text-sidebar-primary-foreground` | Text on active item  |
| `sidebar-accent`             | `bg-sidebar-accent`               | Hovered nav item     |
| `sidebar-accent-foreground`  | `text-sidebar-accent-foreground`  | Text on hovered item |
| `sidebar-border`             | `border-sidebar-border`           | Sidebar dividers     |
| `sidebar-ring`               | `ring-sidebar-ring`               | Sidebar focus rings  |

---

## Chart Palette

Blue monochromatic ramp — from light to dark.

Always assign `chart-1` to the most important data series.

| Token     | Light                  | Dark                   |
| --------- | ---------------------- | ---------------------- |
| `chart-1` | `0.6231 0.1880 259.81` | `0.7137 0.1434 254.62` |
| `chart-2` | `0.5461 0.2152 262.88` | `0.6231 0.1880 259.81` |
| `chart-3` | `0.4882 0.2172 264.38` | `0.5461 0.2152 262.88` |
| `chart-4` | `0.4244 0.1809 265.64` | `0.4882 0.2172 264.38` |
| `chart-5` | `0.3791 0.1378 265.52` | `0.4244 0.1809 265.64` |

---

# 3.2 Border Radius Tokens

| Token       | Tailwind Class | Value    | Usage                     |
| ----------- | -------------- | -------- | ------------------------- |
| `radius-sm` | `rounded-sm`   | `2px`    | Small badges, inline tags |
| `radius-md` | `rounded-md`   | `4px`    | Buttons, inputs           |
| `radius-lg` | `rounded-lg`   | `6px`    | Cards, modals, popovers   |
| `radius-xl` | `rounded-xl`   | `10px`   | Large overlays, sheets    |
| Utility     | `rounded-full` | `9999px` | Pills, avatars            |

> The tighter base radius creates a more refined and professional aesthetic suitable for academic software.

---

# 3.3 Shadow Tokens

All shadows use low-opacity black and are designed to work in both light and dark modes.

| Token        | Tailwind Class | Usage                         |
| ------------ | -------------- | ----------------------------- |
| `shadow-2xs` | `shadow-2xs`   | Minimal hover elevation       |
| `shadow-xs`  | `shadow-xs`    | Subtle surfaces               |
| `shadow-sm`  | `shadow-sm`    | Default card elevation        |
| `shadow`     | `shadow`       | Dropdowns, popovers           |
| `shadow-md`  | `shadow-md`    | Floating actions              |
| `shadow-lg`  | `shadow-lg`    | Dialogs, modals               |
| `shadow-xl`  | `shadow-xl`    | Sheets                        |
| `shadow-2xl` | `shadow-2xl`   | Reserved for critical UI only |

---

# 3.4 Typography Tokens

| Token          | Value                       | Usage                    |
| -------------- | --------------------------- | ------------------------ |
| `font-sans`    | `Inter, sans-serif`         | Default UI text          |
| `font-serif`   | `Source Serif 4, serif`     | Long-form content        |
| `font-mono`    | `JetBrains Mono, monospace` | IDs, codes, score values |
| `font-heading` | Same as `font-sans`         | Headings                 |

## Type Scale

| Class       | Size     | Weight | Line Height | Usage                      |
| ----------- | -------- | ------ | ----------- | -------------------------- |
| `text-4xl`  | 2.25rem  | 700    | 1.1         | School name on report card |
| `text-3xl`  | 1.875rem | 600    | 1.2         | Page titles                |
| `text-2xl`  | 1.5rem   | 600    | 1.3         | Section headings           |
| `text-xl`   | 1.25rem  | 500    | 1.4         | Modal titles               |
| `text-lg`   | 1.125rem | 500    | 1.5         | Emphasized labels          |
| `text-base` | 1rem     | 400    | 1.6         | Default body text          |
| `text-sm`   | 0.875rem | 400    | 1.5         | Table cells                |
| `text-xs`   | 0.75rem  | 400    | 1.4         | Captions, badges           |

---

# 3.5 Spacing

Base spacing unit:

```css
--spacing: 0.25rem;
```

Standard Tailwind spacing scale applies.

| Class   | Value   | Usage                     |
| ------- | ------- | ------------------------- |
| `p-1`   | 0.25rem | Icon padding              |
| `p-2`   | 0.5rem  | Compact badges            |
| `p-3`   | 0.75rem | Compact inputs            |
| `p-4`   | 1rem    | Default component padding |
| `p-6`   | 1.5rem  | Card padding              |
| `p-8`   | 2rem    | Page section padding      |
| `gap-2` | 0.5rem  | Icon/text spacing         |
| `gap-4` | 1rem    | Form spacing              |
| `gap-6` | 1.5rem  | Grid spacing              |

---

# 4. Component Patterns

Components use **shadcn-vue (Reka UI)** primitives located in:

```txt
app/components/ui
```

## Component Architecture Rules

- Extract large or reusable sections into dedicated components.
- Prefer reusable composition over duplicated markup.
- Use props extensively for customization and reuse.
- Shared wrappers around shadcn components are encouraged.
- Examples include:
  - Confirm dialogs
  - Empty states
  - Data tables
  - Dashboard stat cards
  - Section headers

## Naming Conventions

All components inside `app/components/ui/**` are automatically prefixed with `Ui`.

Examples:

| File                              | Usage           |
| --------------------------------- | --------------- |
| `components/ui/button/Button.vue` | `<UiButton />`  |
| `components/form/FormField.vue`   | `<FormField />` |

This behavior relies on Nuxt's `pathPrefix` component configuration.

---

## 4.1 Button

### Rules

- Primary buttons are reserved for the main action on a page or section.
- Avoid multiple primary buttons in the same visual area.
- Icon-only buttons must include `aria-label`.

```vue
<!-- Primary -->
<UiButton>Save Result</UiButton>

<!-- Secondary -->
<UiButton variant="secondary">
  View Scoresheet
</UiButton>

<!-- Outline -->
<UiButton variant="outline">
  Export PDF
</UiButton>

<!-- Ghost -->
<UiButton variant="ghost" :icon="ICONS.edit" aria-label="Edit result" />

<!-- Icon left -->
<UiButton variant="destructive" :icon="ICONS.delete">
  Delete Student
</UiButton>

<!-- Icon right -->
<UiButton :icon-right="ICONS.forward">
  Go to Dashboard
</UiButton>

<!-- Loading -->
<UiButton loading>
  Saving...
</UiButton>
```

---

## 4.2 Card

Create reusable card wrappers where appropriate.

```vue
<UiCard class="shadow-sm">
  <UiCardHeader>
    <UiCardTitle>JSS1A — 1st Term Result</UiCardTitle>

    <UiCardDescription>
      2025/2026 Academic Session
    </UiCardDescription>
  </UiCardHeader>

  <UiCardContent>
    <!-- content -->
  </UiCardContent>

  <UiCardFooter
    class="flex justify-end gap-3 border-t border-border pt-4"
  >
    <Button variant="outline">
      Review
    </Button>

    <Button>
      Approve & Publish
    </Button>
  </UiCardFooter>
</UiCard>
```

---

## 4.3 Status Badge

Use these exact class combinations for result lifecycle states.

```vue id="e8r1i9"
<!-- Draft -->
<UiBadge variant="outline" class="border-border text-muted-foreground">
  Draft
</UiBadge>

<!-- Submitted -->
<UiBadge class="border border-info/30 bg-info/15 text-info">
  Submitted
</UiBadge>

<!-- Pending -->
<UiBadge class="border border-warning/30 bg-warning/15 text-warning">
  Pending Review
</UiBadge>

<!-- Published -->
<UiBadge class="border border-success/30 bg-success/15 text-success">
  Published
</UiBadge>

<!-- Rejected -->
<UiBadge class="border border-destructive/30 bg-destructive/15 text-destructive">
  Rejected
</UiBadge>
```

## 4.4 Forms

All form components are built on top of **vee-validate** and the shared form primitives located in:

```txt id="6l4m80"
app/components/form
```

These components provide:

- Consistent styling
- Validation handling
- Accessibility support
- Shared layouts and spacing
- Tight integration with shadcn-vue primitives

### Form Architecture Rules

- Always initialize forms with `useForm()`
- Prefer `initialValues` for all fields
- Use shared `UiForm*` components instead of raw inputs
- Validation should be handled through vee-validate schemas or field rules
- Never manually wire labels, errors, or descriptions when a `UiForm*` component already handles them
- All form spacing should use `space-y-6` unless a tighter layout is explicitly needed
- Use `gap-4` for grouped form controls
- All submit actions should use `handleSubmit()`

---

## Standard Form Setup

Use `vee-validate` with `zod` schemas for all forms. Always check `shared/validators/**` folder to see if a zod schema is already defined for that form, or that matches the form and import it rather than creating a new one. If need be, edit the already existing one after users approval.

```vue
<script setup lang="ts">
import * as z from "zod"
import { toTypedSchema } from "@vee-validate/zod"

const schema = toTypedSchema(
  z.object({
    fullName: z.string().min(2, "Student name is required"),
    studentId: z.string().min(1, "Student ID is required"),
    class: z.string().min(1, "Class is required")
  })
)

const { handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    fullName: "",
    studentId: "",
    class: ""
  }
})

const onSubmit = handleSubmit((values) => {
  console.log(values)
})

const classOptions = [
  { label: "JSS1A", value: "jss1a" },
  { label: "JSS1B", value: "jss1b" }
]
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    <UiFormInput
      name="fullName"
      label="Student Name *"
      placeholder="Ahmed Musa"
      :icon="ICONS.student"
    />

    <UiFormInput
      name="studentId"
      label="Student ID *"
      placeholder="STU-2026-001"
      :icon="ICONS.credentials"
    />

    <UiFormSelect
      name="class"
      label="Class *"
      placeholder="Select class"
      :options="classOptions"
      :icon="ICONS.class"
    />

    <div class="flex justify-end">
      <UiButton type="submit"> Add Student </UiButton>
    </div>
  </form>
</template>
```

### Supported Form Components

| Component          | Purpose                               |
| ------------------ | ------------------------------------- |
| `UiFormInput`      | Text, email, password, URL, search    |
| `UiFormPassword`   | Password input with visibility toggle |
| `UiFormTextarea`   | Long-form text                        |
| `UiFormNumber`     | Numeric values                        |
| `UiFormSelect`     | Select dropdown                       |
| `UiFormDatePicker` | Date selection                        |
| `UiFormCheckbox`   | Boolean agreement/input               |
| `UiFormSwitch`     | Toggle settings                       |
| `UiFormRadioGroup` | Single-choice selection               |
| `UiFormTagsInput`  | Array/tag input                       |

---

### Field Conventions

#### Labels

- Labels should be concise and sentence-cased
- Required fields should include `*`

```vue id="7v8ojv"
<UiFormInput name="email" label="Email address *" />
```

---

#### Descriptions

Descriptions should provide context, constraints, or guidance.

```vue id="c1v6q5"
<UiFormPassword name="password" description="Use a mix of letters, numbers, and symbols." />
```

---

#### Placeholders

- Use realistic examples
- Avoid generic placeholders like `"Enter value"`

```vue id="v9w5fm"
placeholder="Ada Lovelace"
```

---

#### Icons

All icons must come from the shared `ICONS` constant.

Never hardcode icon names inline.

```vue id="6odbo9"
<UiFormInput :icon="ICONS.email" name="email" />
```

---

### Textarea Slots

`UiFormTextarea` supports toolbar and utility slots.

#### `#block-start`

Useful for helper metadata or toolbars.

```vue id="i4qqs2"
<UiFormTextarea name="message">
  <template #block-start="{ value }">
    <InputGroupText class="text-xs font-mono">
      {{ value?.split(' ').length ?? 0 }} words
    </InputGroupText>
  </template>
</UiFormTextarea>
```

---

#### `#block-end`

Useful for counters or inline actions.

```vue id="m8xvv7"
<UiFormTextarea name="bio" :maxlength="300">
  <template #block-end="{ length, maxlength }">
    <InputGroupText class="ml-auto text-xs text-muted-foreground">
      {{ length }} / {{ maxlength }}
    </InputGroupText>
  </template>
</UiFormTextarea>
```

---

### Validation Rules

- Validation messages must use:

  ```txt
  text-destructive text-xs
  ```

- Validation should occur through vee-validate schemas or rules

- Prefer schema validation (Zod/Yup/Valibot) for complex forms

- Async validation should show loading indicators when necessary

---

### Form Layout Rules

| Scenario         | Recommended Layout          |
| ---------------- | --------------------------- |
| Simple forms     | `space-y-6`                 |
| Compact forms    | `space-y-4`                 |
| Two-column forms | `grid md:grid-cols-2 gap-4` |
| Inline controls  | `flex items-center gap-2`   |
| Form actions     | `flex justify-end gap-3`    |

---

### Submit Actions

- The primary submit button should usually be the right-most action
- Destructive actions must use confirmation dialogs
- Loading states should disable submission

```vue id="imc39p"
<UiButton type="submit" loading>
  Saving...
</UiButton>
```

---

### Accessibility Rules

- Every form field must have:
  - a label
  - accessible error messaging
  - keyboard support

- Icon-only controls require `aria-label`

- Required fields should be communicated both:
  - visually
  - semantically

- Forms must remain fully usable on mobile devices

---

## 4.5 Confirm Dialogs

Create reusable confirm dialog wrappers for destructive or irreversible actions.

---

## 4.6 Empty States

```vue
<UiEmptyState
  :icon="ICONS.empty"
  title="No students to display"
  description="You have not created any students yet."
/>
```

---

## 4.7 Dashboard Stat Cards

Create reusable stat cards for analytics and dashboard metrics.

Recommended structure:

- Icon
- Label
- Value
- Trend indicator (optional)

---

# 5. Color Usage Rules

Agents **must** consult this table before assigning any color classes.

Never use arbitrary Tailwind colors.

| Scenario             | Classes                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| Primary CTA          | `bg-primary text-primary-foreground`                                       |
| Page background      | `bg-background`                                                            |
| Card surface         | `bg-card text-card-foreground shadow-sm`                                   |
| Table header         | `bg-muted/50`                                                              |
| Table row hover      | `hover:bg-accent/40 transition-colors duration-150`                        |
| Selected row         | `bg-accent text-accent-foreground`                                         |
| Sidebar background   | `bg-sidebar text-sidebar-foreground`                                       |
| Active sidebar item  | `bg-sidebar-primary text-sidebar-primary-foreground rounded-md`            |
| Hovered sidebar item | `bg-sidebar-accent text-sidebar-accent-foreground rounded-md`              |
| Secondary text       | `text-muted-foreground`                                                    |
| IDs / usernames      | `font-mono text-xs text-muted-foreground tabular-nums`                     |
| Validation error     | `text-destructive text-xs`                                                 |
| Destructive action   | `bg-destructive text-destructive-foreground`                               |
| Focus ring           | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

---

# 6. Layout Architecture

## 6.1 Content Width Constraints

| Context             | Max Width      | Padding                     |
| ------------------- | -------------- | --------------------------- |
| Dashboard pages     | `max-w-7xl`    | `px-4 sm:px-6 lg:px-8 py-8` |
| Settings pages      | `max-w-3xl`    | `px-4 py-8`                 |
| Auth pages          | `max-w-sm`     | `px-4 py-8`                 |
| Default modal       | `sm:max-w-lg`  | Handled by shadcn           |
| Wide modal          | `sm:max-w-2xl` | Handled by shadcn           |
| Report card preview | `max-w-3xl`    | `px-4 sm:px-0`              |

---

# 7. Report Card Layout

The report card must render cleanly in A4 portrait print format.

## Requirements

- Must remain readable at 100% zoom.
- Must avoid horizontal overflow.
- Print output must prioritize clarity over visual effects.

---

# 8. Icon Conventions

Use **Lucide** and **Tabler** icons through `nuxt-icon`.

## Rules

- Inline icons: `size-4`
- Sidebar/navigation icons: `size-5`
- Never hardcode icon names directly in components.
- Always reference icons through:

  ```ts
  ICONS.someKey
  ```

Icons are defined in:

```txt
shared/constants/icons.ts
```

The `ICONS` constant is auto-imported by Nuxt, so explicit imports are unnecessary.

```vue
<Icon :name="ICONS.class" />

<UiButton text="Add Student" :icon="ICONS.add" />
```

---

# 9. Accessibility Requirements

- All interactive elements must include:

  ```txt
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  ```

- Never rely solely on color to communicate status.

- Every `<UiTable>` must include:
  - `aria-label`
  - or a `<caption>`

- Icon-only buttons must include `aria-label`.

- Minimum tap target:

  ```txt
  min-h-9 min-w-9
  ```

- Report cards must remain readable without zooming or horizontal scrolling.

---

# 10. Responsive Breakpoints

| Breakpoint | Min Width | Behavior                  |
| ---------- | --------- | ------------------------- |
| Default    | `0px`     | Single-column layout      |
| `sm`       | `640px`   | Minor layout improvements |
| `md`       | `768px`   | Two-column forms          |
| `lg`       | `1024px`  | Full sidebar and tables   |
| `xl`       | `1280px`  | 4-column dashboard stats  |

---

# 11. File & Folder Structure

```txt
app
├── assets/
│   └── css/
│       └── main.css
│
├── components/
│   ├── ui/
│   │   └── ...
│   │
│   ├── form/
│   │   └── ...
│   │
│   ├── app/
│   │   ├── Sidebar.vue
│   │   ├── TopBar.vue
│   │   └── Breadcrumb.vue
│   │
│   ├── result/
│   └── student/
```

## Rules

- Do not manually modify generated shadcn components unless necessary.
- Shared application-level components belong in `components/app`.
- Domain-specific components belong in namespaced folders.

---

# 12. Do / Don't

| ✅ Do                                          | ❌ Don't                               |
| ---------------------------------------------- | -------------------------------------- |
| Use design tokens via Tailwind utilities       | Hardcode colors                        |
| Use `text-muted-foreground` for secondary text | Use arbitrary gray utilities           |
| Use `font-mono tabular-nums` for numeric data  | Mix font families randomly             |
| Confirm destructive actions with dialogs       | Delete immediately                     |
| Use sidebar-specific tokens in sidebars        | Use generic background tokens          |
| Use `shadow-sm` for resting cards              | Use excessive shadows/glows            |
| Use `transition-colors duration-150`           | Use JS for simple hover transitions    |
| Use `rounded-lg` as the default radius         | Use oversized radii like `rounded-3xl` |
| Keep icon sizing consistent                    | Scale icons inconsistently             |

---

_DESIGN.md — Particle Theme v1.0 | Tailwind CSS v4 + shadcn-vue (Reka UI) | 2026_
