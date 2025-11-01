import { LitElement, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import type { SparkUpdatedWatch } from './spark-component.interfaces.js';
import { themeColors, type SparkColor } from '~shared/utils/spark-theme.js';

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
  static readonly COLORS = themeColors;

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

  #updatedWatch: SparkUpdatedWatch<this>[] = [];

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add('spark');
  }

  protected override updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);

    for (const watch of this.#updatedWatch) {
      if (changedProperties.has(watch.property)) {
        watch.callback(changedProperties.get(watch.property));
      }
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#updatedWatch = []; // Avoid any potential memory leaks
  }

  /**
   * Registers a callback to be invoked when the specified Lit property is updated.
   *
   * @param property The Lit property to watch for updates.
   * @param cb The callback function to invoke when the Lit property is updated.
   */
  onUpdated(
    property: keyof this,
    cb: (oldValue: this[typeof property]) => void
  ): void {
    this.#updatedWatch.push({ property, callback: cb });
  }

  /**
   * Unregisters a previously registered update callback for the specified Lit property.
   *
   * @param property The Lit property to stop watching for updates.
   * @param cb The callback function to remove.
   */
  offUpdated(
    property: keyof this,
    cb: (oldValue: this[typeof property]) => void
  ): void {
    this.#updatedWatch = this.#updatedWatch.filter(
      (watch) => watch.property !== property || watch.callback !== cb
    );
  }

}

export type * from './spark-component.interfaces.js';
