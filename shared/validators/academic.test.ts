import { describe, expect, it } from "vitest"

import {
  UpdateAcademicSessionSchema,
  UpdateSubjectListSchema,
  UpsertAcademicSessionSchema,
  UpsertStudentSchema,
  UpsertSubjectSchema
} from "./academic"

describe("UpsertStudentSchema", () => {
  it("accepts a name and classId with everything else omitted", () => {
    expect(UpsertStudentSchema.safeParse({ name: "Ada", classId: "class_1" }).success).toBe(true)
  })

  it("accepts an 11-digit phone number", () => {
    expect(
      UpsertStudentSchema.safeParse({ name: "Ada", classId: "class_1", phoneNumber: "08012345678" })
        .success
    ).toBe(true)
  })

  it("rejects a phone number that is not exactly 11 digits", () => {
    expect(
      UpsertStudentSchema.safeParse({ name: "Ada", classId: "class_1", phoneNumber: "123" }).success
    ).toBe(false)
  })

  it("accepts a null phone number", () => {
    expect(
      UpsertStudentSchema.safeParse({ name: "Ada", classId: "class_1", phoneNumber: null }).success
    ).toBe(true)
  })

  it("requires name", () => {
    expect(UpsertStudentSchema.safeParse({ classId: "class_1" }).success).toBe(false)
  })

  it("requires classId", () => {
    expect(UpsertStudentSchema.safeParse({ name: "Ada" }).success).toBe(false)
  })

  it("keeps studentId optional but accepts it when provided", () => {
    const result = UpsertStudentSchema.safeParse({
      name: "Ada",
      classId: "class_1",
      studentId: "STU-001"
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.studentId).toBe("STU-001")
    }
  })
})

describe("UpsertSubjectSchema", () => {
  it("accepts a name with at least one tag", () => {
    expect(UpsertSubjectSchema.safeParse({ name: "Mathematics", tags: ["Science"] }).success).toBe(
      true
    )
  })

  it("rejects an empty tag list", () => {
    expect(UpsertSubjectSchema.safeParse({ name: "Mathematics", tags: [] }).success).toBe(false)
  })

  it("requires name", () => {
    expect(UpsertSubjectSchema.safeParse({ tags: ["Science"] }).success).toBe(false)
  })
})

describe("UpdateSubjectListSchema", () => {
  it("accepts an id and name with subjects omitted", () => {
    expect(
      UpdateSubjectListSchema.safeParse({ id: "subprst_1", name: "Junior Science" }).success
    ).toBe(true)
  })

  it("accepts a list of { id, name } subjects", () => {
    expect(
      UpdateSubjectListSchema.safeParse({
        id: "subprst_1",
        name: "Junior Science",
        subjects: [{ id: "subject_1", name: "Basic Science" }]
      }).success
    ).toBe(true)
  })

  it("rejects an empty subjects array when provided", () => {
    expect(
      UpdateSubjectListSchema.safeParse({ id: "subprst_1", name: "Junior Science", subjects: [] })
        .success
    ).toBe(false)
  })

  it("rejects subjects with the wrong shape", () => {
    expect(
      UpdateSubjectListSchema.safeParse({
        id: "subprst_1",
        name: "Junior Science",
        subjects: [{ id: "subject_1" }]
      }).success
    ).toBe(false)
  })

  it("requires id", () => {
    expect(UpdateSubjectListSchema.safeParse({ name: "Junior Science" }).success).toBe(false)
  })

  it("requires name", () => {
    expect(UpdateSubjectListSchema.safeParse({ id: "subprst_1" }).success).toBe(false)
  })
})

describe("UpsertAcademicSessionSchema", () => {
  it("accepts just a name", () => {
    expect(UpsertAcademicSessionSchema.safeParse({ name: "2024/2025" }).success).toBe(true)
  })

  it("requires name", () => {
    expect(UpsertAcademicSessionSchema.safeParse({}).success).toBe(false)
  })
})

describe("UpdateAcademicSessionSchema", () => {
  it("accepts an id and name", () => {
    expect(UpdateAcademicSessionSchema.safeParse({ id: "aca_1", name: "2025/2026" }).success).toBe(
      true
    )
  })

  it("requires id", () => {
    expect(UpdateAcademicSessionSchema.safeParse({ name: "2025/2026" }).success).toBe(false)
  })
})
