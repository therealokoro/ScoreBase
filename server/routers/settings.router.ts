import { implement } from "@orpc/server"

import { settingsContract } from "../contracts/settings.contract"
import { getResultSettings, setResultSettings } from "../kv/result-settings"
import { getSchoolSettings, setSchoolSettings } from "../kv/school-settings"

const os = implement(settingsContract)

// ---------------------------------------------------------------------------
// School settings
// ---------------------------------------------------------------------------

const fetchSchoolSettings = os.school.getSettings.handler(async () => {
  return await getSchoolSettings()
})

const updateSchoolSettings = os.school.setSettings.handler(async ({ input }) => {
  return await setSchoolSettings(input)
})

// ---------------------------------------------------------------------------
// Result settings
// ---------------------------------------------------------------------------

const fetchResultSettings = os.result.getSettings.handler(async () => {
  return await getResultSettings()
})

const updateResultSettings = os.result.setSettings.handler(async ({ input }) => {
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
