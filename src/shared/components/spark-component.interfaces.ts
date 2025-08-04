import type { SparkComponent } from './spark-component.js';

/**
 * Array of all possible {@link SparkTheme} values for a {@link SparkComponent}.
 *
 * @see {@link SparkComponent.THEMES} for available themes.
 * @see {@link SparkComponent.theme} for the theme property.
 */
export type SparkThemes = typeof SparkComponent.THEMES;

/**
 * Thematic type for a {@link SparkComponent}.
 *
 * @see {@link SparkComponent.THEMES} for available themes.
 * @see {@link SparkComponent.theme} for the theme property.
 */
export type SparkTheme = typeof SparkComponent.THEMES[number];
