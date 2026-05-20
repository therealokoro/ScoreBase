// term.preset.ts
import { kv } from "@nuxthub/kv"

const TERM_PRESET_KV_KEY = "settings:term_preset"
export const DEFAULT_TERM_PRESET: string[] = ["1st Term", "2nd Term", "3rd Term"]

export const getTermPreset = async () => {
  const stored = await kv.get<string[]>(TERM_PRESET_KV_KEY)
  return stored ?? DEFAULT_TERM_PRESET
}

export const setTermPreset = async (preset: string[]): Promise<void> => {
  await kv.set(TERM_PRESET_KV_KEY, preset)
}

export const resetTermPreset = async (): Promise<void> => {
  await kv.del(TERM_PRESET_KV_KEY)
}
