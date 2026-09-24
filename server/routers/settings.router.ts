import { implement } from "@orpc/server"

import type { APiContext } from "../context"
import { settingsContract } from "../contracts/settings.contract"
import { getResultSettings, setResultSettings } from "../kv/result-settings"
import { getSchoolSettings, setSchoolSettings } from "../kv/school-settings"
import { requireAdmin } from "../utils/auth-guard"

const os = implement(settingsContract).$context<APiContext>()

// ---------------------------------------------------------------------------
// School settings
// ---------------------------------------------------------------------------

const fetchSchoolSettings = os.school.getSettings.handler(async () => {
  return await getSchoolSettings()
})

const updateSchoolSettings = os.school.setSettings.handler(async ({ input, context }) => {
  requireAdmin(context)
  return await setSchoolSettings(input)
})

// ---------------------------------------------------------------------------
// Result settings
// ---------------------------------------------------------------------------

const fetchResultSettings = os.result.getSettings.handler(async () => {
  return await getResultSettings()
})

const updateResultSettings = os.result.setSettings.handler(async ({ input, context }) => {
  requireAdmin(context)
  return await setResultSettings(input)
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
