import type { Color } from "hucre"
import { writeXlsx } from "hucre/xlsx"
import type { CellStyle, ColumnDef, WriteSheet } from "hucre/xlsx"
import { subjectClassAverage, subjectClassRank, toOrdinal } from "~~/shared/utils/report-card"

import type { ReportCardView } from "~/components/ReportCard/blocks/placeholder"

// ---------------------------------------------------------------------------
// Report card spreadsheet
//
// `hucre` writes the .xlsx (zero dependencies, ESM, tree-shakeable). Colours are
// { rgb } objects without the leading '#'.
// ---------------------------------------------------------------------------

const INK: Color = { rgb: "1F2933" }
const MUTED: Color = { rgb: "616E7C" }
const HEADER_BG: Color = { rgb: "1F2937" }
const LABEL_BG: Color = { rgb: "F1F3F5" }
const STRIPE_BG: Color = { rgb: "FAFBFC" }
const RULE: Color = { rgb: "AEB7C2" }

const THIN = { style: "thin" as const, color: RULE }
const BOX: CellStyle["border"] = { top: THIN, right: THIN, bottom: THIN, left: THIN }

/** A number that Excel can still sum, shown as a whole number. */
const INTEGER_FMT = "0"
/** E.g. 67.5 -> "67.50%" without turning the value into text. */
const PERCENT_FMT = '0.00"%"'

type SheetCell = string | number | null | { value: string | number | null; style?: CellStyle }

const text = (value: string | number | null, style?: CellStyle): SheetCell => ({ value, style })

/** The subtle zebra fill for a body row (the subject column is tinted on every row). */
const striping = (index: number): CellStyle["fill"] => ({
  type: "pattern",
  pattern: "solid",
  fgColor: index % 2 === 1 ? STRIPE_BG : LABEL_BG
})

/** A solid fill for one colour. */
const solid = (color: Color): CellStyle["fill"] => ({
  type: "pattern",
  pattern: "solid",
  fgColor: color
})

/** The label cell of a detail pair: bold, muted, on a tint. */
function detailLabel(label: string): SheetCell {
  return text(label, {
    font: { bold: true, color: MUTED, size: 10 },
    fill: solid(LABEL_BG),
    border: BOX,
    alignment: { vertical: "center" }
  })
}

/** The value cell of a detail pair; numbers keep a number format so they stay real values. */
function detailValue(value: string | number | null, numFmt?: string): SheetCell {
  return text(value, {
    font: { color: INK, size: 10 },
    border: BOX,
    alignment: { vertical: "center" },
    ...(numFmt ? { numFmt } : {})
  })
}

/** A filename-safe version of a title: strips the characters filesystems reject. */
export function safeFileName(title: string): string {
  return (
    title
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/-+/g, "-")
      // Windows also rejects a name that ends in a space or a dot.
      .replace(/^[-.\s]+|[-.\s]+$/g, "")
  )
}

export interface ReportCardSheetOptions {
  /** Shown as the sheet's title, from the template's school-info block. */
  schoolName?: string
  /** Title colour, from the template's school-name style. */
  accentColor?: string
}

