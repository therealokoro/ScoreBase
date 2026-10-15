import type { Cell, CellStyle, WriteSheet } from "hucre/xlsx"
import { describe, expect, it } from "vitest"

import {
  REPORT_CARD_PLACEHOLDER,
  type ReportCardView
} from "~/components/ReportCard/blocks/placeholder"

import {
  buildReportCardSheet,
  buildReportCardXlsx,
  safeFileName,
  xlsxBlob
} from "./report-card-export"

/** Rows may hold a bare value or a `{ value, style }` cell. */
function cellIn(sheet: WriteSheet, row: number, column: number): Cell | undefined {
  return sheet.rows?.[row]?.[column] as Cell | undefined
}

function valueIn(sheet: WriteSheet, row: number, column: number): unknown {
  const entry = cellIn(sheet, row, column)
  return entry && typeof entry === "object" && "value" in entry ? entry.value : entry
}

function styleIn(sheet: WriteSheet, row: number, column: number): CellStyle | undefined {
  const entry = cellIn(sheet, row, column)
  return entry && typeof entry === "object" && "style" in entry ? entry.style : undefined
}

function fillIn(sheet: WriteSheet, row: number, column: number): string | undefined {
  const fill = styleIn(sheet, row, column)?.fill
  return fill?.type === "pattern" && "fgColor" in fill ? fill.fgColor?.rgb : undefined
}

/** Row index of the score table's header ("Subject" in the first column). */
function headerRowOf(sheet: WriteSheet): number {
  return (sheet.rows ?? []).findIndex((_, index) => valueIn(sheet, index, 0) === "Subject")
}

const sheet = buildReportCardSheet(REPORT_CARD_PLACEHOLDER, { schoolName: "Test Academy" })
const headerRow = headerRowOf(sheet)

describe("buildReportCardSheet", () => {
  it("titles the sheet and spans the title across every column", () => {
    expect(valueIn(sheet, 0, 0)).toBe("Test Academy")
    expect(styleIn(sheet, 0, 0)?.font).toMatchObject({ bold: true, size: 14 })
    expect(styleIn(sheet, 0, 0)?.alignment?.horizontal).toBe("center")
    expect(valueIn(sheet, 1, 0)).toBe("First Term Result — 2027/2028 Session")

    const width = sheet.columns?.length ?? 0
    expect(sheet.merges).toEqual(
      expect.arrayContaining([
        { startRow: 0, startCol: 0, endRow: 0, endCol: width - 1 },
        { startRow: 1, startCol: 0, endRow: 1, endCol: width - 1 }
      ])
    )
  })

  it("lays the student details out as label/value pairs", () => {
    const width = sheet.columns?.length ?? 0
    // Two label/value pairs per row: the right-hand label sits past the left value's merged run.
    const rightLabel = Math.floor((width - 2) / 2) + 1
    const labels = [3, 4, 5, 6].flatMap((row) => [
      valueIn(sheet, row, 0),
      valueIn(sheet, row, rightLabel)
    ])

    expect(labels).toEqual([
      "Session",
      "Term",
      "Student ID",
      "Name",
      "Class",
      "No. In Class",
      "Average",
      "Position"
    ])
    // The label is bold on a tint, and the value sits in a bordered cell across a merged run.
    expect(styleIn(sheet, 3, 0)?.font?.bold).toBe(true)
    expect(fillIn(sheet, 3, 0)).toBe("F1F3F5")
    expect(styleIn(sheet, 3, 1)?.border?.top).toBeDefined()
    expect(valueIn(sheet, 3, 1)).toBe("2027/2028 Session")
  })

  it("heads the score table with the configured maximums on a dark header", () => {
    expect(sheet.rows?.[headerRow]?.length).toBe(sheet.columns?.length)
    expect(valueIn(sheet, headerRow, 0)).toBe("Subject")
    expect(valueIn(sheet, headerRow, 1)).toBe("Assessment 1 (20)")
    expect(valueIn(sheet, headerRow, 4)).toBe("CA Total (60)")
    expect(valueIn(sheet, headerRow, 5)).toBe("Term Exam (40)")
    expect(valueIn(sheet, headerRow, 6)).toBe("Term Total (100)")

    expect(styleIn(sheet, headerRow, 0)?.font).toMatchObject({ bold: true })
    expect(styleIn(sheet, headerRow, 0)?.font?.color?.rgb).toBe("FFFFFF")
    expect(fillIn(sheet, headerRow, 0)).toBe("1F2937")
  })

  it("writes the scores as real numbers so Excel can total them", () => {
    const first = headerRow + 1
    expect(valueIn(sheet, first, 0)).toBe("Mathematics")
    expect(valueIn(sheet, first, 1)).toBe(18)
    expect(valueIn(sheet, first, 4)).toBe(50)
    expect(valueIn(sheet, first, 6)).toBe(88)
    expect(valueIn(sheet, first, 7)).toBe("A")

    expect(styleIn(sheet, first, 1)?.numFmt).toBe("0")
    // Class average and the student's own average are numbers shown as percentages.
    expect(valueIn(sheet, first, 8)).toBeCloseTo(67.5)
    expect(styleIn(sheet, first, 8)?.numFmt).toBe('0.00"%"')
    expect(valueIn(sheet, first, 9)).toBe("1st")
    expect(valueIn(sheet, first, 10)).toBe("Excellent")
  })

  it("keeps the header visible and sets the sheet up for A4 landscape printing", () => {
    expect(sheet.freezePane).toEqual({ rows: headerRow + 1, columns: 1 })
    expect(sheet.pageSetup).toMatchObject({
      paperSize: "a4",
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1
    })
    expect(sheet.columns?.[0]?.width).toBe(30)
  })

  it("prints a dash for a missing score instead of a zero", () => {
    const view: ReportCardView = {
      ...REPORT_CARD_PLACEHOLDER,
      subjectRows: [
        {
          id: "r1",
          subjectId: "ph-sub-1",
          subjectName: "Physics",
          caScores: [10, null, 10],
          caTotal: null,
          exam: null,
          total: null,
          grade: "",
          remark: ""
        }
      ]
    }

    const partial = buildReportCardSheet(view)
    const row = headerRowOf(partial) + 1

    expect(valueIn(partial, row, 0)).toBe("Physics")
    expect(valueIn(partial, row, 2)).toBe("—")
    expect(valueIn(partial, row, 5)).toBe("—")
    expect(valueIn(partial, row, 6)).toBe("—")
    expect(valueIn(partial, row, 9)).toBe("—")
  })
})

