# Frontend MVP Design - ScoreBase App

## Overview

This spec defines the frontend implementation plan for the MVP phase of the ScoreBase app. The frontend will mirror the implemented backend entities and support both Admin and Teacher roles.

---

## Page Structure

### Admin Pages

| Route             | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `/admin/sessions` | Sessions list with expandable terms under each session |
| `/admin/classes`  | Classes CRUD                                           |
| `/admin/subjects` | Subjects management + subject lists (presets) as tabs  |
| `/admin/teachers` | Teachers CRUD                                          |
| `/admin/students` | All students management                                |
| `/admin/results`  | View all results, approve/publish teacher submissions  |

### Teacher Pages

| Route                | Description                            |
| -------------------- | -------------------------------------- |
| `/teacher/dashboard` | Overview of assigned class             |
| `/teacher/students`  | Students in assigned class             |
| `/teacher/results`   | Create/edit results for assigned class |

### Shared Pages

| Route        | Description                                           |
| ------------ | ----------------------------------------------------- |
| `/dashboard` | Redirects to admin or teacher dashboard based on role |
| `/login`     | Authentication page                                   |

---

## UI Pattern

**Hybrid Approach**:

- Sessions, Classes, Subjects, Subject Lists → Card-based layout (horizontal spread)
- Teachers, Students, Results → Table-based layout
- All Add/Edit actions in slide-over sheets (UiSheet)

### Card Layout (Sessions, Classes, Subjects, Subject Lists)

**Session/Class Cards**:

- Horizontal grid layout
- Each card displays: Icon, Name, Teacher (for classes), Student Count, Action buttons
- Click card → navigates to detail page (`/admin/sessions/[id].vue` or `/admin/classes/[id].vue`)
- Add button → opens sheet with form

**Subject Cards** (two-column grid):

- Filter tags control above the list
- Each card displays: Icon, Subject Name, Tags, Action buttons
- Click card → navigates to detail page (`/admin/subjects/[id].vue`)

**Subject Preset Cards**:

- Each card displays: Icon, Preset Name, Subject Count, Action buttons
- Click card → navigates to detail page (`/admin/subject-presets/[id].vue`)

### Table Layout (Teachers, Students, Results)

- Searchable/filterable table with columns
- Add button → opens sheet with form
- Row actions: Edit (opens pre-filled sheet), Delete (confirmation dialog)
- Empty state when no data

### Form Pattern

- Used inside sheets (slide-over panels)
- Uses vee-validate + zod schemas from `shared/validators/`
- Submit button with loading state
- Cancel/close sheet action

---

## Data Flow

### Composables

- Create composables per entity in `app/composables/`
- Follow existing pattern: `useListAcademicSessions()`, `useCreateSession()`, etc.
- Use TanStack Query via oRPC (`$orpc.entity.action()`)

### Form Validation

- Use Zod schemas from `shared/validators/`
- Integrate with vee-validate for form handling

---

## Implementation Order

### Phase 1: Sessions & Terms

1. Create `/admin/sessions` page
   - Card-based grid layout: Icon, Session Name, Term Count, Actions
   - Click card → navigates to `/admin/sessions/[id].vue`
   - Add/Edit session form in sheet

2. Create `/admin/sessions/[id].vue` detail page
   - Session details with list of terms
   - Add/Edit term actions
   - Edit session form

### Phase 2: Classes

3. Create `/admin/classes` page
   - Card-based grid layout: Icon, Class Name, Teacher, Student Count, Actions
   - Click card → navigates to `/admin/classes/[id].vue`
   - Add class form in sheet

4. Create `/admin/classes/[id].vue` detail page
   - Class details: Name, Teacher, Subject List, Students list
   - Edit class form
   - View/manage students in class

### Phase 3: Subjects & Subject Lists

5. Create `/admin/subjects` page
   - Tab interface: Subjects | Subject Presets
   - **Subjects tab**: Two-column card grid with filter tags above
     - Card: Icon, Subject Name, Tags, Actions
     - Click card → navigates to `/admin/subjects/[id].vue`
   - **Subject Presets tab**: Card-based grid
     - Card: Icon, Preset Name, Subject Count, Actions
     - Click card → navigates to `/admin/subject-presets/[id].vue`
   - Add forms in sheets

