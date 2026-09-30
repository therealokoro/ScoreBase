import { describe, expect, it } from "vitest"

import { REPORT_CARD_BLOCK_TYPES, type BlockType } from "#shared/constants/report-card"

import { blockRegistry, getBlockDefinition } from "./registry"

describe("blockRegistry", () => {
  it("defines exactly the seven block types", () => {
    expect(Object.keys(blockRegistry).sort()).toEqual([...REPORT_CARD_BLOCK_TYPES].sort())
  })

  it("throws on an unknown type", () => {
    const bogus = "bogus" as string as BlockType
    expect(() => getBlockDefinition(bogus)).toThrow(/unknown report card block type/i)
  })

  it("gives every block a label and at least one allowed slot", () => {
    for (const type of REPORT_CARD_BLOCK_TYPES) {
      const definition = getBlockDefinition(type)
      expect(definition.label.length).toBeGreaterThan(0)
      expect(definition.allowedSlots.length).toBeGreaterThan(0)
    }
  })

  it("validates every block's defaultConfig against its configSchema", () => {
    for (const type of REPORT_CARD_BLOCK_TYPES) {
      const definition = getBlockDefinition(type)
      expect(definition.configSchema.safeParse(definition.defaultConfig()).success).toBe(true)
    }
  })

  it("generates fresh default configs on every call", () => {
    type StudentInfoDefault = { fields: { id: string }[] }
    const a = getBlockDefinition("student-info").defaultConfig() as StudentInfoDefault
    const b = getBlockDefinition("student-info").defaultConfig() as StudentInfoDefault

    expect(a).not.toBe(b)
    expect(a.fields[0]?.id).not.toBe(b.fields[0]?.id)
  })
})
