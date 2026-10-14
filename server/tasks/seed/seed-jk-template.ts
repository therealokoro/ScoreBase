import { typeid } from "typeid-js"

import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_TEXT_STYLE,
  type ReportCardTemplate,
  type StyledText
} from "#shared/constants/report-card"

import { setReportCardTemplate } from "../../kv/report-card-template"

// ---------------------------------------------------------------------------
// J.K. People's Comprehensive Academy report card template
// Every value here is a DEFAULT the admin can change afterwards in the builder -
// nothing is hard-coded in the renderers. Seeding overwrites the single saved
// template (KV key `settings:report-card-template`), matching how "Reset to
// default" behaves.
// ---------------------------------------------------------------------------

// Colours sampled from the school's own printed report card.
const RED = "#CC0000" // school name
const GREEN = "#80AE7F" // ministry / inspectorate lines
const SLATE = "#5C697D" // descriptor, address, tel, PO box, "MOTTO:" prefix
const MOTTO_RED = "#EF4444" // motto text

function text(value: string, style: Partial<StyledText["style"]> = {}): StyledText {
  return { value, style: { ...DEFAULT_TEXT_STYLE, ...style } }
}

const centred = { align: "center" } as const

/** Builds the fully-configured J.K. template. Exported so it can be reused (and tested). */
export function buildJkTemplate(): ReportCardTemplate {
  return {
    id: typeid("template").toString(),
    fontFamily: DEFAULT_FONT_FAMILY,
    sidebarPosition: "right",
    // Grading key bottom-left, term info + director bottom-right.
    footerLayout: "columns",
    // Square corners, like the school's printed card.
    borderRadius: 0,
    // Black 1px rules everywhere, like the school's printed card.
    tableBorders: { color: "#000000", width: 1, outlineWidth: 1 },
    watermark: null,

    header: [
      {
        id: typeid("block").toString(),
        type: "school-info",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          logoPlacement: "left-right",
          logoSize: "medium",
          // Upload the coat of arms (left) and the school crest (right) in the builder.
          logoPrimary: null,
          logoSecondary: null,
          schoolName: text("J.K. PEOPLE'S COMPREHENSIVE ACADEMY", {
            fontSize: 22,
            fontWeight: "bold",
            color: RED,
            ...centred
          }),
          // Free-form header lines, in printed order. The badge sits after the 3rd.
          paragraphs: [
            text("NASARAWA STATE MINISTRY OF EDUCATION", {
              fontSize: 13,
              fontWeight: "bold",
              color: GREEN,
              ...centred
            }),
            text("KARU EDUCATION INSPECTORATE AREA", {
              fontSize: 10,
              fontWeight: "bold",
              color: GREEN,
              ...centred
            }),
            text("(JUNIOR & SENIOR SECONDARY, SCIENCE & VOCATIONAL INSTITUTE)", {
              fontSize: 13,
              fontWeight: "bold",
              color: SLATE,
              ...centred
            }),
            text("Nyanya/Mararaba Boundary, New Karu L.G.A, Nasarawa State, Nigeria", {
              fontSize: 10,
              color: SLATE,
              ...centred
            }),
            text("Tel: 09-2903303, 08036466111, 08036458122, 08058046033", {
              fontSize: 10,
              color: SLATE,
              ...centred
            }),
            text("P.O.Box 477 Mararaba, Nasarawa State", {
              fontSize: 10,
              color: SLATE,
              ...centred
            }),
            text("MOTTO: Contentment Follows Enlightenment", {
              fontSize: 10,
              fontWeight: "bold",
              italic: true,
              color: MOTTO_RED,
              ...centred
            })
          ],
          showGovernmentApprovedBadge: true,
          badgeAfterParagraph: 3
        }
      }
    ],

    studentInfo: [
      {
        id: typeid("block").toString(),
        type: "student-info",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          columns: 4,
          // Per-cell grid lines, matching the paper original.
          borderStyle: "bordered",
          labelPlacement: "top",
          valueFontSize: 11,
          valueFontWeight: "bold",
          fields: [
            { id: typeid("field").toString(), field: "session.name", label: "Session:" },
            { id: typeid("field").toString(), field: "term.name", label: "Term:" },
            { id: typeid("field").toString(), field: "student.id", label: "Student ID:" },
            { id: typeid("field").toString(), field: "student.name", label: "Name:" },
            { id: typeid("field").toString(), field: "student.class", label: "Class:" },
            { id: typeid("field").toString(), field: "result.average", label: "Avg:" },
            { id: typeid("field").toString(), field: "class.size", label: "No. In Class:" },
            { id: typeid("field").toString(), field: "result.position", label: "Position:" }
          ]
        }
      }
    ],

    main: [
      {
        id: typeid("block").toString(),
        type: "scores",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          // CA breakdown grouped under "Assessments" plus a separate CA Total column.
          caDisplay: "breakdown-grouped-total",
          // CA columns are inserted after the subject automatically.
          columns: [
            "subject",
            "exam",
            "total",
            "grade",
            "classAverage",
            "subjectPosition",
            "remark"
          ],
          columnLabels: {
            subject: "Subjects",
            exam: "Term Exam",
            total: "Term Total",
            grade: "Term Grade",
            classAverage: "Class Avg.",
            subjectPosition: "Subject Position",
            remark: "Remarks"
          },
          // The maximums come from the result settings and print under each heading.
          fontSize: 12,
          fontWeight: "normal",
          textColor: "#000000",
          showScoreMax: true
        }
      }
    ],

    sidebar: [],

    footer: [
      {
        // One remarks block: the class teacher's row, with the head signature beneath it.
        id: typeid("block").toString(),
        type: "remarks",
        hidden: false,
        fontFamily: null,
        column: "full",
        config: {
          teacher: {
            visible: true,
            label: text("Class Teacher's Comment:", { fontSize: 11, fontWeight: "bold" }),
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: text("Class Teacher:", { fontSize: 11, fontWeight: "bold" })
          },
          // Principal and director are the same person; this school calls them the director.
          director: {
            visible: true,
            showSignature: true,
            signatureMode: "blank",
            signatureImage: null,
            signatureLabel: text("Director:", { fontSize: 11, fontWeight: "bold" })
          }
        }
      },
      {
        // Bottom-left.
        id: typeid("block").toString(),
        type: "grading-key",
        hidden: false,
        fontFamily: null,
        column: "left",
        config: {
          title: text("Grading Keys", { fontSize: 11, fontWeight: "bold" }),
          display: "grade",
          // Bulleted list ("● A Distinction - 70% and above") rather than a table.
          displayStyle: "list"
        }
      },
      {
        // Tuition / P.T.A / Total on the first line, the next-term date on the second — one table.
        id: typeid("block").toString(),
        type: "custom-table",
        hidden: false,
        fontFamily: null,
        column: "right",
        config: {
          variant: "static",
          layout: "inline",
          title: text(""),
          rows: [
            {
              id: typeid("row").toString(),
              label: "Tuition Fee",
              value: "N68,000",
              newLine: false
            },
            { id: typeid("row").toString(), label: "P.T.A", value: "N1,000", newLine: false },
            { id: typeid("row").toString(), label: "Total", value: "N69,000", newLine: false },
            {
              id: typeid("row").toString(),
              label: "Next Term Begins",
              value: "September 7, 2026",
              newLine: true
            }
          ]
        }
      }
    ]
  }
}

export default defineTask({
  meta: {
    // Nitro derives the runnable name from the path: `<dir>:<file>` → `seed:seed-jk-template`.
    // Run it with `POST /_nitro/tasks/seed:seed-jk-template` in dev.
    name: "seed:seed-jk-template",
    description:
      "Seeds the J.K. People's Comprehensive Academy report card template (overwrites the saved template)"
  },
  async run() {
    await setReportCardTemplate(buildJkTemplate())
    return { result: "J.K. People's Comprehensive Academy template seeded successfully" }
  }
})
