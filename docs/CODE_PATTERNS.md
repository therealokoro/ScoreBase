# ScoreBase Code Patterns and File Creation Guidelines

## Composables

- **Location**: `app/composables/`
- **File Naming**: `useXXXX.ts` (e.g., `useAuth.ts`, `useTeachers.ts`)
- **Function Naming**:
  - Lists: `useListXXXX()` (e.g., `useListAcademicSessions()`)
  - Single item: `useGetXXXXDetail()` or `useFetchXXXX()` (e.g., `useGetAcademicSessions()`)
  - Mutations: `useCreateXXXX()`, `useUpdateXXXX()`, `useDeleteXXXX()`
- **Pattern**:
  - Exposes reactive state (refs/computed) and methods
  - Often wraps `useAsyncData` or custom fetch logic
  - Example structure:
    ```ts
    export function useListAcademicSessions() {
      const { data, pending, refresh } = await useAsyncData("sessions", () =>
        $orpc.academicSession.list.call()
      )
      return {
        sessions: computed(() => data.value ?? []),
        pending,
        refresh
      }
    }
    ```

## Server Procedures (oRPC)

- **Contracts**: `server/contracts/XXX.contract.ts`
  - Defines procedure shapes and input/output types
  - Example: `class.contract.ts` defines `list`, `getOne`, `create`, `update`, `delete`
- **Routers**: `server/routers/XXX.router.ts`
  - Implements contract procedures
  - Standard procedure names: `list`, `getOne`, `create`, `update`, `delete`
  - Uses `implement(contract)` helper
  - Example structure:
    ```ts
    const os = implement(classContract)
    const listClasses = os.list.handler(async () => await listAllClasses())
    ```
- **Queries**: `server/queries/XXX.query.ts`
  - Reusable database query functions
  - Named descriptively: `fetchSingleClass`, `listAllClasses`, `resolveNextTerm`

## Data Flow (Server → Frontend)

1. Frontend calls oRPC procedure via `$orpc.resource.procedure.call()`
2. Typically wrapped in `useAsyncData` for automatic refetching and pending states:
   ```ts
   const { data, pending, refresh } = await useAsyncData("classes", () => $orpc.class.list.call())
   ```
3. Data exposed as:
   - `data.value` (raw data from server)
   - Computed properties for derived state (e.g., `classes = computed(() => data.value ?? [])`)
   - `pending` for loading states
   - `refresh` function to refetch

## Component Structure for Reusability

- **Location**: `app/components/` (grouped by feature: App, Class, Form, Page, Session, Subject, Teacher, Ui)
- **Naming**:
  - PascalCase (e.g., `StatsCard.vue`, `UpsertForm.vue`)
  - Component is referenced with its parent path as a prefix (e.g., `<SessionUpsertForm>` for `app/components/Sesison/UpsertForm.vue`)
- **Props Pattern**:
  - Accept configuration via props
  - Use `withDefaults` for sensible defaults
  - Example:
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
- **Emits Pattern**:
  - Communicate actions via `defineEmits`
  - Common events: `submit`, `cancel`, `update`, `delete`, `open`, `close`, `edit`
  - Example:
    ```ts
    const emit = defineEmits<{ submit: [payload: UpsertClassInput] }>()
    ```
- **Reusable Component Examples**:
  - `AppEntityCard`: Generic card for displaying entities (title, description, icon, link)
  - `AppEntitySkeleton`: Loading placeholder for entities
  - `AppEntityActionDropdown`: Dropdown for edit/delete actions
  - Form components (`FormInput`, `FormSelect`, etc.): Wrappers for Vee-Validate fields
  - `UiSheet`: Reusable sidebar sheet for forms (used in `Lazy*UpsertForm` patterns)

## File Naming Conventions Summary

| Type             | Location             | Pattern                 | Examples                          |
| ---------------- | -------------------- | ----------------------- | --------------------------------- |
| Composables      | `app/composables/`   | `useXXXX.ts`            | `useAuth.ts`, `useTeachers.ts`    |
| Pages            | `app/pages/`         | `XXX.vue` or `[id].vue` | `index.vue`, `[classId].vue`      |
| Components       | `app/components/`    | `PascalCase.vue`        | `StatsCard.vue`, `UpsertForm.vue` |
| Server Contracts | `server/contracts/`  | `XXX.contract.ts`       | `class.contract.ts`               |
| Server Routers   | `server/routers/`    | `XXX.router.ts`         | `class.router.ts`                 |
| Server Queries   | `server/queries/`    | `XXX.query.ts`          | `class.query.ts`                  |
| Validators       | `shared/validators/` | `XXXX.ts` (semantic)    | `academic.ts`, `actors.ts`        |
| Database Schema  | `server/db/schema/`  | `XXXX.ts`               | `academic.ts`, `auth.ts`          |

## Styling and UI Component Usage

- **Base UI**: Shadcn Vue (Reka UI) via [UIThing](https://uithing.com) components prefixed with `Ui` (e.g., `UiButton`, `UiCard`, `UiSheet`)
- **Custom Components**: Built using base UI components, placed in `app/components/`
- **Styling**: Tailwind CSS utility classes
  - Component-specific styles in `<style lang="css">` blocks
  - Utility classes applied directly in templates
  - Common classes: `nav-item` for sidebar items, card layouts, button variants

## State and Loading Patterns

- **Loading**:
  - Server requests: `pending` from `useAsyncData` or mutation states
  - Component level: `isSubmitting` from Vee-Validate, `isPending` from oRPC procedures
  - UI: `AppEntitySkeleton`, `UiSkeleton` for placeholders
- **Error Handling**:
  - Server: Throw appropriate oRPC errors (`errors.NOT_FOUND()`, `errors.CONFLICT()`, etc. as defined in route's contracts)
  - Frontend: Display via `error` property from `useAsyncData` or mutation error handling
  - UI: Show in `Page` component's `:error` prop or use `useSonner` for toast notifications
- **Empty States**:
  - Check data length (e.g., `!classes.length`)
  - Use `UiEmpty` component with customizable title, description, and button

## Form Patterns

- **Validation**:
  - Zod schemas in `shared/validators/` (e.g., `UpsertClassSchema`)
  - Converted to Vee-Validate schema with `toTypedSchema()`
- **Submission**:
  - Use `useForm` from Vee-Validate
  - Handle submission with e.g `handleSubmit((payload) => { emit('submit', payload) // use the data for something })`
  - Loading state from `isSubmitting`
- **Layout**:
  - Form fields in `fieldset` with `:disabled="isSubmitting"`
  - Footer with Cancel and Submit buttons (For UiSheet)
  - Example structure in `Class/UpsertForm.vue`
- **Types**
  - Reusable types exported from `/shared/types/**.ts`
  - Types are derived from validators schemas using `z.infer<typeof Schema>`
  - Types are auto-imported by Nuxt

## Navigation and Layout

- **Layouts**:
  - `default.vue`: Basic container layout
  - `dashboard.vue`: Sidebar-based layout for authenticated routes (admin/teacher)
- **Navigation**:
  - Sidebar items defined in layout props (admin vs teacher views)
  - Breadcrumbs managed via `useBreadcrumbs` composable and `setPageBreadcrumbLabel` function
  - Page titles set via `useState("pageTitle")` or directly in template
