import { blob } from "@nuxthub/blob"
import { kv } from "@nuxthub/kv"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_REPORT_CARD_TEMPLATE } from "#shared/constants/kv-settings"

import {
  getReportCardTemplate,
  resetReportCardTemplate,
  setReportCardTemplate,
  uploadReportCardAsset
} from "./report-card-template"

vi.mock("@nuxthub/kv", () => ({
  kv: { get: vi.fn(), set: vi.fn(), del: vi.fn() }
}))

vi.mock("@nuxthub/blob", () => ({
  blob: { put: vi.fn() }
}))

describe("getReportCardTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns the defaults when KV has nothing stored", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(getReportCardTemplate()).resolves.toEqual(DEFAULT_REPORT_CARD_TEMPLATE)
    expect(kv.get).toHaveBeenCalledWith("settings:report-card-template")
  })

  it("deep-merges the stored value over the defaults", async () => {
    vi.mocked(kv.get).mockResolvedValue({ header: { heading: "Springfield High" } })

    const template = await getReportCardTemplate()

    expect(template.header.heading).toBe("Springfield High")
    // Sibling nested fields survive the merge.
    expect(template.header.logoPlacement).toBe(DEFAULT_REPORT_CARD_TEMPLATE.header.logoPlacement)
    expect(template.footer.remarks.principal).toEqual(
      DEFAULT_REPORT_CARD_TEMPLATE.footer.remarks.principal
    )
  })

  it("replaces arrays wholesale instead of concatenating them", async () => {
    vi.mocked(kv.get).mockResolvedValue({
      header: {
        paragraphs: [
          { id: "p1", text: "Hello", fontSize: 14, color: "#000000", bold: false, align: "left" }
        ]
      }
    })

    const template = await getReportCardTemplate()

    expect(template.header.paragraphs).toHaveLength(1)
    expect(template.header.paragraphs[0]?.id).toBe("p1")
  })

  it("falls back to the defaults when the merged value is corrupt", async () => {
    // `subject` must always be `true`, so this stored value fails validation.
    vi.mocked(kv.get).mockResolvedValue({ body: { columns: { subject: false } } })

    await expect(getReportCardTemplate()).resolves.toEqual(DEFAULT_REPORT_CARD_TEMPLATE)
  })
})

describe("setReportCardTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the full template back to KV and returns it", async () => {
    const template = structuredClone(DEFAULT_REPORT_CARD_TEMPLATE)
    template.header.heading = "Updated"

    await expect(setReportCardTemplate(template)).resolves.toBe(template)
    expect(kv.set).toHaveBeenCalledWith("settings:report-card-template", template)
  })
})

describe("resetReportCardTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("deletes the key and returns the defaults", async () => {
    vi.mocked(kv.get).mockResolvedValue(null)

    await expect(resetReportCardTemplate()).resolves.toEqual(DEFAULT_REPORT_CARD_TEMPLATE)
    expect(kv.del).toHaveBeenCalledWith("settings:report-card-template")
  })
})

describe("uploadReportCardAsset", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("uploads under a deterministic key and returns the pathname", async () => {
    vi.mocked(blob.put).mockResolvedValue({ pathname: "report-card/logo-primary" } as never)
    const file = new File(["x"], "logo.png", { type: "image/png" })

    await expect(uploadReportCardAsset(file, "logo-primary")).resolves.toBe(
      "report-card/logo-primary"
    )
    expect(blob.put).toHaveBeenCalledWith("report-card/logo-primary", file, {
      contentType: "image/png",
      addRandomSuffix: false
    })
  })
})
