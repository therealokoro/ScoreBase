# ScoreBase MVP - Complete Work Breakdown

## Overview

This document outlines all tasks required to complete a Minimum Viable Product (MVP) for the Nigerian Secondary School Result Management System.

---

## Completed (Phase 1 - Academic Structure)

| Entity            | Status  | Notes                                  |
| ----------------- | ------- | -------------------------------------- |
| Academic Sessions | ✅ Done | Full CRUD + auto-create 1st term       |
| Terms             | ✅ Done | Full CRUD                              |
| Classes           | ✅ Done | Full CRUD + subjectList FK + teacherId |
| Subjects          | ✅ Done | Full CRUD + tags (JSON)                |
| Subject Lists     | ✅ Done | Full CRUD                              |

---

## Completed (Phase 2 - Teachers)

| Entity                   | Status  | Notes                                                          |
| ------------------------ | ------- | -------------------------------------------------------------- |
| Teachers                 | ✅ Done | Uses `user` table (Better Auth), role distinguishes from admin |
| Class-Teacher Assignment | ✅ Done | Via `teacherId` FK in classes table                            |

**Implementation Notes:**

- Teachers use existing `user` table (Better Auth)
- Schema: `shared/validators/actors.ts`
- Creates user via Better Auth API with `role: "user"`
- Password auto-generated as phoneNumber
- Router: `server/routers/teacher.router.ts`

---

## Phase 2 (Remaining): Students

### 2.1 Student Management

**Database Schema:**

- Create `students` table in `server/db/schema/actors.ts`
  - `id` - typeid "student"
  - `name` - Full Name
  - `studentId` - Unique student ID (configurable pattern)
  - `classId` - FK to classes
  - `phoneNumber` - optional
  - `createdAt`, `updatedAt`

**Schema & Contracts:**

- Add schemas to `shared/validators/actors.ts`
- Create `server/contracts/student.contract.ts`
- Create `server/queries/student.query.ts`

**Router:**

- Create `server/routers/student.router.ts`
  - `list` - list all students (optionally by classId)
  - `getOne` - get single student
  - `create` - create student (auto-generate student ID - editable)
  - `update` - update student details
  - `delete` - remove student
  - `promoteOne` - move student to different class(post MVP)
  - `promoteAll` - create multiple students at once(post MVP)
  - `demote` - create multiple students at once(post MVP)

**Student ID Pattern:**

- Configurable format (e.g., `STU/2025/001`)
- Needs system config to store the pattern

### 2.2 Teacher Management

**Database Schema:**

- Teachers are users without the `admin` role set in the existing `user` table
- A teacher can be assigned to only one class

**Schema & Contracts:**

- Add Teacher schemas to `shared/validators/actors.ts`
- Create `server/contracts/teacher.contract.ts`
- Create `server/queries/teacher.query.ts`

**Router:**

- Create `server/routers/teacher.router.ts`
  - `list` - list teachers
  - `getOne` - get teacher details
  - `create` - create teacher (auto-generate credentials)
  - `update` - update teacher (name, phone, assigned class)
  - `delete` - deactivate teacher

**Auto-Generated Credentials Logic:**

- User better-auth email/password auth as base auth provider
- (POST-MVP) Username auth implemented using better-auth username plugin
- Username derived from name (e.g., "John Doe" → "jdoe")
- Password: name + phone (e.g., "john-08133342323")

---

## Phase 3: Results Management

### 3.1 Result Entity

**Database Schema:**

- Create `results` table in `server/db/schema/academic.ts`
  - `id` - typeid "result"
  - `termId` - FK to terms
  - `status` - enum: "draft", "submitted", "reviewed", "published"
  - `createdBy` - teacher ID (FK to users)
  - `reviewedBy` - admin ID (FK to users)
  - `createdAt`, `updatedAt`

**Business Rule:** Each term has max 1 result

**Schema & Contracts:**

- Create `server/contracts/result.contract.ts`
- Create `server/queries/result.query.ts`

**Router:**

- Create `server/routers/result.router.ts`
  - `list` - list results (by termId)
  - `getOne` - get result with scoresheets
  - `create` - create new result for a term (if none exists)
  - `updateStatus` - change status (draft→submitted→reviewed→published)
  - `submit` - teacher submits result
  - `publish` - admin publishes result
  - `proposeEdit` - teacher proposes edit to published result

### 3.2 Scoresheet Entity

**Database Schema:**

