# ScoreBase Codebase Structure and Coding Patterns

## Overview

This document summarizes the structure, architecture, and coding patterns of the ScoreBase application - a Nigerian secondary school result management system.

## Technology Stack

- **Frontend Framework**: Vue 3, Nuxt 4, TypeScript
- **Styling**: TailwindCSS v4
- **UI Components**: Shadcn Vue (Reka UI)
- **Backend**: Nitro (via Nuxt 4 `/server` directory)
- **ORM**: Drizzle ORM with SQLite via NuxtHub
- **API Layer**: oRPC
- **Authentication**: Better Auth (email/password + username + admin plugin)
- **Package Manager**: PNPM
- **Linting & Formatting**: Oxlint, Oxfmt

## Directory Structure

```
ScoreBase/
├── .agents/          # Opencode agent skills
├── .backup/          # Backup files (not tracked by git)
├── .data/            # Data storage
├── .nuxt/            # Nuxt build files
├── .vscode/          # VS Code settings
├── app/              # Main application (Nuxt)
│   ├── components/   # Vue components (organized by feature)
│   ├── layouts/      # Layout components
│   ├── pages/        # Page components (routing)
│   ├── plugins/      # Nuxt plugins
│   └── utils/        # Utility functions
├── server/           # Server-side code
│   ├── api/          # API endpoints
│   ├── context/      # Server context
│   ├── contracts/    # oRPC contracts
│   ├── db/           # Database schema and migrations
│   ├── queries/      # Database queries
│   ├── routers/      # oRPC routers
│   └── routes/       # Route definitions
├── shared/           # Shared code between client/server
│   ├── constants/    # Constant values
│   ├── types/        # TypeScript types
│   ├── validators/   # Input validation schemas
│   └── utils/        # Utility functions
├── public/           # Static assets
├── docs/             # Documentation
└── config files      # nuxt.config.ts, package.json, tsconfig.json, etc.
```

## Key Coding Patterns

### 1. Component Organization

- Components organized by feature/domain: App, Class, Form, Page, Session, Subject, Teacher, Ui
- Consistent pattern:
  - Script setup with TypeScript
  - Props definition with defaults
  - Template with semantic HTML and UI component usage
  - Scoped CSS when needed

### 2. Page Structure

- Uses Nuxt's file-based routing
- Admin pages under `/app/pages/admin/` with subdirectories for each resource
- Pages typically:
  - Define layout metadata
  - Fetch data using `useAsyncData` or custom composables
  - Handle UI states (loading, empty, error)
  - Use reusable components like `Page`, `AppEntityCard`, `AppEntitySkeleton`

### 3. State Management & Data Fetching

- Uses Nuxt's `useAsyncData` for data fetching
- Custom composables for specific data operations (e.g., `useListAcademicSessions`)
- Form handling with Vee-Validate and Zod schemas
- Mutations handled through oRPC with loading states via `useSonner.promise`

### 4. Database Schema (Drizzle ORM)

- Tables defined in `/server/db/schema/`
- Relations defined using Drizzle's `relations` utility
- Uses `typeid` for ID generation
- Common timestamp fields extracted to `dateTimeSchema`
- JSON fields for flexible data storage (tags, subject lists)

### 5. API Layer (oRPC)

- Contracts defined in `/server/contracts/`
- Routers in `/server/routers/` implementing contracts
- Queries separated in `/server/queries/` for reusability
- Standard CRUD operations with proper error handling

### 6. Authentication

- Uses Better Auth with email/password and username strategies
- Auto-generated credentials for teachers based on name and phone
- Role-based access control (admin/teacher)
- Session management through Better Auth

### 7. Reusable Components

- Consistent UI component library (Shadcn Vue/Reka UI)
- Reusable patterns for:
  - Entity cards (`AppEntityCard`)
  - Loading skeletons (`AppEntitySkeleton`)
  - Empty states (`UiEmpty`)
  - Action dropdowns (`AppEntityActionDropdown`)
  - Forms (`Lazy*UpsertForm` patterns)
  - Sheets/dialogs (`UiSheet`)

### 8. Validation

- Uses Zod schemas in `/shared/validators/`
- Separate validators for academic data and actor data
- Integrated with Vee-Validate in

### 9. Types

- Reusable types exported from `/shared/types/**.ts`
- Types are derived from validators schemas using `z.infer<typeof Schema>`
- Types are auto-imported by Nuxt

### 10. Styling Approach

- Tailwind CSS utility-first approach
- Consistent spacing and component variants
- Dark mode considerations in color choices
- Custom CSS classes in component style blocks when needed

## Notable Features Implemented

- Academic session and term management (with auto-creation of 1st term)
- Class management with teacher assignment
- Subject management with tagging
- Subject lists/presets for classes
- Result lifecycle management (draft → submitted → reviewed → approved/published)
- Score distribution configuration per term
- Derived metrics calculation (total, average, position, grade)
- Report card generation with print/PDF export
- Configurable grading system and position display rules

## Architectural Highlights

- Clear separation of concerns between client and server
- Reusable components and composables
- Proper TypeScript typing throughout
- Effective use of Nuxt 4 features (server routes, file-based routing, composables)
- Standardized error handling and loading states
- Consistent API patterns using oRPC
