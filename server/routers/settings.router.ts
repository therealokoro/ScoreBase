import { implement } from "@orpc/server"

import type { APiContext } from "../context"
import { settingsContract } from "../contracts/settings.contract"
import { getResultSettings, setResultSettings } from "../kv/result-settings"
import { getSchoolSettings, setSchoolSettings } from "../kv/school-settings"
import { ResultSettingsSchema, validateGradeBoundaryCoverage } from "~~/shared/validators/settings"
import { requireAdmin, requireSession } from "../utils/auth-guard"

const os = implement(settingsContract).$context<APiContext>()

// ---------------------------------------------------------------------------
// School settings
// ---------------------------------------------------------------------------

const fetchSchoolSettings = os.school.getSettings.handler(async ({ context }) => {
  requireSession(context)
  return await getSchoolSettings()
})

const updateSchoolSettings = os.school.setSettings.handler(async ({ input, context }) => {
  requireAdmin(context)
  return await setSchoolSettings(input)
})

// ---------------------------------------------------------------------------
// Result settings
// ---------------------------------------------------------------------------

const fetchResultSettings = os.result.getSettings.handler(async ({ context }) => {
  requireSession(context)
  return await getResultSettings()
})

const updateResultSettings = os.result.setSettings.handler(async ({ input, context, errors }) => {
  requireAdmin(context)

  // Merge the partial over the stored settings BEFORE validating, so cross-field
  // invariants (caMaxScores length === caCount, and the sum-with-examMax === 100 rule)
  // cannot be silently broken by a partial update.
  const current = await getResultSettings()
  const parsed = ResultSettingsSchema.safeParse({ ...current, ...input })
  if (!parsed.success) {
    throw errors.BAD_REQUEST({
      message: parsed.error.issues[0]?.message ?? "Invalid result settings"
    })
  }

  const boundaryError = validateGradeBoundaryCoverage(parsed.data.gradeBoundaries)
  if (boundaryError) {
    throw errors.BAD_REQUEST({ message: boundaryError })
  }

  return await setResultSettings(parsed.data)
})

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const settingsRouter = {
  school: {
    getSettings: fetchSchoolSettings,
    setSettings: updateSchoolSettings
  },
  result: {
    getSettings: fetchResultSettings,
    setSettings: updateResultSettings
  }
}
