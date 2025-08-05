import type { SparkComponent } from './spark-component.js';

/**
 * Array of all possible {@link SparkColor} values for a {@link SparkComponent}.
 *
 * @see {@link SparkComponent.COLORS} for available colors.
 * @see {@link SparkComponent.color} for the color property.
 */
export type SparkColors = typeof SparkComponent.COLORS;

/**
 * Thematic type for a {@link SparkComponent}.
 *
 * @see {@link SparkComponent.COLORS} for available colors.
 * @see {@link SparkComponent.color} for the color property.
 */
export type SparkColor = typeof SparkComponent.COLORS[number];
