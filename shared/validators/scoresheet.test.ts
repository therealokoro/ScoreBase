import { describe, expect, it } from "vitest"

import { CreateScoresheetsSchema, UpdateScoresheetRemarksSchema } from "./scoresheet"

describe("CreateScoresheetsSchema", () => {
  it("accepts a resultId with one or more student ids", () => {
    expect(
      CreateScoresheetsSchema.safeParse({ resultId: "result_1", studentIds: ["stu_1", "stu_2"] })
        .success
    ).toBe(true)
  })

  it("requires resultId", () => {
    expect(CreateScoresheetsSchema.safeParse({ studentIds: ["stu_1"] }).success).toBe(false)
  })

  it("rejects an empty studentIds array", () => {
    expect(
      CreateScoresheetsSchema.safeParse({ resultId: "result_1", studentIds: [] }).success
    ).toBe(false)
  })

  it("rejects blank student ids", () => {
    expect(
      CreateScoresheetsSchema.safeParse({ resultId: "result_1", studentIds: [""] }).success
    ).toBe(false)
  })
})

describe("UpdateScoresheetRemarksSchema", () => {
  it("accepts an id on its own", () => {
    expect(UpdateScoresheetRemarksSchema.safeParse({ id: "sheet_1" }).success).toBe(true)
  })

  it("accepts teacher and principal remarks", () => {
    expect(
      UpdateScoresheetRemarksSchema.safeParse({
        id: "sheet_1",
        teacherRemark: "Good progress",
        principalRemark: "Keep it up"
      }).success
    ).toBe(true)
  })

  it("accepts null remarks", () => {
    expect(
      UpdateScoresheetRemarksSchema.safeParse({
        id: "sheet_1",
        teacherRemark: null,
        principalRemark: null
      }).success
    ).toBe(true)
  })

  it("rejects a remark longer than 500 characters", () => {
    expect(
      UpdateScoresheetRemarksSchema.safeParse({ id: "sheet_1", teacherRemark: "a".repeat(501) })
        .success
    ).toBe(false)
  })

  it("requires id", () => {
    expect(
      UpdateScoresheetRemarksSchema.safeParse({ teacherRemark: "Good progress" }).success
    ).toBe(false)
  })
})
