import type { SparkColor } from '~shared/utils/spark-theme.js';

/**
 * Attributes for a `SparkButton`.
 *
 * These are custom attributes that can be set in addition to standard {@link HTMLButtonElement} attributes.
 */
export interface SparkButtonAttributes {

  /**
   * The {@link SparkColor} theme of the button.
   *
   * @default 'primary'
   */
  color?: SparkColor;

  /**
   * The icon to display in the button.
   */
  icon?: string;

  /**
   * Whether the button is outlined.
   *
   * @default false
   */
  outlined?: boolean;

  /**
   * Whether the button is raised.
   *
   * @default false
   */
  raised?: boolean;

  /**
   * The shape of the button.
   *
   * @default 'rectangle'
   */
  shape?: 'rectangle' | 'round';

  /**
   * The title (tooltip) of the button.
   */
  title?: string;

}
