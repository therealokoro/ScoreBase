// ---------------------------------------------------------------------------
// School Settings

import {
  type TermPresetKeys,
  type PositionDisplayMode,
  type SchoolSettings
} from "../validators/settings"

// ---------------------------------------------------------------------------

export const TERMS_PRESET: Record<TermPresetKeys, string[]> = {
  ordinals: ["1st Term", "2nd Term", "3rd Term"],
  verbetim: ["First Term", "Second Term", "Third Term"]
} as const

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  sessionSuffix: "Session",
  termPreset: "ordinals",
  subjectTags: ["Art", "Science", "Religous", "Business", "Core"],
  autoGenerateStudentId: true,
  studentIdPrefix: "STU",
  activeSession: null,
  activeTerm: null
}

// ---------------------------------------------------------------------------
// Result Settings
// ---------------------------------------------------------------------------

export interface GradeBoundary {
  label: string // e.g. "A1"
  min: number // lower bound (inclusive)
  max: number // upper bound (inclusive)
  remark: string // e.g. "Excellent"
}

// Default scale follows the standard WAEC/NECO grading used in Nigerian
// secondary schools. Admin can override any boundary from the settings page.
export const DEFAULT_GRADE_BOUNDARIES: GradeBoundary[] = [
  { label: "A", min: 70, max: 100, remark: "Excellent" },
  { label: "B", min: 60, max: 69, remark: "Very Good" },
  { label: "C", min: 50, max: 59, remark: "Good" },
  { label: "D", min: 45, max: 49, remark: "Pass" },
  { label: "E", min: 40, max: 44, remark: "Fair" },
  { label: "F", min: 0, max: 39, remark: "Fail" }
]

export interface ResultSettings {
  gradeBoundaries: GradeBoundary[]
  positionDisplayMode: PositionDisplayMode
  positionTopN: number
  // Number of CA assessments per subject (1–5)
  caCount: number
  // Max score per CA slot — length must equal caCount.
  // Each entry is independently configurable (e.g. [20, 10, 10] for 3 CAs).
  // sum(caMaxScores) + examMax must equal 100.
  caMaxScores: number[]
  examMax: number
}

export const DEFAULT_RESULT_SETTINGS: ResultSettings = {
  gradeBoundaries: DEFAULT_GRADE_BOUNDARIES,
  positionDisplayMode: "all",
  positionTopN: 3,
  caCount: 3,
  caMaxScores: [10, 10, 10],
  examMax: 70
}

// ---------------------------------------------------------------------------
// Report Card Template
// ---------------------------------------------------------------------------

export type LogoPlacement = "left" | "center" | "right" | "left-right"
export type TextAlign = "left" | "center" | "right"
export type InfoField = "student" | "class" | "session" | "term"
export type ReportCardAssetKey = "logo-primary" | "logo-secondary" | "sig-teacher" | "sig-principal"

export interface ReportCardParagraph {
  id: string
  text: string
  fontSize: number // px, range 10–24
  color: string // hex e.g. "#000000"
  bold: boolean
  align: TextAlign
}

export interface ReportCardTemplate {
  header: {
    logoPlacement: LogoPlacement
    logoPrimary: string | null // NuxtHub Blob pathname
    logoSecondary: string | null // Only used in "left-right" and "center"
    // When logoPlacement is "left" or "right", only logoPrimary is used.
    // When "center" or "left-right", both logos can be set; if logoSecondary
    // is null, logoPrimary is used for both slots.
    showWatermark: boolean // render logoPrimary as a centered background watermark
    watermarkOpacity: number // 0–1, default 0.08
    heading: string
    subheading: string
    paragraphs: ReportCardParagraph[]
    info: {
      student: boolean
      class: boolean
      session: boolean
      term: boolean
      order: InfoField[] // display order; always contains all four fields
    }
  }
  body: {
    columns: {
      subject: true // always shown; never allow hiding in the UI
      caBreakdown: boolean // show CA1, CA2... individually
      caTotal: boolean // show a merged CA Total column
      // caBreakdown and caTotal are independent — both, either, or neither can be on
      exam: boolean
      total: boolean
      grade: boolean
      remark: boolean
    }
  }
  summary: {
    placement: "header" | "footer" // where the summary row renders
    total: boolean
    average: boolean
    position: boolean
    outOf: boolean
  }
  footer: {
    remarks: {
      show: boolean
      teacher: {
        show: boolean
        label: string // e.g. "Class Teacher"
        signature: boolean // show a blank signature line when printing
        signatureImage: string | null // NuxtHub Blob pathname; takes priority over blank line
      }
      principal: {
        show: boolean
        label: string
        signature: boolean
        signatureImage: string | null
      }
    }
    classSummary: {
      show: boolean
      highest: boolean
      lowest: boolean
      average: boolean
    }
    customBlocks: {
      id: string
      label: string // e.g. "Next term begins"
      content: string
    }[]
  }
}

export const DEFAULT_REPORT_CARD_TEMPLATE: ReportCardTemplate = {
  header: {
    logoPlacement: "left",
    logoPrimary: null,
    logoSecondary: null,
    showWatermark: false,
    watermarkOpacity: 0.08,
    heading: "",
    subheading: "",
    paragraphs: [],
    info: {
      student: true,
      class: true,
      session: true,
      term: true,
      order: ["student", "class", "session", "term"]
    }
  },
  body: {
    columns: {
      subject: true,
      caBreakdown: false,
      caTotal: true,
      exam: true,
      total: true,
      grade: true,
      remark: true
    }
  },
  summary: {
    placement: "footer",
    total: true,
    average: true,
    position: true,
    outOf: true
  },
  footer: {
    remarks: {
      show: true,
      teacher: { show: true, label: "Class Teacher", signature: true, signatureImage: null },
      principal: { show: true, label: "Principal", signature: true, signatureImage: null }
    },
    classSummary: { show: false, highest: true, lowest: true, average: true },
    customBlocks: []
  }
}

export type { SchoolSettings }
