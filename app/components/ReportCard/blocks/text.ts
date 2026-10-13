import type { CSSProperties } from "vue"
import type { TextStyle } from "~~/shared/constants/report-card"

/**
 * Converts a template's TextStyle into inline CSS for rendering a StyledText value. "normal" and
 * "bold" are both valid CSS font-weight values, so they pass straight through.
 */
export function textStyle(style: TextStyle): CSSProperties {
  return {
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.italic ? "italic" : "normal",
    color: style.color,
    textAlign: style.align
  }
}