### Phase 4: Teachers

6. Create `/admin/teachers` page
   - Table layout: Name, Email, Phone, Assigned Class, Actions
   - Add/Edit teacher form (creates user via Better Auth)
   - Assign classes functionality

7. Create `/admin/teachers/[id].vue` detail page
   - Teacher profile with assigned class
   - Edit teacher form

### Phase 5: Students

8. Create `/admin/students` page
   - Table layout: Name, Student ID, Class, Phone, Actions
   - Add/Edit student form
   - Auto-generate student ID based on pattern

9. Create `/admin/students/[id].vue` detail page
   - Student profile with class and results
   - Edit student form

### Phase 6: Results (Admin)

10. Create `/admin/results` page
    - Results table grouped by Session → Term
    - Columns: Class, Status (Draft/Submitted/Reviewed/Published), Created By, Actions
    - View details: open scoresheet preview
    - Actions: Review, Approve, Publish, Reject

### Phase 7: Teacher Pages

11. Create `/teacher/dashboard` - stats overview
12. Create `/teacher/students` - students in assigned class
13. Create `/teacher/results` - create/edit results for assigned class

---

## Component Requirements

### Shared Components

- `DataTable` - reusable table with sorting, pagination
- `StatusBadge` - for result status (Draft, Submitted, Reviewed, Published)
- `SearchInput` - search with debounce
- `EmptyState` - when no data

### Form Components (reuse existing)

- `UiFormInput` - text inputs
- `UiFormSelect` - dropdown selects
- `UiFormTextarea` - text areas
- `UiButton` - submit/cancel buttons
- `UiSheet` - slide-over for forms
- `UiDialog` - confirmations

---

## Permissions & Access

### Admin

- Access to all `/admin/*` routes
- Full CRUD on all entities
- Approve/publish results

### Teacher

- Access to `/teacher/*` routes only
- Read-only on sessions, terms, class, subjects, subject lists
- CRUD on students in assigned class
- CRUD on results for assigned class
- Cannot publish results (only submit for review)

---

## Acceptance Criteria

1. All admin pages accessible at defined routes
2. All teacher pages accessible at defined routes
3. Card-based layout for Sessions, Classes, Subjects, Subject Presets
4. Table-based layout for Teachers, Students, Results
5. Detail pages for each entity (e.g., `/admin/classes/[id].vue`)
6. Master-detail pattern implemented with sheets for forms
7. Forms validate using zod schemas
8. Data fetches via oRPC + TanStack Query
9. Role-based access enforced via middleware
10. Empty states displayed when no data
11. Loading states shown during fetches
12. Error handling with user-friendly messages
13. **Fully responsive and mobile-friendly** - All layouts adapt to mobile, tablet, and desktop
    - Card grids collapse to single column on mobile
    - Tables become scrollable or transform to card view on mobile
    - Sidebar collapses to drawer on mobile
    - Forms are usable on touch devices
    - Touch-friendly tap targets (min 44px)

## Responsive Design Requirements

All pages must be fully responsive and mobile-friendly:

- **Mobile (< 640px)**: Single column layout, stacked cards, horizontal scroll for tables or card-based alternatives
- **Tablet (640px - 1024px)**: Two-column grids, adjusted spacing
- **Desktop (> 1024px)**: Full layouts as designed

### Specific Responsive Behaviors

- **Card grids**: Collapse to single column on mobile, two columns on tablet
- **Tables**: Horizontal scroll with sticky first column OR convert to card layout on mobile
- **Sheets**: Full-width on mobile, side slide-over on desktop
- **Navigation**: Collapsible sidebar works as drawer on mobile
- **Buttons**: Adequate touch targets (min 44px)
- **Spacing**: Adjusted padding for smaller screens
- **Typography**: Readable font sizes across all breakpoints
