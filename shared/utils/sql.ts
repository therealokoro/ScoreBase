/**
 * Escapes `%`, `_`, and the escape character itself so a user-supplied search string is matched
 * literally in a SQL `LIKE`. Pair with `ESCAPE '\\'` (see the student/result/teacher list queries).
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}
