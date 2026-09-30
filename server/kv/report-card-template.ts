import { blob } from "@nuxthub/blob"
import { kv } from "@nuxthub/kv"

import {
  createDefaultReportCardTemplate,
  type ReportCardAssetKey,
  type ReportCardTemplate
} from "#shared/constants/report-card"
import { ReportCardTemplateSchema } from "#shared/validators/report-card"

import { mergeSettings } from "./merge-settings"

const REPORT_CARD_TEMPLATE_KV_KEY = "settings:report-card-template"

export async function getReportCardTemplate(): Promise<ReportCardTemplate> {
  const stored = await kv.get<Partial<ReportCardTemplate>>(REPORT_CARD_TEMPLATE_KV_KEY)
  // Fresh defaults every call — block IDs must never be shared between templates.
  const defaults = createDefaultReportCardTemplate()
  const merged = mergeSettings(stored ?? {}, defaults) as ReportCardTemplate

  // Guard against corrupted KV values: fall back to defaults rather than propagating bad data.
  const parsed = ReportCardTemplateSchema.safeParse(merged)
  return parsed.success ? parsed.data : defaults
}

export const setReportCardTemplate = async (template: ReportCardTemplate) => {
  await kv.set(REPORT_CARD_TEMPLATE_KV_KEY, template)
  return template
}

/** Deletes the stored template so the next read falls back to the defaults. */
export const resetReportCardTemplate = async (): Promise<ReportCardTemplate> => {
  await kv.del(REPORT_CARD_TEMPLATE_KV_KEY)
  return await getReportCardTemplate()
}

export type { ReportCardAssetKey }

export const uploadReportCardAsset = async (
  file: File,
  assetKey: ReportCardAssetKey
): Promise<string> => {
  const result = await blob.put(`report-card/${assetKey}`, file, {
    contentType: file.type,
    // Deterministic pathname so a re-upload overwrites the previous asset cleanly
    // instead of leaving orphaned blobs.
    addRandomSuffix: false
  })
  return result.pathname
}
