import { html, unsafeCSS } from 'lit';
import { customElement } from 'lit/decorators.js';
import { property } from '~shared/decorators/property.js';
import styles from './progress-spinner.scss?inline';
import { SparkComponent } from './spark-component.js';

/**
 * Generic indefinite progress spinner.
 *
 * @element `spark-progress-spinner`
 * @extends SparkComponent
 * @slot Default slot for adding content inside the spinner.
 */
@customElement('spark-progress-spinner')
export class ProgressSpinner extends SparkComponent {

  static styles = [unsafeCSS(styles)];

  /**
   * Informs assistive technologies whether the element is busy.
   *
   * @default 'true'
   */
  @property({ type: String, reflect: true })
  accessor ariaBusy = 'true';

  /**
   * Informs assistive technologies of the live region politeness.
   *
   * @default 'polite'
   */
  @property({ type: String, reflect: true })
  accessor ariaLive = 'polite';

  /**
   * Informs assistive technologies of the role of the element.
   *
   * @default 'progressbar'
   */
  @property({ type: String, reflect: true })
  accessor role: 'progressbar' = 'progressbar';

  /**
   * Whether the progress spinner is visible.
   *
   * @default true
   */
  @property({ type: Boolean, reflect: true })
  accessor show = true;

  override render() {
    return html`
      <div class="spinner">
        <slot></slot>
        <div class="arc"></div>
        <div class="arc"></div>
        <div class="arc"></div>
        <div class="arc"></div>
      </div>
    `;
  }

}

export type * from './progress-spinner.interfaces.js';
