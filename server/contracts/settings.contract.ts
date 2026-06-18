import { oc } from "@orpc/contract"
import {
  ResultSettingsSchema,
  PartialResultSettingsSchema,
  SchoolSettingsSchema
} from "~~/shared/validators/settings"

// ---------------------------------------------------------------------------
// School settings
// ---------------------------------------------------------------------------

export const getSchoolSettings = oc.output(SchoolSettingsSchema)

export const setSchoolSettings = oc
  .input(SchoolSettingsSchema.partial())
  .output(SchoolSettingsSchema)

// ---------------------------------------------------------------------------
// Result settings
// ---------------------------------------------------------------------------

export const getResultSettings = oc.output(ResultSettingsSchema)

export const setResultSettings = oc.input(PartialResultSettingsSchema).output(ResultSettingsSchema)

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const settingsContract = {
  school: {
    getSettings: getSchoolSettings,
    setSettings: setSchoolSettings
  },
  result: {
    getSettings: getResultSettings,
    setSettings: setResultSettings
  }
}
