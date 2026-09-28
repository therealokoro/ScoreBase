import { ensureBlob } from "@nuxthub/blob"
import { implement } from "@orpc/server"
import { ResultSettingsSchema, validateGradeBoundaryCoverage } from "~~/shared/validators/settings"

import type { APiContext } from "../context"
import { settingsContract } from "../contracts/settings.contract"
import {
  getReportCardTemplate,
  resetReportCardTemplate,
  setReportCardTemplate,
  uploadReportCardAsset
} from "../kv/report-card-template"
import { getResultSettings, setResultSettings } from "../kv/result-settings"
import { getSchoolSettings, setSchoolSettings } from "../kv/school-settings"
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

  return await setResultSettings(parsed.data, current)
})

// ---------------------------------------------------------------------------
// Report card template
// ---------------------------------------------------------------------------

const fetchReportCardTemplate = os.reportCardTemplate.getTemplate.handler(async ({ context }) => {
  // Teachers need the template to render report cards, so this is not admin-gated.
  requireSession(context)
  return await getReportCardTemplate()
})

const updateReportCardTemplate = os.reportCardTemplate.setTemplate.handler(
  async ({ input, context }) => {
    requireAdmin(context)
    return await setReportCardTemplate(input)
  }
)

const resetReportCardTemplateHandler = os.reportCardTemplate.resetTemplate.handler(
  async ({ context }) => {
    requireAdmin(context)
    return await resetReportCardTemplate()
  }
)

const uploadReportCardAssetHandler = os.reportCardTemplate.uploadAsset.handler(
  async ({ input, context, errors }) => {
    requireAdmin(context)

    // The client checks the same limits, but only the server check is trustworthy.
    // ensureBlob throws an H3 400, which oRPC would surface as a 500, so map it.
    try {
      ensureBlob(input.file, { maxSize: "2MB", types: ["image"] })
    } catch {
      throw errors.BAD_REQUEST()
    }

    const url = await uploadReportCardAsset(input.file, input.assetKey)
    return { url }
  }
)

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
  },
  reportCardTemplate: {
    getTemplate: fetchReportCardTemplate,
    setTemplate: updateReportCardTemplate,
    resetTemplate: resetReportCardTemplateHandler,
    uploadAsset: uploadReportCardAssetHandler
  }
}
