import type { Component } from "vue"
import { z } from "zod"
import {
  createDefaultCustomTableConfig,
  createDefaultGradingKeyConfig,
  createDefaultPsychomotorConfig,
  createDefaultRemarksConfig,
  createDefaultSchoolInfoConfig,
  createDefaultScoresConfig,
  createDefaultStudentInfoConfig,
  createDefaultSummaryConfig,
  type BlockType,
  type CustomTableConfig,
  type GradingKeyConfig,
  type PsychomotorConfig,
  type RemarksConfig,
  type SchoolInfoConfig,
  type ScoresConfig,
  type Slot,
  type StudentInfoConfig,
  type SummaryConfig
} from "~~/shared/constants/report-card"
import {
  CustomTableConfigSchema,
  GradingKeyConfigSchema,
  PsychomotorConfigSchema,
  RemarksConfigSchema,
  SchoolInfoConfigSchema,
  ScoresConfigSchema,
  StudentInfoConfigSchema,
  SummaryConfigSchema
} from "~~/shared/validators/report-card"

import CustomTableBlock from "./CustomTableBlock.vue"
import GradingKeyBlock from "./GradingKeyBlock.vue"
import PsychomotorBlock from "./PsychomotorBlock.vue"
import RemarksBlock from "./RemarksBlock.vue"
import SchoolInfoBlock from "./SchoolInfoBlock.vue"
import ScoresBlock from "./ScoresBlock.vue"
import StudentInfoBlock from "./StudentInfoBlock.vue"
import SummaryBlock from "./SummaryBlock.vue"

// ---------------------------------------------------------------------------
// Block registry
//
// Single source of truth for what the builder palette offers and what the renderer mounts.
// The editor enforces `allowedSlots`; the renderer trusts it (see REPORT-CARD-BUILDER-CONTD
// agent rule 4).
// ---------------------------------------------------------------------------

export interface BlockDataRequirements {
  /** Normalised view-model field names this block reads at render time. */
  computed: string[]
  /** Keys this block expects in the scoresheet's `manualValues[blockId]` (teacher-entered). */
  manual: string[]
}

export interface BlockDefinition<TConfig = unknown> {
  type: BlockType
  /** Human-readable display name in the builder palette (plain English, agent rule 8). */
  label: string
  allowedSlots: Slot[]
  configSchema: z.ZodType<TConfig>
  defaultConfig: () => TConfig
  component: Component
  dataRequirements: BlockDataRequirements
}

/** Maps each block type to its config type, keeping the registry entries fully typed. */
interface BlockConfigMap {
  "school-info": SchoolInfoConfig
  "student-info": StudentInfoConfig
  scores: ScoresConfig
  "custom-table": CustomTableConfig
  "grading-key": GradingKeyConfig
  psychomotor: PsychomotorConfig
  summary: SummaryConfig
  remarks: RemarksConfig
}

export type BlockRegistry = { [K in keyof BlockConfigMap]: BlockDefinition<BlockConfigMap[K]> }

export const blockRegistry: BlockRegistry = {
  "school-info": {
    type: "school-info",
    label: "School Information",
    allowedSlots: ["header"],
    configSchema: SchoolInfoConfigSchema,
    defaultConfig: createDefaultSchoolInfoConfig,
    component: SchoolInfoBlock,
    dataRequirements: { computed: [], manual: [] }
  },
  "student-info": {
    type: "student-info",
    label: "Student Details",
    allowedSlots: ["studentInfo"],
    configSchema: StudentInfoConfigSchema,
    defaultConfig: createDefaultStudentInfoConfig,
    component: StudentInfoBlock,
    dataRequirements: {
      computed: [
        "studentName",
        "studentSchoolId",
        "className",
        "sessionName",
        "termName",
        "average",
        "position",
        "totalStudents"
      ],
      manual: []
    }
  },
  scores: {
    type: "scores",
    label: "Subject Scores",
    allowedSlots: ["main"],
    configSchema: ScoresConfigSchema,
    defaultConfig: createDefaultScoresConfig,
    component: ScoresBlock,
    dataRequirements: {
      computed: ["subjectRows", "scoreConfig", "allStudentTotals"],
      manual: []
    }
  },
  "custom-table": {
    type: "custom-table",
    label: "Custom Table",
    allowedSlots: ["main", "sidebar", "footer"],
    configSchema: CustomTableConfigSchema,
    defaultConfig: createDefaultCustomTableConfig,
    component: CustomTableBlock,
    // Manual-variant row values are keyed by the row's id at write time (Phase 12).
    dataRequirements: { computed: [], manual: ["rows"] }
  },
  "grading-key": {
    type: "grading-key",
    label: "Grading Key",
    allowedSlots: ["main", "sidebar", "footer"],
    configSchema: GradingKeyConfigSchema,
    defaultConfig: createDefaultGradingKeyConfig,
    component: GradingKeyBlock,
    // Rows are seeded from result settings' grade boundaries when the block is added.
    dataRequirements: { computed: [], manual: [] }
  },
  psychomotor: {
    type: "psychomotor",
    label: "Psychomotor Skills",
    // Sidebar-only by design: adding one is what turns the two-column layout on.
    allowedSlots: ["sidebar"],
    configSchema: PsychomotorConfigSchema,
    defaultConfig: createDefaultPsychomotorConfig,
    component: PsychomotorBlock,
    // Skill labels are fixed per template; ratings are teacher-entered per student.
    dataRequirements: { computed: [], manual: ["rows"] }
  },
  summary: {
    type: "summary",
    label: "Result Summary",
    allowedSlots: ["studentInfo", "main", "sidebar", "footer"],
    configSchema: SummaryConfigSchema,
    defaultConfig: createDefaultSummaryConfig,
    component: SummaryBlock,
    dataRequirements: {
      computed: [
        "grandTotal",
        "average",
        "position",
        "totalStudents",
        "subjectCount",
        "scoreConfig"
      ],
      manual: []
    }
  },
  remarks: {
    type: "remarks",
    label: "Remarks",
    allowedSlots: ["footer"],
    configSchema: RemarksConfigSchema,
    defaultConfig: createDefaultRemarksConfig,
    component: RemarksBlock,
    // Teacher/principal comment text is teacher-entered (Phase 12 manual values).
    dataRequirements: { computed: [], manual: ["teacher", "principal"] }
  }
}

/** Looks up a block definition by type; throws on an unknown type instead of failing silently. */
export function getBlockDefinition(type: BlockType): BlockDefinition {
  const definition = blockRegistry[type]
  if (!definition) {
    throw new Error(`Unknown report card block type: ${type}`)
  }
  return definition
}