/** Hucre wants "RRGGBB"; the template stores "#RRGGBB". */
function toColor(hex: string | undefined, fallback: Color): Color {
  if (!hex) return fallback
  const rgb = hex.replace(/^#/, "")
  return /^[0-9a-fA-F]{6}$/.test(rgb) ? { rgb: rgb.toUpperCase() } : fallback
}

/**
 * Builds the single worksheet: a titled header, the student's details as a bordered grid, the
 * subject scores (real numbers, so Excel can total them) and the class teacher's comment. Column
 * widths, frozen panes and A4-landscape page setup make it presentable as-is.
 */
export function buildReportCardSheet(
  view: ReportCardView,
  options: ReportCardSheetOptions = {}
): WriteSheet {
  const { caCount, caMaxScores, examMax } = view.scoreConfig
  const caTotalMax = caMaxScores.reduce((sum, max) => sum + max, 0)
  const termTotalMax = caTotalMax + examMax

  const columns: ColumnDef[] = [
    { width: 30 }, // Subject
    ...Array.from({ length: caCount }, () => ({ width: 9 })),
    { width: 10 }, // CA total
    { width: 10 }, // Term exam
    { width: 11 }, // Term total
    { width: 8 }, // Grade
    { width: 13 }, // Class average
    { width: 14 }, // Subject position
    { width: 18 } // Remarks
  ]
  const width = columns.length
  /** Split point for the two label/value pairs on a detail row. */
  const mid = Math.floor((width - 2) / 2)

  const accent = toColor(options.accentColor, { rgb: "CC0000" })
  const rows: SheetCell[][] = []
  const merges: { startRow: number; startCol: number; endRow: number; endCol: number }[] = []

  // ----- Title -----
  const titleRow = rows.length
  rows.push([
    text(options.schoolName ?? "Report Card", {
      font: { bold: true, size: 14, color: accent },
      alignment: { horizontal: "center", vertical: "center" }
    })
  ])
  merges.push({ startRow: titleRow, startCol: 0, endRow: titleRow, endCol: width - 1 })

  const subtitleRow = rows.length
  rows.push([
    text(`${view.termName} Result — ${view.sessionName}`, {
      font: { size: 10, color: MUTED },
      alignment: { horizontal: "center", vertical: "center" }
    })
  ])
  merges.push({ startRow: subtitleRow, startCol: 0, endRow: subtitleRow, endCol: width - 1 })

  // ----- Details (two label/value pairs per row) -----
  rows.push([])

  const details: [string, string | number | null, string?][] = [
    ["Session", view.sessionName],
    ["Term", view.termName],
    ["Student ID", view.studentSchoolId],
    ["Name", view.studentName],
    ["Class", view.className],
    ["No. In Class", view.totalStudents],
    ["Average", view.average, PERCENT_FMT],
    ["Position", view.position || "—"]
  ]

  for (let pair = 0; pair < details.length; pair += 2) {
    const rowIndex = rows.length
    // Cells sit at their real column indices; the merged runs stay empty in between.
    const row: SheetCell[] = Array.from({ length: width }, () => "")
    const left = details[pair]
    const right = details[pair + 1]

    if (left) {
      row[0] = detailLabel(left[0])
      row[1] = detailValue(left[1], left[2])
      // The value spans the rest of the left half.
      merges.push({ startRow: rowIndex, startCol: 1, endRow: rowIndex, endCol: mid })
    }

    if (right) {
      row[mid + 1] = detailLabel(right[0])
      row[mid + 2] = detailValue(right[1], right[2])
      merges.push({ startRow: rowIndex, startCol: mid + 2, endRow: rowIndex, endCol: width - 1 })
    }

    rows.push(row)
  }

  // ----- Score table -----
  rows.push([])
  const headerRow = rows.length
  rows.push([
    text("Subject", {
      font: { bold: true, size: 10, color: { rgb: "FFFFFF" } },
      fill: solid(HEADER_BG),
      border: BOX,
      alignment: { horizontal: "left", vertical: "center", wrapText: true }
    }),
    ...caMaxScores.map((max, index) =>
      text(`Assessment ${index + 1} (${max})`, {
        font: { bold: true, size: 10, color: { rgb: "FFFFFF" } },
        fill: solid(HEADER_BG),
        border: BOX,
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
      })
    ),
    ...(
      [
        `CA Total (${caTotalMax})`,
        `Term Exam (${examMax})`,
        `Term Total (${termTotalMax})`,
        "Grade",
        "Class Average",
        "Subject Position",
        "Remarks"
      ] as const
    ).map((label) =>
      text(label, {
        font: { bold: true, size: 10, color: { rgb: "FFFFFF" } },
        fill: solid(HEADER_BG),
        border: BOX,
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
      })
    )
  ])

  view.subjectRows.forEach((row, index) => {
    const totals =
      view.subjectClassData.find((entry) => entry.subjectId === row.subjectId)?.totals ?? []
    const classAverage = subjectClassAverage(totals)
    const rank = subjectClassRank(row.total, totals)

    const numeric = (value: number | null, fmt = INTEGER_FMT): SheetCell =>
      value === null
        ? text("—", {
            font: { color: MUTED, size: 10 },
            border: BOX,
            alignment: { horizontal: "center", vertical: "center" }
          })
        : text(value, {
            font: { color: INK, size: 10 },
            border: BOX,
            numFmt: fmt,
            alignment: { horizontal: "center", vertical: "center" }
          })

    rows.push([
      text(row.subjectName, {
        font: { color: INK, size: 10 },
        fill: striping(index),
        border: BOX,
        alignment: { vertical: "center", wrapText: true }
      }),
      ...Array.from({ length: caCount }, (_, slot) => numeric(row.caScores[slot] ?? null)),
      numeric(row.caTotal),
      numeric(row.exam),
      text(row.total ?? "—", {
        font: { bold: true, color: INK, size: 10 },
        fill: striping(index),
        border: BOX,
        ...(row.total === null ? {} : { numFmt: INTEGER_FMT }),
        alignment: { horizontal: "center", vertical: "center" }
      }),
      text(row.grade || "—", {
        font: { bold: true, color: INK, size: 10 },
        fill: striping(index),
        border: BOX,
        alignment: { horizontal: "center", vertical: "center" }
      }),
      classAverage === null
        ? text("—", {
            font: { color: MUTED, size: 10 },
            fill: striping(index),
            border: BOX,
            alignment: { horizontal: "center", vertical: "center" }
          })
        : text(classAverage, {
            font: { color: INK, size: 10 },
            fill: striping(index),
            border: BOX,
            numFmt: PERCENT_FMT,
            alignment: { horizontal: "center", vertical: "center" }
          }),
      text(rank === null ? "—" : toOrdinal(rank), {
        font: { color: INK, size: 10 },
        fill: striping(index),
        border: BOX,
        alignment: { horizontal: "center", vertical: "center" }
      }),
      text(row.remark || "—", {
        font: { color: INK, size: 10 },
        fill: striping(index),
        border: BOX,
        alignment: { vertical: "center", wrapText: true }
      })
    ])
  })

  // ----- Teacher's comment -----
  rows.push([])
  const commentRow = rows.length
  rows.push([
    text("Class Teacher's Comment", {
      font: { bold: true, color: MUTED, size: 10 },
      fill: solid(LABEL_BG),
      border: BOX,
      alignment: { vertical: "center" }
    }),
    text(view.teacherRemark ?? "", {
      font: { color: INK, size: 10 },
      border: BOX,
      alignment: { vertical: "center", wrapText: true }
    })
  ])
  merges.push({ startRow: commentRow, startCol: 1, endRow: commentRow, endCol: width - 1 })

  return {
    name: "Result",
    columns,
    rows,
    merges,
    // Keep the title block and the score header visible while scrolling, plus the subject column.
    freezePane: { rows: headerRow + 1, columns: 1 },
    rowDefs: new Map([
      [titleRow, { height: 22 }],
      [headerRow, { height: 30 }]
    ]),
    pageSetup: {
      paperSize: "a4",
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printTitlesRow: `$${headerRow + 1}:$${headerRow + 1}`,
      showGridLines: false,
      horizontalCentered: true
    }
  }
}

/** The workbook bytes for one report card, ready to save as `.xlsx`. */
export async function buildReportCardXlsx(
  view: ReportCardView,
  options: ReportCardSheetOptions = {}
): Promise<Uint8Array> {
  return await writeXlsx({ sheets: [buildReportCardSheet(view, options)] })
}

/**
 * Wraps workbook bytes in a Blob. `BlobPart` wants an `ArrayBuffer`-backed view while hucre's
 * `Uint8Array` is typed `ArrayBufferLike`, so copy into a plain one.
 */
export function xlsxBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  })
}
