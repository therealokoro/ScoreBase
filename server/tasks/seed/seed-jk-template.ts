import { createDefaultReportCardTemplate } from "#shared/constants/report-card"

import { setReportCardTemplate } from "../../kv/report-card-template"

// ---------------------------------------------------------------------------
// J.K. People's Comprehensive Academy report card template
//
// The app's default template IS this school's card (`createDefaultReportCardTemplate`), so this
// task simply re-writes that default over whatever is saved under `settings:report-card-template`.
// Useful after a model change; the builder's "Reset to default" does the same without the task.
// ---------------------------------------------------------------------------

/** The template this seed writes — the app default. Exported so it can be tested. */
export function buildJkTemplate() {
  return createDefaultReportCardTemplate()
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
