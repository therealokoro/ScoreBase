import { oc } from "@orpc/contract"
import z from "zod"
import { ScoreConfigSnapshotSchema } from "~~/shared/validators/results"
import {
  CreateScoresheetsSchema,
  ScoresheetSchema,
  ScoresheetWithDetailsSchema,
  UpdateScoresheetRemarksSchema
} from "~~/shared/validators/scoresheet"

// ---------------------------------------------------------------------------
// Composed output schemas
// ---------------------------------------------------------------------------

export const createScoresheets = oc
  .input(CreateScoresheetsSchema)
  .output(z.array(ScoresheetSchema))
  .errors({
    NOT_FOUND: { message: "The result or one or more students were not found" },
    CONFLICT: { message: "A scoresheet already exists for one or more of these students" },
    PRECONDITION_FAILED: { message: "Scoresheets can only be added to a draft result" },
    FORBIDDEN: { message: "You are not allowed to do that" }
  })

export const getOneScoresheet = oc
  .input(ScoresheetSchema.pick({ id: true }))
  .output(ScoresheetWithDetailsSchema)
  .errors({ NOT_FOUND: { message: "The scoresheet was not found" } })

export const updateScoresheetRemarks = oc.input(UpdateScoresheetRemarksSchema).errors({
  NOT_FOUND: { message: "The scoresheet was not found" },
  FORBIDDEN: { message: "You do not have permission to edit remarks on this scoresheet" }
})

// ---------------------------------------------------------------------------
// Report card
// ---------------------------------------------------------------------------

const ComputedSubjectRowSchema = z.object({
  id: z.string(),
  subjectName: z.string(),
  caScores: z.array(z.number().nullable()),
  caTotal: z.number().nullable(),
  exam: z.number().nullable(),
  total: z.number().nullable(),
  grade: z.string(),
  remark: z.string()
})

const ComputedReportCardSchema = z.object({
  studentName: z.string(),
  studentSchoolId: z.string(),
  subjectRows: z.array(ComputedSubjectRowSchema),
  grandTotal: z.number().nullable(),
  subjectCount: z.number(),
  average: z.number().nullable(),
  position: z.string(),
  positionRank: z.number().nullable()
})

export const ReportCardOutputSchema = z.object({
  resultName: z.string(),
  resultStatus: z.enum(["draft", "submitted", "reviewed", "published"]),
  scoreConfig: ScoreConfigSnapshotSchema,
  term: z.object({
    id: z.string(),
    name: z.string(),
    session: z.object({ name: z.string() })
  }),
  class: z.object({ id: z.string(), name: z.string() }),
  computed: ComputedReportCardSchema,
  teacherRemark: z.string().nullable(),
  principalRemark: z.string().nullable(),
  totalStudents: z.number()
})

export const getReportCard = oc
  .input(ScoresheetSchema.pick({ id: true }))
  .output(ReportCardOutputSchema)
  .errors({
    NOT_FOUND: { message: "The scoresheet or its parent result was not found" },
    FORBIDDEN: { message: "You do not have permission to view this report card" }
  })

export const scoresheetContract = {
  createScoresheets,
  getOneScoresheet,
  updateScoresheetRemarks,
  getReportCard
}
