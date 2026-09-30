import { describe, expect, it } from "vitest"

import { REPORT_CARD_PLACEHOLDER, resolveView } from "./placeholder"
import { textStyle } from "./text"

describe("textStyle", () => {
  it("maps a TextStyle to inline CSS", () => {
    expect(
      textStyle({ fontSize: 18, fontWeight: "bold", color: "#ff0000", align: "center" })
    ).toEqual({
      fontSize: "18px",
      fontWeight: "bold",
      color: "#ff0000",
      textAlign: "center"
    })
  })

  it("passes 'normal' weight through unchanged", () => {
    expect(
      textStyle({ fontSize: 12, fontWeight: "normal", color: "#000000", align: "left" }).fontWeight
    ).toBe("normal")
  })
})

describe("resolveView", () => {
  it("returns the placeholder when there is no data", () => {
    expect(resolveView(null)).toBe(REPORT_CARD_PLACEHOLDER)
    expect(resolveView()).toBe(REPORT_CARD_PLACEHOLDER)
  })

  it("normalises real data into the flat view shape", () => {
    const view = resolveView({
      computed: {
        studentName: "Ada Obi",
        studentSchoolId: "STU-1",
        subjectRows: [],
        grandTotal: 90,
        subjectCount: 2,
        average: 45,
        position: "1st",
        positionRank: 1
      },
      class: { name: "JSS 2" },
      term: { name: "Second Term", session: { name: "2027/2028 Session" } },
      scoreConfig: { caCount: 2, caMaxScores: [10, 10], examMax: 80 },
      teacherRemark: "Good",
      principalRemark: null,
      totalStudents: 20,
      allStudentTotals: [90]
    } as never)

    expect(view).toEqual({
      studentName: "Ada Obi",
      studentSchoolId: "STU-1",
      className: "JSS 2",
      sessionName: "2027/2028 Session",
      termName: "Second Term",
      subjectRows: [],
      scoreConfig: { caCount: 2, caMaxScores: [10, 10], examMax: 80 },
      grandTotal: 90,
      average: 45,
      position: "1st",
      totalStudents: 20,
      subjectCount: 2,
      teacherRemark: "Good",
      principalRemark: null,
      allStudentTotals: [90]
    })
  })

  it("keeps the placeholder score config summing to 100", () => {
    const config = REPORT_CARD_PLACEHOLDER.scoreConfig
    expect(config.caMaxScores.reduce((sum, max) => sum + max, 0) + config.examMax).toBe(100)
  })
})
