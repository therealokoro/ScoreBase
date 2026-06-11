import { kv } from "@nuxthub/kv"

import { DEFAULT_SETTINGS, SchoolSettings, TERMS_PRESET } from "#shared/constants/settings"

const SCHOOL_SETTINGS_KV_KEY = "settings:school"

export async function getSchoolSettings(): Promise<SchoolSettings>
export async function getSchoolSettings<K extends keyof SchoolSettings>(
  key: K
): Promise<SchoolSettings[K]>
export async function getSchoolSettings<K extends keyof SchoolSettings>(
  key?: K
): Promise<SchoolSettings | SchoolSettings[K]> {
  const stored = await kv.get<SchoolSettings>(SCHOOL_SETTINGS_KV_KEY)
  const settings = { ...DEFAULT_SETTINGS, ...stored }
  return key ? settings[key] : settings
}

export const setSchoolSettings = async (settings: Partial<SchoolSettings>) => {
  const current = await getSchoolSettings()
  const newSettings = { ...current, ...settings }
  await kv.set(SCHOOL_SETTINGS_KV_KEY, newSettings)
  return newSettings
}

export const resetSchoolSettings = async (): Promise<void> => {
  await kv.del(SCHOOL_SETTINGS_KV_KEY)
}

export const getTermPreset = async (): Promise<readonly string[]> => {
  const termType = await getSchoolSettings("termPreset")
  return TERMS_PRESET[termType] ?? TERMS_PRESET[DEFAULT_SETTINGS.termPreset]
}
