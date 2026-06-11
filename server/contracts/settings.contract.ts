import { oc } from "@orpc/contract"
import { SchoolSettingsSchema } from "~~/shared/validators/settings"

export const getSchoolSettings = oc.output(SchoolSettingsSchema)

export const setSchoolSettings = oc
  .input(SchoolSettingsSchema.partial())
  .output(SchoolSettingsSchema)

export const settingsContract = {
  school: {
    getSettings: getSchoolSettings,
    setSettings: setSchoolSettings
  }
}
