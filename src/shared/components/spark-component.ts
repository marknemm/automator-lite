import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { SparkTheme } from './spark-component.interfaces.js';

/**
 * Abstract {@link SparkComponent} class that provides common properties and methods for theming and behavior.
 *
 * @extends LitElement
 */
export abstract class SparkComponent extends LitElement {

  /**
   * A readonly array of all possible {@link SparkTheme} values.
   *
   * @see {@link theme} for the theme property.
   */
  static readonly THEMES = [
    'primary',
    'secondary',
    'tertiary',
    'info',
    'success',
    'warn',
    'danger',
  ] as const;

  /**
   * The theme to apply to this {@link SparkComponent}.
   *
   * - `primary` is the main theme.
   * - `secondary` is a supporting theme.
   * - `tertiary` is a less emphasized theme.
   * - `info` is used for informational purposes.
   * - `success` indicates a successful action.
   * - `warn` indicates a warning or caution.
   * - `danger` indicates a critical or dangerous action.
   *
   * @default undefined to apply bare minimum styling.
   */
  @property({ type: String, reflect: true })
  accessor theme: SparkTheme | undefined = undefined;

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('spark');
  }

}

export type * from './spark-component.interfaces.js';
