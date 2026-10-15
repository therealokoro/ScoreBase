import { subjectClassAverage, subjectClassRank, toOrdinal } from "~~/shared/utils/report-card"

import type { ReportCardView } from "~/components/ReportCard/blocks/placeholder"

/** One CSV cell: quoted only when it needs it, with embedded quotes doubled. */
function cell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/**
 * A filename-safe version of a title: strips characters Windows and macOS reject and collapses runs
 * of separators, so "Adewumi's 2025/2026 3rd Term Result" becomes "Adewumi's 2025-2026 3rd Term
 * Result".
 */
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

/**
 * Builds the report card as a CSV spreadsheet (Excel opens it directly): the student's result
 * header, one row per subject with the same columns the card prints (including the class average
 * and subject position), then the class teacher's comment.
 *
 * Values come from the same normalised view model the renderer uses, so the numbers match the
 * printed card. Headings are the export's own — they are not run through the template's custom
 * column labels.
 */
export function buildReportCardCsv(view: ReportCardView): string {
  const { caCount, caMaxScores, examMax } = view.scoreConfig
  const caTotalMax = caMaxScores.reduce((sum, max) => sum + max, 0)
  const termTotalMax = caTotalMax + examMax

  const rows: (string | number)[][] = [
    ["Session", view.sessionName],
    ["Term", view.termName],
    ["Student ID", view.studentSchoolId],
    ["Name", view.studentName],
    ["Class", view.className],
    ["No. In Class", String(view.totalStudents)],
    ["Average", view.average === null ? "—" : `${view.average.toFixed(2)}%`],
    ["Position", view.position || "—"]
  ]

  rows.push([])
  rows.push([
    "Subject",
    ...Array.from(
      { length: caCount },
      (_, index) => `Assessment ${index + 1} (${caMaxScores[index] ?? "?"})`
    ),
    `CA Total (${caTotalMax})`,
    `Term Exam (${examMax})`,
    `Term Total (${termTotalMax})`,
    "Grade",
    "Class Average",
    "Subject Position",
    "Remarks"
  ])

  for (const row of view.subjectRows) {
    const totals =
      view.subjectClassData.find((entry) => entry.subjectId === row.subjectId)?.totals ?? []
    const average = subjectClassAverage(totals)
    const rank = subjectClassRank(row.total, totals)

    rows.push([
      row.subjectName,
      ...Array.from({ length: caCount }, (_, index) => row.caScores[index] ?? "—"),
      row.caTotal ?? "—",
      row.exam ?? "—",
      row.total ?? "—",
      row.grade || "—",
      average === null ? "—" : `${average.toFixed(2)}%`,
      rank === null ? "—" : toOrdinal(rank),
      row.remark || "—"
    ])
  }

  rows.push([])
  rows.push(["Class Teacher's Comment", view.teacherRemark ?? ""])

  return rows.map((row) => row.map(cell).join(",")).join("\r\n")
}
