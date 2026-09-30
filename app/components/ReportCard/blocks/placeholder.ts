import type { ReportCardData } from "~~/server/queries/reportCard.query"
import type { ComputedSubjectRow } from "~~/shared/utils/report-card"
import type { ScoreConfigSnapshot } from "~~/shared/validators/results"

/**
 * Normalised view of a report card. Real data (from the viewer) and the builder's placeholder data
 * have different shapes, so every field the block renderers need is resolved here once.
 */
export interface ReportCardView {
  studentName: string
  studentSchoolId: string
  className: string
  sessionName: string
  termName: string
  subjectRows: ComputedSubjectRow[]
  scoreConfig: ScoreConfigSnapshot
  grandTotal: number | null
  average: number | null
  position: string
  totalStudents: number
  subjectCount: number
  teacherRemark: string | null
  principalRemark: string | null
  allStudentTotals: number[]
}

/** Placeholder values shown in the builder preview while no real scoresheet is loaded. */
export const REPORT_CARD_PLACEHOLDER: ReportCardView = {
  studentName: "Chibuike Idris",
  studentSchoolId: "STU-2026-0010",
  className: "JSS 1",
  sessionName: "2027/2028 Session",
  termName: "First Term",
  subjectRows: [
    {
      id: "ph-1",
      subjectName: "Mathematics",
      caScores: [18, 17, 15],
      caTotal: 50,
      exam: 38,
      total: 88,
      grade: "A",
      remark: "Excellent"
    },
    {
      id: "ph-2",
      subjectName: "English Language",
      caScores: [15, 14, 12],
      caTotal: 41,
      exam: 35,
      total: 76,
      grade: "A",
      remark: "Excellent"
    },
    {
      id: "ph-3",
      subjectName: "Basic Science",
      caScores: [12, 10, 11],
      caTotal: 33,
      exam: 35,
      total: 68,
      grade: "B",
      remark: "Very Good"
    }
  ],
  // caMaxScores + examMax must sum to 100, matching the real ResultSettings invariant.
  scoreConfig: { caCount: 3, caMaxScores: [20, 20, 20], examMax: 40 },
  grandTotal: 232,
  average: 77.33,
  position: "2nd",
  totalStudents: 32,
  subjectCount: 3,
  teacherRemark: "A diligent and focused student.",
  principalRemark: "Keep up the excellent work.",
  allStudentTotals: [88, 83, 79, 74, 68, 65, 61, 58, 55, 52]
}

export function normalizeReportCardData(data: ReportCardData): ReportCardView {
  return {
    studentName: data.computed.studentName,
    studentSchoolId: data.computed.studentSchoolId,
    className: data.class.name,
    sessionName: data.term.session.name,
    termName: data.term.name,
    subjectRows: data.computed.subjectRows,
    scoreConfig: data.scoreConfig,
    grandTotal: data.computed.grandTotal,
    average: data.computed.average,
    position: data.computed.position,
    totalStudents: data.totalStudents,
    subjectCount: data.computed.subjectCount,
    teacherRemark: data.teacherRemark,
    principalRemark: data.principalRemark,
    allStudentTotals: data.allStudentTotals
  }
}

export function resolveView(data?: ReportCardData | null): ReportCardView {
  return data ? normalizeReportCardData(data) : REPORT_CARD_PLACEHOLDER
}
