/**
 * Combines an array of class names and combines them into a single string.
 * @param classNames The array of class names.
 */
export function classNames(
  ...classNames: Array<string | Boolean | null | undefined>
): string {
  return classNames.filter(Boolean).join(" ");
}
