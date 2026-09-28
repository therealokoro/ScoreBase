import { blob } from "@nuxthub/blob"
import { kv } from "@nuxthub/kv"

import {
  DEFAULT_REPORT_CARD_TEMPLATE,
  type ReportCardTemplate
} from "#shared/constants/kv-settings"
import { ReportCardTemplateSchema } from "#shared/validators/settings"

import { mergeSettings } from "./merge-settings"

const REPORT_CARD_TEMPLATE_KV_KEY = "settings:report-card-template"

export async function getReportCardTemplate(): Promise<ReportCardTemplate> {
  const stored = await kv.get<Partial<ReportCardTemplate>>(REPORT_CARD_TEMPLATE_KV_KEY)
  const merged = mergeSettings(stored ?? {}, DEFAULT_REPORT_CARD_TEMPLATE) as ReportCardTemplate

  // Guard against corrupted KV values: fall back to defaults rather than propagating bad data.
  const parsed = ReportCardTemplateSchema.safeParse(merged)
  return (parsed.success ? parsed.data : DEFAULT_REPORT_CARD_TEMPLATE) as ReportCardTemplate
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

export type ReportCardAssetKey = "logo-primary" | "logo-secondary" | "sig-teacher" | "sig-principal"

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
