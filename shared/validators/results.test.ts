import { describe, expect, it } from "vitest"

import {
  AddSubjectScoreSchema,
  BulkUpdateSubjectScoresSchema,
  CreateResultSchema,
  ScoreConfigSnapshotSchema,
  UpdateSubjectScoreSchema
} from "./results"

describe("ScoreConfigSnapshotSchema", () => {
  const VALID = { caCount: 3, caMaxScores: [10, 10, 10], examMax: 70 }

  it("accepts CA maxima matching caCount that sum to 100 with examMax", () => {
    expect(ScoreConfigSnapshotSchema.safeParse(VALID).success).toBe(true)
  })

  it("accepts a single CA slot", () => {
    expect(
      ScoreConfigSnapshotSchema.safeParse({ caCount: 1, caMaxScores: [40], examMax: 60 }).success
    ).toBe(true)
  })

  it("rejects a caMaxScores length that does not match caCount", () => {
    expect(ScoreConfigSnapshotSchema.safeParse({ ...VALID, caMaxScores: [10, 10] }).success).toBe(
      false
    )
  })

  it("rejects CA maxima + exam not summing to 100", () => {
    expect(ScoreConfigSnapshotSchema.safeParse({ ...VALID, examMax: 80 }).success).toBe(false)
  })

  it("rejects more than five CA slots", () => {
    const result = ScoreConfigSnapshotSchema.safeParse({
      caCount: 6,
      caMaxScores: [10, 10, 10, 10, 10, 10],
      examMax: 40
    })
    expect(result.success).toBe(false)
  })
})

describe("UpdateSubjectScoreSchema", () => {
  it("accepts id, caScores and exam together", () => {
    expect(
      UpdateSubjectScoreSchema.safeParse({ id: "ssc_1", caScores: [10, null, 7], exam: 55 }).success
    ).toBe(true)
  })

  it("accepts a null exam", () => {
    expect(
      UpdateSubjectScoreSchema.safeParse({ id: "ssc_1", caScores: [10], exam: null }).success
    ).toBe(true)
  })

  it("requires id", () => {
    expect(UpdateSubjectScoreSchema.safeParse({ caScores: [10], exam: 5 }).success).toBe(false)
  })

  it("rejects a negative exam (audit #13)", () => {
    const result = UpdateSubjectScoreSchema.safeParse({ id: "ssc_1", caScores: [10], exam: -1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "exam")).toBe(true)
    }
  })

  // Partial updates are supported: either field may be omitted (audit #17).
  it("accepts a partial entry with only exam", () => {
    expect(UpdateSubjectScoreSchema.safeParse({ id: "ssc_1", exam: 5 }).success).toBe(true)
  })

  it("accepts a partial entry with only caScores", () => {
    expect(UpdateSubjectScoreSchema.safeParse({ id: "ssc_1", caScores: [10] }).success).toBe(true)
  })

  it("rejects an entry with neither caScores nor exam", () => {
    expect(UpdateSubjectScoreSchema.safeParse({ id: "ssc_1" }).success).toBe(false)
  })
})

describe("BulkUpdateSubjectScoresSchema", () => {
  const ENTRY = { id: "ssc_1", caScores: [10], exam: 5 }

  it("accepts a scoresheet id with at least one score entry", () => {
    expect(
      BulkUpdateSubjectScoresSchema.safeParse({ scoresheetId: "sheet_1", scores: [ENTRY] }).success
    ).toBe(true)
  })

  it("requires scoresheetId", () => {
    expect(BulkUpdateSubjectScoresSchema.safeParse({ scores: [ENTRY] }).success).toBe(false)
  })

  it("rejects an empty scores array", () => {
    expect(
      BulkUpdateSubjectScoresSchema.safeParse({ scoresheetId: "sheet_1", scores: [] }).success
    ).toBe(false)
  })

  it("rejects a negative exam on any entry", () => {
    const result = BulkUpdateSubjectScoresSchema.safeParse({
      scoresheetId: "sheet_1",
      scores: [{ ...ENTRY, exam: -3 }]
    })
    expect(result.success).toBe(false)
  })

  it("rejects an entry without an id", () => {
    expect(
      BulkUpdateSubjectScoresSchema.safeParse({
        scoresheetId: "sheet_1",
        scores: [{ caScores: [10], exam: 5 }]
      }).success
    ).toBe(false)
  })

  // Partial entries are supported per field (audit #17).
  it("accepts an entry with only exam", () => {
    expect(
      BulkUpdateSubjectScoresSchema.safeParse({
        scoresheetId: "sheet_1",
        scores: [{ id: "ssc_1", exam: 5 }]
      }).success
    ).toBe(true)
  })

  it("accepts an entry with only caScores", () => {
    expect(
      BulkUpdateSubjectScoresSchema.safeParse({
        scoresheetId: "sheet_1",
        scores: [{ id: "ssc_1", caScores: [10] }]
      }).success
    ).toBe(true)
  })

  it("rejects an entry with neither caScores nor exam", () => {
    expect(
      BulkUpdateSubjectScoresSchema.safeParse({
        scoresheetId: "sheet_1",
        scores: [{ id: "ssc_1" }]
      }).success
    ).toBe(false)
  })
})

describe("CreateResultSchema", () => {
  it("accepts only a termId and classId", () => {
    expect(CreateResultSchema.safeParse({ termId: "term_1", classId: "class_1" }).success).toBe(
      true
    )
  })

  it("requires classId", () => {
    expect(CreateResultSchema.safeParse({ termId: "term_1" }).success).toBe(false)
  })

  it("requires termId", () => {
    expect(CreateResultSchema.safeParse({ classId: "class_1" }).success).toBe(false)
  })

  it("rejects blank identifiers", () => {
    expect(CreateResultSchema.safeParse({ termId: "", classId: "class_1" }).success).toBe(false)
    expect(CreateResultSchema.safeParse({ termId: "term_1", classId: "" }).success).toBe(false)
  })
})

describe("AddSubjectScoreSchema", () => {
  it("accepts a scoresheetId on its own", () => {
    expect(AddSubjectScoreSchema.safeParse({ scoresheetId: "sheet_1" }).success).toBe(true)
  })

  it("accepts an optional subjectId", () => {
    expect(
      AddSubjectScoreSchema.safeParse({ scoresheetId: "sheet_1", subjectId: "subject_1" }).success
    ).toBe(true)
  })

  it("requires scoresheetId", () => {
    expect(AddSubjectScoreSchema.safeParse({ subjectId: "subject_1" }).success).toBe(false)
  })

  it("rejects a blank subjectId when provided", () => {
    expect(
      AddSubjectScoreSchema.safeParse({ scoresheetId: "sheet_1", subjectId: "" }).success
    ).toBe(false)
  })
})
