import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { SparkColor } from './spark-component.interfaces.js';

/**
 * Abstract {@link SparkComponent} class that provides common properties and methods for theming and behavior.
 *
 * @extends LitElement
 */
export abstract class SparkComponent extends LitElement {

  /**
   * A readonly array of all possible {@link SparkColor} values.
   *
   * @see {@link color} for the color property.
   */
  static readonly COLORS = [
    'primary',
    'secondary',
    'tertiary',
    'info',
    'success',
    'warn',
    'danger',
  ] as const;

  /**
   * The color to apply to this {@link SparkComponent}.
   *
   * - `primary` is the main color.
   * - `secondary` is a supporting color.
   * - `tertiary` is a less emphasized color.
   * - `info` is used for informational purposes.
   * - `success` indicates a successful action.
   * - `warn` indicates a warning or caution.
   * - `danger` indicates a critical or dangerous action.
   *
   * @default undefined to apply bare minimum styling.
   */
  @property({ type: String, reflect: true })
  accessor color: SparkColor | undefined = undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('spark');
  }

}

export type * from './spark-component.interfaces.js';
