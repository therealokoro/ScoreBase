/**
 * Builds the predictable default password handed to a teacher account: `pass-<surname>-123`.
 *
 * The surname is the last word of the full name (the form's example is "John Emeka Olabisi", where
 * "Olabisi" is the surname). Teacher creation and the admin password reset both use this helper so
 * the two paths always agree.
 */
export function defaultTeacherPassword(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const surname = parts.at(-1) ?? ""
  return `pass-${surname}-123`.toLocaleLowerCase()
}
