import { html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Nullish } from 'utility-types';
import { property } from '~shared/decorators/property.js';
import type { SparkProgressBarType } from './progress-bar.interfaces.js';
import styles from './progress-bar.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * Generic indefinite progress bar.
 *
 * @element spark-progress-bar
 * @extends SparkComponent
 */
@customElement('spark-progress-bar')
export class ProgressBar extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  /**
   * Informs assistive technologies whether the element is busy.
   *
   * @default 'true'
   */
  @property ({ type: String, reflect: true })
  accessor ariaBusy = 'true';

  /**
   * Informs assistive technologies of the live region politeness.
   *
   * @default 'polite'
   */
  @property ({ type: String, reflect: true })
  accessor ariaLive = 'polite';

  /**
   * Informs assistive technologies of the role of the element.
   *
   * @default 'progressbar'
   */
  @property ({ type: String, reflect: true })
  accessor role: 'progressbar' = 'progressbar';

  /**
   * Whether the progress bar is visible.
   *
   * @default true
   */
  @property({ type: Boolean, reflect: true })
  accessor show = true;

  /**
   * Whether to show a shimmer overlay effect.
   *
   * @default true
   */
  @property({ type: Boolean, reflect: true })
  accessor shimmer = true;

  /**
   * The current value of the progress bar.
   *
   * Can be between the {@link ariaValueMin} and {@link ariaValueMax}.
   *
   * If set to `null` or `undefined`, the {@link progressType} is `indeterminate`.
   *
   * @alias `aria-valuenow`
   * @default undefined
   */
  @property({ type: Number, attribute: 'aria-valuenow' })
  get value(): number | undefined {
    const val = parseFloat(this.getAttribute('aria-valuenow') ?? '');
    return !isNaN(val)
      ? val
      : undefined;
  }
  set value(val: number | Nullish) {
    if (val != null && !isNaN(val)) {
      const minVal = Number.parseFloat(this.getAttribute('aria-valuemin') ?? '0');
      const maxVal = Number.parseFloat(this.getAttribute('aria-valuemax') ?? '100');
      val = Math.min(maxVal, Math.max(minVal, val));

      this.setAttribute('aria-valuenow', `${val}`);
      this.style.setProperty('--spark-progress-bar-value', `${val}%`);
    } else {
      this.removeAttribute('aria-valuenow');
      this.style.removeProperty('--spark-progress-bar-value');
    }
  }

  /**
   * The type of the progress bar, either 'determinate' or 'indeterminate'.
   * This is inferred from the presence of a valid {@link value}.
   *
   * @default 'indeterminate'
   */
  get progressType(): SparkProgressBarType {
    const value = parseFloat(this.getAttribute('aria-valuenow') ?? '');
    return !isNaN(value)
      ? 'determinate'
      : 'indeterminate';
  }

  override render() {
    return html`
      <slot></slot>
      <div class="bar">
        ${this.shimmer
          ? html`<div class="shimmer"></div>`
          : null}
      </div>
    `;
  }
}

export type * from './progress-bar.interfaces.js';
