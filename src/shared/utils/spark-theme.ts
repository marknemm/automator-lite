/**
 * Array of all possible {@link SparkColor} values.
 */
export const themeColors = [
  'primary',
  'secondary',
  'tertiary',
  'info',
  'success',
  'warn',
  'danger',
] as const;

/**
 * Spark thematic colors.
 *
 * @see {@link themeColors} for available colors.
 */
export type SparkColor = typeof themeColors[number];
