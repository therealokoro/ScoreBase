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

export const setResultSettings = oc
  .input(PartialResultSettingsSchema)
  .output(ResultSettingsSchema)
  .errors({
    BAD_REQUEST: {
      message: "The resulting settings are invalid (CA maxima must match caCount and sum with examMax to 100)"
    }
  })

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
