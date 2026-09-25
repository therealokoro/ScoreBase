import { kv } from "@nuxthub/kv"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_SCHOOL_SETTINGS, TERMS_PRESET } from "#shared/constants/kv-settings"

import { getSchoolSettings, getTermPreset, setSchoolSettings } from "./school-settings"

vi.mock("@nuxthub/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() }
}))

describe("getSchoolSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the defaults when KV has nothing stored", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getSchoolSettings()).resolves.toEqual(DEFAULT_SCHOOL_SETTINGS)
    expect(kv.get).toHaveBeenCalledWith("settings:school")
  })

  it("deep-merges the stored value over the defaults", async () => {
    vi.mocked(kv.get).mockResolvedValue({ sessionSuffix: "Academic Year" })

    const settings = await getSchoolSettings()

    expect(settings.sessionSuffix).toBe("Academic Year")
    // Untouched fields come from the defaults.
    expect(settings.termPreset).toBe(DEFAULT_SCHOOL_SETTINGS.termPreset)
    expect(settings.subjectTags).toEqual(DEFAULT_SCHOOL_SETTINGS.subjectTags)
  })

  it("returns a single field when called with a key", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getSchoolSettings("termPreset")).resolves.toBe("ordinals")
    await expect(getSchoolSettings("studentIdPrefix")).resolves.toBe("STU")
  })

  it("falls back to the defaults when the merged value is corrupt", async () => {
    // `bogus` is not a valid term preset, so the whole read must fall back rather
    // than propagating bad data out of KV (audit #27).
    vi.mocked(kv.get).mockResolvedValue({ termPreset: "bogus" })

    await expect(getSchoolSettings()).resolves.toEqual(DEFAULT_SCHOOL_SETTINGS)
  })

  it("falls back to the defaults when a single field is invalid", async () => {
    vi.mocked(kv.get).mockResolvedValue({ studentIdPrefix: "1" })

    await expect(getSchoolSettings("studentIdPrefix")).resolves.toBe(
      DEFAULT_SCHOOL_SETTINGS.studentIdPrefix
    )
  })
})

describe("setSchoolSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the merged settings back to KV", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    const result = await setSchoolSettings({ studentIdPrefix: "SCH" })

    expect(result.studentIdPrefix).toBe("SCH")
    expect(result.termPreset).toBe(DEFAULT_SCHOOL_SETTINGS.termPreset)
    expect(kv.set).toHaveBeenCalledWith(
      "settings:school",
      expect.objectContaining({ studentIdPrefix: "SCH" })
    )
  })

  it("deep-merges the partial over the current stored value", async () => {
    vi.mocked(kv.get).mockResolvedValue({
      sessionSuffix: "Academic Year",
      studentIdPrefix: "ABC"
    })

    const result = await setSchoolSettings({ termPreset: "verbetim" })

    expect(result).toMatchObject({
      sessionSuffix: "Academic Year",
      studentIdPrefix: "ABC",
      termPreset: "verbetim"
    })
  })

  it("replaces arrays wholesale instead of concatenating them", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    const result = await setSchoolSettings({ subjectTags: ["Core"] })

    expect(result.subjectTags).toEqual(["Core"])
  })
})

describe("getTermPreset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the ordinals preset by default", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getTermPreset()).resolves.toEqual(TERMS_PRESET.ordinals)
  })

  it("returns the preset array for the configured termPreset", async () => {
    vi.mocked(kv.get).mockResolvedValue({ termPreset: "verbetim" })

    await expect(getTermPreset()).resolves.toEqual(TERMS_PRESET.verbetim)
  })
})
