import { describe, expect, it } from "vitest"

import {
  REPORT_CARD_PLACEHOLDER,
  type ReportCardView
} from "~/components/ReportCard/blocks/placeholder"

import { buildReportCardCsv, safeFileName } from "./report-card-export"

describe("buildReportCardCsv", () => {
  const csv = buildReportCardCsv(REPORT_CARD_PLACEHOLDER)
  const lines = csv.split("\r\n")

  it("starts with the student's result header", () => {
    expect(lines.slice(0, 8)).toEqual([
      "Session,2027/2028 Session",
      "Term,First Term",
      "Student ID,STU-2026-0010",
      "Name,Chibuike Idris",
      "Class,JSS 1",
      "No. In Class,32",
      "Average,77.33%",
      "Position,2nd"
    ])
  })

  it("heads the score table with the configured maximums", () => {
    expect(lines[9]).toBe(
      "Subject,Assessment 1 (20),Assessment 2 (20),Assessment 3 (20),CA Total (60)," +
        "Term Exam (40),Term Total (100),Grade,Class Average,Subject Position,Remarks"
    )
  })

  it("writes one row per subject with the card's class average and subject position", () => {
    expect(lines[10]).toBe("Mathematics,18,17,15,50,38,88,A,67.50%,1st,Excellent")
    expect(lines[11]).toBe("English Language,15,14,12,41,35,76,A,63.00%,1st,Excellent")
    expect(lines[12]).toBe("Basic Science,12,10,11,33,35,68,B,57.67%,1st,Very Good")
  })

  it("ends with the class teacher's comment", () => {
    expect(lines.at(-1)).toBe("Class Teacher's Comment,A diligent and focused student.")
  })

  it("leaves a blank line between the sections", () => {
    expect(lines[8]).toBe("")
    expect(lines[13]).toBe("")
  })

  it("quotes values containing commas, quotes or newlines", () => {
    const view: ReportCardView = {
      ...REPORT_CARD_PLACEHOLDER,
      studentName: 'Ada "The Ace", Jr',
      subjectRows: [
        {
          id: "r1",
          subjectId: "ph-sub-1",
          subjectName: "Physics, Further",
          caScores: [1, 2, 3],
          caTotal: 6,
          exam: 30,
          total: 36,
          grade: "C",
          remark: "Needs\nwork"
        }
      ]
    }

    const out = buildReportCardCsv(view).split("\r\n")
    expect(out[3]).toBe('Name,"Ada ""The Ace"", Jr"')
    expect(out[10]).toContain('"Physics, Further"')
    expect(out[10]).toContain('"Needs\nwork"')
  })
})

describe("safeFileName", () => {
  it("strips the characters a filesystem rejects", () => {
    expect(safeFileName("Adewumi's 2025/2026 3rd Term Result")).toBe(
      "Adewumi's 2025-2026 3rd Term Result"
    )
    expect(safeFileName('Bad: name*with?chars<>|"')).toBe("Bad- name-with-chars")
  })
})
