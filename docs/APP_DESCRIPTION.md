Here's the rewritten document — professional, structured, and agent-friendly (clear enough for an AI agent to parse roles, rules, and relationships unambiguously):

---

# ScoreBase - A Nigerian Secondary School Result Management System — Product Requirements Document (PRD)

---

## 1. Overview

A web-based result management platform purpose-built for Nigerian secondary schools. It enables school administrators and teachers to create, manage, and publish student academic results with configurable grading systems, printable report cards, and role-based access control.

---

## 2. Roles & Permissions

### 2.1 Admin

The Admin has system-wide authority. They can perform all operations available to Teachers in addition to the following exclusive capabilities:

- Full CRUD on: Academic Sessions, Terms, Classes, Subjects, Teachers, and Students
- Create, review, approve, and publish Results (including those created by Teachers)
- Approve or decline Teacher-proposed result edits
- Promote or demote students between classes
- Configure school-wide settings (grading system, report card layout, student ID pattern, score distribution, etc.)

### 2.2 Teacher

Teachers are scoped to their assigned class only:

- CRUD on Students within their assigned class
- CRUD on Results for their assigned class
- Propose edits to published results (subject to Admin approval)
- Manage subject offerings per student scoresheet (add/remove subjects)

---

## 3. Core Entities & Relationships

```
Session (e.g. 2025/2026)
  └── Term [max 3 per Session] (e.g. 1st Term)
        └── Result [max 1 per Term]
              └── Scoresheet [1 per Student]
                    └── SubjectScore [1 per Subject offered]
                          ├── CA1 Score
                          ├── CA2 Score
                          ├── CA3 Score (Could be cummulative)
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
- Admin creates subject lists which are basically presets of subjects offerrable by a student.
- Admin can assign a subject-list preset to a class, so any student assigned to that class automatically gets assigned those subjects during subject scoring per term

### 4.5 Student Management

- Admin or assigned Class Teacher manages student records.
- Student record fields: **Full Name**, **Student ID**, **Class**, **Phone Number (optional)**.
- Student ID follows a configurable pattern (e.g. `STU/2025/001`).

### 4.6 Teacher Management

- Admin creates teacher accounts.
- **Auto-generated credentials on creation:**
  - `username`: derived from name (e.g. `John Doe` → `jdoe`)(POST MVP)
  - `password`: derived from name + phone number (e.g. `john-08133342323`)
- Teachers can update their credentials from their dashboard.
- Teachers are assigned to one class each.

### 4.7 Result Management

#### Result Lifecycle:

```
Draft → Submitted (by Teacher) → Reviewed → Approved/Published (by Admin)
       └── Edit Proposed (by Teacher) → Approved/Declined (by Admin)
```

#### Scoresheet:

- Created per student within a Result.
- Pre-populated with the **class's preset subjects** on creation.
- Teacher can **add or remove subjects** from individual student scoresheets.
- Score fields: CA1, CA2, CA3 (configurable), Exam — each bounded by term parameters.

#### Derived Metrics (calculated on the fly; cached until dependencies change):

- **Total Score** per subject = sum of all CA scores + Exam score
- **Overall Score** = sum of all subject totals
- **Average Score** = Overall Score ÷ Number of Subjects
- **Class Position** = rank by Average Score (ties share the same position)
- **Subject Grade** = mapped from Total Score using configurable grading scale

> **Design Decision — Derived Data Storage:**
> Derived metrics (grade, average, position) are computed on the fly at report card load time and cached until any dependent score changes. They are **not stored persistently** in the database. This avoids stale data and reduces storage complexity while maintaining performance via caching.

---

## 5. Report Card

### 5.1 Contents

| Field          | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| Student Info   | Name, Class, Student ID, Session, Term                                      |
| Subject Scores | CA1, CA2, CA3, Exam, Total — one row per subject                            |
| Subject Grade  | Derived from configurable grading scale (e.g. A–F or Excellent/V.Good/Poor) |
| Overall Score  | Total score obtained / Total score obtainable                               |
| Average Score  | Used to determine class position                                            |
| Class Position | Configurable display (e.g. show all, or top 3 only)                         |
| Remarks        | Teacher's and/or Principal's comments                                       |

### 5.2 Configurable Options

- Grading scale (e.g. `A, B, C, D, F` or `Excellent, Very Good, Good, Poor, Fail`)
- Position display rules (e.g. show position only for top 3)
- Report card layout/template
- School information (name, logo, address)

### 5.3 Output

- **Print-optimized CSS view** for browser printing
- **Exportable to PDF**

---

## 6. System Configuration (Admin)

| Setting            | Description                                 |
| ------------------ | ------------------------------------------- |
| Grading System     | Define grade boundaries and labels          |
| Score Distribution | Set CA and Exam weights per term            |
| Student ID Pattern | Configurable format (e.g. `STU/YYYY/###`)   |
| Position Display   | Set which positions to show on report cards |
| Report Card Layout | Choose or customize layout template         |
| School Info        | Name, logo, motto, address                  |
| Subject Tags       | Manage available subject category tags      |

---

## 7. Authentication & Authorization

- Auth library: **Better Auth**
- Strategies: Email/Password, Username, Admin plugin
- Role-based access: `admin` and `teacher` roles with scoped permissions
- Teachers log in with auto-generated or self-updated credentials

---

## 8. Tech Stack

| Layer                | Technology                                             |
| -------------------- | ------------------------------------------------------ |
| Frontend Framework   | Vue 3, Nuxt 4, TypeScript                              |
| Styling              | TailwindCSS v4                                         |
| Data Fetching        | TanStack Vue Query                                     |
| UI Components        | Shadcn Vue (Reka UI)                                   |
| Backend              | Nitro (via Nuxt 4 `/server` directory)                 |
| ORM                  | Drizzle ORM                                            |
| API Layer            | oRPC                                                   |
| Database             | SQLite via NuxtHub v0.10                               |
| Authentication       | Better Auth (email/password + username + admin plugin) |
| Dev Seeding          | Faker.js                                               |
| Package Manager      | PNPM                                                   |
| Linting & Formatting | Oxlint, Oxfmt                                          |

---

## 9. Key Business Rules

1. A Session has a maximum of **3 Terms**. The 1st Term is auto-created with the session.
2. Each Term has a maximum of **1 Result**.
3. Each Result has **1 Scoresheet per enrolled student**.
4. A Scoresheet's subjects are pre-populated from the **class preset** and can be individually adjusted per student.
5. Score distribution across CAs and Exam must always **total 100** per subject.
6. **Two students with the same average share the same class position.**
7. Teachers are **scoped strictly to their assigned class** — they cannot view or edit data outside their scope.
8. **Only the Admin can approve, publish, or decline** result edits proposed by teachers.
9. Auto-generated teacher credentials follow deterministic rules based on **name and phone number**.
10. Derived metrics are **never stored** — always computed from raw scores and cached.
