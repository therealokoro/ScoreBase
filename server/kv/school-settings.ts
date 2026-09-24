import { kv } from "@nuxthub/kv"

import {
  DEFAULT_SCHOOL_SETTINGS,
  type SchoolSettings,
  TERMS_PRESET
} from "#shared/constants/kv-settings"
import { SchoolSettingsSchema } from "#shared/validators/settings"

import { mergeSettings } from "./merge-settings"

const SCHOOL_SETTINGS_KV_KEY = "settings:school"

export async function getSchoolSettings(): Promise<SchoolSettings>
export async function getSchoolSettings<K extends keyof SchoolSettings>(
  key: K
): Promise<SchoolSettings[K]>
export async function getSchoolSettings<K extends keyof SchoolSettings>(
  key?: K
): Promise<SchoolSettings | SchoolSettings[K]> {
  const stored = await kv.get<Partial<SchoolSettings>>(SCHOOL_SETTINGS_KV_KEY)
  const merged = mergeSettings(stored ?? {}, DEFAULT_SCHOOL_SETTINGS) as SchoolSettings

  // Guard against corrupted KV values: fall back to defaults rather than propagating bad data.
  const parsed = SchoolSettingsSchema.safeParse(merged)
  const settings = parsed.success ? parsed.data : DEFAULT_SCHOOL_SETTINGS

  return key ? settings[key] : settings
}

export const setSchoolSettings = async (settings: Partial<SchoolSettings>) => {
  const current = await getSchoolSettings()
  // Deep-merge over the current value (arrays replaced wholesale) so nested objects
  // survive partial updates.
  const newSettings = mergeSettings(settings, current) as SchoolSettings
  await kv.set(SCHOOL_SETTINGS_KV_KEY, newSettings)
  return newSettings
}

export const getTermPreset = async (): Promise<readonly string[]> => {
  const termType = await getSchoolSettings("termPreset")
  return TERMS_PRESET[termType] ?? TERMS_PRESET[DEFAULT_SCHOOL_SETTINGS.termPreset]
}
