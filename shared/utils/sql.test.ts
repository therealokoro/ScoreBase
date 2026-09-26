import { describe, expect, it } from "vitest"

import { escapeLike } from "./sql"

describe("escapeLike", () => {
  it("leaves ordinary text untouched", () => {
    expect(escapeLike("hello world")).toBe("hello world")
  })

  it("escapes LIKE wildcards", () => {
    expect(escapeLike("50%")).toBe("50\\%")
    expect(escapeLike("a_b")).toBe("a\\_b")
  })

  it("escapes the escape character itself", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b")
  })

  it("escapes every occurrence", () => {
    expect(escapeLike("%_%")).toBe("\\%\\_\\%")
  })
})