- Create `scoresheets` table
  - `id` - typeid "sheet"
  - `resultId` - FK to results
  - `studentId` - FK to students
  - `subjectIds` - JSON array of subject IDs offered by this student
  - `createdAt`, `updatedAt`

**Business Rule:** 1 scoresheet per student per result, pre-populated from class subject list

**Router:**

- Create `server/routers/scoresheet.router.ts`
  - `create` - create scoresheet for student (auto-populate subjects from class)
  - `addSubject` - add subject to student's offerings
  - `removeSubject` - remove subject from student's offerings

### 3.3 SubjectScore Entity

**Database Schema:**

- Create `subject_scores` table
  - `id` - typeid "subsco"
  - `scoresheetId` - FK to scoresheets
  - `subjectId` - FK to subjects
  - `ca1`, `ca2`, `ca3`, `exam` - scores (bounded by term's score distribution)
  - `createdAt`, `updatedAt`

**Schema & Contracts:**

- Create `server/contracts/subjectScore.contract.ts`
- Create `server/queries/subjectScore.query.ts`

**Router:**

- Create `server/routers/subjectScore.router.ts`
  - `getByScoresheet` - get all scores for a scoresheet
  - `upsert` - create or update scores for a subject
  - `bulkUpsert` - save all subject scores at once
  - `calculateTotal` - computed: ca1 + ca2 + ca3 + exam

### 3.4 Score Distribution Config

**Database Schema:**

- Add to `terms` table or create `term_config` table
  - `ca1Weight`, `ca2Weight`, `ca3Weight`, `examWeight`
  - Must sum to 100

---

## Phase 4: Derived Metrics (Computed)

### 4.1 Score Calculations (On-The-Fly)

**Functions to create in `server/lib/scores.ts`:**

- `calculateSubjectTotal(ca1, ca2, ca3, exam)` → number
- `calculateOverallScore(scoresheetId)` → number
- `calculateAverage(scoresheetId)` → number

### 4.2 Position Calculation

**Functions:**

- `calculateClassPositions(termId, classId)` → Array<{ studentId, average, position }>
- Must handle ties (same average = same position)

### 4.3 Grade Mapping

**Database Schema:**

- Create `grading_scales` table
  - `id` - typeid "grade"
  - `name` - e.g., "Default Scale"
  - `grades` - JSON: [{ min: 90, max: 100, label: "A", remark: "Excellent" }, ...]

**Functions:**

- `getGrade(totalScore, scaleId)` → { label, remark }

### 4.4 Caching (Optional for MVP)

- Cache derived metrics in KV store
- Invalidate when related scores change

---

## Phase 5: Report Card Generation

### 5.1 Report Card Data Structure

**Function:** `generateReportCard(scoresheetId)` returns:

- Student info (name, class, student ID)
- Session & Term info
- Subject scores (CA1, CA2, CA3, Exam, Total, Grade, Remark)
- Overall Score
- Average Score
- Class Position
- Teacher's remark
- Principal's remark (optional)

### 5.2 Report Card UI

**Page:** `app/pages/reports/[resultId].vue`

- Display report card in print-friendly format
- Show/hide positions based on config

### 5.3 Print Optimization

- Use `print.vue` layout
- CSS `@media print` styles

---

## Phase 6: System Configuration

### 6.1 Settings Database

**Database Schema:**

- Create `settings` table
  - `key` - unique key (e.g., "grading_scale", "student_id_pattern")
  - `value` - JSON value
  - `updatedAt`

### 6.2 Settings Endpoints

**Router:** `server/routers/settings.router.ts`

- `get(key)` - get setting value
- `set(key, value)` - update setting
- `list()` - list all settings

### 6.3 Configurable Items

| Setting            | Type   | Default                                             |
| ------------------ | ------ | --------------------------------------------------- |
| grading_scale      | JSON   | [{min:90,max:100,label:"A",remark:"Excellent"},...] |
| student_id_pattern | string | "STU/YYYY/###"                                      |
| ca_weights         | JSON   | {ca1:10, ca2:10, ca3:10, exam:70}                   |
| position_display   | string | "all" or "top3"                                     |
| school_name        | string | ""                                                  |
| school_logo        | string | URL                                                 |
| school_address     | string | ""                                                  |

---

## Phase 7: Authentication & Authorization

### 7.1 Role-Based Access

**Current State:** Better Auth is set up with admin plugin

**Tasks:**

- Ensure user roles are stored in user table
- Add role field: "admin" | "teacher" | "student" (future)
- Update `app/middleware/guard.ts` for role checks

### 7.2 Teacher Scoping

**Implementation:**

- All teacher queries must filter by `assignedClass`
- Add middleware or helper function: `getTeacherClassIds(userId)`

### 7.3 Admin-Only Actions

**Endpoints that need admin check:**

- Publish results
- Approve/decline edit proposals
- Promote/demote students
- Modify system settings

---

## Phase 8: Frontend Pages & UI

### 8.1 Required Pages

| Route            | Description                    | Access         |
| ---------------- | ------------------------------ | -------------- |
| `/dashboard`     | Overview stats                 | Admin, Teacher |
| `/sessions`      | Manage academic sessions       | Admin          |
| `/terms`         | Manage terms                   | Admin          |
| `/classes`       | Manage classes                 | Admin          |
| `/subjects`      | Manage subjects                | Admin          |
| `/subject-lists` | Manage subject presets         | Admin          |
| `/students`      | Manage students                | Admin, Teacher |
| `/teachers`      | Manage teachers                | Admin          |
| `/results`       | View/manage results            | Admin, Teacher |
| `/results/[id]`  | Result detail with scores      | Admin, Teacher |
| `/reports/[id]`  | Report card view               | Admin, Teacher |
| `/settings`      | System configuration           | Admin          |
| `/profile`       | User profile & password change | Admin, Teacher |

### 8.2 Components Needed

- DataTable with sorting, filtering, pagination
- Forms for each entity
- Status badges (draft, submitted, published, etc.)
- Score input components
- Report card template
- Settings forms

---

## Phase 9: Testing & Polish

### 9.1 Seeding

- Create seed script with FakerJS for:
  - Sample sessions, terms
  - Sample classes
  - Sample subjects with tags
  - Sample subject lists
  - Sample students
  - Sample teachers
  - Sample results with scores

### 9.2 Error Handling

- Global error boundary
- API error responses
- Form validation feedback

### 9.3 Edge Cases

- Empty states for all lists
- Loading states
- 404 pages
- Session/term not found handling

---

## Summary Checklist

- [ ] Phase 2: Students CRUD
- [ ] Phase 2: Teachers CRUD + auto-credentials
- [ ] Phase 2: Class-Teacher assignments
- [ ] Phase 3: Results CRUD + lifecycle
- [ ] Phase 3: Scoresheets CRUD + subject management
- [ ] Phase 3: SubjectScores CRUD
- [ ] Phase 4: Derived metrics (total, average, position, grade)
- [ ] Phase 5: Report card generation + print
- [ ] Phase 6: System settings (grading, patterns, etc.)
- [ ] Phase 7: Role-based access + teacher scoping
- [ ] Phase 8: Frontend pages + components
- [ ] Phase 9: Testing + seeding + polish

---

## File Structure Summary

```
server/
├── db/
│   └── schema/
│       └── academic.ts      # Add: students, results, scoresheets, subject_scores, settings
├── contracts/
│   ├── student.contract.ts   # NEW
│   ├── teacher.contract.ts   # NEW
│   ├── result.contract.ts   # NEW
│   ├── scoresheet.contract.ts # NEW
│   ├── subjectScore.contract.ts # NEW
│   ├── settings.contract.ts # NEW
├── queries/
│   ├── student.query.ts     # NEW
│   ├── teacher.query.ts     # NEW
│   ├── result.query.ts      # NEW
│   ├── scoresheet.query.ts  # NEW
│   ├── subjectScore.query.ts # NEW
│   ├── settings.query.ts    # NEW
├── routers/
│   ├── index.ts             # Add new routers
│   ├── student.router.ts    # NEW
│   ├── teacher.router.ts    # NEW
│   ├── result.router.ts      # NEW
│   ├── scoresheet.router.ts # NEW
│   ├── subjectScore.router.ts # NEW
│   ├── settings.router.ts   # NEW
├── lib/
│   └── scores.ts            # NEW: Derived metrics calculations

shared/
└── schemas/
    └── academic.ts          # Add all new schemas

app/
├── pages/                   # Add all new pages
├── composables/             # Add: useStudents, useTeachers, useResults, etc.
```

---

## Priority Order for Implementation

1. **Students** - Need students before results
2. **Teachers** - Need teachers to create results
3. **Results** - Core feature
4. **Scoresheets** - Link results to students
5. **SubjectScores** - Actual score entry
6. **Derived Metrics** - Make scores meaningful
7. **Report Card** - The output
8. **Settings** - Configure patterns
9. **Auth/Permissions** - Security
10. **UI/Pages** - The interface
