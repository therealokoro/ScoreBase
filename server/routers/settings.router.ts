import { implement } from "@orpc/server"

import { settingsContract } from "../contracts/settings.contract"
import { getSchoolSettings, setSchoolSettings } from "../utils/kv-store"

const os = implement(settingsContract)

const fetchSchoolSettings = os.school.getSettings.handler(async () => {
  return await getSchoolSettings()
})

const updateSchoolSettings = os.school.setSettings.handler(async ({ input }) => {
  return await setSchoolSettings(input)
})

export const settingsRouter = {
  school: {
    getSettings: fetchSchoolSettings,
    setSettings: updateSchoolSettings
  }
}