describe("buildReportCardXlsx", () => {
  it("returns a real xlsx workbook", async () => {
    const bytes = await buildReportCardXlsx(REPORT_CARD_PLACEHOLDER, {
      schoolName: "Test Academy"
    })

    expect(bytes).toBeInstanceOf(Uint8Array)
    // Every xlsx is a zip container.
    expect(String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0)).toBe("PK")
    expect(bytes.byteLength).toBeGreaterThan(2000)
  })

  it("reads back with the sheet's content and merges intact", async () => {
    const { readXlsx } = await import("hucre/xlsx")
    const bytes = await buildReportCardXlsx(REPORT_CARD_PLACEHOLDER, {
      schoolName: "Test Academy"
    })
    const workbook = await readXlsx(bytes)
    const result = workbook.sheets[0]
    if (!result) throw new Error("no sheet written")

    expect(result.name).toBe("Result")
    // The read model is a dense rectangle of values; styles are asserted on the write model.
    const values = result.rows ?? []
    expect(values[0]?.[0]).toBe("Test Academy")
    expect(values[3]).toEqual(
      expect.arrayContaining(["Session", "2027/2028 Session", "Term", "First Term"])
    )
    expect(values[headerRow]?.slice(0, 7)).toEqual([
      "Subject",
      "Assessment 1 (20)",
      "Assessment 2 (20)",
      "Assessment 3 (20)",
      "CA Total (60)",
      "Term Exam (40)",
      "Term Total (100)"
    ])
    expect(values[headerRow + 1]?.slice(0, 8)).toEqual(["Mathematics", 18, 17, 15, 50, 38, 88, "A"])

    // The title spans the full width.
    expect((result.merges ?? []).some((merge) => merge.endCol === 10 && merge.startRow === 0)).toBe(
      true
    )
  })
})

describe("xlsxBlob", () => {
  it("wraps the workbook bytes with the spreadsheet mime type", async () => {
    const bytes = await buildReportCardXlsx(REPORT_CARD_PLACEHOLDER, { schoolName: "Test Academy" })
    const blob = xlsxBlob(bytes)

    expect(blob.type).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    expect(blob.size).toBe(bytes.byteLength)
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
